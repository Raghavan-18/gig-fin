"""
The assistant's tool layer.  ARCHITECTURE.md §4.4.

Every one of these is a deterministic read over engines that have already
computed the answer. The language model may call them; it may not compute.
Each returns plain JSON-serialisable data, which the validator then treats as
the complete set of numbers the answer is allowed to contain.
"""
from __future__ import annotations

from core import safe_to_save as s2s_mod
from core import shortfall as shortfall_mod
from core.state import AppState
from credit import policy as policy_mod
from credit import schedule as schedule_mod
from credit import scorecard as scorecard_mod

TOOL_REGISTRY: dict[str, dict] = {}


def tool(name: str, description: str, schema: dict):
    def wrap(fn):
        TOOL_REGISTRY[name] = {"fn": fn, "name": name,
                               "description": description, "input_schema": schema}
        return fn
    return wrap


NO_ARGS = {"type": "object", "properties": {}, "required": [],
           "additionalProperties": False}


@tool("get_balance", "Current money across the bank account and every savings "
      "bucket, in rupees.", NO_ARGS)
def get_balance() -> dict:
    st = AppState.get()
    s = st.summaries["DHARA"]
    return {"bank_account": s["settlement"], "buffer": s["buffer"],
            "insurance_fund": s["sinking_fund"], "total_liquid": s["liquid_total"],
            "as_of": st.ds.today.isoformat()}


@tool("get_buffer_days", "How many days of essential expenses the buffer covers. "
      "This is the resilience metric that matters most.", NO_ARGS)
def get_buffer_days() -> dict:
    st = AppState.get()
    s = st.summaries["DHARA"]
    return {"buffer_days": s["buffer_days"], "buffer_rupees": s["buffer"],
            "essential_daily_burn": s["essential_daily_burn"],
            "target_buffer_days": 30}


@tool("get_forecast", "Income forecast as a range, never a single number. "
      "Returns p10/p20/p50/p90 for the next 14 and 30 days.", NO_ARGS)
def get_forecast() -> dict:
    st = AppState.get()
    q14 = st.hf14.predict(st.ds.income, t=st.today)
    q30 = st.hf30.predict(st.ds.income, t=st.today)
    return {
        "next_14_days": {k: v for k, v in q14.items() if k.startswith("p")},
        "next_30_days": {k: v for k, v in q30.items() if k.startswith("p")},
        "band_coverage_measured": st.calibration["coverage_p10_p90"],
        "note": "p20 is the figure used for any lending or savings decision.",
    }


@tool("get_safe_to_save", "How much can be safely moved to savings right now, "
      "and if the answer is nothing, why sweeps are paused.", NO_ARGS)
def get_safe_to_save() -> dict:
    st = AppState.get()
    liquid = st.summaries["DHARA"]["settlement"]
    s = s2s_mod.compute(st.ds, st.hf14, st.today, liquid=liquid)
    return s.to_dict()


@tool("get_obligations", "Upcoming dated commitments -- rent, EMI, bills -- with "
      "how many days until each is due.", NO_ARGS)
def get_obligations() -> dict:
    st = AppState.get()
    obs = st.ds.upcoming_obligations(st.today, 30)
    return {"obligations": obs, "count_words": "three" if len(obs) == 3 else str(len(obs)),
            "existing_monthly_debt_service": st.existing_debt_service()}


@tool("get_shortfall_alert", "Whether the user is projected to fall short of an "
      "upcoming commitment, and the ways to cover it.", NO_ARGS)
def get_shortfall_alert() -> dict:
    st = AppState.get()
    s = st.summaries["DHARA"]
    alert = shortfall_mod.detect(st.ds, st.hf14, st.today,
                                 buffer_balance=s["buffer"],
                                 settlement_balance=s["settlement"])
    return alert or {"alert": None, "message": "Nothing looks short right now."}


@tool("simulate_loan", "Assess a loan request: the decision, the reasons, what is "
      "affordable, and what the same loan looks like as a fixed EMI versus an "
      "income-linked repayment.",
      {"type": "object",
       "properties": {
           "amount": {"type": "number", "description": "Amount requested in rupees"},
           "tenure_months": {"type": "integer", "description": "Repayment period in months"},
           "purpose": {"type": "string", "description": "What the money is for"}},
       "required": ["amount"], "additionalProperties": False})
