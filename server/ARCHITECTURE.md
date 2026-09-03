# System Architecture
## Project **Dhara** — Financial Resilience Infrastructure for Gig & Informal Workers

| | |
|---|---|
| **Document status** | Draft v1.0 — for engineering review |
| **Date** | 3 September 2026 |
| **Companion documents** | [`PRD.md`](./PRD.md), [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) |
| **Audience** | Backend, ML, mobile, platform, security, and compliance engineering |

> **Scope note.** This document describes the **target production architecture**. The 24-hour
> hackathon build is a deliberate vertical slice through it — a single FastAPI process with a real
> double-entry ledger, a real Safe-to-Save and sweep engine, a real quantile forecaster, a real
> policy engine, and a real assistant numeric validator, with the bank rails, Account Aggregator,
> and event bus simulated. `IMPLEMENTATION_PLAN.md` §1 is the authoritative build/fake/cut table;
> read this document for where each piece is *going*, and that one for what exists on demo day.

---

# 1. Architectural drivers

The PRD imposes a small number of constraints that dominate every structural decision. Everything below is downstream of these.

| # | Driver (from PRD) | Architectural consequence |
|---|---|---|
| **D1** | *"Withdrawal in under 30 seconds, no penalty, no questions"* (PRD §7 F2.5) — the trust contract | The withdrawal path must have **zero dependency** on the intelligence layer, the assistant, or any ML service. It is a separate deployment unit with its own availability budget. |
| **D2** | Sweeps must never overdraw or bounce (PRD §7 F2.1, §2.2 C7) | Money movement is **double-entry, append-only, and idempotent**. No debit is initiated without a prior successful balance reservation. Sagas with compensating entries, never distributed 2PC. |
| **D3** | Every credit decision replayable for 7 years (PRD §12.4) | Decisions are **immutable records** capturing inputs, feature vector, model version, policy version, attributions, and output. Feature computation must be reproducible — offline/online parity is mandatory, not aspirational. |
| **D4** | Assistant must never fabricate a figure (PRD §9 F4.2) | Numerics come **only** from deterministic tool calls, and a post-generation validator rejects any numeric token not present in that turn's tool results. The model is architecturally denied a calculator. |
| **D5** | Underwrite on p20, forecast as a band (PRD §4 P2, §6 F1.4) | The forecasting service returns **distributions**, not scalars. Quantiles are first-class in the data model; no API anywhere returns a bare "expected income". |
| **D6** | Consent is granular, purpose-limited, revocable (PRD §13.1) | A **Consent Registry** sits in the data path, not beside it. Every read of user financial data is authorised against an active grant for a declared purpose, and the check is enforced at the data-access layer. |
| **D7** | ≤25MB app, 2G-tolerant, offline-capable (PRD §12.4) | Thin client, server-computed state, aggressive payload minimisation, offline queue with resumable sync. Rules out heavyweight cross-platform runtimes. |
| **D8** | Policy limits not overridable by growth targets (PRD §8 F3.2) | The **affordability policy layer is a separate, independently-deployed component downstream of the model**, with its own change-control and audit trail. A model retrain cannot loosen a limit. |
| **D9** | AA-first; product works without any platform's permission (PRD §15) | Connectors are pluggable enrichment behind a canonical schema. Loss of any single source degrades quality, never function. |

---

# 2. System context

```
                          ┌─────────────────────────────────────┐
   Worker (Android,       │                                     │
   voice-first, 2G)  ────▶│           DHARA PLATFORM            │
                          │                                     │
   Field agent /          │  ┌───────────────────────────────┐  │
   partner CSP       ────▶│  │  Edge: BFF + Auth + Consent   │  │
                          │  ├───────────────────────────────┤  │
   Ops / Risk /           │  │  Money plane  │ Intelligence  │  │
   Collections       ────▶│  │  (tier-0)     │ plane (tier-1)│  │
                          │  └───────────────────────────────┘  │
                          └──────┬──────────────────────┬───────┘
                                 │                      │
        ┌────────────────────────┼──────────┬───────────┼──────────────┐
        ▼                        ▼          ▼           ▼              ▼
  Account Aggregator      Partner bank   Gig platform  Credit       Insurer
  (consent + FI data)     CBS / UPI /    APIs          bureau       (micro-
                          mandates /                                 insurance)
                          payouts
```

**Trust boundaries.** Three: (a) device ↔ edge, (b) Dhara ↔ regulated financial partners, (c) money plane ↔ intelligence plane. The third is internal but treated as a hard boundary: the intelligence plane may *read* money-plane state and *propose* actions; it can never write to the ledger directly.

