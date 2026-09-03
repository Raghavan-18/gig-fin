"""
Policy engine.  IMPLEMENTATION_PLAN.md §C5 / PRD §8 F3.2, F3.4.

Declarative consumer-protection rules evaluated AFTER the scorecard. The model
may only ever narrow an outcome; it can never widen one. Changing a threshold
here is a policy change with its own audit trail, not a model retrain
(ARCHITECTURE.md ADR A5).
"""
from __future__ import annotations

from dataclasses import dataclass, field

# --- affordability -----------------------------------------------------------
# PRD §8 F3.2 states:
#     total_obligations <= 0.35 x p20_monthly_net_income - essential_burn_floor
# Read literally, with essential burn at Rs ~23.6k/month against a p20 income of
# Rs ~31.6k, the right-hand side is NEGATIVE and no one could ever borrow. The
# intended meaning is a debt-service ratio applied to what is left after
# essentials, so that is what is implemented:
#
#     total_debt_service <= DSR_CAP x (p20_monthly_income - essential_non_debt_burn)
#
# This is materially stricter than industry FOIR (which applies the ratio to
# gross income and would give Ravi roughly Rs 7,000/month of headroom instead of
# a few hundred). Being stricter is the point.
DSR_CAP = 0.35

# Short-tenor advances (L0/L1) are NOT monthly obligations and must not be
# assessed with a monthly debt-service ratio. An advance against verified
# upcoming earnings is repaid from the payout it is drawn against, so it is
# underwritten on that payout (PRD §8 F3.1: "up to ~50% of verified expected
# next payout"). Applying the monthly DSR to a 14-day advance would deny credit
# to exactly the people the ladder's bottom rungs exist to serve.
ADVANCE_CAP_PCT = 0.50
SHORT_TENOR_LEVELS = ("L0", "L1")

MAX_LATE_FEE_PCT = 0.05          # aggregate cap on penalties, never capitalised
COOLING_OFF_LEVELS = ("L3", "L4")

LADDER = {
    "L0": {"label": "Overdraft buffer", "max": 2000, "max_days": 7},
    "L1": {"label": "Income advance", "max": 8000, "max_days": 14},
    "L2": {"label": "Working-capital line", "max": 15000, "max_days": 90},
    "L3": {"label": "Emergency loan", "max": 50000, "max_days": 365},
    "L4": {"label": "Asset loan", "max": 300000, "max_days": 1460},
}
LEVEL_ORDER = ["L0", "L1", "L2", "L3", "L4"]


@dataclass
class RuleResult:
    rule: str
    passed: bool
    binding: bool
    detail: str
    plain: str


@dataclass
class Decision:
    outcome: str                     # APPROVE | REDUCE | DECLINE
    level: str | None
    approved_amount: float
    requested_amount: float
    binding_constraint: str | None
    rules: list[RuleResult] = field(default_factory=list)
    reason_codes: list[dict] = field(default_factory=list)
    headroom_monthly: float = 0.0
    advance_cap: float = 0.0
    max_eligible_level: str = "L0"

    def to_dict(self) -> dict:
        return {
            "outcome": self.outcome,
            "level": self.level,
            "level_label": LADDER[self.level]["label"] if self.level else None,
            "approved_amount": round(self.approved_amount, 2),
            "requested_amount": round(self.requested_amount, 2),
            "binding_constraint": self.binding_constraint,
            "headroom_monthly": round(self.headroom_monthly, 2),
            "advance_cap": round(self.advance_cap, 2),
            "max_eligible_level": self.max_eligible_level,
            "max_eligible_label": LADDER[self.max_eligible_level]["label"],
            "rules": [r.__dict__ for r in self.rules],
            "reason_codes": self.reason_codes,
        }


def level_for(amount: float) -> str:
    for lv in LEVEL_ORDER:
        if amount <= LADDER[lv]["max"]:
            return lv
    return "L4"


def max_eligible_level(tenure_days: int, repayments_completed: int,
                       buffer_days: float) -> str:
    """Nobody starts at L3 (PRD §8 F3.1)."""
    if tenure_days < 28:
        return "L0"
    if repayments_completed == 0:
        return "L1"
    if repayments_completed < 2 or buffer_days < 7:
        return "L2"
    if buffer_days < 21:
        return "L3"
    return "L4"


