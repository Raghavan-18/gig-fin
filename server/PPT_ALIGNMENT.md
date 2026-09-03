# PPT Alignment — `Innovation Unbond.pptx`

What the deck currently claims, what the repository actually does, and the
exact edits needed to make the two agree.

The governing rule, from the brief: **do not build features to make the deck
true — make the deck honest.** Nothing below asks for new code. Every item is
a slide edit.

Verified against the deck on 2026-09-03 (7 slides) and the code at the commit
this file was added in.

---

## Severity key

| | Meaning |
|---|---|
| 🔴 | Claims something that does not exist. A judge who checks will find nothing. Must fix. |
| 🟠 | Understates or mislabels what was built. Costs credit you have already earned. Should fix. |
| 🟡 | Wording drift. Fix if time allows. |

---

## Slide 4 — "Technical Details"

This slide is the highest risk in the deck: it is a list of technology claims,
and six of ten are wrong. It is also the slide judges screenshot.

| Claim on slide | Reality in repo | Sev | Replace with |
|---|---|---|---|
| **PostgreSQL** | SQLite (`data/dhara.db`), double-entry schema in `core/ledger.py` | 🔴 | `SQLite (double-entry ledger with DB-level balance constraints)` |
| **React.js, Next.js, Tailwind CSS** | One static page, `web/index.html`, vanilla JS + canvas charts | 🔴 | `Vanilla JS single-page app (no build step)` |
| **Recharts** | Hand-drawn `<canvas>` charts | 🔴 | `Canvas 2D charts` |
| **JWT, OTP** | None. Persona picker only (`POST /api/session`) | 🔴 | Move to a **Future** column, or `Persona picker (auth cut for the 24h build)` |
| **AES-256, HTTPS/TLS** | Local HTTP, no encryption layer | 🔴 | Move to **Future**. Do not claim transport security you do not have. |
| **Account Aggregator (AA) APIs** | Mock consent screen over a seeded synthetic dataset | 🔴 | `Mock AA consent flow over seeded data (real AA = future)` |
| **Vercel, Render** | Runs locally via `./run.sh` | 🔴 | `Local (uvicorn); deployment is future work` |
| Python, FastAPI | ✅ correct | — | keep |
| Python, Scikit-learn | ✅ correct — `GradientBoostingRegressor(loss="quantile")` ×4 | — | keep, and say **quantile** regression |
| REST API | ✅ correct | — | keep |

**Missing from the slide entirely** — all real, all working, and all more
interesting than the items above:

- Double-entry ledger with idempotency keys and DB-enforced non-negative balances
- Conformalized quantile regression (cross-conformal, 4 contiguous folds)
- Block-bootstrap horizon forecasting
- Anthropic SDK tool-calling assistant (`claude-opus-5`) with a numeric validator
- Deterministic fallback path so the demo runs with no API key and no network

---

## Slide 3 — "Proposed Solution Overview"

🟠 **"Smart Savings & Safe-to-Spend"** → **"Safe-to-Save"**.

These are opposite products. Safe-to-Spend tells someone a daily spending
limit. Safe-to-Save computes how much can be moved into savings *without*
putting essential spending at risk, and goes **negative** in a drought to pause
saving. The drought pause is the centrepiece of the demo; the current wording
describes a budgeting app instead, and gives away the one idea that makes this
different.

🟠 **"Gig Score"** → **"Income Stability Score"**.

`credit/scorecard.py` computes an ISS from earning-day rate, weekly coefficient
of variation, longest zero-income gap, trend and source diversification. "Gig
Score" reads as a proprietary black box, which is exactly the objection to
avoid; the real thing is explainable and its attributes are shown in the UI.

🟡 **"Account Aggregator Integration"** → **"Mock Account Aggregator consent
flow"**. Consistent with slide 4.

**Add a fifth bullet.** The solution overview does not currently mention the
north-star metric or the credit mechanics:

> **Buffer Days & Income-Linked Credit** — measure resilience as days of
> essential spending covered by liquid savings, and make repayment a share of
> each payout, so a zero-income day costs ₹0 and carries no fee.

---

## Slide 6 — "Implementation Plan"

The "Unique Innovations" column is directionally right but describes a
budgeting product, not this one. Suggested replacements, keeping the numbering:

| # | Currently | Replace with |
|---|---|---|
| 4 | "Income-triggered micro-savings that adapts to payout amounts" | "Adaptive sweeps — payout slice, round-up, and a surge skim that saves 25% of the excess on days above 120% of the personal 30-day median" |
| 5 | "Dynamic Safe-to-Spend calculated from actual cash flow" | "**Safe-to-Save** — savings pause automatically when the 14-day p20 forecast cannot cover committed outflows, with a plain-language reason code (`DROUGHT`)" |
| 6 | "Gig Score based on payout consistency…" | "Underwriting on the **20th percentile** of forecast income, never the mean — plus a policy engine that blocks rollover in code" |
| 7 | "Context-aware financial nudges" | "Assistant with a **numeric validator**: every figure must trace to a tool result, or the answer is blocked and regenerated" |

**Row 8** ("Unified resilience platform…") is good. Keep it.

---

## Slide 7 — "Feasibility & Viability"

🟠 "Proven Technology — React/Next.js, FastAPI, PostgreSQL" — same correction
as slide 4.

🟡 "Secure by Design — explicit consent, encrypted data transfer,
authentication and minimal data retention" — consent is mocked and the rest is
not built. Reword to design intent, e.g. *"Designed for consent-first data
access; the hackathon build ships the consent flow as a mock over seeded
data."*

---

## A slide worth adding

If there is room for one more, add **"What is real in this build"**. It is the
first question a technical judge asks, and answering it before it is asked buys
more credibility than any feature claim:

> **Real, running now:** double-entry ledger · quantile forecaster with
> measured 82.8% p10–p90 coverage against a 75–85% target · Safe-to-Save ·
> adaptive sweeps · shortfall detection with three remedies · credit policy
> engine · income-linked repayment · assistant numeric validator ·
> Traditional-vs-Dhara comparison computed from one shared income series.
>
> **Simulated, and labelled as such in the UI:** Account Aggregator consent ·
> bank/UPI money movement · 180 days of synthetic income · rule-based income
> classification.

The coverage figure is live at `GET /api/health` and shown in the page footer,
so it can be demonstrated rather than asserted.

---

## Terminology to use on stage

Consistency across the team matters more than any single slide:

**Safe-to-Save** · **Buffer days** · **Quantile forecast** · **Drought
protection** · **Adaptive sweeps** · **Responsible credit policy** ·
**Income-linked repayment** · **Numeric validator** · **Traditional vs Dhara**

Avoid: "Safe-to-Spend", "Gig Score", "AI budgeting", "credit score".