---

# 3. Layered architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│ L5  CLIENTS      Android (Kotlin/Compose) · Ops console · Agent-assist    │
│                  console · Partner/platform API                          │
├──────────────────────────────────────────────────────────────────────────┤
│ L4  EDGE         BFF (payload shaping, i18n) · AuthN/AuthZ · Rate limit  │
│                  Consent enforcement middleware · Idempotency gateway    │
├──────────────────────────────────────────────────────────────────────────┤
│ L3  EXPERIENCE   Assistant orchestrator · Nudge engine · Journey/onboard │
│     SERVICES     Entitlement matcher · Notification service              │
├──────────────────────────────────────────────────────────────────────────┤
│ L2  INTELLIGENCE Income classifier · Expense-floor estimator ·           │
│     PLANE        Quantile forecaster · ISS scorer · Credit model ·       │
│     (tier-1)     Uplift model · Feature store · Model registry           │
├──────────────────────────────────────────────────────────────────────────┤
│ L1  MONEY PLANE  Ledger · Sweep orchestrator · Withdrawal service ·      │
│     (tier-0)     Mandate manager · Loan servicing · Collection engine ·  │
│                  Policy engine · Payment gateway adapters               │
├──────────────────────────────────────────────────────────────────────────┤
│ L0  DATA PLANE   Connector service (AA/UPI/platform/voice-cash) ·        │
│                  Canonicalisation · Dedupe · Event bus · Lake/warehouse  │
├──────────────────────────────────────────────────────────────────────────┤
│ CROSS-CUTTING    Consent registry · Audit log · PII vault · Secrets/KMS ·│
│                  Observability · Feature flags · Config & policy store   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Tiering discipline.** L1 is **tier-0**: 99.95% target, no dependency on L2/L3, deployed and scaled independently, and able to run in a degraded "money-only" mode indefinitely. L2 is **tier-1**: 99.5%, and every consumer must have a defined behaviour when it is unavailable (§9.3). This split is the direct expression of driver D1.

---

# 4. Service catalogue

## 4.1 L0 — Data plane

### `connector-service`
Owns all external financial-data ingestion. One adapter per source behind a common interface.

| Adapter | Mode | Notes |
|---|---|---|
| `aa-adapter` | Pull, consent-scoped | Consent lifecycle (grant/refresh/revoke/expiry), FI-data fetch, session retries, partial-fetch handling |
| `upi-cbs-adapter` | Push (webhook) + reconcile pull | Near-real-time credits/debits on the primary account |
| `platform-adapter-*` | Pull, user-authorised | Per-platform; yields gross / incentive / penalty / commission decomposition |
| `cash-log-adapter` | Push from device | Voice or manual entry; `confidence=LOW`, `verified=false` |

**Canonicalisation.** Every adapter emits into one schema:

```jsonc
// IncomeEvent (canonical)
{
  "event_id":      "ie_01J8X...",          // ULID
  "user_id":       "usr_...",
  "source":        "PLATFORM|BANK|CASH",
  "source_ref":    "swiggy:payout:88213",  // natural key from origin
  "amount_minor":  128400,                  // paise; integers only, never float
  "currency":      "INR",
  "occurred_at":   "2026-09-01T14:22:11Z",
  "observed_at":   "2026-09-01T14:22:49Z",
  "counterparty":  { "id": "cp_...", "raw": "SWIGGY PAYOUT", "type": "PLATFORM" },
  "classification":{ "label": "PLATFORM_EARNINGS", "confidence": 0.97,
                     "model_version": "inc-clf@3.2.1" },
  "gross_minor":   152000, "deductions_minor": 23600,   // when decomposable
  "consent_ref":   "cns_...",
  "dedupe_key":    "sha256(user|amount|date|normalised_counterparty)"
}
```

**Deduplication** (PRD §6 F1.1) is a two-stage process: exact match on `dedupe_key`, then a fuzzy pass that links a platform payout to its corresponding bank credit within a ±72h window and ±0 amount tolerance, marking one as `shadow_of` the other. Shadowed events are retained (for the gross/net decomposition they carry) but excluded from income aggregation. Getting this wrong double-counts income and inflates credit limits — it is covered by property-based tests, not example tests.

**Idempotency.** Ingestion is idempotent on `(user_id, dedupe_key)`. Replaying a full AA fetch must be a no-op.

