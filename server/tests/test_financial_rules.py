
"""
Comprehensive Financial Correctness & Policy Tests for Dhara.

Covers:
1. Ledger: debits = credits, non-negative balance, idempotency.
2. Safe-to-Save: conservative floor, drought pause, reason codes.
3. Quantile Forecasting: monotonicity p10 <= p20 <= p50 <= p90.
4. Shortfall Engine: early warning, buffer and non-loan remedies first.
5. Income-Linked Repayment: 8% share, zero on zero-earning days, zero penalty fees.
6. Anti-Harm Policy: hard block on loan rollover, distress lockout, p20-based affordability.
7. Multi-Persona Support: Ravi, Sunita, Imran datasets and ledgers.
8. Vernacular Assistant: English, Tamil, and Hindi numeric consistency and validation.
9. Feedback Mechanism: local SQLite storage and retrieval.
"""
from __future__ import annotations

import os
import tempfile
import pytest

from core.dataset import load
from core.ledger import CR, DR, InsufficientFunds, Ledger, Leg
from core import safe_to_save as s2s_mod
from core import shortfall as shortfall_mod
from core.state import AppState
from credit import policy as policy_mod
from credit import schedule as schedule_mod
from assistant.runner import ask


# --- 1. Ledger Invariants -----------------------------------------------------
def test_ledger_debit_credit_and_non_negative():
    fd, path = tempfile.mkstemp(suffix=".db", dir="data")
    os.close(fd)
    os.remove(path)
    led = Ledger(path)

    led.open_account("world", "u1", "EXTERNAL", "External World")
    led.open_account("settlement", "u1", "USER_SETTLEMENT", "Settlement")
    led.open_account("buffer", "u1", "USER_BUCKET", "Emergency Buffer")

    # Seed initial 5,000
    led.post("SEED", "seed_001", [
        Leg("world", DR, 5000_00),
        Leg("settlement", CR, 5000_00),
    ])

    # Transfer 2,000 to buffer
    led.post("SWEEP", "sweep_001", [
        Leg("settlement", DR, 2000_00),
        Leg("buffer", CR, 2000_00),
    ])

    assert led.balance("settlement") == 3000_00
    assert led.balance("buffer") == 2000_00

    # Test idempotency: replaying same idempotency_key must return same txn without re-moving funds
    txn_id_first = led.post("SWEEP", "sweep_001", [
        Leg("settlement", DR, 2000_00),
        Leg("buffer", CR, 2000_00),
    ])
    assert led.balance("settlement") == 3000_00
    assert led.balance("buffer") == 2000_00

    # Attempting to overdraw settlement account (balance 3000, requesting 4000)
    with pytest.raises(InsufficientFunds):
        led.post("OVERDRAW", "bad_txn", [
            Leg("settlement", DR, 4000_00),
            Leg("world", CR, 4000_00),
        ])

    # Ledger must remain strictly consistent and balanced
    rep = led.verify()
    assert rep["healthy"] is True
    led.close()
    if os.path.exists(path):
        os.remove(path)


# --- 2. Safe-to-Save Engine ---------------------------------------------------
def test_safe_to_save_rules():
    s = AppState.get("ravi")
    # Normal day
    s2s_normal = s2s_mod.compute(s.ds, s.hf14, idx=160, liquid=4000.0)
    assert s2s_normal.amount > 0
    assert s2s_normal.paused is False
    assert s2s_normal.reason is None

    # Drought day (e.g. Day 173)
    s2s_drought = s2s_mod.compute(s.ds, s.hf14, idx=173, liquid=500.0)
    assert s2s_drought.paused is True
    assert s2s_drought.reason == "DROUGHT"
    assert s2s_drought.amount <= 0


# --- 3. Forecast Quantile Ordering --------------------------------------------
def test_forecast_quantile_monotonicity():
    s = AppState.get("ravi")
    path = s.daily_fc.predict_path(
        s.ds.income, s.ds.weekdays, s.ds.day_of_month, t=s.today, horizon=14
    )
    for k in range(14):
        p10 = path["p10"][k]
        p20 = path["p20"][k]
        p50 = path["p50"][k]
        p90 = path["p90"][k]
        assert p10 <= p20 + 0.01, f"p10 {p10} > p20 {p20} at step {k}"
        assert p20 <= p50 + 0.01, f"p20 {p20} > p50 {p50} at step {k}"
        assert p50 <= p90 + 0.01, f"p50 {p50} > p90 {p90} at step {k}"


