"""
Centralized Configuration for Dhara Financial Resilience Engine.

All key parameters, thresholds, and horizons are defined here with environment
variable overrides. No magic numbers scattered across modules (PRD & ARCHITECTURE).
"""
from __future__ import annotations

import os

# --- Pillar 2: SAVE (Sweeps & Safe-to-Save) -----------------------------------
# When daily earnings exceed this multiplier of personal 30-day median, surge skim triggers
SURGE_THRESHOLD: float = float(os.getenv("DHARA_SURGE_THRESHOLD", "1.20"))

# Share of excess earnings swept into buffer during a surge day (25%)
SURGE_SKIM_RATE: float = float(os.getenv("DHARA_SURGE_SKIM_RATE", "0.25"))

# Standard payout slice rate saved on regular income events (3%)
PAYOUT_SLICE_PCT: float = float(os.getenv("DHARA_PAYOUT_SLICE_PCT", "0.03"))

# Round-up denomination in rupees (e.g. ₹97 -> ₹100, saving ₹3)
ROUND_UP_TO: int = int(os.getenv("DHARA_ROUND_UP_TO", "10"))

# Realised income ratio vs median below which drought pause triggers immediately
DROUGHT_RATIO: float = float(os.getenv("DHARA_DROUGHT_RATIO", "0.50"))
DROUGHT_LOOKBACK: int = int(os.getenv("DHARA_DROUGHT_LOOKBACK", "3"))

# User-set untouchable reserve floor in settlement account (rupees)
DEFAULT_RESERVE_FLOOR: float = float(os.getenv("DHARA_RESERVE_FLOOR", "1000"))

# Horizon in days for Safe-to-Save calculation
SAFE_TO_SAVE_HORIZON: int = int(os.getenv("DHARA_S2S_HORIZON", "14"))

# --- Pillar 1: SEE (Forecasting & Shortfall) -----------------------------------
FORECAST_HORIZON: int = int(os.getenv("DHARA_FORECAST_HORIZON", "14"))
SHORTFALL_ALERT_HORIZON: int = int(os.getenv("DHARA_SHORTFALL_HORIZON", "14"))
SHORTFALL_WARNING_HOURS: int = int(os.getenv("DHARA_SHORTFALL_WARNING_HOURS", "72"))
MIN_SHORTFALL_GAP: float = float(os.getenv("DHARA_MIN_SHORTFALL_GAP", "200"))

# --- North Star Target --------------------------------------------------------
TARGET_BUFFER_DAYS: int = int(os.getenv("DHARA_TARGET_BUFFER_DAYS", "30"))

# --- Pillar 3: BORROW (Credit & Repayment) ------------------------------------
DEFAULT_REPAYMENT_RATE: float = float(os.getenv("DHARA_REPAYMENT_RATE", "0.08")) # 8% of payout
DSR_CAP: float = float(os.getenv("DHARA_DSR_CAP", "0.35"))                      # 35% of p20 net disposable
ADVANCE_CAP_PCT: float = float(os.getenv("DHARA_ADVANCE_CAP_PCT", "0.50"))      # 50% of p20 horizon income
MAX_LATE_FEE_PCT: float = float(os.getenv("DHARA_MAX_LATE_FEE_PCT", "0.05"))
GRACE_ZERO_DAYS: int = int(os.getenv("DHARA_GRACE_ZERO_DAYS", "3"))
