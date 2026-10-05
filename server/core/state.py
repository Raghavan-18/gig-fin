"""
Application state, built once at startup.

Training the forecaster and replaying 180 days through the ledger takes a few
seconds, so it happens once here rather than per request.
"""
from __future__ import annotations

import hashlib
import os
import pickle
import threading

from core.dataset import load
from core.engine import Engine
from core.ledger import Ledger
from ml.forecast import DailyQuantileForecaster, HorizonForecaster, coverage_report

TRAIN_UPTO = 150          # last 30 days held out to report honest calibration
DB_DIR = "data"
MODEL_CACHE = "data/models.pkl"


class AppState:
    _lock = threading.Lock()
    _instance: "AppState | None" = None
    _instances: dict[str, "AppState"] = {}
    _active_persona: str = "ravi"

    def __init__(self, persona_id: str = "ravi", retrain: bool = False):
        self.persona_id = persona_id.lower()
        self.ds = load(persona_id=self.persona_id)
        ds = self.ds

        # Model cache keyed by persona fingerprint
        model_cache_path = (
            MODEL_CACHE if self.persona_id == "ravi"
            else f"data/models_{self.persona_id}.pkl"
        )

        fingerprint = hashlib.sha256(ds.income.tobytes()).hexdigest()[:16]
        cached = None
        if not retrain and os.path.exists(model_cache_path):
            try:
                with open(model_cache_path, "rb") as fh:
                    blob = pickle.load(fh)
                if blob.get("fingerprint") == fingerprint:
                    cached = blob
            except Exception:
                cached = None

        if cached:
            self.hf14, self.hf30 = cached["hf14"], cached["hf30"]
            self.daily_fc, self.calibration = cached["daily_fc"], cached["calibration"]
            self.trained = False
        else:
            self.hf14 = HorizonForecaster(14).fit(ds.income)
            self.hf30 = HorizonForecaster(30).fit(ds.income)
            self.daily_fc = DailyQuantileForecaster().fit(
                ds.income, ds.weekdays, ds.day_of_month,
                train_upto=TRAIN_UPTO, calibrate_upto=TRAIN_UPTO)
            d0 = ds.drought["start_idx"]
            self.calibration = coverage_report(
                self.daily_fc, ds.income, ds.weekdays, ds.day_of_month, TRAIN_UPTO,
                drought_idx=range(d0, d0 + ds.drought["days"]))
            self.trained = True
            with open(model_cache_path, "wb") as fh:
                pickle.dump({"fingerprint": fingerprint, "hf14": self.hf14,
                             "hf30": self.hf30, "daily_fc": self.daily_fc,
                             "calibration": self.calibration}, fh)

        # Collect any existing manual cash transactions so they persist across restarts
        existing_cash_txns = []
        dhara_path = (
            os.path.join(DB_DIR, "dhara.db") if self.persona_id == "ravi"
            else os.path.join(DB_DIR, f"dhara_{self.persona_id}.db")
        )
        if os.path.exists(dhara_path):
            try:
                temp_ledger = Ledger(dhara_path)
                existing_cash_txns = temp_ledger.get_cash_transactions()
                temp_ledger.close()
            except Exception:
                existing_cash_txns = []

        self.engines: dict[str, Engine] = {}
        for policy in ("DHARA", "TRADITIONAL"):
            path = (
                os.path.join(DB_DIR, f"{policy.lower()}.db") if self.persona_id == "ravi"
                else os.path.join(DB_DIR, f"{policy.lower()}_{self.persona_id}.db")
            )
            if os.path.exists(path):
                os.remove(path)
            self.engines[policy] = Engine(ds, self.hf14, policy, path).run()

        # Re-post persisted manual cash transactions into Dhara engine ledger
        for ctx in existing_cash_txns:
            try:
                self.dhara.ledger.post_cash_transaction(
                    kind=ctx["type"],
                    amount=ctx["amount"],
                    category=ctx["category"],
                    description=ctx["description"],
                    date_str=ctx["date"],
                    metadata=ctx,
                )
            except Exception:
                pass

        self.summaries = {p: e.out.summary(ds, e.ledger) for p, e in self.engines.items()}

    # ------------------------------------------------------------- helpers
    @property
    def dhara(self) -> Engine:
        return self.engines["DHARA"]

    @property
    def today(self) -> int:
        return self.ds.today_idx

    def p20_monthly(self, idx: int | None = None) -> float:
        return self.hf30.predict(self.ds.income, t=idx if idx is not None else self.today)["p20"]

    def p20_fortnight(self, idx: int | None = None) -> float:
        return self.hf14.predict(self.ds.income, t=idx if idx is not None else self.today)["p20"]

    def essential_non_debt_burn(self) -> float:
        emi = sum(o["amount"] for o in self.ds.obligations if o["category"] == "EMI")
        return self.ds.essential_daily_burn() * 30 - emi

    def existing_debt_service(self) -> float:
        return float(sum(o["amount"] for o in self.ds.obligations if o["category"] == "EMI"))

    @classmethod
    def get(cls, persona_id: str | None = None) -> "AppState":
        with cls._lock:
            pid = (persona_id or cls._active_persona).lower()
            if pid not in cls._instances:
                cls._instances[pid] = cls(persona_id=pid)
            cls._instance = cls._instances[pid]
            return cls._instances[pid]

    @classmethod
    def set_active_persona(cls, persona_id: str):
        with cls._lock:
            pid = persona_id.lower()
            cls._active_persona = pid
            cls.get(pid)

    @classmethod
    def reset(cls, persona_id: str | None = None) -> "AppState":
        with cls._lock:
            if persona_id:
                pid = persona_id.lower()
                cls._instances.pop(pid, None)
            else:
                cls._instances.clear()
            cls._instance = None
        return cls.get(persona_id)
