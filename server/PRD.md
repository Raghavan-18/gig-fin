# Product Requirements Document
## Project **Dhara** — Financial Resilience Infrastructure for Gig & Informal Workers

| | |
|---|---|
| **Document status** | Draft v1.0 — for review |
| **Date** | 3 September 2026 |
| **Owner** | Product |
| **Problem statement** | *How might banking technology help gig workers and individuals with irregular incomes build financial resilience through intelligent savings, responsible access to credit, and personalized financial guidance?* |
| **Codename** | Dhara (*धारा* — "flow"). Placeholder; naming TBD. |

---

# 1. Executive summary

Formal banking is built on an assumption that does not hold for 90% of the world's workers: **that money arrives on a schedule.** Salary on the 1st. EMI on the 5th. SIP on the 10th. Every retail financial product — recurring deposits, systematic investment plans, equated monthly instalments, insurance premiums — is indexed to the calendar, because the salaried customer it was designed for is indexed to the calendar.

A delivery partner is not. A cab driver is not. A domestic worker, a street vendor, a freelance electrician, a farm labourer is not. Their income arrives daily, weekly, or whenever it arrives, in amounts that vary 3–5× week to week. When a calendar-indexed product meets a flow-indexed life, the product does not merely underperform — it actively harms: mandates bounce, penalties accrue, insurance lapses, credit files are damaged, and the user learns that formal finance is a trap. They retreat to cash under the mattress, gold, chit funds, and moneylenders at 3–10% *per month*.

**The core insight of this product: replace the calendar with the cash flow.** Every financial primitive — saving, borrowing, repaying, insuring — should be indexed to income *events*, not to dates. Save a slice of each payout, not a fixed sum on the 1st. Repay a percentage of what you earn, not a fixed EMI. Fund the insurance premium continuously into a sinking fund so it can never lapse.

Three technology shifts make this buildable now in a way it was not five years ago:

1. **Consent-based cash-flow data.** Account Aggregator / open banking gives a bank a complete, permissioned, machine-readable view of a customer's income and obligations across institutions — replacing the salary slip that gig workers do not have.
2. **Near-zero-cost real-time money movement.** UPI and real-time rails make a ₹12 round-up or a ₹40 per-trip sweep economically sensible. Micro-transactions at population scale are now free enough to build a product on.
3. **Vernacular, voice-capable language models.** Financial guidance can finally be delivered conversationally, in the user's language, grounded in *their own* numbers — collapsing the literacy barrier that made every prior financial-literacy programme fail.

**North star metric: the share of active users holding 30+ *buffer days*** — liquid savings sufficient to cover 30 days of essential expenses without new debt. This is the single best predictor of whether a household survives a shock intact, and it is the outcome the product exists to move.

**What differentiates this from the digital-lending apps already targeting this segment:** those monetise distress. Dhara's engine is explicitly permitted — and measured on its willingness — to tell a user *not* to borrow. "Advice that avoided a loan" is a tracked success metric, not a lost conversion.

---

# 2. Problem analysis

## 2.1 The segment

| Segment | Scale (India) | Income pattern | Defining constraint |
|---|---|---|---|
| Platform gig workers (delivery, ride-hail, logistics) | ~7.7M (2021) → ~23.5M projected by 2030 (NITI Aayog) | Daily/weekly payouts, algorithmically variable | High fixed asset cost (vehicle EMI, fuel float), income visible but not documented |
| Own-account / informal service workers (domestic, construction, repair, vendors) | ~380M+ in the informal workforce | Cash, irregular dates, multiple payers | Income is largely *invisible* to any digital system |
| Micro-entrepreneurs / nano-merchants | ~60M+ MSME-adjacent | Revenue-linked, seasonal | Business and personal money are one pool |
| Freelance / creator / knowledge gig | Growing fast, higher ARPU | Project-based, 30–90 day payment lags | Long receivable cycles, tax complexity |

Globally the same shape holds: ~2B informal workers, and roughly 36% of the US workforce doing independent work.

## 2.2 Root causes — what actually breaks

This is not a poverty problem. It is a **volatility and infrastructure-mismatch** problem. Many workers in this segment earn more in a good month than an entry-level salaried employee, yet remain far more financially fragile.

**C1 — Income volatility, not income level.**
Median gig income can swing 25–40% month to month; weekly swings are larger. The scarce resource is not money, it is *predictability*. A worker cannot answer "can I afford this?" because they cannot answer "what will I earn?"

**C2 — Expense shocks are uncorrelated with income peaks.**
A vehicle breakdown, hospital admission, school fee, or festival obligation arrives on its own schedule. Peak need and peak income almost never coincide. Households therefore need a *buffer*, not a higher average.

**C3 — Thin-file invisibility.**
No employer, no salary slip, no Form 16, frequently no ITR. Credit bureaus have little or nothing. Formal underwriting rejects them by construction — not for being risky, but for being *illegible*.

**C4 — Fragmentation.**
One person earns across Uber + Rapido + private trips + cash. No entity, including the worker, holds the consolidated picture. Each platform sees a fraction and underestimates them.

**C5 — Working-capital squeeze.**
Fuel, charging, phone data, and platform commissions are paid *before* earnings arrive. Gross income overstates disposable income by 30–50%. The daily float is the real cash-flow pain, and no formal product serves it.

**C6 — Savings exist, in the wrong shape.**
This segment *does* save — in cash, gold, chit funds, ROSCAs, and lending to kin. These instruments are illiquid, unsafe, unyielding, or all three. The failure is not a savings-habit failure; it is a **savings-instrument** failure.