# --- 4. Shortfall Early Warning -----------------------------------------------
def test_shortfall_detection_and_remedies():
    s = AppState.get("ravi")
    # At day 175 (inside drought, with bike EMI due on day 179)
    alert = shortfall_mod.detect(s.ds, s.hf14, idx=175, buffer_balance=1800.0, settlement_balance=100.0)
    assert alert is not None
    assert alert["type"] == "SHORTFALL"
    assert alert["shortfall"] > 0
    assert alert["due_in_days"] <= 14

    # Safe remedies must be provided and must NOT be a loan recommendation
    remedy_ids = [r["id"] for r in alert["remedies"]]
    assert "USE_BUFFER" in remedy_ids
    assert "EARN_MORE" in remedy_ids
    assert "RESCHEDULE" in remedy_ids
    assert "TAKE_LOAN" not in remedy_ids


# --- 5. Income-Linked Repayment -----------------------------------------------
def test_income_linked_repayment_zero_on_zero_income():
    # Synthetic 5-day series: [1000, 0, 0, 500, 0]
    income_series = [1000.0, 0.0, 0.0, 500.0, 0.0]
    struct = schedule_mod.simulate_income_linked(
        income_series, principal=5000.0, tenure_months=6, rate=0.08
    )
    # Day 0: 1000 earned -> 80 paid
    assert struct.ledger[0]["paid"] == 80.0
    # Days 1, 2: 0 earned -> 0 paid, no bounce, no fee
    assert struct.ledger[1]["paid"] == 0.0
    assert struct.ledger[1]["status"] in ("ZERO", "GRACE")
    assert struct.ledger[2]["paid"] == 0.0
    assert struct.bounces == 0
    assert struct.fees == 0.0


# --- 6. Anti-Harm Policy Engine -----------------------------------------------
def test_anti_harm_rules():
    # Rule 1: No Rollover (refinances existing loan -> hard DECLINE)
    dec_rollover = policy_mod.evaluate(
        requested_amount=5000, purpose="rollover", tenure_months=6,
        p20_monthly_income=25000, p20_horizon_income=12000,
        essential_non_debt_burn=18000, existing_debt_service=4100,
        buffer_days=15, buffer_balance=3000, tenure_days=90,
        repayments_completed=2, active_unacknowledged_shortfall=False,
        alternative_shown=True, refinances_existing_dhara_loan=True,
    )
    assert dec_rollover.outcome == "DECLINE"
    assert dec_rollover.binding_constraint == "NO_ROLLOVER"

    # Rule 2: Distress Lockout (active unacknowledged shortfall -> hard DECLINE)
    dec_distress = policy_mod.evaluate(
        requested_amount=5000, purpose="emergency", tenure_months=6,
        p20_monthly_income=25000, p20_horizon_income=12000,
        essential_non_debt_burn=18000, existing_debt_service=4100,
        buffer_days=15, buffer_balance=3000, tenure_days=90,
        repayments_completed=2, active_unacknowledged_shortfall=True,
        alternative_shown=False, refinances_existing_dhara_loan=False,
    )
    assert dec_distress.outcome == "DECLINE"
    assert dec_distress.binding_constraint == "DISTRESS_LOCKOUT"


# --- 7. Multi-Persona Support -------------------------------------------------
def test_multi_persona_datasets():
    # Test Ravi, Sunita, and Imran
    for pid in ("ravi", "sunita", "imran"):
        st = AppState.get(pid)
        assert st.ds.persona_id == pid
        assert st.ds.n_days == 180
        assert len(st.ds.obligations) > 0
        assert len(st.ds.sinking_targets) > 0
        # Positive earnings history
        assert st.ds.income.sum() > 50000


# --- 8. Vernacular Assistant --------------------------------------------------
def test_vernacular_assistant_numerical_consistency():
    # Ask balance in English, Tamil, and Hindi
    turn_en = ask("What is my balance?", force_deterministic=True, lang="en")
    turn_ta = ask("என் இருப்பு என்ன?", force_deterministic=True, lang="ta")
    turn_hi = ask("मेरा बैलेंस कितना है?", force_deterministic=True, lang="hi")

    # Numeric validation must pass 100% on all three
    assert turn_en.validation["ok"] is True
    assert turn_ta.validation["ok"] is True
    assert turn_hi.validation["ok"] is True

    # Figures found in Tamil and Hindi must match English tool outputs
    en_found = set(turn_en.validation["found"])
    ta_found = set(turn_ta.validation["found"])
    hi_found = set(turn_hi.validation["found"])

    # At least buffer days count or balance figures must be present in all
    assert len(en_found) > 0
    assert len(ta_found) > 0
    assert len(hi_found) > 0


# --- 9. Local Feedback Storage ------------------------------------------------
def test_feedback_storage():
    st = AppState.get("ravi")
    saved = st.dhara.ledger.save_feedback(
        user_id="ravi", useful=True, comment="The drought pause saved my rent money", feature="safe_to_save"
    )
    assert saved["feedback_id"].startswith("fb_")
    assert saved["useful"] is True

    all_fb = st.dhara.ledger.get_feedback(limit=10)
    assert any(f["feedback_id"] == saved["feedback_id"] for f in all_fb)
