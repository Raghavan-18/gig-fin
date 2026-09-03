"""
FastAPI app.  Implements the contract frozen in IMPLEMENTATION_PLAN.md §4.1.

Deviation from the plan, recorded honestly: the plan specifies a Next.js
frontend. This serves a single static page instead -- no npm build step, which
removes the most common source of "it worked on my laptop" at hour 19. The
screens and the demo flow are unchanged.
"""
from __future__ import annotations

import time
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from assistant.runner import ask as assistant_ask, has_api_key
from core import safe_to_save as s2s_mod
from core import shortfall as shortfall_mod
from core.compare import run_both
from core.engine import BUFFER, SETTLEMENT, SINKING
from core.ledger import CR, DR, InsufficientFunds, Leg
from core.state import AppState
from credit import policy as policy_mod
from credit import schedule as schedule_mod
from credit import scorecard as scorecard_mod
from ml.classify import assess_income, classify

app = FastAPI(title="Dhara", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PERSONAS = [
    {"id": "ravi", "name": "Ravi", "age": 29, "role": "Delivery partner",
     "city": "Bengaluru", "active": True,
     "blurb": "Rides for two platforms. Bike EMI on the 5th. Earns more than an "
              "entry-level salaried job, and is far more fragile."},
    {"id": "sunita", "name": "Sunita", "age": 41, "role": "Domestic worker",
     "city": "Jaipur", "active": False,
     "blurb": "Five homes, cash wages on dates that vary. Saves in a chit fund "
              "because it is the only savings she trusts."},
    {"id": "imran", "name": "Imran", "age": 34, "role": "Cab driver",
     "city": "Pune", "active": False,
     "blurb": "Grosses Rs 45,000, nets Rs 18,000. Dreads the Rs 14,000 annual "
              "insurance bill every March."},
]


def st() -> AppState:
    return AppState.get()


class SessionRequest(BaseModel):
    persona_id: str = "ravi"


@app.post("/api/session")
def session(req: SessionRequest) -> dict:
    """Persona picker stands in for auth. IMPLEMENTATION_PLAN.md section 1 cuts
    auth/KYC entirely: it carries no narrative value and costs real hours.

    Only Ravi has a seeded 180-day history. The other two personas are listed
    so the segment is visible, and selecting one is refused explicitly rather
    than silently falling back to Ravi -- a demo that pretends to switch users
    and does not is worse than one that says it cannot.
    """
    alias_map = {
        "bengaluru_rider": "ravi",
        "ramesh": "ravi",
        "mumbai_driver": "imran",
        "suresh": "imran",
    }
    pid = alias_map.get(req.persona_id.lower(), req.persona_id.lower())
    match = next((p for p in PERSONAS if p["id"] == pid), None)
    if match is None:
        raise HTTPException(404, f"no persona {req.persona_id!r}")
    if not match["active"]:
        raise HTTPException(
            409, f"{match['name']} has no seeded history in this build. "
                 "Ravi is the only persona with 180 days of data.")
    s = st()
    return {"session_id": f"demo-{match['id']}", "persona": match,
            "as_of": s.ds.today.isoformat(), "days_of_history": s.ds.n_days,
            "consent": {"source": "mock Account Aggregator",
                        "simulated": True,
                        "accounts_shared": ["Savings account", "UPI transaction history"],
                        "purpose": "Cash-flow analysis for savings and credit",
                        "retention_days": 90}}


@app.get("/api/classify")
def classify_income(limit: int = 12) -> dict:
    """Income intelligence over seeded narrations.

    Rule-based on purpose (see ml/classify.py). Surfaces the anti-gaming
    result: self-transfers are excluded from assessed income, because to a
    balance-based underwriter they look exactly like a payout.
    """
    s = st()
    r = assess_income(s.ds.events)
    sample = [{"date": e["date"], "narration": e["narration"], "amount": e["amount"],
               "kind": e["kind"], **classify(e["narration"], e["kind"])}
              for e in s.ds.events[-limit:]]
    return {**r, "sample": sample}


class SimulateDayRequest(BaseModel):
    day: int | None = None
    scenario: str = "scripted"


@app.post("/api/simulate/day")
def simulate_day(req: SimulateDayRequest) -> dict:
    """Step the scripted simulation one day and return that day's full state.

    The plan's contract name. It reads the same replayed engine output the
    timeline uses, so stepping and scrubbing can never disagree.
    """
    s = st()
    d0 = s.ds.drought["start_idx"]
    daily = {d["idx"]: d for d in s.dhara.out.daily}
    idx = req.day if req.day is not None else min(daily)
    if idx not in daily:
        raise HTTPException(404, f"day {idx} is outside the simulated range")
    d = dict(daily[idx])
    d["is_drought"] = d0 <= idx < d0 + s.ds.drought["days"]
    d["weekday"] = s.ds.date_of(idx).strftime("%a")
    d["events"] = s.ds.events_on(idx)
    nxt = idx + 1
    return {"day": d, "drought": s.ds.drought,
            "has_next": nxt in daily, "next_day": nxt if nxt in daily else None,
            "first_day": min(daily), "last_day": max(daily)}


@app.get("/api/health")
def health() -> dict:
    s = st()
    return {
        "ok": True,
        "ledger_integrity": {p: e.ledger.verify() for p, e in s.engines.items()},
        "assistant_path": "claude" if has_api_key() else "deterministic",
        "calibration": s.calibration,
        "seed_date": s.ds.today.isoformat(),
    }


@app.get("/api/personas")
def personas() -> list[dict]:
    return PERSONAS


@app.get("/api/dashboard")
def dashboard() -> dict:
    s = st()
    summ = s.summaries["DHARA"]
    liquid = summ["settlement"]
    s2s = s2s_mod.compute(s.ds, s.hf14, s.today, liquid=liquid)
    alert = shortfall_mod.detect(s.ds, s.hf14, s.today,
                                 buffer_balance=summ["buffer"],
                                 settlement_balance=liquid)
    q14 = s.hf14.predict(s.ds.income, t=s.today)
    q30 = s.hf30.predict(s.ds.income, t=s.today)
    iss = scorecard_mod.income_stability_score(s.ds, s.today)

    return {
        "persona": PERSONAS[0],
        "as_of": s.ds.today.isoformat(),
        "balances": {
            "account": summ["settlement"],
            "buffer": summ["buffer"],
            "insurance_fund": summ["sinking_fund"],
            "total": summ["liquid_total"],
        },
        "buffer_days": summ["buffer_days"],
        "target_buffer_days": 30,
        "essential_daily_burn": summ["essential_daily_burn"],
        "safe_to_save": s2s.to_dict(),
        "alert": alert,
        "forecast_14": {k: v for k, v in q14.items() if k.startswith("p")},
        "forecast_30": {k: v for k, v in q30.items() if k.startswith("p")},
        "stability": iss,
        "obligations": s.ds.upcoming_obligations(s.today, 30),
        "sinking": {
            "target": s.ds.sinking_targets[0],
            "balance": summ["sinking_fund"],
            "daily_accrual": 38,
        },
        "totals": {
            "saved_to_date": summ["total_saved"],
            "sweeps_executed": summ["sweeps_executed"],
            "sweeps_paused": summ["sweeps_paused"],
        },
    }


@app.get("/api/forecast")
def forecast(days: int = 30) -> dict:
    s = st()
    days = max(1, min(30, days))
    path = s.daily_fc.predict_path(s.ds.income, s.ds.weekdays, s.ds.day_of_month,
                                   s.today, horizon=days)
    hist_from = max(0, s.today - 45)
    history = [{"date": s.ds.date_of(i).isoformat(), "income": float(s.ds.income[i]),
                "drought": s.ds.drought["start_idx"] <= i
                           < s.ds.drought["start_idx"] + s.ds.drought["days"]}
               for i in range(hist_from, s.today + 1)]
    points = [{"date": s.ds.date_of(s.today + k + 1).isoformat(),
               "p10": path["p10"][k], "p20": path["p20"][k],
               "p50": path["p50"][k], "p90": path["p90"][k]}
              for k in range(days)]
    return {"history": history, "points": points, "calibration": s.calibration}


@app.get("/api/timeline")
def timeline(days: int = 30) -> dict:
    s = st()
    lo = max(0, s.today - days + 1)
    daily = [d for d in s.dhara.out.daily if d["idx"] >= lo]
    events = [e for e in s.ds.events if e["idx"] >= lo]
    d0 = s.ds.drought["start_idx"]
    for d in daily:
        d["is_drought"] = d0 <= d["idx"] < d0 + s.ds.drought["days"]
    return {"daily": daily, "events": events[-120:],
            "drought": s.ds.drought}


@app.get("/api/replay")
def replay(start: int = 165, end: int = 179) -> dict:
    """Day-by-day records for the demo's 'run the simulation forward' beat."""
    s = st()
    lo, hi = max(0, start), min(s.ds.n_days - 1, end)
    d0 = s.ds.drought["start_idx"]
    out = []
    for d in s.dhara.out.daily:
        if not (lo <= d["idx"] <= hi):
            continue
        rec = dict(d)
        rec["is_drought"] = d0 <= d["idx"] < d0 + s.ds.drought["days"]
        rec["weekday"] = s.ds.date_of(d["idx"]).strftime("%a")
        rec["events"] = [e for e in s.ds.events_on(d["idx"])
                         if e["kind"] == "INCOME" and e["category"] != "SELF_TRANSFER"]
        out.append(rec)
    return {"days": out, "drought": s.ds.drought}


class WithdrawRequest(BaseModel):
    amount: float
    bucket: str = "buffer"


@app.post("/api/withdraw")
def withdraw(req: WithdrawRequest) -> dict:
    """The trust contract (PRD §7 F2.5): no penalty, no interrogation.

    Deliberately depends only on the ledger -- no forecaster, no assistant, no
    intelligence-plane call anywhere on this path (ARCHITECTURE.md driver D1).
    """
    t0 = time.time()
    s = st()
    ledger = s.dhara.ledger
    account = {"buffer": BUFFER, "insurance_fund": SINKING}.get(req.bucket, BUFFER)
    minor = int(round(req.amount * 100))
    if minor <= 0:
        raise HTTPException(400, "amount must be positive")
    try:
        ledger.post("WITHDRAWAL", f"wd:{time.time_ns()}",
                    [Leg(account, DR, minor), Leg(SETTLEMENT, CR, minor)],
                    occurred_on=s.ds.today.isoformat(),
                    metadata={"channel": "instant_out"})
    except InsufficientFunds:
        raise HTTPException(400, "more than that bucket holds")

    summ = s.summaries["DHARA"]
    summ["buffer"] = ledger.balance(BUFFER) / 100
    summ["sinking_fund"] = ledger.balance(SINKING) / 100
    summ["settlement"] = ledger.balance(SETTLEMENT) / 100
    summ["liquid_total"] = summ["buffer"] + summ["sinking_fund"] + summ["settlement"]
    emb = summ["essential_daily_burn"]
    summ["buffer_days"] = round(summ["buffer"] / emb, 1) if emb else 0.0

    return {"ok": True, "elapsed_ms": round((time.time() - t0) * 1000, 1),
            "penalty": 0, "questions_asked": 0,
            "balances": {"account": summ["settlement"], "buffer": summ["buffer"],
                         "insurance_fund": summ["sinking_fund"]},
            "buffer_days": summ["buffer_days"]}


class CreditRequest(BaseModel):
    amount: float
    tenure_months: int = 12
    purpose: str = "general"


@app.post("/api/credit/apply")
def credit_apply(req: CreditRequest) -> dict:
    s = st()
    summ = s.summaries["DHARA"]
    alert = shortfall_mod.detect(s.ds, s.hf14, s.today,
                                 buffer_balance=summ["buffer"],
                                 settlement_balance=summ["settlement"])
    decision = policy_mod.evaluate(
        requested_amount=req.amount, purpose=req.purpose,
        tenure_months=req.tenure_months,
        p20_monthly_income=s.p20_monthly(), p20_horizon_income=s.p20_fortnight(),
        essential_non_debt_burn=s.essential_non_debt_burn(),
        existing_debt_service=s.existing_debt_service(),
        buffer_days=summ["buffer_days"], buffer_balance=summ["buffer"],
        tenure_days=180, repayments_completed=0,
        active_unacknowledged_shortfall=bool(alert), alternative_shown=True,
        refinances_existing_dhara_loan=req.purpose.lower().startswith("repay"))

    alternative = None
    if summ["buffer"] >= req.amount:
        alternative = {"type": "USE_YOUR_OWN_MONEY", "covers": req.amount, "cost": 0,
                       "plain": f"Your buffer holds Rs {summ['buffer']:,.0f}. It covers "
                                f"this whole amount today, at no cost."}
    elif summ["buffer"] > 0:
        alternative = {"type": "PARTIAL_BUFFER", "covers": summ["buffer"], "cost": 0,
                       "plain": f"Your buffer covers Rs {summ['buffer']:,.0f} of this at "
                                f"no cost. You would only need to borrow the rest."}

    return {
        "decision": decision.to_dict(),
        "alternative": alternative,
        "scorecard": scorecard_mod.score(s.ds, s.today, summ["buffer_days"],
                                         s.existing_debt_service(), s.p20_monthly()),
        "structures": schedule_mod.compare_structures(
            s.ds, s.dhara.out.daily, req.amount, req.tenure_months),
        "shortfall_active": bool(alert),
    }


class AskRequest(BaseModel):
    text: str
    force_deterministic: bool = False


@app.post("/api/assistant/ask")
def assistant(req: AskRequest) -> dict:
    turn = assistant_ask(req.text, force_deterministic=req.force_deterministic)
    return turn.to_dict()


_compare_cache: dict[str, Any] = {}


@app.get("/api/compare")
def compare() -> dict:
    if "r" not in _compare_cache:
        s = st()
        _compare_cache["r"] = run_both(s.ds, s.hf14)
    r = _compare_cache["r"]
    return {"traditional": r["TRADITIONAL"]["summary"],
            "dhara": r["DHARA"]["summary"],
            "delta": r["delta"],
            "traditional_daily": r["TRADITIONAL"]["daily"],
            "dhara_daily": r["DHARA"]["daily"],
            "traditional_timeline": [t for t in r["TRADITIONAL"]["timeline"]
                                     if t["kind"] in ("BOUNCE", "RD_BOUNCE",
                                                      "MANDATE_DISABLED")][:20]}


@app.get("/")
def root() -> dict:
    return {
        "app": "Dhara Financial Resilience API",
        "status": "ok",
        "version": "0.1.0",
        "docs": "/docs",
        "client": "http://localhost:5173",
    }
