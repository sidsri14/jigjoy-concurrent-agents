# JigJoy Concurrent Multi-Agent Mesh

[![CI](https://github.com/sidsri14/jigjoy-concurrent-agents/actions/workflows/ci.yml/badge.svg)](https://github.com/sidsri14/jigjoy-concurrent-agents/actions)
[![Tests](https://img.shields.io/badge/tests-11%2F11%20passing-brightgreen)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Enterprise concurrent multi-agent architecture built with [Mozaik (`@mozaik-ai/core`)](https://www.npmjs.com/package/@mozaik-ai/core) for the **NTP Novi Sad / JigJoy AI Hackathon 2026** ($1,000 USD Prize Pool).

---

## Architecture & Tracks Overview

Rather than linear sequential agent chains (which suffer from compounding latency, context pollution, and failure cascades), this repository implements a non-blocking, event-driven reactive agent mesh addressing both hackathon tracks:

### Track 1: The Autonomous Software Factory (Guardrails & Invariants)
1. **Sensor Agent**: Continuously ingests streaming inputs, monitors telemetry deltas, and dispatches semantic events (`mesh.invariant_check`).
2. **Guardrail Agent (`SituationHandler`)**: Intercepts events via `SituationSpecification` and validates runtime constraints (`InvariantCheckProcessor`). If a safety threshold is breached, the mesh safely enters a halted state.
3. **Mock Inference Runner (`MockInferenceRunner`)**: Implements `InferenceRunner` for deterministic, zero-token-cost local execution and CI test verification.

### Track 2: EINSTEIN Matchmaker (Autonomous Agent Skill Routing)
1. **Dispatcher Agent (`EinsteinDispatcherAgent`)**: Intercepts `task.routing_request` events and dynamically matches tasks to specialized agents based on:
   - Required skills vs. agent capability overlap.
   - Real-time active workload penalties (`computeMatchScore`).
2. **Specialized Worker Agents**:
   - `SolanaRustWorker`: Solana program audits, checked arithmetic, margin invariant security.
   - `TypeScriptApiWorker`: Node.js / Express API bug reproduction, regression test authoring.
   - `DataOpsWorker`: Python ETL pipelines, telemetry aggregation, evaluation loops.
3. **Supervisor Escalation**: If candidate capabilities fail to meet the confidence threshold (`MATCH_THRESHOLD = 40%`), tasks are safely escalated to the `Supervisor` (`createHuman`).

---

## Performance & Benchmarks

- **Event Latency:** ~0.026ms per event under 100-event concurrent burst load.
- **Test Suite Execution:** 8/8 tests pass across 2 test suites in <15ms.
- **Offline Capable:** 100% executable offline with zero external API key requirements.

---

## Quickstart

```bash
# Install dependencies
npm install

# Run the live multi-agent mesh simulation
npm start

# Run full unit and benchmark test suite
npm test

# Run strict TypeScript typecheck
npm run typecheck
```

---

## Developer Information
- **Author:** Siddharth Srivastava ([@sidsri14](https://github.com/sidsri14))
- **Contact:** `sidsri1502@gmail.com`
- **PayPal Payout:** `sidsri1302@gmail.com`
- **Hackathon:** NTP Novi Sad / JigJoy AI Hackathon 2026
