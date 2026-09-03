# Implementation Plan — 24-Hour Hackathon Build
## Project **Dhara** — Financial Resilience for Gig & Informal Workers

| | |
|---|---|
| **Format** | 24-hour hackathon · team of 4 |
| **Companion documents** | [`PRD.md`](./PRD.md) · [`ARCHITECTURE.md`](./ARCHITECTURE.md) |
| **Goal** | A working demo that proves the PRD's central claim, plus a target architecture that shows we know how to build the real thing |

---

# 0. The one thing to internalise first

**You cannot build the PRD in 24 hours. You are not supposed to.**

`ARCHITECTURE.md` describes the production system. This document describes a **24-hour vertical slice through it** — one narrow path, working end to end, that makes the thesis undeniable in five minutes.

The thesis, restated as the demo's win condition:

> **A fixed-date financial product breaks a gig worker on a bad week. A cash-flow-indexed one bends with them.**
> We show the same bad week, twice: once with a normal bank, once with Dhara.

Every hour below is spent making that comparison real and legible. Anything that does not serve it is cut, without debate.

**Build backwards from the demo script (§12), not forwards from the architecture.** Teams that build forwards ship an impressive backend nobody sees.

---

# 1. Build / fake / cut

The single highest-leverage decision set in the whole event. Decide this in hour 0 and do not revisit it.

| Capability | Decision | Why |
|---|---|---|
| Double-entry ledger with balance invariants | **BUILD (real)** | ~120 lines, demos as rigour, prevents demo-breaking negative balances |
| Safe-to-Save engine | **BUILD (real)** | The core logic. Pure function. Cheap and it *is* the product |
| Surge-skim + payout-slice + round-up sweeps | **BUILD (real)** | Pure logic on top of S2S. The visible magic |
| Quantile income forecaster (p10/p20/p50/p90) | **BUILD (real)** | ~30 lines with sklearn quantile GBM. The p20 underwrites everything |
| Shortfall detector + 3 remedies | **BUILD (real)** | The emotional centre of the demo |
| Income-linked repayment schedule | **BUILD (real)** | Pure arithmetic. Flagship credit differentiator |
| Policy engine (affordability, rollover block, ladder) | **BUILD (real)** | Declarative rules, ~80 lines. Where "responsible" becomes visible |
| Assistant with tool-calling + **numeric validator** | **BUILD (real)** | Highest wow-per-hour in the entire build. The validator is the differentiator |
| Sinking fund for a lumpy premium | **BUILD (real, simple)** | One formula; huge narrative payoff |
| Account Aggregator integration | **FAKE** — seeded synthetic dataset with a mock AA consent screen | No sandbox access in 24h. The mock consent screen sells it in 8 seconds |
| Real bank / UPI money movement | **FAKE** — simulated rail with realistic latency and a 5% failure path | Demonstrating the failure path is *more* impressive than a fake success |
| Real ASR/TTS voice | **THIN** — browser Web Speech API, English + one Indic language, with a text fallback always visible | Do not stake the demo on live ASR in a noisy venue |
| Income classifier ML model | **FAKE** — rules + keyword map over seeded narrations, presented honestly as such | A trained classifier costs 3h and looks identical on stage |
| Auth, KYC, onboarding | **CUT** — persona picker | Zero narrative value |
| Bureau reporting, insurance underwriting, entitlement matcher | **CUT from code, KEEP in deck** | Slide-level only |
| Native Android app | **CUT** — responsive web in a phone frame | Android build/deploy overhead is fatal at this timescale |
| Kafka, feature store, microservices | **CUT** — single FastAPI app, in-process events | Architecture doc covers the target; the demo needs one process |

**Rule for anything faked:** label it in the UI as seeded/simulated. Judges forgive simulation; they do not forgive being misled, and one "is this real?" question you answer badly costs more than the feature was worth.

---

# 2. Stack

Chosen for speed of iteration under sleep deprivation, not for production fitness.