def simulate_loan(amount: float, tenure_months: int = 12, purpose: str = "general") -> dict:
    st = AppState.get()
    s = st.summaries["DHARA"]
    alert = shortfall_mod.detect(st.ds, st.hf14, st.today,
                                 buffer_balance=s["buffer"],
                                 settlement_balance=s["settlement"])

    decision = policy_mod.evaluate(
        requested_amount=float(amount), purpose=purpose,
        tenure_months=int(tenure_months),
        p20_monthly_income=st.p20_monthly(), p20_horizon_income=st.p20_fortnight(),
        essential_non_debt_burn=st.essential_non_debt_burn(),
        existing_debt_service=st.existing_debt_service(),
        buffer_days=s["buffer_days"], buffer_balance=s["buffer"],
        tenure_days=180, repayments_completed=0,
        active_unacknowledged_shortfall=bool(alert), alternative_shown=True,
        refinances_existing_dhara_loan=(purpose or "").lower().startswith("repay"),
    )

    # The alternative is evaluated BEFORE the offer is rendered (PRD §8 F3.6).
    alternative = None
    if s["buffer"] >= float(amount):
        alternative = {
            "type": "USE_YOUR_OWN_MONEY",
            "covers": float(amount),
            "cost": 0,
            "plain": (f"Your buffer holds Rs {s['buffer']:,.0f}. It covers this "
                      f"whole amount today, at no cost. Taking a loan instead "
                      f"would cost you money you do not need to spend."),
        }
    elif s["buffer"] > 0:
        alternative = {
            "type": "PARTIAL_BUFFER",
            "covers": s["buffer"],
            "cost": 0,
            "plain": (f"Your buffer covers Rs {s['buffer']:,.0f} of this at no cost. "
                      f"You would only need to borrow the rest."),
        }

    comparison = schedule_mod.compare_structures(
        st.ds, st.dhara.out.daily, float(amount), int(tenure_months))

    return {"decision": decision.to_dict(), "alternative": alternative,
            "structures": comparison,
            "scorecard": scorecard_mod.score(
                st.ds, st.today, s["buffer_days"], st.existing_debt_service(),
                st.p20_monthly())}


@tool("get_transaction_history", "Recent income and spending, most recent first.",
      {"type": "object",
       "properties": {"days": {"type": "integer",
                               "description": "How many days back to look"}},
       "required": [], "additionalProperties": False})
def get_transaction_history(days: int = 7) -> dict:
    st = AppState.get()
    lo = max(0, st.today - int(days) + 1)
    rows = [e for e in st.ds.events if e["idx"] >= lo]
    income = sum(e["amount"] for e in rows
                 if e["kind"] == "INCOME" and e["category"] != "SELF_TRANSFER")
    spend = sum(e["amount"] for e in rows
                if e["kind"] == "OUTFLOW" and e["category"] != "SELF_TRANSFER")
    return {"days": int(days), "total_income": income, "total_spending": spend,
            "net": income - spend,
            "events": [{"date": e["date"], "label": e["label"], "kind": e["kind"],
                        "amount": e["amount"]} for e in rows[-40:]]}


@tool("get_spending_breakdown", "Aggregates recent outflows by category to identify "
      "biggest expenses and reduction opportunities.",
      {"type": "object",
       "properties": {"days": {"type": "integer", "description": "Analysis window in days"}},
       "required": [], "additionalProperties": False})
def get_spending_breakdown(days: int = 30) -> dict:
    st = AppState.get()
    lo = max(0, st.today - int(days) + 1)
    rows = [e for e in st.ds.events if e["idx"] >= lo and e["kind"] == "OUTFLOW" and e["category"] != "SELF_TRANSFER"]
    by_cat: dict[str, float] = {}
    for e in rows:
        c = e.get("category", "OTHER")
        by_cat[c] = by_cat.get(c, 0.0) + float(e["amount"])
    
    total = sum(by_cat.values())
    sorted_cats = sorted(by_cat.items(), key=lambda x: x[1], reverse=True)
    top_categories = [{"category": c.title(), "amount": round(amt), "percentage": round((amt / total) * 100) if total else 0}
                      for c, amt in sorted_cats]
    top_name = top_categories[0]["category"] if top_categories else "None"
    top_amt = top_categories[0]["amount"] if top_categories else 0
    return {
        "days": int(days),
        "total_spending": round(total),
        "categories": top_categories,
        "top_expense_category": top_name,
        "top_expense_amount": top_amt,
    }


