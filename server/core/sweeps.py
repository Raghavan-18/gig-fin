"""
Adaptive sweep engine.  IMPLEMENTATION_PLAN.md §C3 / PRD §7 F2.2.

Three modes, all bounded by Safe-to-Save:

  PAYOUT_SLICE  save X% of each income event            (default 5%)
  ROUND_UP      round each spend up to the next Rs 10   (painless, high freq)
  SURGE_SKIM    on a day earning >120% of the personal 30-day median,
                save 20% of the EXCESS

Surge skim is the mechanically correct answer to income volatility: it turns
variance from the threat into the funding source for the buffer.

No sweep is ever larger than the remaining Safe-to-Save for that day. On a
drought day S2S <= 0 and every mode yields zero, with a reason code.
"""
from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np

PAYOUT_SLICE_PCT = 0.03
# A same-day guard. Safe-to-Save is backward-looking: one washout day barely
# moves a 7-day mean, so on the FIRST day of a drought S2S can still be positive
# and a sweep would fire. But the sweep decision is made at end of day, when
# today's earnings are already known -- so if today came in far below his
# personal median, we simply don't take anything, whatever the forecast says.
# Fails in the safe direction (ARCHITECTURE §9.3).
DROUGHT_DAY_RATIO = 0.50
SURGE_THRESHOLD = 1.20
SURGE_SKIM_PCT = 0.25
ROUND_UP_TO = 10


@dataclass
class SweepRule:
    mode: str
    enabled: bool = True
    params: dict = field(default_factory=dict)


DEFAULT_RULES = [
    SweepRule("PAYOUT_SLICE", True, {"pct": PAYOUT_SLICE_PCT}),
    SweepRule("ROUND_UP", True, {"to": ROUND_UP_TO}),
    SweepRule("SURGE_SKIM", True, {"threshold": SURGE_THRESHOLD, "pct": SURGE_SKIM_PCT}),
]


@dataclass
class SweepResult:
    idx: int
    date: str
    total: float
    lines: list[dict]
    paused: bool
    reason: str | None
    s2s: float
    headroom_binding: bool = False

    def to_dict(self) -> dict:
        return {
            "idx": self.idx, "date": self.date, "total": round(self.total, 2),
            "lines": self.lines, "paused": self.paused, "reason": self.reason,
            "s2s": round(self.s2s, 2), "headroom_binding": self.headroom_binding,
        }


def personal_median(income: np.ndarray, idx: int, window: int = 30) -> float:
    lo = max(0, idx - window + 1)
    w = income[lo: idx + 1]
    nz = w[w > 0]
    return float(np.median(nz)) if len(nz) else 0.0


def evaluate_day(ds, idx: int, s2s, rules: list[SweepRule] | None = None) -> SweepResult:
    """Decide what to sweep on day `idx`. Pure function -- no side effects."""
    rules = rules or DEFAULT_RULES
    d = ds.date_of(idx).isoformat()

    if s2s.paused:
        return SweepResult(idx, d, 0.0, [], True, s2s.reason, s2s.amount)

    # same-day realised-income guard (see DROUGHT_DAY_RATIO)
    med_today = personal_median(ds.income, idx - 1 if idx else 0)
    if med_today > 0 and ds.income[idx] < DROUGHT_DAY_RATIO * med_today:
        return SweepResult(idx, d, 0.0, [], True, "DROUGHT", s2s.amount)

    headroom = s2s.amount
    lines: list[dict] = []
    events = ds.events_on(idx)
    income_events = [e for e in events if e["kind"] == "INCOME"
                     and e["category"] != "SELF_TRANSFER"]
    spend_events = [e for e in events if e["kind"] == "OUTFLOW"
                    and e["category"] not in ("SELF_TRANSFER",)]
    day_income = sum(e["amount"] for e in income_events)

    by_mode = {r.mode: r for r in rules if r.enabled}

    if "PAYOUT_SLICE" in by_mode and headroom > 0:
        pct = by_mode["PAYOUT_SLICE"].params.get("pct", PAYOUT_SLICE_PCT)
        for e in income_events:
            amt = min(round(e["amount"] * pct, 2), headroom)
            if amt <= 0:
                break
            headroom -= amt
            lines.append({"mode": "PAYOUT_SLICE", "amount": amt,
                          "note": f"{int(pct * 100)}% of {e['label']}"})

    if "ROUND_UP" in by_mode and headroom > 0:
        to = by_mode["ROUND_UP"].params.get("to", ROUND_UP_TO)
        total_ru = sum((-e["amount"]) % to for e in spend_events)
        amt = min(float(total_ru), headroom)
        if amt > 0:
            headroom -= amt
            lines.append({"mode": "ROUND_UP", "amount": amt,
                          "note": f"{len(spend_events)} spends rounded to Rs {to}"})

    if "SURGE_SKIM" in by_mode and headroom > 0 and day_income > 0:
        p = by_mode["SURGE_SKIM"].params
        med = personal_median(ds.income, idx - 1 if idx else 0)
        thresh = med * p.get("threshold", SURGE_THRESHOLD)
        if med > 0 and day_income > thresh:
            excess = day_income - med
            amt = min(round(excess * p.get("pct", SURGE_SKIM_PCT), 2), headroom)
            if amt > 0:
                headroom -= amt
                lines.append({
                    "mode": "SURGE_SKIM", "amount": amt,
                    "note": f"earned Rs {int(day_income):,} vs median Rs {int(med):,}"
                            f" - saving {int(p.get('pct', SURGE_SKIM_PCT) * 100)}%"
                            f" of the excess"})

    total = sum(l["amount"] for l in lines)
    return SweepResult(idx, d, total, lines, False, None, s2s.amount,
                       headroom_binding=headroom <= 0.01 and total > 0)