| Layer | Choice | Note |
|---|---|---|
| Backend | **Python 3.11 + FastAPI** | Same language as the ML work — no serialisation boundary, no second runtime |
| DB | **SQLite** (single file) | Zero setup. The ledger schema is portable to Postgres unchanged |
| ML | **scikit-learn** (`GradientBoostingRegressor(loss="quantile")`), pandas, numpy | Quantile forecasting in ~30 lines |
| Assistant | **Anthropic SDK** (`anthropic`), model `claude-opus-5` | Tool-calling loop |
| Frontend | **Next.js + Tailwind**, rendered inside a phone frame | Fast to style; looks like a product, not a dashboard |
| Charts | Recharts | The p10–p90 forecast band is an area chart |
| Voice | Web Speech API (browser) | Free, no keys, degrades to text |
| Deploy | One box or ngrok; **plus a fully local fallback** | Never demo off someone's conference wifi without a local path |

### Assistant implementation notes (get these right the first time)

- Model `claude-opus-5`; **do not** pass `budget_tokens` — it is rejected with a 400 on this model. Thinking is on by default; `thinking: {"type": "adaptive"}` is the explicit form.
- For demo latency, lower **effort**, not the model: `output_config={"effort": "low"}`. Never downgrade the model to save time — quality of explanation is the demo.
- Use the SDK tool runner (`client.beta.messages.tool_runner` with `@beta_tool`-decorated functions) rather than hand-writing the agent loop — it saves ~90 minutes.
- Stream responses so the UI shows tokens immediately; a 4-second silent pause reads as "it's broken" on stage.
- `max_tokens` ~4000 is ample; do not lowball it and get truncated mid-sentence in front of judges.

---

# 3. Team and ownership

Four people, four lanes, minimal cross-blocking. Each lane owns its files outright — **no shared files between lanes before the first integration checkpoint.**

| | Owner | Owns | Files |
|---|---|---|---|
| **P1** | Core backend | Ledger, buckets, sweep engine, Safe-to-Save, API surface | `core/`, `api/` |
| **P2** | Data & ML | Synthetic data generator, forecaster, classifier rules, credit scorer + policy engine | `data/`, `ml/`, `credit/` |
| **P3** | Frontend | Every screen, phone frame, charts, the A/B "bad week" comparison view | `web/` |
| **P4** | Assistant, integration, pitch | Assistant + tool layer + numeric validator, glue, deck, demo script, rehearsal | `assistant/`, `deck/`, `demo/` |

**P4 owns the pitch and is protected from feature work after T+16.** The most common way good hackathon projects lose is a great build with an unrehearsed demo. Someone must be accountable for the five minutes on stage from hour zero.

---

# 4. Hour 0 — the contract freeze (do this before writing any feature code)

Spend the first 45 minutes here. It is the highest-return time in the entire 24 hours, because it is what lets four people work in parallel without blocking.

### 4.1 Freeze the API contract
Write `api/contract.md` and stub every endpoint to return **hardcoded sample JSON immediately**. P3 then builds the full frontend against real-shaped responses from minute 45, and never waits for P1.

```
GET  /api/personas                        → [{id, name, role, city, blurb}]
POST /api/session          {persona_id}   → {session_id}
GET  /api/dashboard                       → {balance, buckets[], buffer_days,
                                             essential_burn, forecast_band, alerts[]}
GET  /api/forecast?days=30                → {points:[{date,p10,p20,p50,p90}]}
GET  /api/timeline                        → {events:[{date, type, amount, label, meta}]}
POST /api/simulate/day     {scenario}     → {events[], sweeps[], alerts[], state}
POST /api/withdraw         {amount,bucket}→ {ok, latency_ms, new_state}
POST /api/credit/apply     {amount,purpose}→ {decision, reason_codes[], schedule[],
                                             alternative, total_cost_minor}
POST /api/assistant/ask    {text}         → SSE stream {token|tool_call|final|blocked}
GET  /api/compare                         → {without_dhara:{...}, with_dhara:{...}}
```

