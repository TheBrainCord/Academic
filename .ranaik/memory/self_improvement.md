# Self-Improvement Ledger

Active ledger tracking prompt drift, recurring failures, and optimization
experiments. Reviewed at the start of every PLAN phase. Append-only; never
rewrite past entries — supersede them with a new entry referencing the old one.

## How the orchestrator uses this file

At the start of every PLAN phase:

1. Read `memory/execution_logs.json` and group entries by `assigned_agent` +
   `compute_tier`.
2. Compute, per group: failure rate (`FAILED`/`REWORK` ÷ total), mean
   `execution_time_ms`, and mean `input_tokens` + `output_tokens`.
3. Flag a **systemic failure** when a group's failure rate is ≥40% over its
   last 5 entries — this is a candidate for tier escalation
   (`config/model_mapping.json` → `escalation_policy`) or a sub-agent prompt
   tweak (edit the relevant file under `sub_agents/`).
4. Flag **redundant context** when a group's mean `input_tokens` exceeds its
   tier's `max_input_tokens_per_task` (`config/model_mapping.json`) on
   ≥3 of its last 5 entries — this is a candidate for tightening the task
   packet (smaller `inputs`, more targeted file excerpts) rather than
   escalating tier.
5. Flag a **demotion candidate** when a group has ≥5 consecutive `DONE`
   entries with no `REWORK` — per `escalation_policy.demote_after_consecutive_successes`,
   trial the next-cheaper tier for that agent and record the experiment below.
6. For every flag raised, append an entry below describing the observation,
   the adjustment made (prompt edit, tier change, routing rule), and set
   `Status: OPEN`. On the next PLAN phase, check whether the adjusted group's
   metrics improved and update that entry's `Result`/`Status` in place
   (this is the one exception to append-only: updating the *outcome* fields
   of your own still-`OPEN` entries is allowed; the observation/adjustment
   text itself is never rewritten).
7. Apply `safety_guardrails.json` → `pii_scrubbing` and
   `structural_data_masking` to anything quoted from logs before writing it
   into this file.

## Entry format

```
## [YYYY-MM-DD] <short title>
- Observation: what drifted, failed repeatedly, or looked wasteful
- Hypothesis: suspected cause
- Adjustment: concrete change (prompt tweak, tier rebinding, routing rule)
- Result: outcome after the adjustment ran (fill in on a later cycle)
- Status: OPEN | VALIDATED | REVERTED
```

---

## [2026-06-11] Ledger initialized
- Observation: Fresh deployment of the Ranaik Fabel-5 engine into the Academic repository. No execution history yet.
- Hypothesis: n/a (bootstrap entry).
- Adjustment: Default tier bindings set per `config/model_mapping.json`; demotion trials disabled until ≥5 cycles of history exist.
- Result: pending first real execution cycles.
- Status: OPEN
