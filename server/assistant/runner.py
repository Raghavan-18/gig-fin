"""
Assistant orchestration.  ARCHITECTURE.md §4.4 / IMPLEMENTATION_PLAN.md §C7.

Two execution paths, ONE validator:

  claude         -- real tool-calling loop via the Anthropic SDK tool runner.
  deterministic  -- an intent router that calls the same tools and renders
                    templates. Used when no API key is configured, and as the
                    on-stage fallback the plan requires (§10: never stake the
                    demo on a live API call).

Both paths end at validator.validate(). The guarantee -- no number reaches the
user unless a tool produced it -- holds identically either way.
"""
from __future__ import annotations

import os
import re
from dataclasses import dataclass, field

from assistant import tools as tool_layer
from assistant import validator as validator_mod
from assistant.prompts import SYSTEM

MODEL = "claude-opus-5"


@dataclass
class Turn:
    question: str
    answer: str
    source: str
    intent: str = "UNKNOWN"
    time_scope: str = "NONE"
    tool_calls: list[dict] = field(default_factory=list)
    validation: dict = field(default_factory=dict)
    sources: list[str] = field(default_factory=list)
    blocked_draft: str | None = None
    regenerated: bool = False

    def to_dict(self) -> dict:
        return {
            "question": self.question,
            "answer": self.answer,
            "source": self.source,
            "intent": self.intent,
            "time_scope": self.time_scope,
            "period": self.time_scope,
            "tool_calls": self.tool_calls,
            "validation": self.validation,
            "sources": self.sources,
            "blocked_draft": self.blocked_draft,
            "regenerated": self.regenerated,
        }


def has_api_key() -> bool:
    return bool(os.environ.get("ANTHROPIC_API_KEY"))


# --------------------------------------------------------------- Claude path
def _run_claude(question: str) -> Turn:
    import anthropic
    from anthropic import beta_tool

    client = anthropic.Anthropic()
    called: list[dict] = []

    def make(spec):
        def fn(**kwargs):
            result = tool_layer.call(spec["name"], **kwargs)
            called.append({"name": spec["name"], "input": kwargs, "result": result})
            return result
        fn.__name__ = spec["name"]
        fn.__doc__ = spec["description"]
        return beta_tool(fn, name=spec["name"], description=spec["description"],
                         input_schema=spec["input_schema"])

    wrapped = [make(spec) for spec in tool_layer.TOOL_REGISTRY.values()]

    def ask(extra: str = "") -> str:
        runner = client.beta.messages.tool_runner(
            model=MODEL,
            max_tokens=4000,
            system=SYSTEM + extra,
            output_config={"effort": "low"},
            thinking={"type": "adaptive"},
            tools=wrapped,
            messages=[{"role": "user", "content": question}],
        )
        message = runner.until_done()
        return "".join(b.text for b in message.content if b.type == "text").strip()

    draft = ask()
    results = [c["result"] for c in called]
    v = validator_mod.validate(draft, results)

    if v.ok:
        return Turn(question, draft, "claude", intent="CLAUDE", tool_calls=called,
                    validation=v.to_dict(), sources=[c["name"] for c in called])

    retry = ask(
        "\n\nCORRECTION: your previous draft contained "
        f"{v.unmatched} which no tool returned. Restate using ONLY figures "
        "present in the tool results, or say you cannot work that out.")
    v2 = validator_mod.validate(retry, results)
    if v2.ok:
        return Turn(question, retry, "claude", intent="CLAUDE", tool_calls=called,
                    validation=v2.to_dict(), sources=[c["name"] for c in called],
                    blocked_draft=draft, regenerated=True)

    safe = _deterministic_answer(question, called)
    return Turn(question, safe.answer, "claude+template", intent=safe.intent,
                time_scope=safe.time_scope,
                tool_calls=called, validation=v2.to_dict(),
                sources=[c["name"] for c in called],
                blocked_draft=draft, regenerated=True)


# -------------------------------------------------- Intent & Scope Detection
def _detect_scope(q: str) -> str:
    ql = q.strip().lower()
    if re.search(r"\b(today|so far today|current day)\b", ql):
        return "TODAY"
    if re.search(r"\b(last 7 days|past 7 days|last seven days)\b", ql):
        return "LAST_7_DAYS"
    if re.search(r"\b(this week|current week|past week)\b", ql):
        return "WEEK"
    if re.search(r"\b(this month|current month|last 30 days|past 30 days)\b", ql):
        return "MONTH"
    return "NONE"