**C7 — Product-mechanic mismatch.**
Fixed-date auto-debits bounce on bad weeks → ₹300–600 in penalties → the customer disables the mandate → the savings habit dies. The mechanic, not the intent, kills it.

**C8 — Absent safety net.**
No provident fund, no employer health cover, no paid sick leave. Downtime is doubly punishing: income falls to zero exactly when expenses spike. Subsidised state schemes exist (life cover at ~₹436/yr, accident cover at ~₹20/yr, pension schemes) with dismal uptake — an awareness and enrolment-friction problem, not an affordability one.

**C9 — Cognitive load.**
Scarcity consumes bandwidth. Someone juggling a shortfall in the next four days has little capacity for long-horizon planning. Guidance must be *timely and specific*, not educational and general.

**C10 — Justified distrust.**
Prior experience with hidden fees, harassing collections, contact-list scraping, and mis-sold products means trust must be *earned mechanically*, not claimed in marketing.

## 2.3 Why banks have not solved it

- **Unit economics.** Manual underwriting costs more than the margin on a ₹15,000 loan.
- **Model inheritance.** Risk models are trained on salaried populations; volatile income reads as risk rather than as a different distribution.
- **Documentation-first KYC and origination** flows that assume documents this segment does not possess.
- **Cross-sell posture.** Products are pushed at customers rather than fitted to their cash flow.
- **Regulatory caution** around digital lending, and (correctly) around a segment where mis-selling causes real harm.

Each of these is now addressable: consent-based data replaces documents, cash-flow underwriting replaces salaried scorecards, automation replaces manual review, and compliant-by-design rails make responsible lending auditable.

## 2.4 The competitive gap

| Existing option | What it gets right | Where it fails this user |
|---|---|---|
| Neobanks / payment apps | Great UX, wide reach | Assume regular income; savings products are calendar-indexed |
| Digital-lending apps | Fast, thin-file friendly | Monetise distress; rollovers, opaque pricing, aggressive collection |
| Earned-wage access (EWA) | Correctly income-indexed | Employer-tethered — structurally unavailable to the self-employed |
| Platform-embedded finance | Real income data | Single-platform view; lock-in; worker cannot port their record |
| Microfinance / SHG | Trust, community, discipline | Group liability, rigid cycles, weak digital layer, capped ticket sizes |
| Chit funds / ROSCAs | Culturally trusted, flexible | Unregulated variants, counterparty risk, illiquid |

**The gap:** nobody provides a *worker-owned, cross-platform, cash-flow-native* financial layer that treats savings, credit, and guidance as one system rather than three products.

---

# 3. Users

## 3.1 Personas

**Ravi, 29 — food-delivery partner, Bengaluru**
Rides for two platforms; ₹22,000–38,000/month depending on weather, festivals, and incentive schemes. Bike EMI ₹4,100 due on the 5th; last month it bounced because a slow week landed on the 3rd. Has ₹1,800 in his account and no emergency fund. Borrowed ₹8,000 from a friend for a phone repair and hasn't repaid it. Comfortable with UPI and short-form video; will not read a paragraph.
*Needs:* a buffer that survives a bad week, an EMI that flexes, and a warning before the bounce — not after.

**Sunita, 41 — domestic worker, Jaipur**
Works in five homes; paid partly in cash on dates that vary by employer. Contributes ₹2,000/month to a neighbourhood chit fund because it is the only "savings" she trusts. Reads Hindi slowly; prefers voice. Keeps ₹15,000 in cash at home, which was stolen once.
*Needs:* her cash income made visible and safe, a familiar savings mental model (the chit), and an insurance premium that gets paid without her having to remember.

**Imran, 34 — cab driver, Pune**
Grosses ₹45,000/month; nets closer to ₹18,000 after fuel, EMI, and commissions. Dreads the ₹14,000 annual vehicle-insurance bill every March and has driven uninsured for two months before. Runs a working-capital gap: he pays for CNG today and is paid out on Tuesday.
*Needs:* a sinking fund for lumpy annual obligations, and a small revolving fuel line repaid per trip.

## 3.2 Jobs to be done

| # | Job | Today's workaround | Success looks like |
|---|---|---|---|
| J1 | "Tell me if I'll make it to the end of the month." | Mental math, anxiety | A forecast with an honest uncertainty range and a specific shortfall date |
| J2 | "Save without noticing, and stop when I can't afford it." | Cash at home, chit fund | Adaptive sweeps that scale with earnings and pause in a drought |
| J3 | "Cover an emergency without a moneylender." | 3–10%/month informal credit | Buffer first; if credit is needed, transparent and capped |
| J4 | "Prove I'm creditworthy without a salary slip." | Rejection | A portable, consented income record that underwrites |
| J5 | "Don't let my insurance/EMI lapse when I have a bad week." | Lapse, penalty, re-purchase | Sinking funds + flexible repayment + pre-emptive alerts |
| J6 | "Explain money to me in my language, about my money." | YouTube, relatives | Grounded vernacular voice guidance using the user's own numbers |
| J7 | "Get the government benefits I'm entitled to." | Unaware | Automated eligibility match and assisted enrolment |

## 3.3 Non-users (explicitly out of scope for v1)
Salaried customers with stable income; HNI/wealth; corporate/SME lending above ₹5L; equity or F&O investing.

---

# 4. Product thesis and principles

> **Index every financial primitive to the income event, never to the calendar.**

**P1 — Cash flow over credit score.** Underwrite on observed inflows, obligations, and buffer, not on the presence of a bureau file.