### `event-bus`
Kafka. Topics are the spine of the system.

| Topic | Key | Producers | Primary consumers |
|---|---|---|---|
| `income.events.v1` | `user_id` | connector-service | sweep-orchestrator, feature-pipeline, nudge-engine, loan-servicing |
| `outflow.events.v1` | `user_id` | connector-service | expense-floor estimator, feature-pipeline |
| `ledger.postings.v1` | `account_id` | ledger | reporting, reconciliation, feature-pipeline |
| `credit.decisions.v1` | `user_id` | decision-service | audit, analytics, ops console |
| `consent.changes.v1` | `user_id` | consent-registry | **all** data consumers (revocation fan-out) |
| `user.state.v1` | `user_id` | multiple | assistant context cache, nudge engine |

Ordering is per-`user_id` partition, which is the only ordering guarantee the domain actually needs. Consumers are idempotent; at-least-once delivery is assumed everywhere.

## 4.2 L1 — Money plane (tier-0)

### `ledger-service` — the system of record
Append-only, double-entry, integer minor units. **No service anywhere else in the system computes a balance.**

```
accounts
  account_id · user_id · type(USER_BUCKET|USER_SETTLEMENT|LOAN_PRINCIPAL|
       LOAN_INTEREST|FEE_INCOME|SINKING_FUND|SUSPENSE|EXTERNAL) · currency · status

transactions                       -- one business event
  txn_id · type · idempotency_key(UNIQUE) · status · created_at · metadata

postings                           -- >=2 rows per txn, must sum to zero
  posting_id · txn_id · account_id · direction(DR|CR) · amount_minor · created_at

balances                           -- materialised projection, rebuildable from postings
  account_id · available_minor · reserved_minor · version · updated_at
```

**Invariants, enforced in the database, not in application code:**
1. `SUM(DR) = SUM(CR)` per `txn_id` — deferred constraint checked at commit.
2. `available_minor >= 0` for every user-facing account — a CHECK constraint. An overdraw is a failed transaction, never a negative balance. This is D2 made physical.
3. `idempotency_key` is unique — a retried sweep cannot double-debit.
4. Postings are immutable. Corrections are **reversal entries**, never updates or deletes.

**Buckets** (PRD §7 F2.3) are ledger sub-accounts under a single insured deposit account, not separate deposits. Bucket balances are internal allocations; the partner-bank-side balance is the sum. This keeps deposit insurance and regulatory treatment simple while giving users the mental-accounting benefit.

**Reservations.** A two-phase pattern used by every outbound flow: `reserve(amount)` moves value from `available` to `reserved`; the external call is then made; `commit` or `release` follows. A crash between phases leaves a reserved amount that a reaper releases after TTL. This is what makes "never initiate a debit that could overdraw" (PRD §12.2) true rather than hoped-for.

### `withdrawal-service` (D1 — the trust contract)
Deliberately the simplest service in the system. Reads a bucket balance, reserves, calls the payout rail, commits. Dependencies: ledger + payment adapter + auth. **Nothing else.**

- Deployed independently; can be released without releasing anything else.
- Circuit-broken from every optional call. The "are you sure?" alternatives screen (PRD F2.5) is rendered from **cached** context; if that cache is cold, the screen is skipped and the withdrawal proceeds. Friction is never allowed to arise from a service outage.
- Target: p95 ≤ 8s, p99 ≤ 30s end-to-end including rail settlement; hard SLO with paging.

### `sweep-orchestrator`
Consumes `income.events.v1`. For each event, evaluates active `SweepRule`s and executes a saga.

```
 income.event ──▶ [1] load rules + Safe-to-Save (cached, ≤15min old)
                  [2] compute sweep amount  (0 if S2S<=0 → PAUSE, emit reason)
                  [3] ledger.reserve(settlement → bucket)      ◀── idempotency_key
                  [4] external debit via mandate (if funds not already internal)
                  [5] ledger.commit  |  on failure ledger.release + retry policy
                  [6] emit sweep.completed / sweep.paused (+ reason code)
```

Reason codes on pause are user-visible and never punitive (`DROUGHT`, `UPCOMING_OBLIGATION`, `RESERVE_FLOOR`, `USER_PAUSED`). A pause is a normal outcome, logged as such — PRD metric M-S5 depends on this being emitted faithfully.

**Degraded mode:** if the Safe-to-Save service (L2) is unavailable, the orchestrator uses the last cached value if <24h old; otherwise it **skips the sweep**. Fail-safe direction is always "don't take the user's money."