`/api/compare` is the money endpoint. It returns the two sides of the bad-week story. Build the shape now.

### 4.2 Freeze the persona and the seed dataset spec
The demo persona is **Ravi** (PRD §3.1). One primary persona, two secondary. Do not build three demo flows.

### 4.3 Freeze the demo script
P4 writes the five-minute script (§12) **in hour 0**, before the code exists. Every subsequent build decision is checked against it: *does this appear in the script?* If no, it is not built.

### 4.4 Repo skeleton

```
dhara/
  api/        contract.md  main.py  routes/
  core/       ledger.py  buckets.py  safe_to_save.py  sweeps.py  shortfall.py
  ml/         generate.py  forecast.py  classify.py
  credit/     scorecard.py  policy.py  schedule.py
  assistant/  tools.py  validator.py  runner.py  prompts.py
  data/       seed.db  personas.json
  web/        app/  components/  lib/
  demo/       script.md  fallback.mp4  reset.sh
  deck/
```

`demo/reset.sh` restores the seed DB to a known state in one command. **Write it in hour 1.** You will run it fifty times, including twice during rehearsal and possibly once on stage.

---

# 5. The synthetic data generator (P2, hours 1–3) — the foundation

Everything downstream is only as convincing as this. Realistic gig-income data is what makes the forecast band, the drought pause, and the shortfall alert all land at once.

`ml/generate.py` produces 180 days of history for Ravi:

```python
daily_earnings = base
    × weekday_factor          # weekends ~1.4×, Mondays ~0.8×
    × weather_factor          # ~12% of days are rain: 0.3× (or a 2.0× surge — pick a lane)
    × incentive_cycle         # platform weekly bonus thresholds create a Sat/Sun spike
    × seasonality             # festival weeks ~1.5×
    × lognormal_noise(σ=0.35) # the fat tail that makes the p10–p90 band wide and honest
```

Plus, on the outflow side:
- Fixed: bike EMI ₹4,100 on the 5th · rent ₹6,500 on the 1st · phone ₹399
- Daily variable: fuel ₹180–320, food ₹120–250
- Lumpy: vehicle insurance ₹14,000 annually · one ₹3,200 phone repair at day 96
- **A scripted 5-day drought at days 172–176**, positioned so that the EMI on the 5th falls just after it

That drought is not incidental. It is engineered so the forecast, the sweep pause, the shortfall alert, and the buffer drawdown all fire in sequence during the demo window. **Design the data around the story.**

*Acceptance:* the generated series produces a coefficient of variation of weekly income between 0.3 and 0.5 (realistically volatile), and the day-180 state puts Ravi at ~11 buffer days with the EMI 4 days out.

---

# 6. Hour-by-hour plan

### Block A · T+0 → T+4 — foundations in parallel

| Hour | P1 Core | P2 Data/ML | P3 Frontend | P4 Assistant/Pitch |
|---|---|---|---|---|
| 0–1 | **ALL: contract freeze, repo skeleton, persona lock, demo script v0** | | | |
| 1–2 | Ledger: accounts, postings, `SUM(DR)=SUM(CR)`, non-negative CHECK | Generator: income series | Phone frame, nav, design tokens | Stub all endpoints with sample JSON; `reset.sh` |
| 2–3 | Buckets + reservations + `/withdraw` | Generator: outflows, recurring detection | Dashboard: balance, buckets, buffer-days ring | Tool schemas defined against the contract |
| 3–4 | Timeline + event replay engine | Essential-burn calculator | Timeline / transaction list | Deck skeleton; storyline lock |

**◆ CHECKPOINT 1 @ T+4 — "fake data on a real screen."** The UI renders a dashboard from the API. Nothing is real yet. If this is not green, cut a feature now, not at T+18.

### Block B · T+4 → T+9 — the core loop