**P2 — Underwrite the downside, not the average.** Affordability is computed from the **20th percentile of rolling weekly net income**, not the mean. A good month must never set an obligation the median month cannot service.

**P3 — Liquidity is the trust contract.** Savings are withdrawable in under 30 seconds, with no penalty and no interrogation. Illiquidity is precisely why this segment distrusts formal savings. Commitment is *opt-in*, never default.

**P4 — Buffer before yield.** The first goal is always 30 buffer days. Nobody is offered an investment product before they have a floor to stand on.

**P5 — Credit is earned, and refusable.** Savings consistency and cash-flow stability lower the price of credit. The engine is empowered to recommend *not borrowing*, and is measured on it.

**P6 — Deterministic numbers, conversational delivery.** Every figure the assistant states comes from a computed engine via tool call. The language model explains and translates; it never calculates and never invents.

**P7 — No dark patterns, ever.** No gamified borrowing, no pre-ticked consent, no shame nudges, no contact scraping, no collection harassment. Written into the product spec, not the marketing.

**P8 — Design for the ₹8,000 phone.** Sub-25MB app, works on 2G, functions offline, voice-first, eight-plus languages, icon-led navigation for low text literacy.

**P9 — The record belongs to the worker.** The income and repayment history the user builds is exportable and portable — including to competitors.

---

# 5. Solution architecture — five pillars

```
        ┌───────────────────────────────────────────────────────────┐
        │            PILLAR 5 · PROTECT (micro-insurance)           │
        ├───────────────────────────────────────────────────────────┤
        │  PILLAR 2 · SAVE        │  PILLAR 3 · BORROW              │
        │  Adaptive sweep engine  │  Cash-flow underwriting         │
        │  Goal buckets, sinking  │  Income-linked repayment        │
        │  funds, digital chit    │  Anti-harm rails                │
        ├─────────────────────────┴─────────────────────────────────┤
        │            PILLAR 4 · GUIDE (vernacular assistant)        │
        ├───────────────────────────────────────────────────────────┤
        │            PILLAR 1 · SEE (cash-flow intelligence)        │
        │   AA + UPI + platform connectors + voice cash logging     │
        └───────────────────────────────────────────────────────────┘
```

Pillar 1 is the foundation: without a trustworthy cash-flow picture, the savings engine cannot be safe, the credit engine cannot be fair, and the assistant has nothing true to say.

---

# 6. Pillar 1 — SEE: the cash-flow intelligence layer

**Goal:** construct a complete, continuously updated, consented picture of the user's income, obligations, and discretionary spend — including cash.

### F1.1 Multi-source income aggregation
- **Account Aggregator / open banking consent** for bank statements across all held accounts (transaction history, 12–24 months where available).
- **UPI transaction stream** from the primary account for high-frequency, merchant-tagged granularity.
- **Platform connectors** (partner APIs or user-authorised statement import) for gig platforms, giving gross vs. incentive vs. penalty breakdown.
- **Voice/photo cash logging** for informal income invisible to any digital rail: user says *"aaj bara sau mila"*, system logs ₹1,200 with source tagging. Cash entries are held at lower confidence and flagged as unverified in underwriting.
- **Deduplication** across sources: a platform payout must not be double-counted as both a platform event and a bank credit.

*Acceptance:* ≥95% of bank credits correctly classified income vs. non-income on the validation set; user-visible "unclassified" queue with one-tap correction that feeds back into the classifier.

### F1.2 Income classification and stability scoring
Classify every inflow: platform earnings · cash income · reimbursement · transfer from self · transfer from family · loan disbursal · refund. Self-transfers and circular flows are excluded from income (this is also the primary gaming vector — see §12).

**Income Stability Score (ISS), 0–100**, computed from:
- coefficient of variation of weekly net income (rolling 13 weeks)
- earning-day frequency and longest zero-income gap
- income trend (slope, 90-day)
- source diversification (Herfindahl across payers — a bounded positive)
- tenure and continuity of the earning history

### F1.3 Essential-expense floor detection
Automatically identify recurring, non-negotiable outflows: rent, EMIs, school fees, utilities, recharges, insurance premiums, ration/grocery baseline, fuel/charging. Output: **Essential Monthly Burn (EMB)**, with the user able to confirm, edit, or reclassify. EMB is the denominator of the buffer-days metric and the floor in every affordability calculation.

### F1.4 Forecasting — with honest uncertainty
Rolling 30-day cash-flow projection, expressed as a **band, not a number**: p10 / p50 / p90. Modelled per-user with quantile regression over engineered features (day-of-week and seasonality effects, platform incentive cycles, recent trend, personal history), with hierarchical pooling toward a cohort prior during cold start.

UI rule: never display a single point forecast. Showing "you will earn ₹28,400" and being wrong destroys trust permanently; showing "most likely ₹24k–₹31k" and being right builds it.

### F1.5 Shortfall early warning
Detect projected inability to meet a committed obligation, and alert with lead time and a specific remedy:
> *"Your bike EMI of ₹4,100 is due in 9 days. At your current pace you'll be about ₹2,300 short. Three options: move ₹2,300 from your buffer, add ~4 extra trips this week, or reschedule the sweep. Tap to choose."*

*Acceptance:* ≥72h median lead time; ≥60% precision at the alerting threshold (a false alarm is costly to trust — tune for precision over recall).

### F1.6 Cold start
A user with no history cannot be underwritten or swept safely. Behaviour for the first 4 weeks:
- conservative cohort-prior defaults for forecast and safe-to-save
- sweep percentages capped at half of steady-state
- credit limited to the smallest, shortest product only, or withheld
- explicit UI: *"I'm still learning your earnings — my estimates get sharper after a few weeks."*

