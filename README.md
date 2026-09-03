# Dhara — Financial Resilience for Gig & Informal Workers

> **Cash-flow-indexed savings, credit, and insurance for volatile earners.**
> Built to provide a flexible financial safety net for gig economy workers.

---

## 🎯 The Thesis

A fixed-date financial product breaks a gig worker on a bad week.
A cash-flow-indexed one bends with them.

Dhara replaces calendar-indexed primitives (fixed-date EMIs, rigid SIPs, month-end savings) with **cash-flow-indexed primitives** designed for income volatility. It actively learns from a user's earnings and adapts financial obligations dynamically.

---

## 🏗️ Project Structure

This project is structured as a full-stack monorepo:

- **`client/`**: The frontend React application built with Vite and Tailwind CSS.
- **`server/`**: The backend Python application powered by FastAPI, containing the core ledger, machine learning models, and policy engines.

---

## 🚀 Quick Start

### Backend (Server) Setup

The backend requires **Python 3.11+**.

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Generate seed data and run the server
PYTHONPATH=. python -m ml.generate
PYTHONPATH=. uvicorn api.main:app --port 8000
```
*The backend API will be running on http://localhost:8000.*

### Frontend (Client) Setup

The frontend requires **Node.js**.

```bash
cd client
npm install
npm run dev
```
*The frontend application will be running on http://localhost:5173.*

---

## 🧠 Core Architecture

The backend (`server/`) is organized as follows:

- **`api/`**: FastAPI app — endpoints for health, dashboard, forecast, credit, and the AI assistant.
- **`assistant/`**: Vernacular financial assistant with a numeric validator and tool bindings.
- **`core/`**: Double-entry ledger, simulation engine, sweeps, Safe-to-Save logic, and shortfall detectors.
- **`credit/`**: Scorecard, affordability policy engine, and income-linked repayment schedules.
- **`ml/`**: Quantile income forecaster (GBM) and synthetic gig transaction generator.
- **`tests/`**: Acceptance tests (ledger, sweeps, calibration, comparison) and assistant red-teaming.

---

## 🧪 Tests

To run the backend tests:

```bash
cd server

# Run acceptance tests (ledger, sweeps, forecast calibration, comparison)
PYTHONPATH=. .venv/bin/python -m pytest tests/test_acceptance.py -v

# Run assistant red-team (adversarial numeric questions, zero unsourced numbers)
PYTHONPATH=. .venv/bin/python -m pytest tests/test_assistant.py -v
```

---

## 📖 Deep-Dive Documents

For a deeper understanding of the product requirements and architecture, see the documents inside the `server/` directory:

- [`server/PRD.md`](./server/PRD.md) — Full product requirements with features across 5 pillars.
- [`server/ARCHITECTURE.md`](./server/ARCHITECTURE.md) — Target production architecture (event-driven, ledger-first).
- [`server/IMPLEMENTATION_PLAN.md`](./server/IMPLEMENTATION_PLAN.md) — Implementation details and build plan.

---

## 🛡️ License

Apache-2.0 / MIT
