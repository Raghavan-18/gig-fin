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
    tool_calls: list[dict] = field(default_factory=list)
    validation: dict = field(default_factory=dict)
    blocked_draft: str | None = None
    regenerated: bool = False

    def to_dict(self) -> dict:
        return {"question": self.question, "answer": self.answer,
                "source": self.source, "tool_calls": self.tool_calls,
                "validation": self.validation, "blocked_draft": self.blocked_draft,
                "regenerated": self.regenerated}


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
            # effort, not a smaller model: the quality of the explanation IS the
            # product, so we buy latency by thinking less, not by thinking worse.
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
        return Turn(question, draft, "claude", called, v.to_dict())

    # blocked: one regeneration with the violation named, then a safe fallback
    retry = ask(
        "\n\nCORRECTION: your previous draft contained "
        f"{v.unmatched} which no tool returned. Restate using ONLY figures "
        "present in the tool results, or say you cannot work that out.")
    v2 = validator_mod.validate(retry, results)
    if v2.ok:
        return Turn(question, retry, "claude", called, v2.to_dict(),
                    blocked_draft=draft, regenerated=True)

    safe = _deterministic_answer(question, called)
    return Turn(question, safe.answer, "claude+template", called,
                v2.to_dict(), blocked_draft=draft, regenerated=True)


# -------------------------------------------------- deterministic fallback
# Order matters: the first match wins, so the specific patterns come first.
INTENTS = [
    ("loan", r"(loan|borrow|udhaar|udhar|lend|\bcredit\b|\badvance\b)"),
    ("safe_to_save", r"(sweep|safe to save|why.*(stop|paus|not sav)|"
                     r"(saving|savings).*(stop|paus)|(stop|paus).*(saving|savings))"),
    ("shortfall", r"(\bemi\b|shortfall|\bshort\b|\bdue\b|bounce|kist)"),
    ("buffer", r"(buffer|cushion|emergency fund|how much.*saved|\bsaved\b)"),
    ("forecast", r"(earn|forecast|next month|next week|kamai|income|afford|fees|"
                 r"\u092b\u0940\u0938|\u0915\u092e\u093e)"),
    ("history", r"(spend|spent|history|transactions|last week)"),
    ("balance", r"(balance|how much|paisa|money|account)"),
]


def _classify(q: str) -> str:
    ql = q.lower()
    for name, pattern in INTENTS:
        if re.search(pattern, ql):
            return name
    return "balance"


def _rupees(v) -> str:
    return f"Rs {v:,.0f}"


def _deterministic_answer(question: str, precalled: list[dict] | None = None) -> Turn:
    intent = _classify(question)
    called: list[dict] = list(precalled or [])

    def use(name, **kw):
        r = tool_layer.call(name, **kw)
        called.append({"name": name, "input": kw, "result": r})
        return r

    if intent == "loan":
        m = re.search(r"(\d[\d,]*)", question)
        amount = float(m.group(1).replace(",", "")) if m else 20000.0
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
            parts.append(f"I can offer {_rupees(d['approved_amount'])} as "
                         f"{d['level_label'].lower()}.")
        for rc in d["reason_codes"]:
            parts.append(rc["plain"])
        v = r["structures"]["verdict"]
        parts.append(v["plain"])
        answer = " ".join(parts)

    elif intent == "shortfall":
        a = use("get_shortfall_alert")
        if a.get("message") and a.get("shortfall"):
            lines = [a["message"], "Here is what you can do:"]
            for rem in a["remedies"]:
                lines.append(f"- {rem['label']}. {rem['detail']}")
            answer = " ".join(lines)
        else:
            answer = a.get("message", "Nothing looks short right now.")

    elif intent == "buffer":
        b = use("get_buffer_days")
        answer = (f"Your buffer holds {_rupees(b['buffer_rupees'])}. At your usual "
                  f"essential spending of {_rupees(b['essential_daily_burn'])} a day, "
                  f"that covers {b['buffer_days']} days. The target is "
                  f"{b['target_buffer_days']} days.")

    elif intent == "forecast":
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

    elif intent == "safe_to_save":
        s = use("get_safe_to_save")
        if s["paused"]:
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

    elif intent == "history":
        h = use("get_transaction_history", days=7)
        answer = (f"Over the last {h['days']} days you brought in "
                  f"{_rupees(h['total_income'])} and spent {_rupees(h['total_spending'])}, "
                  f"so you're {_rupees(h['net'])} ahead.")

    else:
        b = use("get_balance")
        bd = use("get_buffer_days")
        answer = (f"You have {_rupees(b['bank_account'])} in your account and "
                  f"{_rupees(b['buffer'])} in your buffer, plus "
                  f"{_rupees(b['insurance_fund'])} set aside for your bike insurance. "
                  f"That buffer is {bd['buffer_days']} days of expenses.")

    results = [c["result"] for c in called]
    v = validator_mod.validate(answer, results)
    if not v.ok:
        # our own template leaked an unsourced number: say less rather than guess
        answer = ("I can only tell you figures I've actually looked up, and something "
                  "in that answer didn't check out. Let me pull it up again.")
        v = validator_mod.validate(answer, results)
    return Turn(question, answer, "deterministic", called, v.to_dict())


def ask(question: str, force_deterministic: bool = False) -> Turn:
    if force_deterministic or not has_api_key():
        return _deterministic_answer(question)
    try:
        return _run_claude(question)
    except Exception as e:                      # never let the demo die on an API
        t = _deterministic_answer(question)
        t.source = f"deterministic (claude unavailable: {type(e).__name__})"
        return t