def evaluate(*, requested_amount: float, purpose: str, tenure_months: int,
             p20_monthly_income: float, p20_horizon_income: float,
             essential_non_debt_burn: float,
             existing_debt_service: float, buffer_days: float,
             buffer_balance: float, tenure_days: int, repayments_completed: int,
             active_unacknowledged_shortfall: bool, alternative_shown: bool,
             refinances_existing_dhara_loan: bool) -> Decision:

    disposable = max(0.0, p20_monthly_income - essential_non_debt_burn)
    cap = DSR_CAP * disposable
    headroom = max(0.0, cap - existing_debt_service)

    requested_level = level_for(requested_amount)
    max_level = max_eligible_level(tenure_days, repayments_completed, buffer_days)
    monthly_for_request = requested_amount / max(1, tenure_months)
    short_tenor = requested_level in SHORT_TENOR_LEVELS
    advance_cap = ADVANCE_CAP_PCT * p20_horizon_income

    rules: list[RuleResult] = []

    # 1. rollover -- a hard system block, not a guideline
    rules.append(RuleResult(
        "NO_ROLLOVER", not refinances_existing_dhara_loan,
        refinances_existing_dhara_loan,
        "new credit may not settle an existing Dhara loan",
        "We never lend you money to repay a loan you already have with us."))

    # 2. distress lockout
    distress_ok = not (active_unacknowledged_shortfall and not alternative_shown)
    rules.append(RuleResult(
        "DISTRESS_LOCKOUT", distress_ok, not distress_ok,
        "no offer while a shortfall alert is unacknowledged and no alternative shown",
        "You have a payment coming up that you're short for. We'll show you the "
        "cheaper ways to cover it before we offer you a loan."))

    # 3. ladder
    ladder_ok = LEVEL_ORDER.index(requested_level) <= LEVEL_ORDER.index(max_level)
    rules.append(RuleResult(
        "PRODUCT_LADDER", ladder_ok, not ladder_ok,
        f"requested {requested_level}, eligible up to {max_level}",
        f"Right now you qualify for {LADDER[max_level]['label'].lower()}. "
        f"Products above that open up as you build a repayment record with us."))

    # 4. affordability, on the 20th percentile of income
    if short_tenor:
        afford_ok = requested_amount <= advance_cap
        rules.append(RuleResult(
            "AFFORDABILITY_P20_ADVANCE", afford_ok, not afford_ok,
            f"advance Rs {requested_amount:,.0f} vs 50% of p20 fortnight income "
            f"Rs {p20_horizon_income:,.0f} = Rs {advance_cap:,.0f}",
            f"Even in a slow fortnight you should bring in about "
            f"Rs {p20_horizon_income:,.0f}. We will advance at most half of that, "
            f"so repaying it can never take your whole payout."))
    else:
        afford_ok = monthly_for_request <= headroom
        rules.append(RuleResult(
            "AFFORDABILITY_P20", afford_ok, not afford_ok,
            f"repayment Rs {monthly_for_request:,.0f}/mo vs headroom Rs {headroom:,.0f}/mo "
            f"(35% of Rs {disposable:,.0f} disposable, less Rs {existing_debt_service:,.0f} "
            f"already committed)",
            f"In your slower months you clear about Rs {disposable:,.0f} after rent, fuel "
            f"and food. Your bike EMI already takes Rs {existing_debt_service:,.0f} of that. "
            f"That leaves about Rs {headroom:,.0f} a month we could safely lend against."))

    failed = [r for r in rules if not r.passed]
    binding = failed[0].rule if failed else None

    if not failed:
        outcome, level, approved = "APPROVE", requested_level, requested_amount
    else:
        # what COULD we responsibly offer instead?
        if max_level in SHORT_TENOR_LEVELS:
            affordable_amount = advance_cap
        else:
            affordable_amount = headroom * tenure_months
        level_cap = LADDER[max_level]["max"]
        alt = min(affordable_amount, level_cap)
        blocking = {"NO_ROLLOVER", "DISTRESS_LOCKOUT"}
        if any(r.rule in blocking for r in failed) or alt < 500:
            outcome, level, approved = "DECLINE", None, 0.0
        else:
            outcome, level, approved = "REDUCE", level_for(alt), float(int(alt))

    reason_codes = [{"code": r.rule, "plain": r.plain, "detail": r.detail}
                    for r in failed]
    return Decision(outcome=outcome, level=level, approved_amount=approved,
                    requested_amount=requested_amount, binding_constraint=binding,
                    rules=rules, reason_codes=reason_codes,
                    headroom_monthly=headroom, advance_cap=advance_cap,
                    max_eligible_level=max_level)
