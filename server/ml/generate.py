"""
Synthetic cash-flow generator for the demo persona.

IMPLEMENTATION_PLAN.md §5. The data is deliberately engineered around the demo
script: a 5-day drought is placed so that the bike EMI falls 4 days after it
ends, which is what makes the forecast, the sweep pause, the shortfall alert and
the buffer drawdown all fire in sequence during the demo window.

Everything here is SYNTHETIC. Calibrated to published gig-earnings volatility,
not drawn from any real person's data.
"""
from __future__ import annotations

import json
import math
import random
from dataclasses import dataclass, asdict, field
from datetime import date, timedelta
from pathlib import Path

# ---------------------------------------------------------------- parameters

N_DAYS = 180
TODAY = date(2026, 9, 1)               # day index N_DAYS-1
START = TODAY - timedelta(days=N_DAYS - 1)

DROUGHT_START_IDX = 171                # 2026-08-24 .. 2026-08-28 (5 days)
DROUGHT_LEN = 5
# The monsoon spell breaks. These are the days on which the surge-skim rebuilds
# the buffer during the demo, so the clear weather is scripted, not sampled.
CLEAR_AFTER_DROUGHT = 4

SEED = 20260901

# Income shape
BASE_DAILY = 1020                      # median gross day, in rupees
WEEKDAY_FACTOR = {0: 0.80, 1: 0.85, 2: 0.90, 3: 0.95, 4: 1.15, 5: 1.40, 6: 1.35}
# Weather is a 2-state Markov chain, not iid days: rain arrives in spells.
# This is what actually drives week-to-week income variance for a rider.
P_RAIN_GIVEN_DRY = 0.08
P_RAIN_GIVEN_RAIN = 0.55
RAIN_FACTOR = 0.35
# Week-level AR(1) demand factor: platform incentive schemes and local demand
# drift over weeks, which is the second source of weekly (not daily) variance.
DEMAND_RHO = 0.55
DEMAND_SIGMA = 0.22
SIGMA = 0.35                           # lognormal noise -> the fat tail
FESTIVAL_WEEKS = {(2026, 4, 13), (2026, 8, 15)}   # week-start dates, 1.5x

PLATFORMS = [
    ("SWIFTEATS", "SWIFTEATS PAYOUT", 0.62),
    ("QUIKMART", "QUIKMART PARTNER SETTLEMENT", 0.38),
]

# Obligations
RENT = 6500          # 1st
EMI = 4100           # 5th   <- the one that bounces in the traditional sim
PHONE = 399          # 12th
INSURANCE_PREMIUM = 14000
INSURANCE_DUE = date(2027, 9, 1)       # 365 days out -> ~Rs 38/day accrual

BOUNCE_FEE = 590     # what a failed fixed-date debit costs (traditional sim)

OPENING_BALANCE = 2000
# Ravi supports family in his home district. A monthly remittance is a defining
# feature of this segment's cash flow and it is what absorbs the surplus --
# without it the simulation gives him Rs 45k of idle savings and nothing to
# solve. It is not "essential" in the burn sense: he skips it when broke.
REMITTANCE = 4000
REMITTANCE_DAY = 8
# Consumption tracks income: he spends more on good days. The failure to smooth
# consumption is the behaviour the buffer exists to correct.
DISCRETIONARY_PCT = 0.08


@dataclass
class Event:
    idx: int
    date: str
    kind: str                # INCOME | OUTFLOW
    amount: int              # rupees, positive integer
    label: str
    narration: str
    category: str
    source: str = "BANK"     # BANK | PLATFORM | CASH
    meta: dict = field(default_factory=dict)


# ---------------------------------------------------------------- generation

def _is_festival_week(d: date) -> bool:
    ws = d - timedelta(days=d.weekday())
    return (ws.year, ws.month, ws.day) in FESTIVAL_WEEKS


def _gross_for_day(idx: int, d: date, rng: random.Random,
                   raining: bool, demand: float) -> tuple[int, dict]:
    """Return (gross rupees, factor breakdown) for one day."""
    in_drought = DROUGHT_START_IDX <= idx < DROUGHT_START_IDX + DROUGHT_LEN

    weekday = WEEKDAY_FACTOR[d.weekday()]
    weather = RAIN_FACTOR if raining else 1.0
    # platform weekly incentive threshold -> weekend push
    incentive = 1.18 if d.weekday() in (5, 6) else 1.0
    season = 1.5 if _is_festival_week(d) else 1.0
    noise = math.exp(rng.gauss(0, SIGMA))

    if in_drought:
        # a genuine washout: heavy rain, no incentive achievable
        weather = 0.22
        incentive = 1.0
        noise = min(noise, 1.0)

    gross = BASE_DAILY * weekday * weather * incentive * season * demand * noise
    return max(0, int(round(gross))), {
        "weekday": round(weekday, 2), "weather": round(weather, 2),
        "incentive": round(incentive, 2), "season": round(season, 2),
        "demand": round(demand, 2), "raining": raining, "drought": in_drought,
    }


