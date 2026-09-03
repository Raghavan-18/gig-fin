"""
Shortfall early warning.  PRD §6 F1.5.

Compares p20 projected inflow against dated commitments and gives the user a
specific gap, a date, and three one-tap remedies. Tuned for PRECISION over
recall: a false alarm costs trust, which is the scarcest resource in this
segment.
"""
from __future__ import annotations

ALERT_HORIZON = 14
MIN_GAP = 200          # don't alert on trivial gaps -- precision over recall


def detect(ds, horizon_forecaster, idx: int, buffer_balance: float,
           settlement_balance: float = 0.0, horizon: int = ALERT_HORIZON) -> dict | None:
    obligations = ds.upcoming_obligations(idx, horizon)
    if not obligations:
        return None

    nearest = min(obligations, key=lambda o: o["in_days"])
    k = nearest["in_days"]

    # p20 income actually landing before the obligation falls due
    q = horizon_forecaster.predict(ds.income, t=idx)
    p20_full = q["p20"]
    p20_by_then = p20_full * (k / horizon)
    burn_by_then = ds.daily_essential_burn(upto=idx) * k
    earlier = sum(o["amount"] for o in obligations if o["in_days"] < k)

    available = settlement_balance + p20_by_then - burn_by_then - earlier
    gap = nearest["amount"] - available
    if gap < MIN_GAP:
        return None

    med = ds.daily_essential_burn(upto=idx)
    per_trip = 95        # typical net per delivery, used to size the earn remedy
    remedies = [
        {"id": "USE_BUFFER", "label": f"Move Rs {int(min(gap, buffer_balance)):,} from your buffer",
         "available": buffer_balance >= gap,
         "detail": f"Your buffer has Rs {int(buffer_balance):,}. No fee, no interest.",
         "cost": 0},
        {"id": "EARN_MORE", "label": f"Add about {max(1, round(gap / per_trip))} extra trips this week",
         "available": True,
         "detail": f"At roughly Rs {per_trip} net per trip that closes the gap.",
         "cost": 0},
        {"id": "RESCHEDULE", "label": "Move the sweep date after your payout",
         "available": True,
         "detail": "Shifts the debit to land after money arrives, not before.",
         "cost": 0},
    ]

    return {
        "type": "SHORTFALL",
        "obligation": nearest,
        "due_in_days": k,
        "due_date": nearest["date"],
        "shortfall": round(gap, 2),
        "projected_available": round(available, 2),
        "p20_income_by_due": round(p20_by_then, 2),
        "remedies": remedies,
        "message": (f"Your {nearest['label']} of Rs {nearest['amount']:,} is due in "
                    f"{k} days. At your current pace you'll be about "
                    f"Rs {int(round(gap)):,} short."),
    }