| Hour | P1 | P2 | P3 | P4 |
|---|---|---|---|---|
| 4–5 | Safe-to-Save (PRD §7 F2.1) | Quantile forecaster training + `/forecast` | Forecast band chart (p10–p90 area + p50 line) | Assistant tool-call loop working end to end |
| 5–6 | Sweep engine: payout-slice + round-up | Forecast eval: p10–p90 coverage ≈ 80% | Sweep animation on the timeline | `get_balance`, `get_forecast`, `get_buffer_days` tools |
| 6–7 | **Surge skim** + auto-pause with reason codes | Classifier rules over seeded narrations | Bucket detail + goal progress | **Numeric validator** (§8) |
| 7–8 | Shortfall detector + 3 remedies | Sinking fund calculator | Shortfall alert card + remedy buttons | `get_safe_to_save`, `get_obligations`, `simulate_loan` |
| 8–9 | Day-simulation endpoint (`/simulate/day`) | Credit scorecard v1 | Voice input button + streaming text | Validator wired into the response path |

**◆ CHECKPOINT 2 @ T+9 — "the loop runs."** Simulate a day → income event → sweep fires or pauses with a reason → dashboard updates → forecast shifts. This is the product. If it works, you have a demo regardless of what else fails.

### Block C · T+9 → T+14 — credit, comparison, and the differentiators

| Hour | P1 | P2 | P3 | P4 |
|---|---|---|---|---|
| 9–10 | Loan account + disbursal ledger entries | **Policy engine**: affordability on p20, rollover block, ladder | Credit application screen | Assistant persona + vernacular prompt tuning |
| 10–11 | Income-linked repayment collection on income events | Reason-code catalogue → plain language | Repayment schedule visualiser (variable bars) | Scenario simulator tool |
| 11–12 | **`/api/compare`** — the A/B bad-week engine | Alternative evaluator (buffer-covers-it path) | **Comparison screen** — the demo's centrepiece | Deck: problem + insight slides |
| 12–13 | Rail-failure path + retry/release | Credit decision explainability output | **Refusal-path screen** (PRD §8 F3.6) | Red-team the validator: 30 adversarial numeric questions |
| 13–14 | Bug bash on the ledger; invariant tests | Tune the drought so the story lands | Polish: empty states, loading, ₹ formatting | Demo script v2 + first dry run |

**◆ CHECKPOINT 3 @ T+14 — FEATURE FREEZE.** No new backend features after this line. Everything from here is integration, polish, and rehearsal. Teams that keep adding features past T+14 demo something broken.

### Block D · T+14 → T+20 — make it real on screen

Staggered rest: two people sleep 14→17, the other two 17→20. **Nobody skips rest entirely** — the failure mode at hour 21 is not missing features, it is a bad decision made by an exhausted person, or a garbled pitch.

| Hour | Focus |
|---|---|
| 14–16 | Full path integration. Run the demo script end to end for real. Fix only what breaks it. |
| 16–18 | Visual polish: the buffer-days ring, the forecast band, the pause reason chips, the comparison split-screen. Judges see the UI, not the ledger. |
| 18–19 | **Demo hardening**: `reset.sh` verified · offline/local mode verified · assistant response cached for the three scripted questions as fallback · seeded latency so nothing hangs · **record a full backup video** |
| 19–20 | Deck finished. Architecture slide (from `ARCHITECTURE.md`). Metrics slide (PRD §11). |

**◆ T+20 — HARD CODE FREEZE.** Merge nothing after this. The remaining four hours are worth more spent on delivery than on one more feature.

### Block E · T+20 → T+24 — rehearsal

| Hour | Focus |
|---|---|
| 20–21 | Rehearsal ×2, timed. Cut anything that pushes past 4:30 in a 5-minute slot. |
| 21–22 | Q&A prep (§13). Every team member must be able to answer "what's real and what's simulated?" identically. |
| 22–23 | Rehearsal ×2 more, including one deliberately on the backup video to prove it works. |
| 23–24 | Submission, README, repo tidy, buffer. **Do not code.** |

---