---

# 7. Pillar 2 — SAVE: the adaptive savings engine

**Goal:** build a liquid buffer without the user having to make a monthly decision, and without ever taking money they cannot spare.

### F2.1 Safe-to-Save computation (runs daily, and on every income event)

```
Safe-to-Save = projected_inflow(next 14d, p20)
             − committed_outflow(next 14d)      # EMIs, rent, premiums, mandates
             − essential_burn(next 14d)
             − reserve_floor                     # user-set untouchable minimum
```

If the result is ≤ 0, **all sweeps pause automatically** — no bounce, no penalty, no notification shaming the user. When the result recovers, sweeps resume and optionally run a catch-up (opt-in, capped).

### F2.2 Sweep modes (multiple can be active; all user-configurable and pausable)

| Mode | Mechanic | Best for |
|---|---|---|
| **Payout slice** | Save X% of each income event (default 5%, range 1–20%) | Platform workers with frequent payouts |
| **Round-up** | Round each UPI spend to the next ₹10/₹50 and save the difference | Everyone; painless, high engagement |
| **Surge skim** | On a day earning >120% of personal median, save 25% of the excess | Volatile earners — saves in the good weeks, silent in the bad |
| **Manual / voice** | "Save 500" | Cash earners; preserves agency |
| **Scheduled** | Classic fixed-date debit | Offered but **not default**, and auto-suspended when Safe-to-Save ≤ 0 |

*Surge skim is the mechanically correct answer to income volatility:* it converts variance from a threat into the funding source for the buffer.

### F2.3 Goal buckets
Named, visually distinct sub-balances within one insured deposit account. Default ladder, presented in strict order:

1. **Buffer** (target: 30 × daily essential burn) — *always first; no other goal is offered until Buffer ≥ 7 days*
2. **Known lumpy obligations** (sinking funds — see F2.4)
3. **Aspirational** (vehicle, education, home, festival)
4. **Old age** (NPS-Lite / APY / long-horizon deposit) — introduced only after Buffer is complete

### F2.4 Sinking funds for lumpy obligations
The system detects annual/semi-annual obligations from history (vehicle insurance, health premium, school fees, license renewal, festival spend), computes the required daily accrual, and funds it continuously.

> *Imran's ₹14,000 March insurance bill becomes ₹38/day from April — invisible, and the premium can never lapse.*

This single feature converts the most common cause of emergency borrowing in this segment into a non-event.

### F2.5 Instant-out guarantee (trust contract)
Withdrawal to the linked account in **under 30 seconds**, at any hour, with **zero penalty and zero justification required**. One optional screen offers alternatives ("this is your buffer for a slow week — take ₹2,000 instead of ₹8,000?") but the primary button always completes the withdrawal.

*This feature is non-negotiable and must not be softened for retention metrics.* Every prior formal savings product for this segment has failed on exit friction.

### F2.6 Optional commitment devices
For users who *want* discipline, opt-in only:
- **Self-lock** until a chosen date or goal amount (with a documented emergency-break path).
- **Digital chit / savings circle**: a regulated, transparent rendering of the ROSCA mental model this segment already trusts — fixed contribution, transparent rotation, no counterparty bidding, full auditability. Leverages an existing trusted behaviour instead of asking users to learn a new one.
- **Streaks and pair commitments**, with an explicit rule that a broken streak caused by a *drought* never counts as a failure.

### F2.7 Savings mechanics requirements
- Every sweep is idempotent and double-entry ledgered; a failed debit never silently retries into an overdraft.
- Interest accrues from day one; buffer balances are held in an insured deposit.
- Variable-amount mandates (UPI Autopay style) used for sweeps, with per-transaction caps disclosed.
- Full sweep history is visible and reversible for 24 hours ("undo this save").

---

# 8. Pillar 3 — BORROW: responsible access to credit

**Goal:** make small, appropriate, correctly-shaped credit available to people the formal system cannot see — while making harm structurally difficult.

### F3.1 Product ladder

| # | Product | Size | Tenure | Repayment | Trigger |
|---|---|---|---|---|---|
| **L0** | **Overdraft buffer** | ₹500–2,000 | ≤7 days | Auto from next payout | Shortfall on an essential obligation |
| **L1** | **Income advance** | up to ~50% of verified expected next payout | ≤14 days | Single deduction at payout | User-initiated, gap-funding |
| **L2** | **Working-capital line** (fuel/charging/inventory) | ₹2,000–15,000 revolving | Revolving | % of each payout | Daily float need |
| **L3** | **Emergency loan** | ₹5,000–50,000 | 3–12 months | Income-linked instalment | Verified medical/repair/education event |
| **L4** | **Asset loan** (vehicle, EV upgrade, tools) | ₹50,000–3,00,000 | 12–48 months | Income-linked instalment | Aspirational, post-graduation |

Users graduate through the ladder on demonstrated behaviour. **Nobody starts at L3.**

### F3.2 Cash-flow underwriting

Decision inputs (all consented):
- **Income:** p20 of rolling 13-week net income; ISS; trend; source diversification; tenure
- **Obligations:** all detected EMIs/mandates across institutions (via AA), including obligations at other lenders
- **Resilience:** current buffer days; sinking-fund adequacy; volatility of the essential-expense floor
- **Behaviour:** sweep consistency; withdrawal-to-deposit ratio; repayment history on our own L0/L1 products
- **Bureau (if any):** used as a *positive* signal; its absence is never a rejection reason

