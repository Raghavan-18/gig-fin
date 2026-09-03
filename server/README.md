# Dhara — Financial Resilience for Gig & Informal Workers

> **Cash-flow-indexed savings, credit, and insurance for volatile earners.**
> Built for a 24-hour hackathon. Working demo, real mechanics, honest simulation labels.

---

## 🎯 The Thesis

A fixed-date financial product breaks a gig worker on a bad week.
A cash-flow-indexed one bends with them.

Dhara replaces calendar-indexed primitives (fixed-date EMIs, rigid SIPs, month-end savings) with **cash-flow-indexed primitives** designed for income volatility. The demo runs the same bad week — a 5-day rain drought for a Bengaluru delivery rider — through both systems and shows the divergence.

---

## 🚀 Quick Start

```bash
# From a clean clone:
./setup.sh        # creates venv, installs deps, generates seed data, runs tests
./run.sh          # starts the server on port 8000

# Open http://localhost:8000
```

Requires **Python 3.11+**. No npm, no Docker, no external services.

### Manual Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=. python -m ml.generate          # generate seed data
PYTHONPATH=. uvicorn api.main:app --port 8000
```

### Demo Reset

```bash
./demo/reset.sh    # restores seed data to the scripted starting state
```

### Demo Smoke Test

Walks the full demo path against a running server and exits non-zero if
any beat in `demo/script.md` would fail on stage. Run it after every
reset and once more before presenting.

```bash
./demo/smoke.sh                          # defaults to http://localhost:8000
./demo/smoke.sh http://localhost:8137    # or point it at another port
```

---

## 🏗️ Architecture

```
├── api/              FastAPI app — health, dashboard, forecast, credit, assistant endpoints
├── assistant/        Vernacular financial assistant with numeric validator + tool bindings
├── core/             Double-entry ledger, simulation engine, sweeps, Safe-to-Save, shortfall
├── credit/           Scorecard, affordability policy engine, income-linked repayment schedules
├── data/             Seed database, trained model cache
├── demo/             Reset script, 5-minute demo script
├── ml/               Quantile income forecaster (GBM), synthetic gig transaction generator
├── tests/            Acceptance tests (ledger, sweeps, calibration, comparison) + assistant red-team
├── web/              Single-page app — phone-frame UI, canvas charts, no build step
├── PRD.md            Product Requirements Document
├── ARCHITECTURE.md   Target production architecture
└── IMPLEMENTATION_PLAN.md   24-hour build plan with scope decisions
```

---

## ✅ What's Real vs. What's Simulated

Every component is labelled in the UI. Here is the full table:

| Capability | Status | Detail |
|---|---|---|
| **Double-entry ledger** with balance invariants | ✅ REAL | ~400 lines. DR=CR enforced. Non-negative balances. Idempotent postings. SQLite. |
| **Safe-to-Save engine** | ✅ REAL | `S2S = p20(14d) − obligations − burn − floor`. Pure function. |
| **Sweep engine** (surge skim, payout slice, round-up) | ✅ REAL | Three modes. Zero sweeps during drought. Never larger than S2S. |
| **Quantile income forecaster** (p10/p20/p50/p90) | ✅ REAL | `GradientBoostingRegressor(loss="quantile")` × 4. Cross-conformal calibration. |
| **Shortfall detector** + 3 remedies | ✅ REAL | Fires 9 days out. Buffer, reduce, borrow options. |
| **Income-linked repayment schedule** | ✅ REAL | `repayment = clamp(rate × payout, 0, ceiling)`. ₹0 on zero-income days. |
| **Policy engine** (affordability, rollover block, ladder) | ✅ REAL | Declarative rules. p20 underwriting. Rollover blocked in code. |
| **Assistant with tool-calling + numeric validator** | ✅ REAL | Tools grounded to ledger/forecast. Validator blocks unsourced numbers. |
| **Sinking fund** for lumpy insurance premium | ✅ REAL | One formula, daily accrual, progress bar. |
| **Comparison engine** (Traditional vs Dhara) | ✅ REAL | Same income series replayed through both policy sets. Not hardcoded. |
| **Income classifier** | ✅ REAL, rule-based | `ml/classify.py`. Keyword map, honestly labelled `method: rule` everywhere it surfaces. Excludes self-transfers from assessed income. |
| Account Aggregator consent | 🔶 SIMULATED | Mock consent screen (`POST /api/session`) over a seeded synthetic dataset. Labelled *simulated* in the UI. No real AA sandbox. |
| Bank / UPI money movement | 🔶 SIMULATED | Simulated rail. `POST /api/withdraw` posts to the real ledger and reports measured latency. |
| Income data | 🔶 SYNTHETIC | 180 seeded days, calibrated to published gig-earnings volatility (weekly CV ≈ 0.31). |
| Voice input | 🔶 PROGRESSIVE | Browser Web Speech API. The mic button only appears if the browser supports it; the text field always works. |
| Auth, KYC, onboarding | ⛔ CUT | Persona picker instead. Personas without seeded history are refused explicitly, not silently switched. |
| Native mobile app | ⛔ CUT | Responsive web. |

---

## 🖥️ Frontend note

`web/index.html` is a single static page — vanilla JS, canvas charts, no build
step. The presentation deck lists Next.js / Tailwind / Recharts; it is wrong,
and `PPT_ALIGNMENT.md` lists that and every other slide correction needed.

---

## 🧪 Tests

```bash
# Acceptance tests (ledger, sweeps, forecast calibration, comparison)
PYTHONPATH=. .venv/bin/python -m pytest tests/test_acceptance.py -v

# Assistant red-team (30 adversarial numeric questions, zero unsourced numbers)
PYTHONPATH=. .venv/bin/python -m pytest tests/test_assistant.py -v

# Full demo path against a running server — 50 checks, one group per demo beat
./demo/smoke.sh http://localhost:8000
```

`smoke.sh` checks the claims the demo makes, not just HTTP 200: that the
drought never drains the buffer, that every paused sweep carries a reason code,
that measured forecast coverage sits inside its target band, that income-linked
repayment bounces less and costs less than fixed EMI, that a persona with no
seeded history is refused rather than faked, and that the assistant's numeric
validator passes on every scripted question.

---

## 📊 Key Metrics (from the last run)

| Metric | Value |
|---|---|
| Forecast p10–p90 coverage | ~82.8% over held-out days |
| Bounces — Traditional | 8 |
| Bounces — Dhara | 0 |
| Fees — Traditional | ₹4,720 |
| Fees — Dhara | ₹0 |
| Assistant red-team pass rate | 30/30 (zero unsourced numbers) |

---

## 📖 Deep-Dive Documents

- [`PRD.md`](./PRD.md) — Full product requirements with 22 features across 5 pillars
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Target production architecture (event-driven, ledger-first)
- [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) — 24-hour build plan with scope decisions and demo script

---

## 🛡️ License

Apache-2.0 / MIT