@tool("get_income_analysis", "Analyzes earnings for a specified window (1 day for today, "
      "7 days for week, 30 days for month) against baseline.",
      {"type": "object",
       "properties": {
           "days": {"type": "integer", "description": "Days to analyze (1 for today, 7 for week, 30 for month)"},
           "scope": {"type": "string", "description": "Scope label: today, week, last_7_days, month"}
       },
       "required": [], "additionalProperties": False})
def get_income_analysis(days: int = 7, scope: str = "week") -> dict:
    st = AppState.get()
    days_val = max(1, int(days))
    lo = max(0, st.today - days_val + 1)
    recent_events = [e for e in st.ds.events if e["idx"] >= lo and e["kind"] == "INCOME" and e["category"] != "SELF_TRANSFER"]
    recent_total = sum(float(e["amount"]) for e in recent_events)
    
    # 30-day weekly average baseline
    lo30 = max(0, st.today - 30 + 1)
    month_events = [e for e in st.ds.events if e["idx"] >= lo30 and e["kind"] == "INCOME" and e["category"] != "SELF_TRANSFER"]
    avg_weekly = (sum(float(e["amount"]) for e in month_events) / 30.0) * 7.0 if month_events else recent_total

    d0 = st.ds.drought["start_idx"]
    in_drought = d0 <= st.today < d0 + st.ds.drought["days"]
    drought_days_in_window = sum(1 for i in range(lo, st.today + 1) if d0 <= i < d0 + st.ds.drought["days"])

    return {
        "recent_income": round(recent_total),
        "days": days_val,
        "scope": scope,
        "average_weekly_income": round(avg_weekly),
        "is_drought": in_drought or drought_days_in_window > 0,
        "drought_days": drought_days_in_window,
        "payout_count": len(recent_events),
        "status": "LOW" if recent_total < (avg_weekly * 0.75) else "NORMAL",
        "has_data": len(recent_events) > 0,
    }



@tool("check_affordability", "Evaluates whether an upcoming commitment or expense "
      "can be covered by existing reserves and projected income.",
      {"type": "object",
       "properties": {
           "amount": {"type": "number", "description": "Expense amount in rupees"},
           "commitment_name": {"type": "string", "description": "Name of the commitment, e.g. school fees, rent"},
       },
       "required": [], "additionalProperties": False})
def check_affordability(amount: float | None = None, commitment_name: str = "commitment") -> dict:
    st = AppState.get()
    s = st.summaries["DHARA"]
    p20_14 = st.p20_fortnight()
    liquid_total = s["liquid_total"]
    buffer_rupees = s["buffer"]
    
    obs = st.ds.upcoming_obligations(st.today, 30)
    matched_ob = next((o for o in obs if commitment_name.lower() in o.get("name", "").lower() or commitment_name.lower() in o.get("category", "").lower()), None)
    target_amount = float(amount) if amount is not None else (float(matched_ob["amount"]) if matched_ob else 6500.0)
    target_name = commitment_name or (matched_ob["name"] if matched_ob else "commitment")

    is_covered_by_buffer = buffer_rupees >= target_amount
    is_covered_by_cashflow = (liquid_total + p20_14) >= (target_amount + s["essential_daily_burn"] * 14)

    return {
        "commitment_name": target_name,
        "amount": round(target_amount),
        "buffer_rupees": round(buffer_rupees),
        "liquid_total": round(liquid_total),
        "p20_projected_fortnight": round(p20_14),
        "can_cover": is_covered_by_buffer or is_covered_by_cashflow,
        "covered_by": "BUFFER" if is_covered_by_buffer else ("CASHFLOW" if is_covered_by_cashflow else "SHORTFALL"),
    }



def call(name: str, **kwargs):
    if name not in TOOL_REGISTRY:
        raise KeyError(f"unknown tool {name}")
    return TOOL_REGISTRY[name]["fn"](**kwargs)


def schemas() -> list[dict]:
    return [{"name": t["name"], "description": t["description"],
             "input_schema": t["input_schema"]} for t in TOOL_REGISTRY.values()]
