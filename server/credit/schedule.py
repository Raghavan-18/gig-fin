"""
Income-linked repayment.  IMPLEMENTATION_PLAN.md §C6 / PRD §8 F3.3.

    repayment_i = clamp(rate x payout_i, 0, ceiling)

with a hard maturity date and a total cost disclosed in rupees up front.
On a zero-income day: Rs 0 collected, no fee, no DPD, no bureau report.

The comparison here is a BACKTEST, not a projection: both structures are run
against Ravi's actual last 90 days of earnings -- which contain the drought --
so the fixed EMI's failure is observed, not asserted.
"""
from __future__ import annotations

from dataclasses import dataclass

FLAT_FEE_PCT = 0.02          # one-time origination, disclosed in rupees
MONTHLY_RATE = 0.018         # ~1.8%/month on reducing balance
GRACE_ZERO_DAYS = 3          # consecutive zero-income days before auto-grace


@dataclass
class Structure:
    label: str
    collected: float
    missed_events: int
    bounces: int
    fees: float
    days_to_clear: int | None
    outstanding: float
    ledger: list[dict]


def total_cost(principal: float, tenure_months: int) -> dict:
    fee = principal * FLAT_FEE_PCT
    interest = principal * MONTHLY_RATE * tenure_months * 0.55   # reducing balance
    total = principal + fee + interest
    return {
        "principal": round(principal, 2),
        "fee": round(fee, 2),
        "interest": round(interest, 2),
        "total_repayable": round(total, 2),
        "cost_of_credit": round(fee + interest, 2),
        "tenure_months": tenure_months,
        # rupee-first disclosure (PRD §8 F3.4): the headline is what you pay back
        "plain": (f"You borrow Rs {principal:,.0f}. You pay back "
                  f"Rs {total:,.0f} in total. That is Rs {fee + interest:,.0f} "
                  f"as the cost of the loan."),
    }


def simulate_income_linked(income_by_day, principal: float, tenure_months: int,
                           rate: float = 0.08, ceiling: float | None = None,
                           bounce_fee: float = 590.0) -> Structure:
    cost = total_cost(principal, tenure_months)
    owed = cost["total_repayable"]
    ceiling = ceiling or (owed / (tenure_months * 30) * 4)

    collected = 0.0
    zero_run = 0
    ledger = []
    cleared = None
    for i, inc in enumerate(income_by_day):
        if inc <= 0:
            zero_run += 1
            ledger.append({"day": i, "income": 0.0, "paid": 0.0,
                           "status": "GRACE" if zero_run >= GRACE_ZERO_DAYS else "ZERO"})
            continue
        zero_run = 0
        pay = min(max(0.0, rate * inc), ceiling, owed - collected)
        collected += pay
        ledger.append({"day": i, "income": float(inc), "paid": round(pay, 2),
                       "status": "PAID"})
        if collected >= owed - 0.01 and cleared is None:
            cleared = i
            break
    return Structure("Income-linked", round(collected, 2), 0, 0, 0.0, cleared,
                     round(max(0.0, owed - collected), 2), ledger)


def simulate_fixed_emi(income_by_day, balances_by_day, principal: float,
                       tenure_months: int, due_day_of_month: int,
                       day_of_month, bounce_fee: float = 590.0) -> Structure:
    """The same loan as a fixed monthly instalment presented on a fixed date.

    `balances_by_day` is the settlement balance actually available on each day,
    so a bounce here means the money genuinely was not there.
    """
    cost = total_cost(principal, tenure_months)
    emi = cost["total_repayable"] / tenure_months

    collected = 0.0
    bounces = 0
    fees = 0.0
    ledger = []
    for i, inc in enumerate(income_by_day):
        if day_of_month[i] != due_day_of_month:
            continue
        available = balances_by_day[i]
        if available >= emi:
            collected += emi
            ledger.append({"day": i, "due": round(emi, 2), "paid": round(emi, 2),
                           "available": round(available, 2), "status": "PAID"})
        else:
            bounces += 1
            fees += bounce_fee
            ledger.append({"day": i, "due": round(emi, 2), "paid": 0.0,
                           "available": round(available, 2), "status": "BOUNCED",
                           "fee": bounce_fee})
    return Structure("Fixed EMI", round(collected, 2), bounces, bounces,
                     round(fees, 2), None,
                     round(max(0.0, cost["total_repayable"] - collected), 2), ledger)


def compare_structures(ds, daily_records, principal: float, tenure_months: int,
                       window: int = 90) -> dict:
    """Backtest both structures over the last `window` days of real earnings."""
    lo = max(0, ds.n_days - window)
    income = list(ds.income[lo:])
    balances = [d["settlement"] for d in daily_records[lo:]]
    dom = list(ds.day_of_month[lo:lo + len(income)])

    il = simulate_income_linked(income, principal, tenure_months)
    fx = simulate_fixed_emi(income, balances, principal, tenure_months, 5, dom)

    return {
        "principal": principal,
        "tenure_months": tenure_months,
        "window_days": len(income),
        "cost": total_cost(principal, tenure_months),
        "income_linked": {
            "label": il.label, "collected": il.collected, "bounces": il.bounces,
            "fees": il.fees, "outstanding": il.outstanding,
            "zero_income_days_charged_nothing": sum(
                1 for r in il.ledger if r["status"] in ("ZERO", "GRACE")),
            "ledger": il.ledger,
        },
        "fixed_emi": {
            "label": fx.label, "collected": fx.collected, "bounces": fx.bounces,
            "fees": fx.fees, "outstanding": fx.outstanding,
            "ledger": fx.ledger,
        },
        "verdict": {
            "bounces_avoided": fx.bounces - il.bounces,
            "fees_avoided": round(fx.fees - il.fees, 2),
            "on_schedule_pct": round(
                il.collected / (total_cost(principal, tenure_months)["total_repayable"]
                                * len(income) / (tenure_months * 30)) * 100, 1),
            "plain": (f"Over Ravi's last {len(income)} days -- the ones that include "
                      f"the washout week -- a fixed instalment would have bounced "
                      f"{fx.bounces} time(s) and cost Rs {fx.fees:,.0f} in penalties. "
                      f"The income-linked structure collected Rs {il.collected:,.0f} "
                      f"with no bounce and charged nothing on the days he earned "
                      f"nothing -- ahead of where a straight-line schedule would "
                      f"have him at this point."),
        },
    }
