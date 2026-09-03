"""
Loads the seeded cash-flow into the arrays every engine works from.

One loader, one canonical shape -- the forecaster, Safe-to-Save, the sweep
engine and the comparison engine all read the same series, so they can never
disagree about what Ravi earned.
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import date, timedelta
from functools import lru_cache
from pathlib import Path

import numpy as np

CALENDAR_PAD = 45          # days of future calendar we need for forecasting

# Categories that are NOT income, however they look in a bank statement.
NON_INCOME = {"SELF_TRANSFER"}
# Essential, non-negotiable outflow categories -> the Essential Monthly Burn.
ESSENTIAL = {"RENT", "EMI", "FUEL", "FOOD", "UTILITY", "INSURANCE"}
# Dated commitments (they have a due date) vs. undated daily essentials.
# Safe-to-Save subtracts these SEPARATELY -- counting rent in both the
# committed-outflow term and the burn-rate term would double-count it.
COMMITTED = {"RENT", "EMI", "UTILITY", "INSURANCE"}
DAILY_ESSENTIAL = {"FUEL", "FOOD"}


@dataclass
class Dataset:
    persona_id: str
    start: date
    today: date
    n_days: int
    events: list[dict]
    obligations: list[dict]
    sinking_targets: list[dict]
    bounce_fee: int
    opening_balance: int
    drought: dict

    income: np.ndarray          # rupees/day, excludes self-transfers
    outflow: np.ndarray         # rupees/day, all outflows
    essential: np.ndarray       # rupees/day, ALL essentials -> Essential Monthly Burn
    daily_essential: np.ndarray # rupees/day, undated only (fuel, food) -> S2S burn
    weekdays: np.ndarray        # length n_days + CALENDAR_PAD
    day_of_month: np.ndarray    # length n_days + CALENDAR_PAD

    def date_of(self, idx: int) -> date:
        return self.start + timedelta(days=idx)

    def index_of(self, d: date) -> int:
        return (d - self.start).days

    @property
    def today_idx(self) -> int:
        return self.n_days - 1

    def essential_daily_burn(self, window: int = 30, upto: int | None = None) -> float:
        """Essential Monthly Burn / 30 -- the denominator of buffer days."""
        hi = self.n_days if upto is None else upto + 1
        return float(self.essential[max(0, hi - window):hi].mean())

    def daily_essential_burn(self, window: int = 30, upto: int | None = None) -> float:
        """Undated daily essentials only -- the burn term inside Safe-to-Save."""
        hi = self.n_days if upto is None else upto + 1
        return float(self.daily_essential[max(0, hi - window):hi].mean())

    def events_on(self, idx: int) -> list[dict]:
        return [e for e in self.events if e["idx"] == idx]

    def upcoming_obligations(self, from_idx: int, days: int) -> list[dict]:
        """Dated commitments falling in (from_idx, from_idx+days]."""
        out = []
        for k in range(1, days + 1):
            d = self.date_of(from_idx + k)
            for ob in self.obligations:
                if ob["day_of_month"] == d.day:
                    out.append({**ob, "date": d.isoformat(), "idx": from_idx + k,
                                "in_days": k})
        return out


@lru_cache(maxsize=4)
def load(path: str = "data/seed.json") -> Dataset:
    raw = json.loads(Path(path).read_text())
    n = raw["n_days"]
    start = date.fromisoformat(raw["start"])

    income = np.zeros(n)
    outflow = np.zeros(n)
    essential = np.zeros(n)
    daily_essential = np.zeros(n)
    for e in raw["events"]:
        i = e["idx"]
        if e["kind"] == "INCOME":
            if e["category"] not in NON_INCOME:
                income[i] += e["amount"]
        else:
            if e["category"] in NON_INCOME:
                continue
            outflow[i] += e["amount"]
            if e["category"] in ESSENTIAL:
                essential[i] += e["amount"]
            if e["category"] in DAILY_ESSENTIAL:
                daily_essential[i] += e["amount"]

    total = n + CALENDAR_PAD
    weekdays = np.array([(start + timedelta(days=i)).weekday() for i in range(total)])
    dom = np.array([(start + timedelta(days=i)).day for i in range(total)])

    return Dataset(
        persona_id=raw["persona_id"],
        start=start,
        today=date.fromisoformat(raw["generated_for"]),
        n_days=n,
        events=raw["events"],
        obligations=raw["obligations"],
        sinking_targets=raw["sinking_targets"],
        bounce_fee=raw["bounce_fee"],
        opening_balance=raw.get("opening_balance", 0),
        drought=raw["drought"],
        income=income, outflow=outflow, essential=essential,
        daily_essential=daily_essential,
        weekdays=weekdays, day_of_month=dom,
    )
