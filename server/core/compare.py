"""
The A/B comparison engine.  IMPLEMENTATION_PLAN.md §C8.

Replays the SAME seeded income series through both policies and returns both
outcome sets. Nothing here is hardcoded -- change a parameter and re-run and the
numbers move, which is the answer to "did you compute that or write it?"
"""
from __future__ import annotations

import os
import tempfile

from core.dataset import load
from core.engine import Engine
from ml.forecast import HorizonForecaster


def run_both(ds=None, hf=None, keep_db: dict | None = None) -> dict:
    ds = ds or load()
    hf = hf or HorizonForecaster(14).fit(ds.income)

    results = {}
    for policy in ("TRADITIONAL", "DHARA"):
        path = (keep_db or {}).get(policy)
        if path is None:
            fd, path = tempfile.mkstemp(suffix=f"_{policy}.db", dir="data")
            os.close(fd)
            os.remove(path)
        elif os.path.exists(path):
            os.remove(path)
        eng = Engine(ds, hf, policy, path).run()
        summary = eng.out.summary(ds, eng.ledger)
        summary["integrity"] = eng.ledger.verify()
        results[policy] = {
            "summary": summary,
            "daily": eng.out.daily,
            "timeline": eng.out.timeline,
        }
        if keep_db is None:
            eng.ledger.close()
            os.path.exists(path) and os.remove(path)
        else:
            eng.ledger.close()

    t, d = results["TRADITIONAL"]["summary"], results["DHARA"]["summary"]
    results["delta"] = {
        "fees_avoided": round(t["fees_paid"] - d["fees_paid"], 2),
        "bounces_avoided": t["bounces"] - d["bounces"],
        "buffer_days_gained": round(d["buffer_days"] - t["buffer_days"], 1),
        "liquid_difference": round(d["liquid_total"] - t["liquid_total"], 2),
        "locked_savings_that_could_not_help": t["locked_savings"],
        "savings_habit_survived": d["savings_habit_alive"] and not t["savings_habit_alive"],
    }
    return results


if __name__ == "__main__":
    import json
    r = run_both()
    for k in ("TRADITIONAL", "DHARA"):
        s = r[k]["summary"]
        print(f"\n=== {k} ===")
        for f in ("buffer", "sinking_fund", "settlement", "liquid_total", "buffer_days",
                  "bounces", "fees_paid", "unpaid_obligations", "total_saved",
                  "sweeps_executed", "sweeps_paused", "savings_habit_alive",
                  "rd_disabled_on"):
            print(f"  {f:22} {s[f]}")
        print(f"  {'ledger integrity':22} {s['integrity']['healthy']} "
              f"({s['integrity']['transactions']} txns, {s['integrity']['postings']} postings)")
    print("\n=== DELTA ===")
    for k, v in r["delta"].items():
        print(f"  {k:26} {v}")
