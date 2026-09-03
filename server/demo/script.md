# Demo Script — 5 Minutes
## Dhara: Financial Resilience for Gig & Informal Workers

> Rehearse from T+20. Time every run. Cut anything past 4:30.

---

### 0:00–0:30 · The Hook

**[Show persona chip — Ravi, Bengaluru]**

> "Ravi delivers food in Bengaluru. Last month he earned ₹31,000 — more than an
> entry-level salaried job. He also paid ₹590 in bounce charges, because his bike
> EMI is due on the 5th and it rained on the 3rd. He isn't poor. He's
> **volatile** — and every bank product he can access is built for a calendar he
> doesn't live on."

---

### 0:30–1:15 · The Picture

**[Dashboard → tap Forecast tab]**

Show the 6-month income history and the p10–p90 forecast band.

> "We don't tell him he'll earn ₹28,400 — we'd be wrong, and he'd stop trusting
> us. We tell him ₹24k–₹31k, and we're right 80% of the time. Here's the
> measured calibration."

Point to the calibration number: **82.8% coverage**, cross-conformal, honest.

---

### 1:15–2:30 · The Bad Week

**[Dashboard → tap Timeline tab]**

Run through the day-by-day replay. Rain. Earnings collapse to zero.

- **Safe-to-Save goes negative** → sweeps pause automatically, yellow chip:
  `DROUGHT`. *"A normal recurring deposit would have debited him today and
  bounced. We just… didn't take his money."*

- **Shortfall alert fires** (visible on Dashboard) — 9 days out with three
  one-tap remedies. Take the buffer option.

- Weather clears → surge skim quietly rebuilds the buffer from the excess.

---

### 2:30–3:15 · The Comparison

**[Tap Compare tab]**

Split screen, same income series, two products.

> "Same person. Same week. Same income. Different mechanics."

Read the numbers:
- Traditional: **8 bounces**, ₹4,720 in fees, 0 buffer days
- Dhara: **0 bounces**, ₹0 fees, 13.5 buffer days, insurance accruing at ₹38/day

Point to the buffer trajectory chart: Traditional flatlines at zero while Dhara's
buffer grows and bends but never breaks.

---

### 3:15–4:15 · Credit That Can Say No

**[Tap Credit tab → ₹40,000 request]**

- Policy engine **reduces** with the binding constraint shown in plain language
  (PRODUCT_LADDER).
- The **alternative appears above** the offer: "Your buffer covers ₹10,639
  today, at no cost."
- Approved smaller loan with an **income-linked schedule**: variable bars, ₹0 on
  zero-income days, hard maturity date, total cost in rupees.

> "We measure ourselves on loans avoided. That's metric M-C6 in our PRD."

Show the repayment backtest: Fixed EMI bounces. Income-linked: zero bounces.

---

### 4:15–4:45 · The Assistant & Its Guardrail

**[Tap Ask tab]**

Ask: *"How much money do I have?"* — grounded answer from tool calls.

Then tap: *"What's 15% of my savings?"*

> **Show the validator blocking it** (or declining to compute).

> "Our assistant is structurally incapable of inventing a number about your
> money. Every figure comes from a tool call, and anything else gets blocked
> before you see it."

---

### 4:45–5:00 · The Close

> "The demo is a vertical slice. The architecture behind it is designed for the
> real thing — here's the ledger, the policy layer that a model retrain can't
> loosen, and the consent registry in the data path."

> "North star metric: **buffer days**. Not loan volume. Not revenue. Buffer
> days."

---

## Pre-Demo Checklist

- [ ] Run `demo/reset.sh`
- [ ] Start server: `python3 -m uvicorn api.main:app --port 8000`
- [ ] Open `http://localhost:8000` in Chrome (phone viewport or resize)
- [ ] Run `demo/smoke.sh` — all beats must pass before you go on
- [ ] Verify Dashboard loads with Ravi's data
- [ ] Run through each tab once to warm the cache
- [ ] Record backup video of full demo flow