### `policy-engine` (D8)
A separately-deployed, version-controlled rules component that sits **downstream** of every ML output. Encodes the hard constraints from PRD §8:

```
affordability:   total_obligations ≤ 0.35 × p20_monthly_net − essential_burn_floor
ladder:          max_product_level = f(tenure, repayment_history, buffer_days)
rollover:        BLOCK if new_loan.purpose resolves to settling an existing Dhara loan
distress:        BLOCK offers while unacknowledged shortfall alert AND no alternative shown
cooling_off:     L3/L4 require 24h cancellation window
penalties:       flat, aggregate-capped, never capitalised
```

Rules are declarative (DSL/decision tables), versioned, and require a two-person + compliance approval to change. The credit model can only ever *narrow* an outcome relative to policy; it can never widen one.

### `loan-servicing` + `collection-engine`
Implements income-linked repayment (PRD §8 F3.3):

```
repayment_i = clamp(rate × payout_i, floor_i, ceiling_i)
```
- Subscribes to `income.events.v1`; collects on the event, not on a date.
- `floor = 0` on zero-income days; N consecutive zero days → automatic grace, **no fee, no DPD accrual, no bureau report**.
- A hard maturity date with a disclosed total-cost cap; a schedule projector recomputes expected completion after each payment and surfaces it to the user.
- **DPD semantics for variable instalments** is an open regulatory question (PRD §15 Q5). The service therefore tracks *two* parallel clocks — `contractual_dpd` and `expected_progress_variance` — so that whichever definition the regulator settles on can be adopted without re-architecting.
- Collection actions are executed from an encoded policy table (allowed hours, channel, cadence, hardship path), not from agent discretion (PRD §13.3). Every attempt is logged and auditable.

### `mandate-manager`
Variable-amount mandate lifecycle (create, amend, pause, revoke), per-transaction caps, pre-debit notification, and mandate-health monitoring. Suspends any scheduled mandate automatically when Safe-to-Save ≤ 0 (PRD §7 F2.2).

## 4.3 L2 — Intelligence plane (tier-1)

### `feature-store`
Offline (warehouse) and online (Redis) with **shared transformation code** — one Python library used by both the batch pipeline and the online path, with a parity test that recomputes a sample of online features offline and fails CI on divergence. This is the mechanism that makes D3 (replayability) real; without it, "reproduce the decision" is fiction.

Feature groups: `income_stats_13w`, `income_quantiles`, `expense_floor`, `obligation_book`, `buffer_state`, `savings_behaviour`, `platform_tenure`, `repayment_history`.
All features are **point-in-time correct** — computed with an as-of timestamp so training never sees the future. Leakage here silently inflates model performance and then loses money in production.

### `income-classifier`
Gradient-boosted model over narration-text embeddings + amount + periodicity + counterparty-graph features. Emits a label and a calibrated confidence. Low-confidence events enter the user-visible "unclassified" queue; corrections are logged as labels and feed a weekly retrain (PRD §6 F1.1).

**Anti-gaming (PRD §12.5).** A counterparty graph detects circular flows: value leaving user A and returning within a window, self-transfers across the user's own accounts, and reciprocal-pair patterns across accounts. Detected circular value is excluded from income. Cash income is capped at 25% of assessed income for underwriting purposes (PRD §15 Q1) and requires spending-pattern corroboration above a threshold.

### `expense-floor-estimator`
Periodicity detection (FFT/autocorrelation over counterparty-amount series) plus a merchant-category classifier to identify recurring non-negotiable outflows. Produces `EssentialMonthlyBurn` with a per-line confidence and a user confirm/edit surface. EMB is the denominator of the north-star metric, so its accuracy is monitored as a product KPI, not just a model metric.

### `forecast-service` (D5)
Per-user quantile regression at τ ∈ {0.1, 0.2, 0.5, 0.9}, pinball loss, with hierarchical shrinkage toward cohort priors for cold start (PRD §6 F1.6).

- τ=0.2 is materially important: it is the p20 that underwrites everything (PRD §4 P2).
- Features: rolling stats, day-of-week, month-position, platform incentive-cycle indicators, festival/weather calendars, trend.
- **Calibration monitoring is the primary health metric** — empirical coverage of the p10–p90 band should sit at 80%; sustained deviation triggers an alarm and a conservative fallback. Accuracy of the median matters far less than honesty of the interval.
- API returns a distribution object. There is deliberately no endpoint that returns a scalar expected income; D5 is enforced by the absence of the affordance.

