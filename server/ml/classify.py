"""Income and expense classification over transaction narrations.

Deliberately rules + a keyword map, not a trained model. IMPLEMENTATION_PLAN
section 1 records the reasoning: a trained classifier costs roughly three hours
and looks identical on stage. Presented honestly as rule-based everywhere it
surfaces -- `method` is on every result, and the UI prints it.

What it does buy us is the anti-gaming story. A self-transfer looks exactly
like a platform payout to a naive balance-based underwriter: money arrives,
balance goes up. Counting it as income is how income-inflation fraud works, so
SELF_TRANSFER is classified out of assessed income rather than merely tagged.
"""
from __future__ import annotations

import re

# Ordered: the first pattern that matches wins, so the specific self-transfer
# and reversal rules are checked before the broad platform-payout ones.
INCOME_RULES: list[tuple[str, str, str]] = [
    ("SELF_TRANSFER",     r"\b(self|own a/c|own account|to self|transfer to own)\b", "self-transfer"),
    ("REVERSAL",          r"\b(reversal|refund|failed|returned|chargeback)\b",       "reversal or refund"),
    ("PLATFORM_EARNINGS", r"\b(swifteats|quikmart|zomato|swiggy|zepto|blinkit|dunzo|"
                          r"rapido|ola|uber|urbanclap|urban company)\b",             "known gig platform"),
    ("PLATFORM_EARNINGS", r"\b(payout|settlement|trip earnings|order earnings|"
                          r"weekly earnings|incentive)\b",                            "payout language"),
    ("CASH_DEPOSIT",      r"\b(cash|cdm|atm deposit|by cash)\b",                     "cash deposit"),
    ("REMITTANCE_IN",     r"\b(from family|received from|gift)\b",                   "inbound remittance"),
]

EXPENSE_RULES: list[tuple[str, str, str]] = [
    ("RENT",       r"\b(rent|landlord|house rent)\b",                              "rent"),
    ("EMI",        r"\b(emi|loan|nbfc|instal?ment)\b",                             "loan instalment"),
    ("UTILITY",    r"\b(recharge|telecom|electricity|broadband|gas|water|bill)\b", "utility"),
    ("INSURANCE",  r"\b(insurance|premium|policy)\b",                              "insurance"),
    ("FUEL",       r"\b(petrol|fuel|diesel|hpcl|iocl|bpcl|shell|charging)\b",      "fuel"),
    ("FOOD",       r"\b(kirana|grocery|mess|canteen|hotel|restaurant|food)\b",     "food"),
    ("MEDICAL",    r"\b(clinic|hospital|pharmacy|medical|chemist|apollo)\b",       "medical"),
    ("SHOCK",      r"\b(repair|garage|service centre|service center|spare)\b",     "one-off repair"),
    ("REMITTANCE", r"\b(to family|remit|sent home|money order)\b",                 "outbound remittance"),
]

# Categories that must never count toward assessed income. Cash is excluded
# from this set on purpose: it is real income, but capped separately.
NOT_INCOME = {"SELF_TRANSFER", "REVERSAL"}

# PRD anti-gaming rule: cash cannot exceed this share of assessed income
# without spending-pattern corroboration we do not have in a 24-hour build.
CASH_INCOME_CAP = 0.25


def classify(narration: str, kind: str) -> dict:
    """Classify one transaction narration.

    `kind` is INCOME or OUTFLOW -- the direction is known from the ledger, so
    the classifier only has to pick the category within that direction.
    """
    text = (narration or "").lower()
    rules = INCOME_RULES if kind == "INCOME" else EXPENSE_RULES
    for category, pattern, why in rules:
        if re.search(pattern, text):
            return {"category": category, "matched": why, "method": "rule",
                    "counts_as_income": kind == "INCOME" and category not in NOT_INCOME}
    fallback = "UNCLASSIFIED_IN" if kind == "INCOME" else "DISCRETIONARY"
    return {"category": fallback, "matched": "no rule matched", "method": "fallback",
            "counts_as_income": kind == "INCOME"}


def assess_income(events: list[dict]) -> dict:
    """Split a transaction list into assessed income and what was excluded.

    Returns the figure an underwriter should use, plus every exclusion with a
    reason -- the refusal path has to be explainable, so nothing is dropped
    silently.
    """
    counted, excluded = [], []
    for e in events:
        if e.get("kind") != "INCOME":
            continue
        r = classify(e.get("narration", ""), "INCOME")
        row = {"idx": e.get("idx"), "date": e.get("date"), "amount": e.get("amount"),
               "narration": e.get("narration"), **r}
        (counted if r["counts_as_income"] else excluded).append(row)

    gross = sum(r["amount"] for r in counted)
    cash = sum(r["amount"] for r in counted if r["category"] == "CASH_DEPOSIT")
    # Cash above the cap is set aside rather than deleted, so the number is
    # auditable and the UI can explain the haircut.
    cash_allowed = min(cash, CASH_INCOME_CAP * gross) if gross else 0.0
    cash_haircut = round(cash - cash_allowed, 2)
    assessed = round(gross - cash_haircut, 2)

    by_cat: dict[str, float] = {}
    for r in counted:
        by_cat[r["category"]] = round(by_cat.get(r["category"], 0.0) + r["amount"], 2)

    return {
        "method": "rules + keyword map (not a trained model)",
        "gross_inflow": round(gross + sum(r["amount"] for r in excluded), 2),
        "assessed_income": assessed,
        "excluded_total": round(sum(r["amount"] for r in excluded), 2),
        "cash_haircut": cash_haircut,
        "cash_cap_pct": CASH_INCOME_CAP,
        "by_category": by_cat,
        "counted_n": len(counted),
        "excluded": excluded,
    }
