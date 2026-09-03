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


def call(name: str, **kwargs):
    if name not in TOOL_REGISTRY:
        raise KeyError(f"unknown tool {name}")
    return TOOL_REGISTRY[name]["fn"](**kwargs)


def schemas() -> list[dict]:
    return [{"name": t["name"], "description": t["description"],
             "input_schema": t["input_schema"]} for t in TOOL_REGISTRY.values()]