### `credit-model` + `decision-service`
Monotonically-constrained GBM (or a points scorecard for the first cohort, where interpretability outweighs lift). Monotonic constraints matter: more buffer days must never reduce a limit. SHAP attributions are persisted per decision and mapped to a fixed catalogue of plain-language reason codes, localised (PRD §8 F3.2).

```
DecisionRecord  (immutable, 7-year retention, D3)
  decision_id · user_id · requested_at · product_level
  feature_vector_hash + full snapshot · feature_store_version
  model_id + version · model_output(score, pd, suggested_limit)
  policy_version · policy_evaluations[] (rule → pass/fail → binding_constraint)
  final_outcome(APPROVE|REDUCE|DECLINE|REFER) · reason_codes[] · limit · price
  alternative_offered (buffer_use | external_plan | none)     ← PRD §8 F3.6
```

`alternative_offered` and the user's response to it are what make metric M-C6 ("loans avoided") measurable. If the schema does not carry it, the product's differentiating metric cannot be reported — so it is mandatory, not optional.

### `nudge-engine`
Uplift/causal model selecting from a versioned nudge corpus, with frequency caps, a suppression list, and holdout groups. A nudge with no measured uplift after its evaluation window is **retired automatically** (PRD §9 F4.3). Every nudge send is logged with its arm assignment so effects are estimable rather than assumed.

## 4.4 L3 — Experience services

### `assistant-orchestrator` (D4 — safety-critical)

```
user utterance (voice)
   │
   ├─▶ ASR (vernacular, code-mixed)
   ├─▶ intent + safety classifier ──▶ [refusal/escalation paths: investment, tax,
   │                                   legal advice; distress → human handoff]
   ├─▶ LLM planning turn ─────────▶ TOOL CALLS ONLY for facts:
   │                                 get_balance · get_buffer_days · get_forecast
   │                                 get_safe_to_save · get_obligations
   │                                 simulate_loan · check_eligibility
   │                                 get_transaction_history
   ├─▶ LLM composition turn (explains tool results, no arithmetic permitted)
   │
   ├─▶ ◆ NUMERIC VALIDATOR ◆  extract every numeric token from the draft;
   │      assert each is present in this turn's tool results (exact match, or a
   │      whitelisted format transform: minor→major units, rounding, %, date fmt).
   │      Any unmatched numeral ⇒ BLOCK, log, regenerate once, then fall back to a
   │      templated deterministic response.
   │
   └─▶ TTS (vernacular) + on-screen figures rendered from tool results directly
```

Three properties make this robust rather than aspirational:
1. **No arithmetic in-context.** The system prompt forbids it and the validator catches it. Any derived quantity must have its own tool.
2. **Untrusted text is data.** Merchant narrations, user free text, and platform strings are passed inside delimiters with an explicit instruction that they are never instructions (prompt-injection defence — a real risk when the model reads merchant-controlled narration fields).
3. **Money moves only through confirmed intents.** The assistant may *prepare* an action; execution requires an explicit in-app confirmation that carries its own idempotency key. The model never holds a credential capable of moving money.

The validator's block rate is a released metric. PRD M-G1 (100% numeric accuracy) is gated on a ≥500-question red-team suite per release.

### `entitlement-matcher`
Rules-based eligibility evaluation over a versioned scheme catalogue (subsidised life/accident cover, pension schemes, health cover, welfare boards), pre-fill from existing KYC, and enrolment orchestration. Catalogue is data, not code — schemes change by state and by year, and must be updatable without a deploy.

## 4.5 Cross-cutting

### `consent-registry` (D6)
Not a table in a service — a service in the data path.

- Grants are per-`(user, purpose, data_scope, expiry)`. Purposes are separate and independently revocable: `SAVINGS_INTELLIGENCE`, `CREDIT_ASSESSMENT`, `BUREAU_REPORTING`, `INSURANCE_DISTRIBUTION`.
- A **consent-enforcement library** wraps every financial-data read. Reads carry a purpose; the library resolves an active grant or throws. There is no unmediated path to user financial data.
- Revocation publishes to `consent.changes.v1`; consumers must purge derived caches within 15 minutes and are compliance-tested on it. Revoking `CREDIT_ASSESSMENT` mid-loan degrades monitoring but triggers **no punitive action** (PRD §12.5).
- Retention: raw statement data has a TTL; derived features are preferred over raw retention (PRD §13.1).