# 7. Component specs and acceptance criteria

### C1 · Ledger (P1, 2h)
Double-entry over SQLite. `accounts`, `transactions` (unique `idempotency_key`), `postings`, materialised `balances`.
*Accept:* postings sum to zero per transaction (property test over 1,000 random transaction sets); no user account can go negative; replaying the same sweep twice moves money once.

### C2 · Safe-to-Save (P1, 1h)
```
S2S = forecast_p20(14d) − committed_outflows(14d) − essential_burn(14d) − reserve_floor
```
*Accept:* during the scripted drought, S2S ≤ 0 and every sweep pauses with reason `DROUGHT`. This exact behaviour is the demo's turning point — test it explicitly, not incidentally.

### C3 · Sweep engine (P1, 2h)
Three modes. Surge skim: on a day earning >120% of the personal 30-day median, save 25% of the excess.
*Accept:* over 180 seeded days, zero sweeps executed on drought days; total saved > ₹0 and < 12% of net income; a sweep is never larger than S2S.

### C4 · Quantile forecaster (P2, 2h)
Four `GradientBoostingRegressor(loss="quantile", alpha=τ)` models at τ ∈ {0.1, 0.2, 0.5, 0.9}. Features: day-of-week, 7/14/30-day rolling mean and std, days-since-drought, month-position.
*Accept:* empirical coverage of the p10–p90 band on held-out days is 75–85%. **Report this number on the metrics slide** — calibration is a claim judges can check, and honest intervals are more impressive than a confident point estimate.

### C5 · Policy engine (P2, 1.5h)
Declarative rules evaluated after the scorecard, returning `(outcome, binding_constraint, reason_codes)`:
```
affordability : obligations_after ≤ 0.35 × p20_monthly_net − essential_burn
ladder        : max_level = f(tenure_days, repayments_completed, buffer_days)
rollover      : BLOCK if purpose == repay_existing_dhara_loan
distress      : BLOCK while an unacknowledged shortfall alert exists and no alternative shown
```
*Accept:* a scripted ₹40,000 request is **declined with a named binding constraint**, and the alternative path renders. This is the "responsible" claim made visible — it must work flawlessly.

### C6 · Income-linked schedule (P2/P1, 1h)
`repayment_i = clamp(rate × payout_i, 0, ceiling)` with a hard maturity date and a disclosed total cost.
*Accept:* on zero-income days, ₹0 collected, no fee, no DPD. Side-by-side with a fixed EMI on the same income series, the fixed EMI bounces and the income-linked one does not. **Show both bars.**

### C7 · Assistant + numeric validator (P4, 4h) — the differentiator
Tools: `get_balance` · `get_buffer_days` · `get_forecast` · `get_safe_to_save` · `get_obligations` · `simulate_loan` · `get_transaction_history`.

The validator (~40 lines, and worth more than any other 40 lines in the build):
```python
def validate(draft: str, tool_results: list[dict]) -> tuple[bool, list[str]]:
    allowed = numeric_closure(tool_results)   # raw values + minor→major, rounded,
                                              # %, and date-formatted variants
    found   = extract_numerals(draft)
    unmatched = [n for n in found if n not in allowed]
    return (not unmatched), unmatched
```
On a violation: block, log, regenerate once, then fall back to a deterministic template.
*Accept:* a red-team set of 30 questions designed to induce arithmetic ("what's 15% of my savings?", "how much will I have in 3 months?") yields **zero unvalidated numbers reaching the user**. Demo this live — deliberately ask a question that trips the validator and show the block. Judges remember the team that showed their AI's guardrail working.

### C8 · Comparison engine (P1, 1.5h)
Replays the same seeded income series through two policy sets: `TRADITIONAL` (fixed-date EMI, fixed RD, no forecast) and `DHARA`. Emits both outcome sets: bounces, fees paid, buffer trajectory, ending balance, borrowing incurred.
*Accept:* reproduces PRD §16's table from actual simulation, not hardcoded values. If a judge asks "did you compute that or write it?", the answer must be "computed", and you should be able to change a parameter and re-run.