**Affordability rule (hard constraint):**
```
total_obligations_after_new_credit  ≤  0.35 × p20_monthly_net_income − essential_burn_floor
```
Computed on the 20th percentile, never the mean. If the constraint binds, the offer is reduced or declined — the limit is not negotiable by sales or growth targets.

**Explainability:** decisions come from a monotonic, feature-attributable model (scorecard or GBM with SHAP), producing a plain-language adverse-action reason in the user's language for every decline. "Your application was declined" without a reason is prohibited.

### F3.3 Income-linked repayment (the core credit innovation)

Instead of a fixed EMI on a fixed date:

```
repayment_i = clamp(rate × payout_i, floor_i, ceiling_i)
```
- **rate**: 5–15% of each income event, set at origination from affordability
- **floor**: 0 on a zero-income day — a bad week costs nothing and is never a default
- **ceiling**: protects the user from over-collection in a surge week
- **hard maturity date**: total cost is capped and disclosed upfront; the loan cannot extend indefinitely
- **automatic grace**: N consecutive zero-income days pause collection without a fee and without a bureau ding

This makes the *lender* absorb timing risk, which is the risk the lender is far better equipped to hold — and eliminates the bounce-penalty spiral that is the primary destroyer of thin-file credit records.

### F3.4 Anti-harm rails (non-negotiable requirements)

| Rail | Requirement |
|---|---|
| **Rupee-first disclosure** | Total cost of credit in ₹, before APR, before signing — plus a voice readout in the user's language |
| **Comprehension gate** | User must answer "what will you repay in total?" correctly before disbursal of L3+ |
| **No rollover** | A loan cannot be refinanced by a new loan from us. Hard system block. |
| **No compounding penalties** | Late fees are flat, capped in aggregate at a fixed % of principal, and never capitalised |
| **Buffer-first prompt** | If the user has sufficient buffer, the UI must show "use your own ₹X instead and pay nothing" *above* the loan offer |
| **Cooling-off** | 24h cancellation with full refund of charges on L3/L4 |
| **Debt-trap detector** | Rising utilisation + falling buffer + new external obligations → triggers intervention and a credit freeze, not an upsell |
| **Collections ethics** | No contact-list access, no third-party contact, no shaming, no calls outside 09:00–18:00, documented hardship path, human escalation |
| **Distress lockout** | Credit offers are suppressed while an active shortfall alert is unacknowledged unless the savings alternative is shown alongside |

### F3.5 Credit-file building
With explicit, separately-obtained consent, repayment behaviour is reported to bureaus so users build a portable formal credit history — the mechanism by which a user eventually *leaves* us for a cheaper mainstream product. That is a success, and is tracked as one (§11, M-C5).

### F3.6 The refusal path
When the model determines that borrowing would worsen the user's position, the product does not silently decline. It presents the analysis:
> *"A ₹15,000 loan would take ₹1,900/month for 9 months. In your slower months that leaves about ₹700 after essentials. Instead: your buffer covers ₹6,000 of this today, and the repair shop offers a 3-month plan at no cost. Want me to walk through that?"*

This path is instrumented and reported as a positive outcome.

---

# 9. Pillar 4 — GUIDE: personalized financial guidance

**Goal:** deliver advice that is timely, specific to the user's own numbers, in their own language, and safe.

### F4.1 Vernacular voice-first assistant
- Full duplex voice in 8+ languages at launch (Hindi, Tamil, Telugu, Kannada, Marathi, Bengali, Gujarati, Malayalam) plus English; code-mixed input handled.
- Text as a secondary mode; every screen has a "explain this to me" voice button.
- Designed for zero text literacy: icon navigation, spoken balances, spoken confirmations.

### F4.2 Grounded-answer architecture (safety-critical)
The language model is an **explainer, not a calculator**.

- Every numeric claim is obtained by tool call to a deterministic service (`get_balance`, `get_forecast`, `get_safe_to_save`, `simulate_loan`, `get_obligations`, `check_eligibility`). The model may not perform arithmetic in-context.
- Responses cite the figure's source and as-of timestamp.
- **Hard refusals with hand-off:** investment/securities advice, tax filing advice, legal advice, and any instruction to move money without an explicit in-app confirmation step.
- **Human escalation** always one tap away; mandatory escalation on distress signals (mentions of harassment, self-harm, coercion, or a dispute).
- Adversarial-input handling: user-supplied text and merchant strings are data, never instructions.

*Acceptance:* 0 tolerance for fabricated figures — measured on a red-team suite of ≥500 numeric questions per release; any hallucinated number is a launch blocker.

### F4.3 Event-timed nudges
Nudges fire on **income and spend events**, not on schedules — the moment of highest relevance and highest available bandwidth.

| Trigger | Nudge |
|---|---|
| Payout ≥120% of median | "Strong day — ₹340 moved to your buffer. You're at 11 days." |
| 3rd bounce charge this quarter | "You've paid ₹960 in bounce charges since June. Switching your EMI to income-linked would have avoided all of it." |
| Buffer crosses 30 days | "You can now cover a full month without borrowing. This is the milestone." |
| Insurance premium due in 45 days, sinking fund short | "₹22/day for 45 days covers it. Start?" |
| Detected external high-cost loan | "This lender is charging you ~₹X/month. Here's what refinancing would look like." |

Nudge selection is governed by an uplift model with a **frequency cap** and a suppression list — a nudge that does not change behaviour is removed from the corpus, not repeated.

### F4.4 Scenario simulator
Plain-language what-ifs, answered from the user's own model:
*"What if I take a week off?" · "What if I switch to an EV?" · "Can I afford ₹3,000/month for school fees?" · "What happens if I skip this loan for 3 months?"*
Each returns a band, not a number, plus the specific action that closes the gap.

