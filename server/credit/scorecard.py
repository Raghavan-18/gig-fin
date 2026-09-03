"""
Cash-flow scorecard.  PRD §8 F3.2 / ARCHITECTURE.md §4.3.

A points scorecard rather than a black box: for the first cohort, being able to
say exactly why someone scored what they scored is worth more than a few points
of AUC, and every points band maps to a plain-language reason code.

Nothing here uses a bureau score. Its absence is never a rejection reason.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np


@dataclass
class Attribute:
    name: str
    value: float
    points: int
    band: str
    plain: str


def _band(value, bands):
    """bands: list of (upper_bound_exclusive, points, band_label, plain_text)."""
    for upper, pts, label, plain in bands:
        if value < upper:
            return pts, label, plain
    upper, pts, label, plain = bands[-1]
    return pts, label, plain


def income_stability_score(ds, idx: int) -> dict:
    """ISS 0-100 (PRD §6 F1.2). Volatility, continuity, trend, diversification."""
    lo = max(0, idx - 90)
    inc = ds.income[lo: idx + 1]
    weeks = [inc[i:i + 7].sum() for i in range(0, len(inc) - 6, 7)]
    weeks = [w for w in weeks if w > 0]
    cv = float(np.std(weeks) / np.mean(weeks)) if weeks and np.mean(weeks) else 1.0

    earning_days = float((inc > 0).mean())
    longest_gap = 0
    run = 0
    for v in inc:
        run = run + 1 if v <= 0 else 0
        longest_gap = max(longest_gap, run)

    half = len(inc) // 2
    trend = (float(inc[half:].mean()) / float(inc[:half].mean())
             if half and inc[:half].mean() else 1.0)

    # source diversification across payers, as 1 - Herfindahl
    by_src: dict[str, float] = {}
    for e in ds.events:
        if lo <= e["idx"] <= idx and e["kind"] == "INCOME" and e["category"] != "SELF_TRANSFER":
            by_src[e["label"]] = by_src.get(e["label"], 0) + e["amount"]
    tot = sum(by_src.values()) or 1
    hhi = sum((v / tot) ** 2 for v in by_src.values())
    diversification = 1 - hhi

    tenure_days = min(idx + 1, 180)

    score = (
        35 * max(0.0, 1 - cv / 0.8)
        + 25 * earning_days
        + 10 * max(0.0, 1 - longest_gap / 10)
        + 10 * min(1.0, trend)
        + 10 * diversification
        + 10 * min(1.0, tenure_days / 180)
    )
    return {
        "iss": round(min(100.0, max(0.0, score)), 1),
        "weekly_cv": round(cv, 3),
        "earning_day_rate": round(earning_days, 3),
        "longest_zero_gap_days": int(longest_gap),
        "trend": round(trend, 3),
        "source_diversification": round(diversification, 3),
        "tenure_days": int(tenure_days),
    }


def score(ds, idx: int, buffer_days: float, existing_obligations: float,
          p20_monthly: float, repayments_completed: int = 0) -> dict:
    iss = income_stability_score(ds, idx)
    dsr = existing_obligations / p20_monthly if p20_monthly else 1.0

    attrs = [
        Attribute("Income stability", iss["iss"],
                  *_band(iss["iss"], [(40, 0, "LOW", "earnings swing a lot week to week"),
                                      (60, 12, "FAIR", "earnings are moderately steady"),
                                      (75, 22, "GOOD", "earnings are fairly steady"),
                                      (200, 30, "STRONG", "earnings are very steady")])),
        Attribute("Buffer days", buffer_days,
                  *_band(buffer_days, [(3, 0, "NONE", "almost no savings cushion"),
                                       (7, 8, "THIN", "a few days of cushion"),
                                       (21, 18, "FAIR", "a useful savings cushion"),
                                       (999, 25, "STRONG", "a month or more of cushion")])),
        Attribute("Existing obligations", dsr,
                  *_band(dsr, [(0.10, 25, "LIGHT", "very little existing debt"),
                               (0.20, 16, "MODERATE", "a manageable amount of debt"),
                               (0.35, 6, "HEAVY", "a large share of income already committed"),
                               (99, 0, "STRETCHED", "most income already committed")])),
        Attribute("Earning consistency", iss["earning_day_rate"],
                  *_band(iss["earning_day_rate"],
                         [(0.6, 0, "PATCHY", "many days with no earnings"),
                          (0.85, 8, "REGULAR", "earns on most days"),
                          (2, 12, "DAILY", "earns nearly every day")])),
        Attribute("Repayment history", repayments_completed,
                  *_band(repayments_completed,
                         [(1, 0, "NONE", "no repayment history with us yet"),
                          (3, 4, "SOME", "a short repayment history"),
                          (99, 8, "PROVEN", "a solid repayment history")])),
    ]

    total = sum(a.points for a in attrs)
    # map points to a probability of default via a logistic calibration
    pd = 1 / (1 + np.exp((total - 45) / 12))
    return {
        "score": total,
        "max_score": 100,
        "pd": round(float(pd), 4),
        "iss": iss,
        "dsr": round(dsr, 3),
        "attributes": [a.__dict__ for a in attrs],
    }