---

# 8. Integration protocol

- `main` is always demoable. Feature branches, small PRs, self-merge after a green smoke test.
- `demo/smoke.sh` runs the full demo path headlessly and exits non-zero on failure. **Write it at T+4** and run it before every merge. It is the only thing standing between four tired people and a broken `main` at hour 19.
- Checkpoints at T+4, T+9, T+14, T+16, T+20 are **hard stops**: everyone stops, runs the demo path together, and decides go/cut. Fifteen minutes each, timeboxed.
- Any lane blocked for more than 20 minutes escalates immediately and fakes the dependency rather than waiting.

---

# 9. Scope-cut ladder

Pre-agree the cut order in hour 0, while everyone is rested and unattached to their code. Cut from the bottom when behind:

```
  9  Voice input                    ← cut first, text is fine
  8  Round-up sweep mode            ← surge skim carries the story alone
  7  Sinking fund visual            ← keep the calculation, cut the screen
  6  Scenario simulator             ← nice, not load-bearing
  5  Third persona                  ← one persona is enough
  4  Credit scorecard ML            ← replace with a fixed score, keep the policy engine
  3  Refusal path screen            ← ONLY if desperate; this is a core differentiator
  2  Comparison screen              ← do not cut
  1  Assistant + numeric validator  ← do not cut
  0  Sweep pause on drought         ← the demo does not exist without this
```

Items 0–2 are the demo. If only those three work, you still have a strong five minutes.

---

# 10. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Venue wifi fails during the demo | High | Fatal | Full local mode + recorded backup video, both verified at T+18 |
| Live LLM call is slow or errors on stage | Medium | High | Stream tokens; pre-cache the three scripted questions; deterministic fallback template |
| Live ASR fails in a loud room | High | Medium | Text input always visible; voice is a bonus, never a dependency |
| Integration hell at hour 18 | High | High | Contract freeze at hour 0; stubs from minute 45; `smoke.sh` from T+4 |
| Someone builds past feature freeze | Medium | High | T+14 freeze is a team commitment made in hour 0, enforced at the checkpoint |
| Demo data doesn't tell the story | Medium | High | Data is engineered around the script (§5); verified at Checkpoint 2 |
| Exhaustion → bad pitch | High | High | Mandatory staggered rest; P4 protected from code after T+16 |
| Judges ask "what's real?" and answers differ | Medium | Medium | §1 table memorised by all four; one rehearsed answer |
| Scope creep from a good idea at 3am | Certain | High | Write it in `demo/parking-lot.md` and move on. Mention it as roadmap in the pitch |

---

# 11. What NOT to build

Explicitly, so nobody quietly starts one at 2am:

Auth and user accounts · real KYC · a real AA integration · a trained income classifier · a mobile app · Docker/Kubernetes · a microservice split · Kafka · a design system · unit tests beyond the ledger invariants and the validator · admin/ops console · multi-language i18n plumbing (hardcode one Indic string set for the demo) · dark mode · a landing page.

Every one of these has sunk a hackathon team that had a working product at hour 14.

---

# 12. Demo script (5 minutes)

Written in hour 0. Rehearsed from T+20. Timed.

**0:00–0:30 · The hook.** *"Ravi delivers food in Bengaluru. Last month he earned ₹31,000 — more than an entry-level salaried job. He also paid ₹590 in bounce charges, because his bike EMI is due on the 5th and it rained on the 3rd. He isn't poor. He's* ***volatile*** *— and every bank product he can access is built for a calendar he doesn't live on."*

**0:30–1:15 · The picture.** Dashboard. Six months of Ravi's real-shaped income. The forecast band. *"We don't tell him he'll earn ₹28,400 — we'd be wrong, and he'd stop trusting us. We tell him ₹24k–₹31k, and we're right 80% of the time. Here's the measured calibration."*

