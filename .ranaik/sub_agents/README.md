# Sub-Agent Blueprint & Handoff Contracts

Each sub-agent is a stateless specialist invoked by the orchestrator with a
self-contained task packet and returning a structured result. Agents never
talk to each other directly — all handoffs route through the orchestrator,
which validates contracts at the OBSERVE phase.

## Pipeline

```
user prompt
   │
   ▼
ORCHESTRATOR ── PLAN ──► architect ──► task graph
   │                                       │
   ├── ACT ───────► code_synthesizer ◄─────┤   (per node, parallel where possible)
   │                refactoring_guru   ◄───┤   (migration/modernization nodes)
   │                performance_analyst◄───┘   (hotspot/optimization nodes)
   │                       │ diff
   ├── gate ──────► security_warden            (mandatory for security-signature diffs)
   │                       │ PASS/FAIL
   ├── gate ──────► quality_assurance          (tests + runtime validation)
   │                       │ PASS/FAIL
   └── CRITIQUE + REFINE ──► merge to workspace
```

## Task packet (orchestrator → agent)

Every dispatch includes exactly these fields:

| Field | Description |
|-------|-------------|
| `task_id` | Node ID from the PLAN task graph |
| `objective` | One paragraph; a single, testable outcome |
| `inputs` | File paths, interfaces, prior agent outputs the task depends on |
| `constraints` | Repo conventions, guardrails excerpt, tier token budget |
| `acceptance` | Checkable criteria the OBSERVE phase will apply |

## Result packet (agent → orchestrator)

| Field | Description |
|-------|-------------|
| `task_id` | Echoed back |
| `status` | `DONE` \| `BLOCKED` \| `FAILED` |
| `artifacts` | Diffs, file paths created/modified, or report body |
| `evidence` | Compiler/lint/test output proving the acceptance criteria |
| `open_risks` | Anything the agent could not verify within its scope |

A result missing any field, or whose `evidence` does not address the
`acceptance` criteria, is a contract violation → REJECT in OBSERVE.

## Roster

| Agent | File | Role |
|-------|------|------|
| Architect | `architect.md` | System layout & decomposition specialist |
| Security Warden | `security_warden.md` | Zero-Trust static analyzer & policy checker |
| Code Synthesizer | `code_synthesizer.md` | Modular, clean-code constructor |
| Refactoring Guru | `refactoring_guru.md` | Migration & refactoring specialist (modernization, decoupling, behavior-preserving rewrites) |
| Performance Analyst | `performance_analyst.md` | Performance & profiling optimizer (CPU/memory/space complexity, query efficiency) |
| Quality Assurance | `quality_assurance.md` | Unit tester, runtime validator & edge-case checker |
