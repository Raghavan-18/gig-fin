"""
Replay engine.  Runs the seeded cash-flow through the ledger day by day under a
named policy, producing real balances, a timeline, and the outcome counters the
comparison screen reads.

Two policies (IMPLEMENTATION_PLAN.md §C8):

  TRADITIONAL  fixed-date recurring deposit on the 1st, fixed-date mandates,
               no forecast, no pause. When the balance isn't there, the debit
               bounces and a fee lands.
  DHARA        adaptive sweeps bounded by Safe-to-Save, auto-pause in a drought,
               surge skim on good days, and a buffer that covers an obligation
               before it can bounce.

Same income series, same obligations, same fees. Only the mechanics differ --
which is the entire argument of the PRD.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from core import safe_to_save as s2s_mod
from core import sweeps as sweeps_mod
from core.ledger import CR, DR, InsufficientFunds, Ledger, Leg

WORLD = "world"
SETTLEMENT = "settlement"
BUFFER = "bucket_buffer"
RD_LOCKED = "bucket_rd_locked"
SINKING = "bucket_sinking_insurance"
FEES = "fee_expense"

RD_AMOUNT = 2000            # traditional recurring deposit, debited on the 1st
RD_DAY = 1
MAX_RD_BOUNCES = 2          # after this the user disables the mandate in disgust
BUFFER_DAYS_BEFORE_SINKING = 7
SINKING_DAILY = 38          # Rs 14,000 premium / 365 days

# Behavioural: money sitting in the current account gets spent. Marginal
# propensity to consume out of liquid balances, applied AFTER the day's sweep.
#
# This rule is applied IDENTICALLY under both policies -- it is not a thumb on
# the scale. It is the whole mechanism the sweep exploits: Dhara does not make
# Ravi more disciplined, it moves the money out of reach before the same
# behaviour can spend it. Without this rule the traditional simulation quietly
# accumulates Rs 16k of idle cash that acts as an accidental buffer, and the
# comparison measures nothing.
FLOAT_TARGET = 2500         # rupees he keeps at hand without thinking about it
MPC_LIQUID = 0.03           # share of the balance above that, spent per day
# 3%/day gives idle cash a half-life of about three weeks: money lingers, but it
# does not sit untouched for six months. (A 20% DAILY rate -- the figure usually
# quoted for MPC out of liquid wealth, which is a per-period not per-day number
# -- compounds to draining the account in a fortnight.)


@dataclass
class Outcome:
    policy: str
    bounces: int = 0
    fees_paid: float = 0.0
    unpaid_obligations: int = 0
    buffer_drawdowns: float = 0.0
    total_saved: float = 0.0
    sweeps_executed: int = 0
    sweeps_paused: int = 0
    rd_disabled_on: str | None = None
    savings_habit_alive: bool = True
    timeline: list[dict] = field(default_factory=list)
    daily: list[dict] = field(default_factory=list)

    def summary(self, ds, ledger: Ledger) -> dict:
        buf = ledger.balance(BUFFER) / 100
        sink = ledger.balance(SINKING) / 100
        settle = ledger.balance(SETTLEMENT) / 100
        locked = ledger.balance(RD_LOCKED) / 100
        emb = ds.essential_daily_burn()
        return {
            "policy": self.policy,
            "buffer": round(buf, 2),
            "sinking_fund": round(sink, 2),
            "settlement": round(settle, 2),
            "locked_savings": round(locked, 2),
            "liquid_total": round(buf + sink + settle, 2),
            "total_savings": round(buf + sink + locked, 2),
            "buffer_days": round(buf / emb, 1) if emb else 0.0,
            "essential_daily_burn": round(emb, 2),
            "bounces": self.bounces,
            "fees_paid": round(self.fees_paid, 2),
            "unpaid_obligations": self.unpaid_obligations,
            "total_saved": round(self.total_saved, 2),
            "sweeps_executed": self.sweeps_executed,
            "sweeps_paused": self.sweeps_paused,
            "savings_habit_alive": self.savings_habit_alive,
            "rd_disabled_on": self.rd_disabled_on,
        }


def _rupees_to_minor(x: float) -> int:
    return int(round(x * 100))


class Engine:
    def __init__(self, ds, horizon_forecaster, policy: str, db_path: str):
        self.ds = ds
        self.hf = horizon_forecaster
        self.policy = policy
        self.ledger = Ledger(db_path)
        self.out = Outcome(policy=policy)
        self._rd_bounces = 0
        self._rd_active = True
        self._pending: list[dict] = []       # obligations awaiting retry
        self._setup_accounts()
        if ds.opening_balance:
            self._credit_settlement(ds.opening_balance, f"{policy}:opening",
                                    ds.start.isoformat(), {"label": "Opening balance"})

    def _setup_accounts(self):
        L = self.ledger
        L.open_account(WORLD, "ravi", "EXTERNAL", "External world")
        L.open_account(FEES, "ravi", "FEE_INCOME", "Penalties & charges")
        L.open_account(SETTLEMENT, "ravi", "USER_SETTLEMENT", "Bank account")
        L.open_account(BUFFER, "ravi", "USER_BUCKET", "Buffer")
        L.open_account(RD_LOCKED, "ravi", "USER_BUCKET", "Recurring deposit (locked)")
        L.open_account(SINKING, "ravi", "SINKING_FUND", "Bike insurance fund")
        L.open_account("cash_wallet", "ravi", "CASH_WALLET", "Cash wallet")
        L.open_account("cash_expense", "ravi", "EXPENSE", "Manual cash expense")
        L.open_account("cash_income", "ravi", "INCOME", "Manual cash income")

    # ------------------------------------------------------------ helpers
    def _credit_settlement(self, amount: float, key: str, on: str, meta: dict):
        self.ledger.post("INCOME", key,
                         [Leg(WORLD, DR, _rupees_to_minor(amount)),
                          Leg(SETTLEMENT, CR, _rupees_to_minor(amount))],
                         occurred_on=on, metadata=meta)

    def _debit_settlement(self, amount: float, key: str, on: str, meta: dict,
                          txn_type: str = "SPEND") -> bool:
        try:
            self.ledger.post(txn_type, key,
                             [Leg(SETTLEMENT, DR, _rupees_to_minor(amount)),
                              Leg(WORLD, CR, _rupees_to_minor(amount))],
                             occurred_on=on, metadata=meta)
            return True
        except InsufficientFunds:
            return False

    def _charge_fee(self, amount: float, key: str, on: str, label: str) -> bool:
        """A penalty. If the account can't even fund the fee it still accrues."""
        ok = self._debit_settlement(amount, key, on, {"label": label}, "FEE")
        self.out.fees_paid += amount
        return ok

    def _move_from_buffer(self, amount: float, key: str, on: str, why: str) -> float:
        have = self.ledger.balance(BUFFER) / 100
        take = min(have, amount)
        if take <= 0:
            return 0.0
        self.ledger.post("BUFFER_DRAWDOWN", key,
                         [Leg(BUFFER, DR, _rupees_to_minor(take)),
                          Leg(SETTLEMENT, CR, _rupees_to_minor(take))],
                         occurred_on=on, metadata={"why": why})
        self.out.buffer_drawdowns += take
        self.out.timeline.append({
            "date": on, "kind": "BUFFER_DRAWDOWN", "amount": take, "label": why})
        return take

    # --------------------------------------------------------------- run
    def run(self) -> "Engine":
        ds = self.ds
        for idx in range(ds.n_days):
            on = ds.date_of(idx).isoformat()
            events = ds.events_on(idx)

            # 1. dated obligations debit at the start of the day, before the
            #    day's earnings arrive. This ordering is why bounces happen.
            self._run_obligations(idx, on, events)

            # 2. the traditional fixed-date recurring deposit
            if self.policy == "TRADITIONAL":
                self._run_rd(idx, on)

            # 3. income
            for e in events:
                if e["kind"] != "INCOME":
                    continue
                self._credit_settlement(
                    e["amount"], f"{self.policy}:inc:{idx}:{e['label']}:{e['amount']}",
                    on, {"label": e["label"], "category": e["category"],
                         "narration": e["narration"], "source": e["source"]})

            # 4. day-to-day spending
            for e in events:
                if e["kind"] != "OUTFLOW" or e["category"] in ("RENT", "EMI", "UTILITY"):
                    continue
                self._debit_settlement(
                    e["amount"], f"{self.policy}:out:{idx}:{e['label']}:{e['amount']}",
                    on, {"label": e["label"], "category": e["category"],
                         "narration": e["narration"]})

            # 5. adaptive sweeps at end of day
            day_record = {"idx": idx, "date": on, "income": float(ds.income[idx])}
            if self.policy == "DHARA":
                day_record.update(self._run_sweeps(idx, on))
            # 6. spend-down of whatever is left within easy reach
            self._spend_down(idx, on)

            day_record["settlement"] = self.ledger.balance(SETTLEMENT) / 100
            day_record["buffer"] = self.ledger.balance(BUFFER) / 100
            day_record["sinking"] = self.ledger.balance(SINKING) / 100
            emb = ds.essential_daily_burn(upto=idx)
            day_record["buffer_days"] = round(day_record["buffer"] / emb, 2) if emb else 0
            self.out.daily.append(day_record)
        return self

    def _spend_down(self, idx: int, on: str):
        balance = self.ledger.balance(SETTLEMENT) / 100
        excess = balance - FLOAT_TARGET
        if excess <= 0:
            return
        amount = round(excess * MPC_LIQUID, 2)
        if amount < 1:
            return
        self._debit_settlement(amount, f"{self.policy}:spenddown:{idx}", on,
                               {"label": "Everyday spending",
                                "category": "DISCRETIONARY"}, "SPEND")

    def _run_obligations(self, idx: int, on: str, events: list[dict]):
        due = [e for e in events
               if e["kind"] == "OUTFLOW" and e["category"] in ("RENT", "EMI", "UTILITY")]
        due += self._pending
        self._pending = []

        for e in due:
            amount = e["amount"]
            key = f"{self.policy}:obl:{e.get('retry', 0)}:{idx}:{e['label']}:{amount}"

            # DHARA: top up from the buffer BEFORE the mandate presents, so the
            # debit cannot bounce. This is the buffer doing its job.
            if self.policy == "DHARA":
                short = amount - self.ledger.balance(SETTLEMENT) / 100
                if short > 0:
                    self._move_from_buffer(
                        short, f"{self.policy}:cover:{idx}:{e['label']}", on,
                        f"covering {e['label']}")

            if self._debit_settlement(amount, key, on,
                                      {"label": e["label"], "category": e["category"]},
                                      "OBLIGATION"):
                self.out.timeline.append(
                    {"date": on, "kind": "OBLIGATION_PAID", "amount": amount,
                     "label": e["label"]})
            else:
                retry = e.get("retry", 0)
                self.out.bounces += 1
                self._charge_fee(self.ds.bounce_fee,
                                 f"{self.policy}:fee:{idx}:{e['label']}:{retry}", on,
                                 f"{e['label']} bounce charge")
                self.out.timeline.append(
                    {"date": on, "kind": "BOUNCE", "amount": amount,
                     "label": e["label"], "fee": self.ds.bounce_fee})
                if retry < 2:
                    self._pending.append({**e, "retry": retry + 1})
                else:
                    self.out.unpaid_obligations += 1

    def _run_rd(self, idx: int, on: str):
        """Calendar-indexed savings: debit Rs 2,000 on the 1st, come what may."""
        if not self._rd_active or self.ds.date_of(idx).day != RD_DAY:
            return
        ok = self._debit_settlement(
            RD_AMOUNT, f"{self.policy}:rd:{idx}", on, {"label": "Recurring deposit"},
            "RD")
        if ok:
            # money genuinely saved, but into an illiquid RD -- modelled as the
            # buffer bucket so the comparison is like-for-like on balances
            # An RD is contractually locked until maturity. Modelling it as a
            # liquid buffer would hide the entire point: this money exists and
            # still cannot stop a bounce (PRD §2.2 C6, savings in the wrong shape).
            self.ledger.post("RD_CREDIT", f"{self.policy}:rdc:{idx}",
                             [Leg(WORLD, DR, _rupees_to_minor(RD_AMOUNT)),
                              Leg(RD_LOCKED, CR, _rupees_to_minor(RD_AMOUNT))],
                             occurred_on=on, metadata={"label": "Recurring deposit"})
            self.out.total_saved += RD_AMOUNT
            self.out.sweeps_executed += 1
            self.out.timeline.append({"date": on, "kind": "SAVED",
                                      "amount": RD_AMOUNT, "label": "Recurring deposit"})
        else:
            self._rd_bounces += 1
            self.out.bounces += 1
            self._charge_fee(self.ds.bounce_fee, f"{self.policy}:rdfee:{idx}", on,
                             "RD mandate bounce charge")
            self.out.timeline.append({"date": on, "kind": "RD_BOUNCE",
                                      "amount": RD_AMOUNT, "label": "Recurring deposit",
                                      "fee": self.ds.bounce_fee})
            if self._rd_bounces >= MAX_RD_BOUNCES:
                self._rd_active = False
                self.out.savings_habit_alive = False
                self.out.rd_disabled_on = on
                self.out.timeline.append(
                    {"date": on, "kind": "MANDATE_DISABLED", "amount": 0,
                     "label": "User cancelled the recurring deposit after 2 bounces"})

    def _run_sweeps(self, idx: int, on: str) -> dict:
        liquid = self.ledger.balance(SETTLEMENT) / 100
        s2s = s2s_mod.compute(self.ds, self.hf, idx, liquid=liquid)
        res = sweeps_mod.evaluate_day(self.ds, idx, s2s)

        if res.paused or res.total <= 0:
            self.out.sweeps_paused += 1
            return {"s2s": round(s2s.amount, 2), "sweep": 0.0,
                    "paused": True, "reason": res.reason}

        # cannot sweep more than is actually in the account
        amount = min(res.total, liquid)
        if amount <= 0:
            self.out.sweeps_paused += 1
            return {"s2s": round(s2s.amount, 2), "sweep": 0.0,
                    "paused": True, "reason": "NO_LIQUIDITY"}

        # buffer first; the sinking fund only starts once there is a floor
        emb = self.ds.essential_daily_burn(upto=idx)
        buffer_days = (self.ledger.balance(BUFFER) / 100) / emb if emb else 0
        to_sinking = 0.0
        if buffer_days >= BUFFER_DAYS_BEFORE_SINKING:
            to_sinking = min(SINKING_DAILY, amount)
        to_buffer = amount - to_sinking

        rid = self.ledger.reserve(SETTLEMENT, _rupees_to_minor(amount))
        try:
            if to_buffer > 0 and to_sinking > 0:
                self.ledger.release(rid)
                self.ledger.post(
                    "SWEEP", f"{self.policy}:sweep:{idx}",
                    [Leg(SETTLEMENT, DR, _rupees_to_minor(amount)),
                     Leg(BUFFER, CR, _rupees_to_minor(to_buffer)),
                     Leg(SINKING, CR, _rupees_to_minor(to_sinking))],
                    occurred_on=on, metadata={"lines": res.lines})
            else:
                target = SINKING if to_sinking > 0 else BUFFER
                self.ledger.commit_reservation(
                    rid, "SWEEP", f"{self.policy}:sweep:{idx}", target,
                    occurred_on=on, metadata={"lines": res.lines})
        except Exception:
            self.ledger.release(rid)
            raise

        self.out.total_saved += amount
        self.out.sweeps_executed += 1
        for l in res.lines:
            self.out.timeline.append({"date": on, "kind": "SWEEP", "amount": l["amount"],
                                      "label": l["mode"], "note": l["note"]})
        return {"s2s": round(s2s.amount, 2), "sweep": round(amount, 2),
                "paused": False, "reason": None, "lines": res.lines}