# Order matters: more specific patterns come before broader ones.
INTENT_PATTERNS = [
    ("GREETING_CASUAL", r"^(hi|hello|hey|namaste|good\s*(morning|evening|afternoon)|thank\s*you|thanks|shukriya|bye)[\s!.]*$"),
    ("UNKNOWN", r"^(can i afford it|afford it)\??$"),
    ("FINANCIAL_GUIDANCE", r"(how (can|do|should) i (improve|become|increase|build).*(financial stability|financially stable|financial health|emergency fund|savings|habits)|how (can|do|should) i (save more|reduce (my )?expenses|cut down (my )?expenses|manage irregular income|budget my money)|how (do|to) manage irregular income|what should i do to (become|improve|be).*(financially stable|financial stability|financial|finances)|(tips|advice).*(saving|budget|spending|expenses|stability|finances)|financial advice|guidance on (saving|spending|budget|stability)|how can i save more money|how to save more money)"),
    ("DHARA_FEATURE", r"(what is (account aggregator|safe to save|safe-to-save|buffer days|sinking fund)|how does (dhara|safe to save|account aggregator) work)"),
    ("GENERAL_FINANCIAL", r"(what is (an? )?(emergency fund|emi|credit score|cibil)|what does (emi|credit score) mean|should i have a separate savings account)"),
    ("CREDIT", r"(loan|borrow|udhaar|udhar|lend|\bcredit\b|\badvance\b)"),
    ("FORECAST", r"(will i be able to pay.*fees|school fee|college fee|can i afford.*fees|what will i earn next month|forecast my income)"),
    ("SAFE_TO_SAVE", r"(how much can i spend|safe to spend|can i spend|what'?s safe.*spend|spend today|sweep|safe to save|why.*(stop|paus|not sav)|(saving|savings).*(stop|paus)|(stop|paus).*(saving|savings))"),
    ("SHORTFALL", r"(will.*(bounce|short|problem)|shortfall|\bshort\b|\bdue\b|bounce|kist|\bemi\b.*problem)"),
    ("SAVINGS", r"(how much should i save|save from it|how much to save)"),
    ("EXPENSES", r"(biggest expense|where.*money go|outflow|spending breakdown|what did i spend)"),
    ("INCOME", r"(how much (did|have) i (earn|made|make)|what (did i make|was my income)|why was my income low|kamai|my earnings|earned this week|earn this week|earn today|earned today|earn in the last 7 days|earned in the last 7 days)"),
    ("TRANSACTIONS", r"(transaction|history|statement|passbook|records|events)"),
    ("PERSONAL_BALANCE", r"(how much (money )?(do i have|is in my account)|what is my (current )?(balance|buffer)|my bank balance|how much in my account|what('?s| is) my balance|how many buffer days|my money)"),
]


def _classify(q: str, history: list[dict] | None = None) -> str:
    ql = q.strip().lower()

    # Check conversational follow-ups first if history exists
    if history and len(history) > 0:
        if re.search(r"^(was that good|is that good|why was that|why)\??$", ql):
            return "INCOME"
        if re.search(r"^(how much should i save from it|save from it)\??$", ql):
            return "SAVINGS"
        if re.search(r"^(can i afford it|afford it)\??$", ql):
            return "UNKNOWN"

    for name, pattern in INTENT_PATTERNS:
        if re.search(pattern, ql):
            return name

    # Default fallbacks
    if re.search(r"(earn|income|kamai)", ql):
        return "INCOME"
    if re.search(r"(spend|bought|burn)", ql):
        return "EXPENSES"
    return "PERSONAL_BALANCE"


def _rupees(v) -> str:
    return f"Rs {v:,.0f}"


def _detect_lang(q: str, param_lang: str = "en") -> str:
    pl = (param_lang or "en").lower()
    if pl in ("ta", "tamil"):
        return "ta"
    if pl in ("hi", "hindi"):
        return "hi"
    if re.search(r"[\u0B80-\u0BFF]", q) or re.search(r"\b(vanakkam|panam|kaasu|semippu|kadan|selavu|eppadi)\b", q.lower()):
        return "ta"
    if re.search(r"[\u0900-\u097F]", q) or re.search(r"\b(namaste|bachat|kamai|kharcha|udhar|paise|kitna|kaise)\b", q.lower()):
        return "hi"
    return "en"