**1:15–2:30 · The bad week.** Run the simulation forward. Rain. Earnings collapse.
- Safe-to-Save goes negative → **sweeps pause automatically**, reason chip: `DROUGHT`. *"A normal recurring deposit would have debited him today and bounced. We just… didn't take his money."*
- Shortfall alert fires 9 days out with three one-tap remedies. Take the buffer option.
- Weather clears → surge skim quietly rebuilds the buffer from the excess.

**2:30–3:15 · The comparison.** Split screen, same income series, two products. Traditional: bounced EMI, ₹590 in fees, savings habit abandoned. Dhara: EMI cleared, ₹0 fees, 11 buffer days, insurance premium accruing at ₹38/day. *"Same person. Same week. Same income. Different mechanics."*

**3:15–4:15 · Credit that can say no.** Ravi asks for ₹40,000.
- The policy engine declines with the binding constraint shown in plain language.
- The alternative appears *above* any offer: his buffer covers ₹6,000 today, and the repair shop has a no-cost plan.
- Then the approved smaller loan, with an **income-linked schedule**: variable bars, ₹0 on zero-income days, hard maturity date, total cost in rupees. *"We measure ourselves on loans avoided. That's metric M-C6 in our PRD."*

**4:15–4:45 · The assistant, and its guardrail.** Ask in Hindi: *"क्या मैं इस महीने स्कूल फीस दे पाऊँगा?"* — grounded answer from tool calls. Then deliberately ask something that induces arithmetic, and **show the validator blocking it**. *"Our assistant is structurally incapable of inventing a number about your money. Every figure comes from a tool call, and anything else gets blocked before you see it."*

**4:45–5:00 · The close.** North star: buffer days. Architecture slide. *"The demo is a vertical slice. The architecture behind it is designed for the real thing — here's the ledger, the policy layer that a model retrain can't loosen, and the consent registry in the data path."*

---

# 13. Q&A preparation

Rehearse these. Consistency across all four people matters more than depth.

| Question | Answer |
|---|---|
| *What's real vs. simulated?* | "Ledger, sweep engine, forecaster, policy engine, income-linked schedule and the assistant guardrail are real code running now. Bank connectivity and money movement are simulated, and the income data is synthetic but calibrated to published gig-earnings volatility. The §1 table in our plan lists every one." |
| *How is this not a lending app?* | "Loan volume isn't a KPI. Buffer days is. We track loans *avoided* as a success metric, and rollover is blocked in code, not policy." |
| *How do you make money?* | "Float on deposits, interchange, insurance distribution, and thin credit margin on volume — with the honest caveat that unit economics on a ₹4,000 average balance is our open question #7." |
| *What if someone fakes income?* | "Circular-flow detection on the counterparty graph, self-transfers excluded, cash income capped at 25% of assessed income and requiring spending-pattern corroboration." |
| *Why would a bank deploy this?* | "It underwrites a segment they currently reject by construction, using data they can already access under consent — and it builds deposits before it builds a loan book." |
| *Isn't the AI risky in finance?* | "That's why it can't do arithmetic. Watch —" *(run the validator demo)* |
| *What would you build next?* | "The entitlement matcher. Accident cover costs ₹20 a year and hundreds of millions of eligible workers don't have it. Highest resilience-per-rupee in the whole PRD." |

---

# 14. Submission checklist (T+23)

- [ ] `main` runs from clean clone: `./setup.sh && ./run.sh`
- [ ] `demo/reset.sh` restores demo state in one command
- [ ] Backup video recorded, playable offline, under 5 minutes
- [ ] README: what's real, what's simulated, how to run
- [ ] `PRD.md`, `ARCHITECTURE.md`, `IMPLEMENTATION_PLAN.md` in the repo — the depth behind the demo is itself a differentiator
- [ ] Deck exported to PDF and stored locally
- [ ] Every team member can deliver the 5-minute demo alone
- [ ] Laptop charged, adapter present, screen mirroring tested **on the actual venue setup**

---

*End of document.*