### `pii-vault` and data protection
Tokenised account references throughout; raw PANs/account numbers only inside the vault, accessed by token with a purpose and audited. Statement data never enters application logs — enforced by a log scrubber and a CI check on log statements. Envelope encryption with KMS/HSM-held keys; per-tenant data keys.

### `audit-log`
Append-only, hash-chained, WORM-stored. Every money movement, every credit decision, every consent change, every collection contact, every admin override. Retention 7 years (D3). Queryable by the ops console and exportable for regulatory inspection.

---

# 5. Key flows

## 5.1 Income event → adaptive sweep (the core loop)

```
Platform/bank                connector          Kafka         sweep-orch        ledger
     │  payout ₹1,284           │                 │                │              │
     ├─────────────────────────▶│                 │                │              │
     │                          │ canonicalise    │                │              │
     │                          │ dedupe(key)     │                │              │
     │                          │ classify ──────▶│ income.events  │              │
     │                          │                 ├───────────────▶│              │
     │                          │                 │        load SweepRules        │
     │                          │                 │        S2S = p20(14d) −       │
     │                          │                 │              committed −      │
     │                          │                 │              burn − reserve   │
     │                          │                 │                │              │
     │                          │        S2S ≤ 0 ─┼── PAUSE(DROUGHT) ────────────▶ (no debit)
     │                          │                 │                │              │
     │                          │        S2S > 0 ─┼── amount = min(rules, S2S)    │
     │                          │                 ├── reserve ────▶│ available−   │
     │                          │                 │                │ reserved+    │
     │                          │                 ├── external debit (mandate)    │
     │                          │                 ├── commit ─────▶│ bucket CR    │
     │                          │                 │                │ (DR=CR ✓)    │
     │                          │                 ├── sweep.completed → nudge     │
```

Failure at the external-debit step releases the reservation and applies a bounded retry with jitter; after exhaustion the sweep is abandoned (never queued indefinitely) and surfaced as a skipped sweep. The user's money is never in an indeterminate state for more than the reservation TTL.

## 5.2 Credit request → decision (with the refusal path)

```
 request
   │
   ├─▶ consent check (CREDIT_ASSESSMENT) ──── absent ──▶ consent flow
   ├─▶ feature-store: point-in-time snapshot (as_of = now)
   ├─▶ cold-start gate: tenure < 4w ⇒ L0/L1 only or withhold (PRD §6 F1.6)
   ├─▶ credit-model ⇒ score, PD, suggested_limit, SHAP
   ├─▶ ◆ POLICY ENGINE ◆  (may only narrow)
   │        affordability(p20) · ladder · rollover-block · distress-lockout
   │
   ├─▶ ALTERNATIVE EVALUATION  ← runs BEFORE the offer is rendered
   │        buffer_days ≥ need?  external no-cost plan available?
   │        if yes ⇒ surface alternative ABOVE the offer (PRD §8 F3.4)
   │
   ├─▶ persist DecisionRecord (immutable) → credit.decisions.v1 → audit
   └─▶ render: rupee-first total cost + voice readout + comprehension gate (L3+)
```

## 5.3 Shortfall detection → alert → remedy

Scheduled evaluation (and re-evaluation on each income/obligation change): compare `p20 projected inflow` against `committed outflows` over the horizon. On a projected gap, emit an alert **with three concrete remedies** (buffer transfer / earnings target / sweep reschedule), each a one-tap action bound to a prepared, idempotent command. Alert precision is tuned over recall (PRD §6 F1.5) — a false alarm costs trust, which is the scarcest resource in this segment.

---

# 6. Data architecture

## 6.1 Storage choices

| Store | Technology | Holds | Rationale |
|---|---|---|---|
| Ledger | PostgreSQL, `SERIALIZABLE` on write paths | accounts, transactions, postings, balances | Correctness over throughput; constraints enforce invariants; volumes are modest (~10⁷ postings/day at 1M users) |
| Operational | PostgreSQL | users, rules, loans, policies, consents | Boring and transactional |
| Event log | Kafka (7–30d retention) + object-store archive | all domain events | Replay for rebuild and backfill |
| Online features | Redis | serving features, cached S2S, assistant context | ms-latency reads |
| Warehouse / lake | Columnar warehouse + object store (Parquet) | history, training data, analytics | Point-in-time feature computation, backtesting |
| Vault | Dedicated encrypted store | PANs, account numbers, KYC docs | Blast-radius isolation |
| Audit | Append-only + WORM object store | audit chain | Regulatory retention |