def _deterministic_answer(question: str, precalled: list[dict] | None = None,
                           history: list[dict] | None = None, lang: str = "en") -> Turn:
    target_lang = _detect_lang(question, lang)
    intent = _classify(question, history)
    scope = _detect_scope(question)
    called: list[dict] = list(precalled or [])

    def use(name, **kw):
        r = tool_layer.call(name, **kw)
        called.append({"name": name, "input": kw, "result": r})
        return r

    ql = question.strip().lower()

    # 1. GREETING / CASUAL
    if intent == "GREETING_CASUAL":
        if re.search(r"(thank|thanks|shukriya)", ql):
            answer = ("You are very welcome! I am always here to help you navigate "
                      "your cash flow, buffer, and financial planning. Stay safe on the road.")
        else:
            answer = ("Hello! I am Dhara, your financial companion for gig work. "
                      "I can help you check your live balance, Safe-to-Save headroom, "
                      "income forecast, or loan affordability using verified ledger data. "
                      "How can I help you today?")

    # 2. FINANCIAL GUIDANCE / ADVICE (No bare digits, practical advice first)
    elif intent == "FINANCIAL_GUIDANCE":
        if re.search(r"(save more|saving|save money)", ql):
            answer = ("To save more with variable gig earnings, focus on three cash-flow-friendly habits:\n"
                      "- Save on peak payout days: set aside a percentage of high delivery earnings rather than committing to a rigid monthly target.\n"
                      "- Protect essential burn: keep daily fuel and food funds accessible so you never need costly emergency loans.\n"
                      "- Pause during slowdowns: automated micro-sweeps automatically pause when cash is tight to keep your working capital safe.\n\n"
                      "I can also look at your recent income and spending to identify where you have surplus headroom.")
        elif re.search(r"(reduce|cut down).*(expense|spending)", ql):
            answer = ("To reduce expenses effectively as a gig worker:\n"
                      "- Track your fuel consumption and keep up with regular maintenance to prevent costly breakdowns.\n"
                      "- Plan meals and tea breaks in advance rather than buying on the go during long shifts.\n"
                      "- Minimize high-interest borrowing fees by building a modest cash buffer.\n\n"
                      "I can also analyze your recent spending breakdown across fuel, food, and bills to highlight where most of your money goes.")
        elif re.search(r"(manage irregular income|irregular income)", ql):
            answer = ("Managing irregular gig income works best with these core strategies:\n"
                      "- Maintain a liquid emergency buffer to smooth out slow platform weeks.\n"
                      "- Separate your daily working cash from upcoming obligations like rent or EMI.\n"
                      "- Channel extra earnings on busy weekends directly into savings before expanding discretionary spending.\n\n"
                      "I can also look at your income forecast to help you prepare for the upcoming fortnight.")
        elif re.search(r"(emergency fund|build.*fund)", ql):
            answer = ("To build an emergency buffer with irregular payouts:\n"
                      "- Start with a modest target of one to two weeks of essential living expenses.\n"
                      "- Divert a small slice of every platform settlement automatically so your reserve builds gradually.\n"
                      "- Keep these funds in a dedicated liquid pocket separate from your daily wallet.\n\n"
                      "I can also check your current buffer days to see where your safety cushion stands today.")
        else:
            answer = ("With irregular gig income, focus on three areas:\n"
                      "- Keep a small emergency buffer.\n"
                      "- Save a percentage of each payout instead of a fixed monthly amount.\n"
                      "- Keep daily spending flexible during low-income periods.\n\n"
                      "Because your income changes from week to week, cash-flow-based saving can be more suitable than a fixed monthly saving target.\n\n"
                      "I can also look at your recent income and spending and suggest where you could improve.")


    # 3. GENERAL FINANCIAL EDUCATION (No tools called, no bare digits)
    elif intent == "GENERAL_FINANCIAL":
        if "emergency fund" in ql:
            answer = ("An emergency fund is money set aside for unexpected costs such as "
                      "medical emergencies, vehicle repairs, or sudden drops in earnings. "
                      "For gig workers with irregular income, having a liquid buffer covering "
                      "several weeks of essential living expenses prevents you from having "
                      "to take high-interest loans when work is slow.")
        elif "emi" in ql:
            answer = ("EMI stands for Equated Monthly Instalment. It is the fixed amount "
                      "you pay periodically toward a loan, covering both principal and interest "
                      "until the debt is completely paid off.")
        elif "credit score" in ql or "cibil" in ql:
            answer = ("A credit score is a three-digit metric used by traditional lenders to "
                      "evaluate your repayment history. In Dhara, we focus on cash-flow-indexed "
                      "financial resilience metrics directly from your bank transactions rather "
                      "than penalizing you for lacking traditional salary slips.")
        elif "separate savings account" in ql:
            answer = ("Yes, having a separate savings account or digital reserve helps protect "
                      "your money. Keeping your daily operating money separate from funds earmarked "
                      "for rent or emergencies prevents accidental spending.")
        else:
            answer = ("Building financial security as an independent worker comes down to three "
                      "habits: maintaining an emergency buffer for slow periods, separating your "
                      "operating cash from essential bills, and avoiding high-cost short-term debt.")

    # 4. DHARA FEATURES (No tools called, no bare digits)
    elif intent == "DHARA_FEATURE":
        if "account aggregator" in ql:
            answer = ("Account Aggregator is a secure, RBI-regulated framework in India that "
                      "allows you to digitally share your bank statements with financial services "
                      "with your explicit consent. It replaces paper statements and passwords, "
                      "and you can pause or revoke consent at any time.")
        elif "safe to save" in ql:
            answer = ("Safe-to-Save is Dhara's real-time calculation that evaluates your current "
                      "bank balance against upcoming bill obligations and essential daily burn. "
                      "It tells you exactly how much surplus you can safely move into savings "
                      "without risking a shortfall or bounced payment.")
        elif "buffer days" in ql:
            answer = ("Buffer days measure how many days your liquid reserve can sustain your "
                      "essential living expenses if your income completely stopped. It is the "
                      "primary metric Dhara uses to gauge your financial resilience.")
        elif "sinking fund" in ql:
            answer = ("A sinking fund is a dedicated reserve where small amounts are accumulated "
                      "over time for predictable future lump-sum expenses, such as annual vehicle "
                      "insurance or festive costs.")
        else:
            answer = ("Dhara combines automated income forecasting, Safe-to-Save sweeps, "
                      "and double-entry accounting to protect gig workers from cash-flow shortfalls.")

    # 5. CREDIT / LOAN
    elif intent == "CREDIT":
        m = re.search(r"(\d[\d,]*)", question)
        amount = float(m.group(1).replace(",", "")) if m else 5000.0
        r = use("simulate_loan", amount=amount, tenure_months=12, purpose="general")
        d = r["decision"]
        parts = []
        if r["alternative"]:
            parts.append(r["alternative"]["plain"])
        if d["outcome"] == "DECLINE":
            parts.append(f"On the loan itself: I can't offer {_rupees(d['requested_amount'])}.")
        elif d["outcome"] == "REDUCE":
            parts.append(f"On the loan itself: {_rupees(d['requested_amount'])} is more "
                         f"than I can responsibly offer. The most I could do safely is "
                         f"{_rupees(d['approved_amount'])}, as {d['level_label'].lower()}.")
        else:
            parts.append(f"Based on our demo affordability policy, you appear eligible for a "
                         f"potential {_rupees(d['approved_amount'])} loan as {d['level_label'].lower()}.")
        for rc in d["reason_codes"]:
            parts.append(rc["plain"])
        v = r["structures"]["verdict"]
        parts.append(v["plain"])
        parts.append("(Note: this is an educational assessment based on demo policy, not a formal lender approval.)")
        answer = " ".join(parts)

    # 6. SAFE TO SAVE / AFFORDABILITY TO SPEND
    elif intent == "SAFE_TO_SAVE":
        s = use("get_safe_to_save")
        m = re.search(r"(?:spend|afford)\s+(?:rs\.?|₹)?\s*(\d[\d,]*)", ql)
        if m:
            desired_spend = float(m.group(1).replace(",", ""))
            if s["paused"] or s["amount"] < desired_spend:
                answer = (f"Spending {_rupees(desired_spend)} today is not recommended. "
                          f"Your Safe-to-Save sweeps are currently paused to protect "
                          f"{_rupees(s['committed'])} of upcoming bill obligations and "
                          f"{_rupees(s['burn'])} of essential burn.")
            else:
                answer = (f"Yes, you can safely spend {_rupees(desired_spend)} today. "
                          f"Your current Safe-to-Save headroom is {_rupees(s['amount'])}, "
                          f"after reserving {_rupees(s['committed'])} for bills and "
                          f"{_rupees(s['burn'])} for essential daily burn.")
        elif s["paused"]:
            answer = (f"I've paused your saving, and that's deliberate. Even taking "
                      f"the low end of what you'll earn, {_rupees(s['p20_income'])} "
                      f"over the next two weeks, you have {_rupees(s['committed'])} of "
                      f"bills due and about {_rupees(s['burn'])} of fuel and food to "
                      f"cover. There's nothing spare, so I'm not taking anything. "
                      f"It'll start again on its own.")
        else:
            answer = (f"You can spare about {_rupees(s['amount'])} right now. That's "
                      f"after setting aside {_rupees(s['committed'])} of bills and "
                      f"{_rupees(s['burn'])} for fuel and food.")

    # 7. SHORTFALL / OBLIGATIONS
    elif intent == "SHORTFALL":
        a = use("get_shortfall_alert")
        if a.get("message") and a.get("shortfall"):
            lines = [a["message"], "Here is what you can do:"]
            for rem in a["remedies"]:
                lines.append(f"- {rem['label']}. {rem['detail']}")
            answer = " ".join(lines)
        else:
            answer = a.get("message", "Nothing looks short right now.")

    # 8. SAVINGS
    elif intent == "SAVINGS":
        s = use("get_safe_to_save")
        b = use("get_buffer_days")
        if re.search(r"(how much should i save|save from it)", ql):
            if s["paused"]:
                answer = (f"Because your income fluctuates and sweeps are currently paused to cover "
                          f"{_rupees(s['committed'])} in obligations, hold onto your cash today rather "
                          f"than locking it away. Your buffer currently holds {_rupees(b['buffer_rupees'])}.")
            else:
                answer = (f"You should save flexibly based on your headroom: right now, {_rupees(s['amount'])} "
                          f"is safe to move into savings without putting your {_rupees(s['committed'])} in "
                          f"upcoming commitments at risk.")
        else:
            answer = (f"To save more without risking shortfalls, use automatic micro-sweeps on good earning "
                      f"days. You currently have {_rupees(b['buffer_rupees'])} saved, covering {b['buffer_days']} "
                      f"buffer days toward your {b['target_buffer_days']}-day target.")

    # 9. EXPENSES / SPENDING BREAKDOWN
    elif intent == "EXPENSES":
        sp = use("get_spending_breakdown", days=30)
        answer = (f"Over the last thirty days, your total spending was {_rupees(sp['total_spending'])}. "
                  f"Your biggest expense category is {sp['top_expense_category']} at "
                  f"{_rupees(sp['top_expense_amount'])}. To reduce your spending, focus on "
                  f"optimizing daily fuel consumption and discretionary dining.")

    # 10. INCOME / EARNINGS ANALYSIS (Scope-aware: today, week, last 7 days, month)
    elif intent == "INCOME":
        if scope == "TODAY":
            inc = use("get_income_analysis", days=1, scope="today")
            if inc.get("has_data") and inc["recent_income"] > 0:
                answer = (f"Today you brought in {_rupees(inc['recent_income'])} "
                          f"across {inc['payout_count']} payout(s).")
            else:
                answer = ("I don't have a verified income figure for today yet.")
        elif scope == "WEEK":
            inc = use("get_income_analysis", days=7, scope="week")
            answer = (f"This week you brought in {_rupees(inc['recent_income'])} "
                      f"across {inc['payout_count']} payouts, compared to your regular weekly "
                      f"average of {_rupees(inc['average_weekly_income'])}.")
        elif scope == "LAST_7_DAYS":
            inc = use("get_income_analysis", days=7, scope="last_7_days")
            answer = (f"Over the last seven days you brought in {_rupees(inc['recent_income'])} "
                      f"across {inc['payout_count']} payouts, compared to your regular weekly "
                      f"average of {_rupees(inc['average_weekly_income'])}.")
        elif scope == "MONTH":
            inc = use("get_income_analysis", days=30, scope="month")
            answer = (f"This month you brought in {_rupees(inc['recent_income'])} "
                      f"across {inc['payout_count']} payouts.")
        else:
            inc = use("get_income_analysis", days=7, scope="week")
            if "why" in ql or inc.get("is_drought"):
                answer = (f"Over the last seven days you brought in {_rupees(inc['recent_income'])} "
                          f"across {inc['payout_count']} payouts, compared to your regular weekly "
                          f"average of {_rupees(inc['average_weekly_income'])}. Your income was lower "
                          f"because of platform lull and weather disruption days detected during this period.")
            else:
                answer = (f"Over the last seven days you earned {_rupees(inc['recent_income'])} "
                          f"across {inc['payout_count']} payouts. That compares to your average "
                          f"weekly benchmark of {_rupees(inc['average_weekly_income'])}.")

    # 11. FORECAST / AFFORDABILITY (School fees, commitments, future weeks)
    elif intent == "FORECAST":
        if re.search(r"(fees|school|college)", ql):
            aff = use("check_affordability", commitment_name="school fees")
            if aff["can_cover"]:
                answer = (f"Yes. Looking at your current buffer of {_rupees(aff['buffer_rupees'])} "
                          f"and projected fortnight cash-flow of {_rupees(aff['p20_projected_fortnight'])}, "
                          f"you are in good shape to cover your {_rupees(aff['amount'])} "
                          f"{aff['commitment_name']} commitment.")
            else:
                answer = (f"Covering your {_rupees(aff['amount'])} {aff['commitment_name']} will be "
                          f"tight against your current buffer of {_rupees(aff['buffer_rupees'])}. "
                          f"Dhara is actively monitoring this commitment to protect you from shortfalls.")
        else:
            f = use("get_forecast")
            o = use("get_obligations")
            n14, n30 = f["next_14_days"], f["next_30_days"]
            answer = (f"I won't give you one number, because I'd be wrong. Over the next "
                      f"two weeks you'll most likely bring in between "
                      f"{_rupees(n14['p10'])} and {_rupees(n14['p90'])}, with "
                      f"{_rupees(n14['p50'])} in the middle. Over the month it's "
                      f"{_rupees(n30['p10'])} to {_rupees(n30['p90'])}. When I plan "
                      f"anything for you I use the low end, {_rupees(n30['p20'])}, "
                      f"so a slow month doesn't catch you out. Against that you have "
                      f"{o['count_words']} commitments coming up.")

    # 12. TRANSACTIONS
    elif intent == "TRANSACTIONS":
        h = use("get_transaction_history", days=7)
        answer = (f"Over the last {h['days']} days you brought in "
                  f"{_rupees(h['total_income'])} and spent {_rupees(h['total_spending'])}, "
                  f"so you're {_rupees(h['net'])} ahead.")

    # 13. UNKNOWN / CLARIFICATIONS
    elif intent == "UNKNOWN":
        if re.search(r"can i afford", ql):
            answer = ("What expense are you considering? If you give me the amount in rupees, "
                      "I can check it against your current Safe-to-Save buffer and forecast.")
        else:
            b = use("get_balance")
            bd = use("get_buffer_days")
            answer = (f"I checked your accounts. You have {_rupees(b['bank_account'])} in your "
                      f"account and {_rupees(b['buffer'])} in your buffer, giving you "
                      f"{bd['buffer_days']} days of expenses. Let me know what you would like to explore.")

    # 14. PERSONAL BALANCE / BUFFER
    else:
        b = use("get_balance")
        bd = use("get_buffer_days")
        if "buffer" in ql:
            answer = (f"Your buffer holds {_rupees(bd['buffer_rupees'])}. At your usual "
                      f"essential spending of {_rupees(bd['essential_daily_burn'])} a day, "
                      f"that covers {bd['buffer_days']} days. The target is "
                      f"{bd['target_buffer_days']} days.")
        else:
            answer = (f"You have {_rupees(b['bank_account'])} in your account and "
                      f"{_rupees(b['buffer'])} in your buffer, plus "
                      f"{_rupees(b['insurance_fund'])} set aside for your bike insurance. "
                      f"That buffer is {bd['buffer_days']} days of expenses.")

    # --- Vernacular Localization (Pillar 4 - Requirement 16) ---
    if target_lang == "ta":
        if intent == "GREETING_CASUAL":
            if re.search(r"(thank|thanks|shukriya)", ql):
                answer = "மிக்க மகிழ்ச்சி! உங்கள் ரொக்க ஓட்டம் மற்றும் இடையக சேமிப்பை நிர்வகிக்க நான் எப்போதும் உங்களுக்கு உதவ தயாராக இருக்கிறேன். பாதுகாப்பாக இருங்கள்."
            else:
                answer = "வணக்கம்! நான் தாரா (Dhara), கிக் பணியாளர்களுக்கான உங்கள் நிதித் தோழன். நேரடி இருப்பு, சேமிப்பு வரம்பு, அல்லது நிதித் திட்டமிடலைச் சரிபார்க்க நான் உதவ முடியும்."
        elif intent == "FINANCIAL_GUIDANCE":
            answer = "மாறுபடும் வருமானத்தில் சேமிக்க மூன்று முக்கிய வழிகள்: அதிக வருமானம் கிடைக்கும் நாட்களில் ஒரு சதவீதத்தை ஒதுக்குங்கள், தினசரி அத்தியாவசிய செலவு நிதியைப் பாதுகாக்கவும், மந்தமான காலங்களில் சேமிப்பைத் தற்காலிகமாக நிறுத்தவும்."
        elif intent == "GENERAL_FINANCIAL":
            answer = "அவசரகால நிதி என்பது எதிர்பாராத செலவுகளான மருத்துவ அவசரங்கள் அல்லது வாகனம் பழுதுபார்க்க ஒதுக்கி வைக்கப்படும் திரவ நிதியாகும்."
        elif intent == "DHARA_FEATURE":
            answer = "தாரா (Dhara) என்பது கிக் மற்றும் அமைப்புசாரா தொழிலாளர்களின் உண்மையான பணப் புழக்கத்திற்கு ஏற்ப சேமிப்பு மற்றும் கடனை மாற்றியமைக்கும் ஒரு நிதி தளமாகும்."
        elif intent == "SAFE_TO_SAVE":
            for call in called:
                if call["name"] == "get_safe_to_save":
                    s_res = call["result"]
                    if s_res.get("paused"):
                        answer = f"அடுத்த இரண்டு வாரங்களில் எதிர்பார்க்கப்படும் வருமானம் குறைவாக இருப்பதாலும், {_rupees(s_res['committed'])} பில்கள் மற்றும் {_rupees(s_res['burn'])} அவசிய செலவுகள் உள்ளதாலும் தானியங்கி சேமிப்பு தற்காலிகமாக நிறுத்தப்பட்டுள்ளது. உங்கள் பணம் அத்தியாவசிய தேவைகளுக்காக பாதுகாப்பாக இருக்கும்."
                    else:
                        answer = f"அவசிய செலவுகள் {_rupees(s_res['burn'])} மற்றும் பில்கள் {_rupees(s_res['committed'])} ஒதுக்கிய பிறகு, நீங்கள் இப்போது பாதுகாப்பாக {_rupees(s_res['amount'])} சேமிக்கலாம்."
                    break
        elif intent == "PERSONAL_BALANCE":
            b_res = next((c["result"] for c in called if c["name"] == "get_balance"), None)
            bd_res = next((c["result"] for c in called if c["name"] == "get_buffer_days"), None)
            if b_res and bd_res:
                if "buffer" in ql:
                    answer = f"உங்கள் இடையக நிதியில் (buffer) {_rupees(bd_res['buffer_rupees'])} உள்ளது. இது {bd_res['buffer_days']} நாட்களுக்கான அத்தியாவசிய செலவுகளுக்கு போதுமானது. இலக்கு {bd_res['target_buffer_days']} நாட்கள் ஆகும்."
                else:
                    answer = f"உங்கள் வங்கிக் கணக்கில் {_rupees(b_res['bank_account'])}, இடையக நிதியில் {_rupees(b_res['buffer'])}, மற்றும் காப்பீட்டு நிதியில் {_rupees(b_res['insurance_fund'])} உள்ளது. இந்த இடையக நிதி {bd_res['buffer_days']} நாட்களுக்கு போதுமானது."
        elif intent == "INCOME":
            for call in called:
                if call["name"] == "get_income_summary":
                    inc_res = call["result"]
                    answer = f"கடந்த {inc_res['days']} நாட்களில் உங்கள் மொத்த வருமானம் {_rupees(inc_res['total_income'])} ஆகும்."
                    break
        elif intent == "SHORTFALL":
            for call in called:
                if call["name"] == "get_shortfall_alert":
                    sf_res = call["result"]
                    if sf_res and sf_res.get("shortfall"):
                        answer = f"உங்கள் கட்டணம் இன்னும் {sf_res['due_in_days']} நாட்களில் செலுத்தப்பட வேண்டும். சுமார் {_rupees(sf_res['shortfall'])} பற்றாக்குறை ஏற்படும் அபாயம் உள்ளது. இடையக நிதியைப் பயன்படுத்துதல் போன்ற பாதுகாப்பான வழிகளைப் பயன்படுத்தலாம்."
                    else:
                        answer = "தற்போது எந்த பற்றாக்குறை அபாயமும் இல்லை. உங்கள் நிலைமை சீராக உள்ளது."
                    break
    elif target_lang == "hi":
        if intent == "GREETING_CASUAL":
            if re.search(r"(thank|thanks|shukriya)", ql):
                answer = "आपका बहुत धन्यवाद! मैं आपके नकदी प्रवाह और बचत बफर को प्रबंधित करने में हमेशा मदद के लिए तैयार हूँ। सुरक्षित रहें।"
            else:
                answer = "नमस्ते! मैं धारा (Dhara) हूँ, गिग श्रमिकों के लिए आपका वित्तीय साथी। मैं आपके बैंक बैलेंस, सेफ-टू-सेव सीमा, या ऋण क्षमता की जांच में मदद कर सकता हूँ।"
        elif intent == "FINANCIAL_GUIDANCE":
            answer = "अनियमित आय में वित्तीय स्थिरता के लिए: एक आपातकालीन बफर बनाए रखें, प्रत्येक भुगतान का एक प्रतिशत बचाएं, और कम आय वाले दिनों में खर्च नियंत्रित रखें।"
        elif intent == "GENERAL_FINANCIAL":
            answer = "आपातकालीन फंड (Emergency Fund) वह बचत है जो अप्रत्याशित खर्चों जैसे चिकित्सा या वाहन मरम्मत के समय काम आती है।"
        elif intent == "DHARA_FEATURE":
            answer = "धारा (Dhara) एक वित्तीय ढांचा है जो गिग श्रमिकों के वास्तविक नकदी प्रवाह के अनुसार बचत और ऋण को लचीला बनाता है।"
        elif intent == "SAFE_TO_SAVE":
            for call in called:
                if call["name"] == "get_safe_to_save":
                    s_res = call["result"]
                    if s_res.get("paused"):
                        answer = f"अगले दो हफ्तों में संभावित कम कमाई और {_rupees(s_res['committed'])} के बिल तथा {_rupees(s_res['burn'])} के आवश्यक खर्चों को देखते हुए आपकी बचत रोक दी गई है ताकि जरूरी खर्च सुरक्षित रहें।"
                    else:
                        answer = f"आवश्यक खर्च {_rupees(s_res['burn'])} और बिल {_rupees(s_res['committed'])} अलग रखने के बाद, आप अभी सुरक्षित रूप से {_rupees(s_res['amount'])} बचा सकते हैं।"
                    break
        elif intent == "PERSONAL_BALANCE":
            b_res = next((c["result"] for c in called if c["name"] == "get_balance"), None)
            bd_res = next((c["result"] for c in called if c["name"] == "get_buffer_days"), None)
            if b_res and bd_res:
                if "buffer" in ql:
                    answer = f"आपके बफर में {_rupees(bd_res['buffer_rupees'])} हैं। यह {bd_res['buffer_days']} दिनों के खर्च को संभाल सकता है। लक्ष्य {bd_res['target_buffer_days']} दिनों का है।"
                else:
                    answer = f"आपके बैंक खाते में {_rupees(b_res['bank_account'])}, बफर में {_rupees(b_res['buffer'])}, और बीमा फंड में {_rupees(b_res['insurance_fund'])} हैं। यह बफर {bd_res['buffer_days']} दिनों के लिए पर्याप्त है।"
        elif intent == "INCOME":
            for call in called:
                if call["name"] == "get_income_summary":
                    inc_res = call["result"]
                    answer = f"पिछले {inc_res['days']} दिनों में आपकी कुल कमाई {_rupees(inc_res['total_income'])} रही है।"
                    break
        elif intent == "SHORTFALL":
            for call in called:
                if call["name"] == "get_shortfall_alert":
                    sf_res = call["result"]
                    if sf_res and sf_res.get("shortfall"):
                        answer = f"आपका भुगतान अगले {sf_res['due_in_days']} दिनों में देय है। लगभग {_rupees(sf_res['shortfall'])} की कमी हो सकती है। सुरक्षित विकल्पों में बफर का उपयोग शामिल है।"
                    else:
                        answer = "फिलहाल किसी कमी का कोई जोखिम नहीं है। आपकी स्थिति सामान्य है।"
                    break

    results = [c["result"] for c in called]
    v = validator_mod.validate(answer, results)
    if not v.ok:
        answer = ("I can only tell you figures I've actually looked up, and something "
                  "in that answer didn't check out. Let me pull it up again.")
        v = validator_mod.validate(answer, results)
    return Turn(question, answer, "deterministic", intent=intent, time_scope=scope,
                tool_calls=called, validation=v.to_dict(), sources=[c["name"] for c in called])


def ask(question: str, history: list[dict] | None = None, force_deterministic: bool = False, lang: str = "en") -> Turn:
    if force_deterministic or not has_api_key():
        return _deterministic_answer(question, history=history, lang=lang)
    try:
        return _run_claude(question)
    except Exception as e:
        t = _deterministic_answer(question, history=history, lang=lang)
        t.source = f"deterministic (claude unavailable: {type(e).__name__})"
        return t