def generate() -> dict:
    rng = random.Random(SEED)
    events: list[Event] = []
    raining = False
    log_demand = 0.0

    for idx in range(N_DAYS):
        d = START + timedelta(days=idx)

        # autocorrelated weather spell
        p = P_RAIN_GIVEN_RAIN if raining else P_RAIN_GIVEN_DRY
        raining = rng.random() < p
        # AR(1) week-level demand, resampled at each week boundary
        if d.weekday() == 0:
            log_demand = DEMAND_RHO * log_demand + rng.gauss(0, DEMAND_SIGMA)
        demand = math.exp(log_demand)

        in_drought = DROUGHT_START_IDX <= idx < DROUGHT_START_IDX + DROUGHT_LEN
        drought_end = DROUGHT_START_IDX + DROUGHT_LEN
        if in_drought:
            raining = True
        elif drought_end <= idx < drought_end + CLEAR_AFTER_DROUGHT:
            raining = False
            log_demand = max(log_demand, 0.15)      # demand rebounds with the weather
            demand = math.exp(log_demand)
        gross, factors = _gross_for_day(idx, d, rng, raining, demand)

        # --- income: split the day's gross across platforms -------------
        if gross > 0:
            remaining = gross
            for i, (code, narration, share) in enumerate(PLATFORMS):
                if i == len(PLATFORMS) - 1:
                    amt = remaining
                else:
                    amt = int(round(gross * share * rng.uniform(0.85, 1.15)))
                    amt = min(amt, remaining)
                remaining -= amt
                if amt <= 0:
                    continue
                events.append(Event(
                    idx=idx, date=d.isoformat(), kind="INCOME", amount=amt,
                    label=f"{code} payout", narration=f"{narration} {rng.randint(10000, 99999)}",
                    category="PLATFORM_EARNINGS", source="PLATFORM",
                    meta=factors if i == 0 else {},
                ))

        # occasional cash tip -> exercises the cash-logging path
        if rng.random() < 0.10 and gross > 0:
            events.append(Event(
                idx=idx, date=d.isoformat(), kind="INCOME",
                amount=rng.choice([50, 80, 100, 120]),
                label="Cash tip", narration="CASH ENTRY (voice)",
                category="CASH_INCOME", source="CASH",
            ))

        # a self-transfer that must NOT be counted as income (anti-gaming)
        if idx in (58, 119, 168):
            amt = rng.choice([2000, 3000, 5000])
            events.append(Event(
                idx=idx, date=d.isoformat(), kind="INCOME", amount=amt,
                label="Transfer from own wallet", narration="UPI/SELF/RAVI@YBL",
                category="SELF_TRANSFER", source="BANK",
                meta={"circular": True},
            ))
            events.append(Event(
                idx=idx, date=d.isoformat(), kind="OUTFLOW", amount=amt,
                label="Transfer to own wallet", narration="UPI/SELF/RAVI@PAYTM",
                category="SELF_TRANSFER",
            ))

        # --- outflows ---------------------------------------------------
        if gross > 0:
            fuel = rng.randint(180, 320)
            events.append(Event(idx, d.isoformat(), "OUTFLOW", fuel, "Fuel",
                               "UPI/HPCL PETROL PUMP", "FUEL"))
        food = rng.randint(120, 250)
        events.append(Event(idx, d.isoformat(), "OUTFLOW", food, "Food",
                           "UPI/LOCAL MESS", "FOOD"))

        if d.day == 1:
            events.append(Event(idx, d.isoformat(), "OUTFLOW", RENT, "Rent",
                               "NEFT/LANDLORD/RENT", "RENT"))
        if d.day == 5:
            events.append(Event(idx, d.isoformat(), "OUTFLOW", EMI, "Bike EMI",
                               "ACH-D/BIKE LOAN EMI", "EMI"))
        if d.day == REMITTANCE_DAY:
            events.append(Event(idx, d.isoformat(), "OUTFLOW", REMITTANCE,
                               "Money sent home", "IMPS/FAMILY/HOME", "FAMILY"))
        if gross > 0:
            disc = int(round(gross * DISCRETIONARY_PCT * rng.uniform(0.6, 1.6)))
            if disc > 0:
                events.append(Event(idx, d.isoformat(), "OUTFLOW", disc, "Everyday spending",
                                   "UPI/ASSORTED MERCHANTS", "DISCRETIONARY"))
        if d.day == 12:
            events.append(Event(idx, d.isoformat(), "OUTFLOW", PHONE, "Phone recharge",
                               "UPI/TELECOM RECHARGE", "UTILITY"))
        if idx == 96:
            events.append(Event(idx, d.isoformat(), "OUTFLOW", 3200, "Phone repair",
                               "UPI/MOBILE REPAIR SHOP", "SHOCK"))
        if idx == 130:
            events.append(Event(idx, d.isoformat(), "OUTFLOW", 1450, "Clinic visit",
                               "UPI/CITY CLINIC", "MEDICAL"))

    events.sort(key=lambda e: (e.idx, 0 if e.kind == "INCOME" else 1))

    return {
        "persona_id": "ravi",
        "generated_for": TODAY.isoformat(),
        "start": START.isoformat(),
        "n_days": N_DAYS,
        "drought": {
            "start_idx": DROUGHT_START_IDX,
            "start": (START + timedelta(days=DROUGHT_START_IDX)).isoformat(),
            "days": DROUGHT_LEN,
        },
        "obligations": [
            {"label": "Rent", "amount": RENT, "day_of_month": 1, "category": "RENT"},
            {"label": "Bike EMI", "amount": EMI, "day_of_month": 5, "category": "EMI"},
            {"label": "Phone recharge", "amount": PHONE, "day_of_month": 12, "category": "UTILITY"},
        ],
        "sinking_targets": [
            {"label": "Bike insurance", "amount": INSURANCE_PREMIUM,
             "due": INSURANCE_DUE.isoformat(), "category": "INSURANCE"},
        ],
        "bounce_fee": BOUNCE_FEE,
        "opening_balance": OPENING_BALANCE,
        "events": [asdict(e) for e in events],
    }


def write(path: str | Path = "data/seed.json") -> dict:
    payload = generate()
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(payload, indent=1))
    return payload


if __name__ == "__main__":
    d = write()
    print(f"wrote data/seed.json: {len(d['events'])} events over {d['n_days']} days")
