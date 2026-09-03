"""
Acceptance criteria from IMPLEMENTATION_PLAN.md §7 (C1-C4, C8).
These are the checks the plan says must pass, not a general test suite.
"""
from __future__ import annotations

import os
import random
import tempfile

import numpy as np

from core.dataset import load
from core.ledger import CR, DR, InsufficientFunds, Ledger, Leg
from core import safe_to_save as s2s_mod, sweeps as sweeps_mod
from ml.forecast import DailyQuantileForecaster, HorizonForecaster, coverage_report

RESULTS: list[tuple[str, bool, str]] = []


def check(name: str, ok: bool, detail: str = ""):
    RESULTS.append((name, ok, detail))
    print(f"  [{'PASS' if ok else 'FAIL'}] {name}" + (f"  -- {detail}" if detail else ""))


# ------------------------------------------------------------------ C1
def test_ledger_properties():
    print("\nC1 ledger")
    fd, path = tempfile.mkstemp(suffix=".db", dir="data"); os.close(fd); os.remove(path)
    L = Ledger(path)
    L.open_account("w", "u", "EXTERNAL", "world")
    accts = [f"a{i}" for i in range(5)]
    for a in accts:
        L.open_account(a, "u", "USER_BUCKET", a)
    L.post("SEED", "seed", [Leg("w", DR, 10_000_00)] +
           [Leg(a, CR, 2_000_00) for a in accts])

    rng = random.Random(3)
    refused = 0
    for i in range(1000):
        src, dst = rng.sample(accts, 2)
        amt = rng.randint(1, 500_00)
        try:
            L.post("XFER", f"x{i}", [Leg(src, DR, amt), Leg(dst, CR, amt)])
        except InsufficientFunds:
            refused += 1

    rep = L.verify()
    check("1000 random transactions keep every invariant", rep["healthy"],
          f"{rep['transactions']} txns, {rep['postings']} postings, "
          f"{refused} refused for insufficient funds")

    # unbalanced transactions are rejected outright
    try:
        L.post("BAD", "bad1", [Leg("w", DR, 100), Leg(accts[0], CR, 99)])
        ok = False
    except Exception:
        ok = True
    check("unbalanced transaction is refused", ok)

    # idempotency
    b0 = L.balance(accts[0])
    t1 = L.post("IDEM", "same-key", [Leg("w", DR, 5_00), Leg(accts[0], CR, 5_00)])
    t2 = L.post("IDEM", "same-key", [Leg("w", DR, 5_00), Leg(accts[0], CR, 5_00)])
    check("replaying a transaction moves money once",
          t1 == t2 and L.balance(accts[0]) == b0 + 5_00)

    # balances are rebuildable from the append-only postings
    before = {a: L.balance(a) for a in accts}
    L.rebuild()
    check("balances rebuild exactly from postings",
          all(L.balance(a) == before[a] for a in accts))
    L.close(); os.remove(path)


# ------------------------------------------------------------------ C2/C3
def test_sweeps():
    print("\nC2/C3 Safe-to-Save and sweeps")
    ds = load()
    hf = HorizonForecaster(14).fit(ds.income)
    d0 = ds.drought["start_idx"]
    drought = range(d0, d0 + ds.drought["days"])

    # Replay with realistic liquidity so S2S sees a true settlement balance.
    from core.engine import Engine, SETTLEMENT
    fd, path = tempfile.mkstemp(suffix=".db", dir="data"); os.close(fd); os.remove(path)
    eng = Engine(ds, hf, "DHARA", path).run()
    daily = {d["idx"]: d for d in eng.out.daily}

    swept_in_drought = [i for i in drought if daily[i].get("sweep", 0) > 0]
    check("zero sweeps execute during the drought", not swept_in_drought,
          f"drought days {list(drought)}, swept on {swept_in_drought}")

    paused = [i for i in drought if daily[i].get("paused")]
    check("every drought day pauses with a reason code",
          len(paused) == len(drought),
          f"reasons: {sorted({str(daily[i].get('reason')) for i in drought})}")

    total_income = float(ds.income.sum())
    saved = eng.out.total_saved
    pct = saved / total_income
    check("total saved is between 0 and 12% of income",
          0 < pct < 0.12, f"saved Rs {saved:,.0f} = {pct:.1%} of Rs {total_income:,.0f}")

    over = [d["idx"] for d in eng.out.daily
            if d.get("sweep", 0) > max(0.0, d.get("s2s", 0)) + 0.01]
    check("no sweep ever exceeds Safe-to-Save", not over, f"violations: {over[:5]}")
    eng.ledger.close(); os.remove(path)


# ------------------------------------------------------------------ C4
def test_forecast_calibration():
    print("\nC4 forecaster calibration")
    ds = load()
    CAL = 150   # everything before day 150 trains + cross-conformally calibrates
    daily = DailyQuantileForecaster().fit(ds.income, ds.weekdays, ds.day_of_month,
                                          train_upto=CAL, calibrate_upto=CAL)
    d0 = ds.drought["start_idx"]
    rep = coverage_report(daily, ds.income, ds.weekdays, ds.day_of_month, CAL,
                          drought_idx=range(d0, d0 + ds.drought["days"]))
    cov = rep["coverage_p10_p90"]
    check("p10-p90 band coverage is 75-85% on held-out days",
          0.75 <= cov <= 0.85,
          f"coverage {cov:.1%} over {rep['held_out_days']} days "
          f"(excl. drought {rep['coverage_excl_drought']:.0%})")

    hf = HorizonForecaster(14).fit(ds.income)
    q_normal = hf.predict(ds.income, t=100)
    q_drought = hf.predict(ds.income, t=d0 + 2)
    check("horizon quantiles are strictly ordered, not collapsed",
          q_normal["p10"] < q_normal["p20"] < q_normal["p50"] < q_normal["p90"],
          f"p10={q_normal['p10']:.0f} p20={q_normal['p20']:.0f} "
          f"p50={q_normal['p50']:.0f} p90={q_normal['p90']:.0f}")
    check("the drought lowers the 14-day p20 forecast",
          q_drought["p20"] < q_normal["p20"] * 0.9,
          f"normal p20 Rs {q_normal['p20']:,.0f} -> drought p20 Rs {q_drought['p20']:,.0f}")


# ------------------------------------------------------------------ C8
def test_comparison():
    print("\nC8 comparison engine")
    from core.compare import run_both
    r = run_both()
    t, d = r["TRADITIONAL"]["summary"], r["DHARA"]["summary"]
    check("both simulations end with a healthy ledger",
          t["integrity"]["healthy"] and d["integrity"]["healthy"])
    check("traditional policy bounces, Dhara does not",
          t["bounces"] > 0 and d["bounces"] == 0,
          f"traditional {t['bounces']} bounces / Rs {t['fees_paid']:,.0f} fees, "
          f"dhara {d['bounces']}")
    check("Dhara ends with more liquid savings",
          d["liquid_total"] > t["liquid_total"],
          f"Rs {d['liquid_total']:,.0f} vs Rs {t['liquid_total']:,.0f}")
    check("the traditional saver's money was locked when needed",
          t["locked_savings"] > 0 and t["buffer_days"] == 0,
          f"Rs {t['locked_savings']:,.0f} saved, {t['buffer_days']} liquid buffer days")


if __name__ == "__main__":
    test_ledger_properties()
    test_sweeps()
    test_forecast_calibration()
    test_comparison()
    passed = sum(1 for _, ok, _ in RESULTS if ok)
    print(f"\n{'=' * 60}\n{passed}/{len(RESULTS)} acceptance checks passed")
    raise SystemExit(0 if passed == len(RESULTS) else 1)