**Money is always integer minor units.** No floating point touches an amount anywhere in the system, in any language, at any layer. This is a lint rule and a code-review gate.

## 6.2 Core entities

```
User ─┬─ ConsentGrant*
      ├─ Account* ─── IncomeEvent* / OutflowEvent*
      ├─ RecurringObligation*  ── EssentialBurnProfile
      ├─ Forecast{p10,p20,p50,p90} · StabilityScore
      ├─ Bucket* ─┬─ SweepRule*  ─── SweepTransaction*
      │           └─ SinkingFund*  (target, due_date, daily_accrual)
      ├─ CreditOffer* ─ DecisionRecord ─ LoanAccount ─ RepaymentEvent*
      ├─ InsurancePolicy*  (premium funded by SinkingFund)
      ├─ Nudge* (arm, sent_at, outcome)
      └─ AssistantTurn* (tools_called, validator_result)
```

## 6.3 Reproducibility

Every derived artefact carries the version of what produced it: `model_version`, `policy_version`, `feature_store_version`, `rule_version`, `scheme_catalogue_version`. Combined with point-in-time features and the immutable event log, any decision from any date is reconstructible — which is D3, and also the only credible answer when a regulator asks why a specific user was declined 14 months ago.

---

# 7. ML platform

```
 raw events ─▶ point-in-time feature pipeline ─▶ offline store ─▶ training
                        │ (shared transform lib)                     │
                        ▼                                            ▼
                  online store ◀── parity test (CI gate)      model registry
                        │                                    (version, lineage,
                        ▼                                     fairness report,
                  serving (low latency)                        rollback plan)
                        │
                        └─▶ shadow / champion-challenger ─▶ staged rollout ─▶ monitor
```

**Deployment gates.** No model reaches production without: backtest on a held-out period, calibration report, **fairness/disparity audit** across gender, region, language, urban/rural, and platform cohorts (PRD §13.2), a documented rollback plan, and shadow-mode agreement analysis. Automated limit *increases* are frozen whenever cohort-level drift alarms fire (PRD §12.5) — a platform changing its pay structure moves an entire cohort at once, and the correct response is to stop, not to adapt quickly.

**Reject inference** is run on a small randomised approval band so the model does not ossify around its own early decisions.

---

# 8. Client architecture

**Native Android (Kotlin + Jetpack Compose).** Chosen over cross-platform runtimes because D7's ≤25MB / 2GB-RAM / 2G targets are binding, and because voice-first UX depends on tight platform integration. iOS is deferred — it is a rounding error in this segment. A partner/platform web console and an ops console are separate React applications.

```
  UI (Compose, icon-led, voice-first, RTL-safe, 8+ locales)
  ├─ Voice layer: ASR/TTS with on-device wake and server-side recognition
  ├─ State: server-authoritative; client never computes money
  ├─ Offline cache (Room): last-known balances, buckets, forecast band, obligations
  ├─ Outbox queue: user intents persisted locally, replayed with idempotency keys
  └─ Sync: delta APIs, protobuf/compact JSON, resumable, 2G-tolerant backoff
```

**Offline semantics.** Read-only operations serve from cache with a visible "as of" timestamp. Write intents (save ₹500, log cash income) queue and replay; **money-moving intents are never optimistically confirmed** — the UI shows "queued", never "done", until the server acknowledges. Showing a false success on a financial action is the one UX shortcut this product cannot take.

---

# 9. Reliability, security, operations

## 9.1 SLOs

| Path | Availability | Latency |
|---|---|---|
| Withdrawal (D1) | 99.95% | p95 ≤ 8s, p99 ≤ 30s |
| Balance / bucket read | 99.95% | p95 ≤ 500ms |
| Sweep execution | 99.9% | ≤ 5 min from income event |
| Credit decision | 99.5% | p95 ≤ 3s |
| Assistant first token | 99.0% | ≤ 1.5s |
| Ingestion freshness | — | ≤ 15 min p95 from source availability |

## 9.2 Security
Device binding + step-up auth for money movement · mTLS between internal services · least-privilege IAM · tokenised PII with vault-mediated access · secrets in KMS with rotation · signed webhooks with replay protection · rate limiting and anomaly detection at the edge · no PII in logs (CI-enforced) · annual penetration test and continuous dependency scanning.

**Prompt-injection** is treated as a first-class threat because the assistant reads merchant-controlled narration text. Mitigations: delimited untrusted input, tool allow-listing, no credentialed actions from the model, and the numeric validator as a last line.