### F4.5 Micro-learning
60-second, contextual, consequence-anchored lessons — triggered by something that just happened to *this* user, never as a generic curriculum. Delivered as vertical short-form video/audio in the user's language.

### F4.6 Entitlement and benefits matcher
Automatically evaluate eligibility for state and central schemes (life and accident micro-insurance, pension schemes, health cover, gig-worker welfare boards, worker registration platforms), pre-fill applications from existing KYC, and assist enrolment end-to-end.

Rationale: an accident cover costing ~₹20/year is unclaimed by hundreds of millions of eligible workers. This is arguably the **highest resilience-per-rupee feature in the entire product**, and it costs the user almost nothing.

*Acceptance:* ≥1 eligible scheme surfaced for ≥80% of users; ≥30% completed enrolment within 60 days.

---

# 10. Pillar 5 — PROTECT: micro-insurance that cannot lapse

**Goal:** convert catastrophic shocks into manageable ones. A buffer handles a ₹8,000 shock; only insurance handles a ₹2,00,000 one.

- **Bundled cover:** subsidised government life and personal-accident schemes (enrolled via F4.6), plus optional hospital-cash, accident, and vehicle-downtime cover.
- **Premium funded by sinking fund** (F2.4) — this is the product. Micro-insurance in this segment fails at renewal, not at sale; continuous accrual solves renewal.
- **Downtime cover** — a daily benefit for days a worker cannot earn due to injury or vehicle failure. This is the single most under-served risk in gig work: the income *stop*, not the medical bill, is what triggers the debt spiral.
- **Claims assistance**, including document collection via the assistant and human-assisted filing. Claims friction, not premium, is why trust in insurance is low here.
- Lapse-risk monitoring with 30/15/7-day interventions.

---

# 11. Success metrics

## 11.1 North star
**% of active users with ≥30 buffer days** (liquid savings ÷ daily essential burn), plus **median buffer days** as the distributional companion.

Targets: 25% of 6-month-tenured users at ≥30 buffer days by end of year 1; median buffer days from ~2 at onboarding to ≥14 at month 6.

## 11.2 Outcome metrics

| ID | Metric | Target (12 mo) |
|---|---|---|
| M-R1 | Median buffer days at month 6 | ≥14 |
| M-R2 | % who absorbed an expense shock **without new debt** | ≥50% |
| M-R3 | Reduction in bounce/penalty charges vs. pre-onboarding baseline | −60% |
| M-R4 | Insurance lapse rate among enrolled users | <5% |
| M-R5 | % holding at least one active protection product | ≥70% |

