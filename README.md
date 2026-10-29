# JigJoy Concurrent Multi-Agent Mesh

Standalone concurrent agent architecture built with [Mozaik (`@mozaik-ai/core`)](https://www.npmjs.com/package/@mozaik-ai/core) for the **NTP Novi Sad / JigJoy AI Hackathon**.

## Architecture & Concurrency Model

Rather than linear sequential agent chains (which suffer from compounding latency and failure propagation), this repository implements a non-blocking, event-driven reactive agent mesh:

1. **Shared State (`MeshRuntimeState`)**: Type-safe shared runtime state holding telemetry, invariant results, and dispatch queues.
2. **Sensor Agent**: Continuously ingests streaming inputs, extracts state deltas, and dispatches semantic events.
3. **Guardrail Agent (`SituationHandler`)**: Intercepts events via `SituationSpecification` and validates invariants via `SituationProcessor`.
4. **Mock Inference Runner (`MockInferenceRunner`)**: Implements `InferenceRunner` for deterministic, zero-token-cost local execution and CI test verification.

## Getting Started

```bash
# Install dependencies
npm install

# Run the mesh
npm start

# Run unit tests
npm test
```

## Developer Information
- **Author:** Siddharth Srivastava ([@sidsri14](https://github.com/sidsri14))
- **Contact:** sidsri1502@gmail.com
- **Event:** NTP Novi Sad / JigJoy AI Hackathon 2026