## 9.3 Degradation matrix

| Component down | Behaviour |
|---|---|
| Intelligence plane (L2) | Withdrawals, balances, transfers, loan repayment collection all continue. Sweeps use cached S2S (<24h) or skip. Assistant returns templated deterministic answers. New credit decisions are **declined-with-retry**, never approved on stale data. |
| Connector / AA | Existing data serves; forecasts age with a visible staleness indicator; no punitive action anywhere |
| Assistant / LLM | App fully functional; voice degrades to menu navigation |
| Kafka | Connector buffers to disk; sweeps delayed, not lost; ledger unaffected |
| Partner bank rail | Withdrawals queue with honest user messaging and an ETA; reservations held; no silent failures |

Direction of failure is uniform: **the system fails toward not moving the user's money and not extending credit.**

## 9.4 Reconciliation
Continuous three-way reconciliation between the internal ledger, the partner bank's CBS, and the payment rail. Daily automated close with break detection; any unexplained break above a threshold pages, and a suspense account holds unresolved items with mandatory ageing review. Reconciliation is a tier-0 concern, staffed from day one — not a finance-team afterthought.

## 9.5 Observability
Product-level dashboards mirror PRD §11 (buffer days, sweep pause reasons, alert precision, validator block rate, loans avoided). Model-level: calibration coverage, drift, disparity. Guardrail metrics (PRD §11.3) are alerted on, and a regression on any of them blocks release.

---

# 10. Architecture decision records

| ADR | Decision | Rationale | Rejected alternative |
|---|---|---|---|
| **A1** | Modular monolith per plane, not fine-grained microservices | Small team; the hard boundary that matters is money↔intelligence, not service count | Full microservices — distributed-transaction complexity for no benefit at this scale |
| **A2** | Double-entry append-only ledger in Postgres | Correctness, auditability, invariants in the DB; volumes are modest | Balance-column updates — unauditable and race-prone |
| **A3** | AA-first, platform connectors as pluggable enrichment | Product must work without any platform's permission (PRD §15 Q2) | Platform-partnership-first — richer data, but dependency and conflict of interest |
| **A4** | Quantile forecasts; no scalar-income API exists | An over-optimistic point forecast causes over-sweeping and destroys trust (PRD §12.5) | Point forecast + heuristic margin — hides uncertainty exactly where it matters |
| **A5** | Policy engine separate from and downstream of the credit model | A retrain must never be able to loosen a consumer-protection limit (D8) | Limits as model features — silently overridable |
| **A6** | LLM restricted to tool-call facts + output-validated numerics | Financial harm and regulatory exposure from one fabricated figure | Trusting model arithmetic — unbounded downside |
| **A7** | Withdrawal service isolated with zero optional dependencies | The instant-out guarantee is the trust contract (PRD §7 F2.5) | Withdrawal inside the main service — an unrelated outage becomes exit friction |
| **A8** | Native Android | 25MB / 2GB-RAM / 2G constraints are binding | Flutter/RN — faster to build, heavier artefact, weaker voice integration |
| **A9** | Consent enforced in a shared data-access library, not per-service | Per-service checks drift and get skipped under deadline pressure | Convention-based checks — unauditable |
| **A10** | Buckets as ledger sub-accounts, single deposit account | Preserves deposit insurance and simplifies regulatory treatment | Separate deposits per goal — operationally heavy, unclear insurance treatment |

---

# 11. Open architectural questions

1. **Ledger partitioning** at >10M users — user-hash sharding vs. time-partitioned postings with a hot/cold split. Not urgent, but the sharding key must be chosen before the first migration is painful.
2. **Cash-income confidence model** — the 25% cap (PRD §15 Q1) is a policy placeholder; a corroboration model using spend-pattern consistency should replace the flat cap.
3. **Sinking-fund legal structure** (PRD §15 Q4) determines whether these stay ledger sub-accounts (A10) or need separate instruments. Revisit before Phase 2.
4. **On-device vs. server ASR** for very-low-connectivity users — a hybrid with an on-device fallback vocabulary for the top ~50 intents is likely correct but adds app size against D7.
5. **Multi-tenancy** for partner-branded distribution (platforms, cooperatives, welfare boards) — decide before Phase 3, as retrofitting tenancy into the ledger is expensive.
6. **DPD representation** for income-linked repayment (PRD §15 Q5) — the dual-clock design in §4.2 is a hedge, not an answer.

---

*End of document.*