| ID | Savings | Target |
|---|---|---|
| M-S1 | Sweep participation among activated users | ≥65% |
| M-S2 | Savings-habit survival at 90 days | ≥55% |
| M-S3 | Median monthly net savings | ≥6% of net income |
| M-S4 | Withdrawal-to-deposit ratio (watch, don't optimise) | <0.6 |
| M-S5 | Sweeps auto-paused during droughts (proves the safety valve works) | tracked, no target |

| ID | Credit | Target |
|---|---|---|
| M-C1 | Approval rate for thin-file applicants | ≥45% |
| M-C2 | 30+ DPD | <6% |
| M-C3 | Rollover rate | **0** (structurally enforced) |
| M-C4 | Median all-in cost of credit as % of borrower monthly income | <8% |
| M-C5 | % of borrowers graduating to a lower-priced product (ours or external) | ≥20% |
| M-C6 | **Loans avoided** — declined-by-user after being shown a cheaper alternative | ≥15% of eligible offers |

| ID | Guidance | Target |
|---|---|---|
| M-G1 | Assistant numeric-accuracy rate | 100% (blocker) |
| M-G2 | Action taken within 72h of a nudge | ≥25% |
| M-G3 | Vernacular-session share | ≥60% |
| M-G4 | Shortfall-alert precision | ≥60% |
| M-G5 | Entitlement enrolments completed | ≥30% of eligible |

## 11.3 Guardrail / counter-metrics (a launch is blocked if these regress)
- Complaint rate per 1,000 active users
- Over-indebtedness incidence: users with total obligations >40% of p20 income
- Distress withdrawals — buffer emptied within 48h of a loan disbursal (signals a mis-sold loan)
- Uninstall rate within 7 days of a shortfall alert (signals alerts that shame rather than help)
- Fairness: approval-rate and pricing dispersion across gender, region, language, and platform cohorts (see §13.2)
- Nudge fatigue: notification opt-out rate

**Explicitly *not* a target metric:** loan volume, disbursal growth, or interest income as a primary KPI. Those are outputs; optimising them directly inverts the product's purpose.

---

# 12. Technical design

## 12.1 System architecture

```
 SOURCES            INGEST                INTELLIGENCE              ACTION
 ─────────          ──────                ────────────              ──────
 AA / open bkg  ─┐                    ┌─ income classifier ─┐
 UPI / CBS feed ─┼─ connector svc ─┐  ├─ expense-floor est. │   ┌─ sweep orchestrator
 Platform APIs  ─┤   (normalise,   ├──┤─ quantile forecaster├───┤   (idempotent, ledgered)
 Voice cash log ─┘    dedupe)      │  ├─ ISS scorer         │   ├─ credit decision svc
                                   │  ├─ credit model (XAI) │   ├─ collection engine
                     event bus ────┘  ├─ uplift/nudge engine│   ├─ notification svc
                     (Kafka)          └─ eligibility engine ┘   └─ LLM assistant (tool-calling)
                          │
                    feature store ── model registry ── consent registry ── audit log
```

## 12.2 Key components

**Connector service.** Normalises heterogeneous inflow data into a canonical `IncomeEvent` / `OutflowEvent` schema. Handles AA consent lifecycle (grant, refresh, revoke, expiry), retries, and partial-data states. Must degrade gracefully: the product remains useful with bank data alone.

**Income classifier.** Gradient-boosted model over narration text embeddings + amount + periodicity + counterparty features. Human-in-the-loop correction from the user's "unclassified" queue feeds retraining.

**Forecaster.** Per-user quantile regression (pinball loss at τ = 0.1/0.5/0.9) with hierarchical shrinkage toward cohort priors for cold start. Features: rolling statistics, day-of-week, month-position, platform incentive-cycle indicators, weather/festival calendars, recent trend. Retrained weekly; drift-monitored.

**Credit decision service.** Monotonically-constrained GBM or a points-based scorecard, with SHAP attributions persisted per decision. Hard affordability constraint applied *after* the model as a non-overridable policy layer. Every decision is fully replayable: inputs, model version, policy version, output, reason codes.

**Sweep orchestrator.** Idempotency keys per income event; double-entry ledger; compensating transactions on failure; never initiates a debit that could overdraw. Variable-amount mandate management with per-transaction caps.

**Assistant layer.** Tool-calling orchestration over the deterministic services. System prompt forbids in-context arithmetic and unsourced figures; all user/merchant text is passed as delimited data. Response validation pass rejects any numeric token not returned by a tool call in the same turn.

## 12.3 Data model (core entities)
`User` · `ConsentGrant` · `Account` · `IncomeEvent` · `OutflowEvent` · `RecurringObligation` · `EssentialBurnProfile` · `Forecast(p10,p50,p90)` · `StabilityScore` · `Bucket` · `SweepRule` · `SweepTransaction` · `SinkingFund` · `CreditOffer` · `LoanAccount` · `RepaymentEvent` · `InsurancePolicy` · `Nudge` · `AssistantTurn` · `DecisionRecord`

## 12.4 Non-functional requirements

| Area | Requirement |
|---|---|
| Availability | 99.9% for balance/withdrawal paths; withdrawal must succeed even if intelligence services are down |
| Latency | Withdrawal ≤30s end-to-end; balance ≤500ms p95; assistant first token ≤1.5s |
| Footprint | App ≤25MB; functional on 2GB-RAM Android 8+; core screens work offline with last-known state |
| Network | Usable on 2G; all sync operations resumable; no operation loses data on connection drop |
| Localisation | 8+ languages, all financial disclosures and adverse-action reasons localised and voice-rendered |
| Security | Encryption at rest and in transit; tokenised account references; no raw statement data in logs; device binding |
| Auditability | Every automated money movement and credit decision reconstructible for 7 years |

## 12.5 Failure modes and mitigations

| Failure | Consequence | Mitigation |
|---|---|---|
| Forecast systematically over-optimistic | Over-sweeping → user runs short → trust destroyed | Sweep off **p20**, not p50; hard reserve floor; automatic pause; calibration monitoring (coverage of the p10–p90 band) |
| Income-gaming via self-transfers | Inflated limits, credit loss | Circular-flow detection, counterparty graph analysis, cash income held at low confidence, platform corroboration required above a limit threshold |
| Platform changes its pay structure | Model drift across an entire cohort at once | Cohort-level drift alarms; conservative fallback mode; ability to freeze automated limit increases |
| AA consent revoked mid-loan | Loss of monitoring | Graceful degradation, no punitive action, re-consent flow, contractual disclosure at origination |
| Assistant states a wrong number | Direct financial harm, regulatory exposure | Tool-call-only numerics + output validation + red-team suite as a release gate |
| Savings cannibalised by credit uptake | Product becomes a lending app with a savings skin | Buffer-first ordering, M-C6 as a tracked KPI, lending volume explicitly excluded from primary KPIs |
| Collection pressure creeps in under portfolio stress | Segment-defining reputational harm | Collections policy encoded in system rules, not in agent discretion; independent audit |

---

# 13. Trust, ethics, and inclusion

## 13.1 Consent and data
- **Purpose-limited, granular, revocable.** Consent is requested per purpose (savings intelligence / credit assessment / bureau reporting), never as one bundled acceptance. Each is independently revocable, and revocation of an optional purpose never degrades a core feature.
- **Vernacular consent, explained by voice**, with a plain-language summary of exactly what is read and for how long.
- **Data minimisation and retention limits**; derived features preferred over raw statement retention where possible.
- **No device-permission overreach.** No contacts, no SMS scraping, no location beyond what a specific feature requires and the user grants for that feature.
- **Portability.** The user can export their full income and repayment record at any time, in a machine-readable format, including for use with a competitor.

## 13.2 Fairness and model governance
- Pre-deployment and quarterly **disparity audits** on approval rate, limit, and price across gender, region, language, urban/rural, and platform cohorts, with documented thresholds and remediation.
- **Proxy screening** — features audited for correlation with protected characteristics; any feature that acts as a proxy without independent predictive justification is removed.
- **Reject inference** to prevent the model from ossifying around whoever it happened to approve first.
- **Adverse-action reasons** in plain language for every decline, in the user's language.
- **Model registry and challenger monitoring**; no model reaches production without a documented fairness review and a rollback plan.

## 13.3 Product ethics — prohibited by specification
No gamified borrowing. No pre-ticked consents. No urgency or scarcity framing on credit offers. No shame-based nudges. No dark-pattern withdrawal friction. No contact-list access. No collection harassment. No selling of user financial data. These are written as system constraints and test cases, not as guidelines.

## 13.4 Inclusion
Low-end device support · offline-first core · 2G tolerance · voice-first for low literacy · icon-led IA · assisted onboarding through field agents and partner platforms · gender-aware design (accounts, devices, and phones are often shared; the app must be usable and private on a shared device).

## 13.5 Regulatory posture
Built to comply with the applicable digital-lending framework (direct lender–borrower money flow, no pass-through pools, full key-fact-statement disclosure, cooling-off, grievance redressal, loss-guarantee limits), account-aggregator rules, data-protection law (consent, purpose limitation, breach notification, data-principal rights), KYC/AML obligations, and insurance-distribution licensing. Regulatory review is a gate before each pillar's launch, not a post-hoc check.

---

# 14. Scope and roadmap

## Phase 0 — Prototype / hackathon demo (2–3 weeks)
Prove the thesis end-to-end on one narrow path.
- Simulated or sandbox AA + platform data for 3 seeded personas
- Income classification, essential-burn detection, p10/p50/p90 forecast
- Safe-to-Save calculation + surge-skim sweep + buffer bucket with instant withdrawal
- Shortfall alert with three remedies
- Vernacular voice assistant answering 10 grounded questions via tool calls
- One credit decision demonstrating income-linked repayment **and** one demonstrating the refusal path
*Demo narrative: Ravi's bad week — where the old product bounces and this one pauses, warns, and covers.*

## Phase 1 — MVP (≈12 weeks)
- Live AA + UPI ingestion, one platform connector, voice cash logging
- Full SEE pillar with cold-start behaviour
- SAVE: payout slice, round-up, surge skim, Buffer bucket, instant-out, one sinking fund type
- GUIDE: assistant (3 languages), event-timed nudges, entitlement matcher
- PROTECT: enrolment into subsidised life + accident cover, sinking-fund-funded
- BORROW: **L0/L1 only** (overdraft and income advance), tight limits, manual review sampling
*Exit criteria: M-S1 ≥50%, M-G1 = 100%, zero rollover incidents, complaint rate below threshold.*

## Phase 2 — V1 (months 4–9)
- L2 working-capital line and L3 emergency loan with full income-linked repayment
- Digital chit / savings circle
- 8 languages; scenario simulator; micro-learning
- Bureau reporting with separate consent; downtime insurance
- Fairness audit published

## Phase 3 — V2 (months 10–18)
- L4 asset loans; multi-platform connector coverage; household/joint buffers
- Old-age and pension goals; portable income-record export standard
- Partner distribution via platforms, cooperatives, and welfare boards
- Employer/platform-side APIs so platforms can offer the product to their workers

## Explicitly out of scope (v1)
Equity/mutual-fund investing · trading · crypto · cards · business lending above ₹5L · international remittance · tax filing.

---

# 15. Open questions and dependencies

**Open questions**
1. **Cash income verification** — how much unverified cash income may enter an underwriting decision, and at what confidence discount? Proposal: cap at 25% of assessed income, corroborated by spending-pattern consistency.
2. **Platform partnerships vs. AA-only** — direct connectors give far richer data (gross/incentive/penalty splits) but create dependency and possible conflict of interest. Recommendation: build AA-first so the product works without any platform's permission; treat connectors as enrichment.
3. **Balance-sheet vs. partner lending** for L3/L4, and the resulting risk-sharing and pricing constraints.
4. **Sinking-fund legal status** — earmarked sub-balances within one deposit account, or separate instruments? Affects insurance coverage and attachability.
5. **Income-linked repayment classification** — how variable instalments map to existing DPD and asset-classification norms needs a regulatory read early; getting this wrong makes the flagship credit feature unshippable.
6. **Digital chit** — regulated chit-fund structure vs. a goal-based savings circle with no rotation of others' money? The latter is far simpler to launch.
7. **Unit economics** — what interchange, float, insurance commission, and credit margin mix sustains a customer whose average balance is ₹4,000?

**Dependencies**
AA ecosystem coverage and reliability · banking partner for deposit and lending licences · insurance partner · bureau membership · ASR/TTS quality for low-resource languages and code-mixed speech · platform API access · field distribution partners.

---

# 16. Appendix — worked example

**Ravi's bad week, with and without Dhara.**

| Day | Event | Without | With Dhara |
|---|---|---|---|
| Mon | Rain, ₹410 earned (median ₹1,150) | — | Sweep auto-paused. Safe-to-Save = ₹0. |
| Tue | ₹520 earned | — | Still paused. Shortfall model flags EMI risk 9 days out. |
| Wed | — | — | Alert: *"EMI ₹4,100 due 5th. You'll likely be ₹2,300 short. Buffer has ₹3,600 — cover it? Or add ~4 trips?"* Ravi taps **cover from buffer**. |
| Thu–Sun | Weather clears, ₹1,480/day | Spends it | Surge skim saves 25% of the excess: ₹330 back into buffer. |
| 5th | EMI debit | **Bounces. ₹590 penalty. Bureau flag. Mandate disabled by user in frustration.** | Clears. Buffer at ₹1,600, rebuilding. Zero fees. |
| +30d | | Habit dead, ₹590 poorer, credit file damaged | 11 buffer days, ₹0 borrowed, insurance premium accruing at ₹38/day |

The difference is not a better interest rate. It is a mechanic that bends with the income instead of breaking against it — and that is the whole product.

---

*End of document.*
