"""
Safe-to-Save.  IMPLEMENTATION_PLAN.md §C2 / PRD §7 F2.1.

    S2S = liquid_balance + forecast_p20(14d income)
        - committed_outflows(14d)     # dated: rent, EMI, utility, premium
        - daily_essential_burn * 14   # undated: fuel, food
        - reserve_floor               # user-set untouchable minimum

The PRD states this formula in terms of projected inflow alone. That shorthand
funds every committed outflow purely out of FUTURE income, which makes S2S
structurally negative on the ~half of all days that have rent or an EMI inside
the 14-day window -- the buffer would then never get funded. The liquid
settlement balance belongs on the inflow side. Note it is the SETTLEMENT
balance only: counting the buffer itself would be circular ("you have savings,
so save more").

Computed on the 20th percentile, never the mean (PRD §4 P2). If S2S <= 0 every
sweep pauses -- no debit, no bounce, no penalty, and no notification that shames
the user for a bad week.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

HORIZON_DAYS = 14
DEFAULT_RESERVE_FLOOR = 1000        # rupees

# Realised earnings over the last DROUGHT_LOOKBACK days, as a share of the
# personal 30-day median, below which we call it a drought. Mirrors the sweep
# engine's same-day guard (core.sweeps.DROUGHT_DAY_RATIO).
DROUGHT_RATIO = 0.50
DROUGHT_LOOKBACK = 3


@dataclass
class SafeToSave:
    amount: float                   # rupees; <= 0 means PAUSE
    liquid: float
    p20_income: float
    committed: float
    burn: float
    reserve_floor: float
    horizon_days: int
    obligations: list[dict]
    recent_ratio: float | None = None

    @property
    def paused(self) -> bool:
        return self.amount <= 0

    @property
    def reason(self) -> str | None:
        """User-visible pause reason. Never punitive (ARCHITECTURE §4.2).

        DROUGHT is tested first, and against *realised* income rather than the
        forecast alone. The p20 band is built from a 30-day lookback, so two
        bad days barely move it -- testing the forecast alone reported
        UPCOMING_OBLIGATION through the middle of the scripted drought. That is
        both less true and the wrong thing to tell someone whose earnings have
        just collapsed: say the washout is why, then that rent is also coming.
        """
        if not self.paused:
            return None
        if self.recent_ratio is not None and self.recent_ratio < DROUGHT_RATIO:
            return "DROUGHT"
        if self.p20_income < self.burn:
            return "DROUGHT"
        if self.committed > 0:
            return "UPCOMING_OBLIGATION"
        return "RESERVE_FLOOR"

    def to_dict(self) -> dict:
        return {
            "amount": round(self.amount, 2),
            "paused": self.paused,
            "reason": self.reason,
            "liquid": round(self.liquid, 2),
            "p20_income": round(self.p20_income, 2),
            "committed": round(self.committed, 2),
            "burn": round(self.burn, 2),
            "reserve_floor": self.reserve_floor,
            "horizon_days": self.horizon_days,
            "obligations": self.obligations,
            "recent_ratio": (round(self.recent_ratio, 3)
                             if self.recent_ratio is not None else None),
        }


def compute(ds, horizon_forecaster, idx: int, liquid: float = 0.0,
            reserve_floor: float = DEFAULT_RESERVE_FLOOR,
            horizon: int = HORIZON_DAYS) -> SafeToSave:
    q = horizon_forecaster.predict(ds.income, t=idx)
    p20 = q["p20"]

    obligations = ds.upcoming_obligations(idx, horizon)
    committed = float(sum(o["amount"] for o in obligations))
    burn = ds.daily_essential_burn(upto=idx) * horizon

    return SafeToSave(
        amount=liquid + p20 - committed - burn - reserve_floor,
        liquid=liquid, p20_income=p20, committed=committed, burn=burn,
        reserve_floor=reserve_floor, horizon_days=horizon,
        obligations=obligations,
        recent_ratio=_recent_ratio(ds, idx),
    )


def _recent_ratio(ds, idx: int) -> float | None:
    """Realised earnings over the last few days against the personal median.

    Personal rather than absolute on purpose: a drought is a collapse relative
    to what this worker normally earns, not a fixed rupee line that would mean
    different things to a delivery rider and a cab driver.
    """
    lo = max(0, idx - DROUGHT_LOOKBACK + 1)
    recent = ds.income[lo:idx + 1]
    hist = ds.income[max(0, idx - 30):idx + 1]
    if len(recent) == 0 or len(hist) < 7:
        return None
    med = float(np.median(hist))
    if med <= 0:
        return None
    # The weaker of today alone and the recent average. A single washout day
    # counts even when the days behind it were good (otherwise the first days
    # of a drought get read as a normal week), and a run of thin days counts
    # even when today was passable.
    return min(float(ds.income[idx]), float(np.mean(recent))) / med
