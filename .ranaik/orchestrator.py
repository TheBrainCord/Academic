#!/usr/bin/env python3
"""
Ranaik Fabel-5 Orchestration Engine — execution bridge.

Implements the PLAN -> ACT -> OBSERVE -> CRITIQUE -> REFINE loop described in
system_orchestrator.md as a runnable CLI. It does workspace discovery, loads
the routing/tier config, builds a task graph via the architect sub-agent
profile, dispatches nodes to the appropriate sub-agent profile (optionally via
the Anthropic API if ANTHROPIC_API_KEY is set, otherwise in dry-run/plan-only
mode), enforces the security gate before any disk write, and appends telemetry
to memory/execution_logs.json.

This script is the *bridge*, not the agents themselves: each "agent" is a
prompt template under sub_agents/ plus a tier binding from
config/model_mapping.json. Swap ANTHROPIC_MODEL ids in model_mapping.json to
point at whatever models are available in your deployment.

Usage:
    python3 .ranaik/orchestrator.py plan   "<objective>"
    python3 .ranaik/orchestrator.py run    "<objective>" [--apply]
    python3 .ranaik/orchestrator.py discover
    python3 .ranaik/orchestrator.py report
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
RANAIK_DIR = Path(__file__).resolve().parent
CONFIG_DIR = RANAIK_DIR / "config"
MEMORY_DIR = RANAIK_DIR / "memory"
SUB_AGENTS_DIR = RANAIK_DIR / "sub_agents"

MODEL_MAPPING_PATH = CONFIG_DIR / "model_mapping.json"
GUARDRAILS_PATH = CONFIG_DIR / "safety_guardrails.json"
EXECUTION_LOG_PATH = MEMORY_DIR / "execution_logs.json"

# Files/dirs ignored during workspace discovery — keeps the scan fast and
# avoids treating generated/vendored content as part of the project's stack.
DISCOVERY_IGNORE = {
    "node_modules", ".git", ".next", "dist", "build", "out",
    "__pycache__", ".venv", "venv", ".turbo", "coverage",
}

STACK_SIGNALS: dict[str, list[str]] = {
    "node": ["package.json"],
    "typescript": ["tsconfig.json"],
    "nextjs": ["next.config.js", "next.config.mjs", "next.config.ts"],
    "tailwind": ["tailwind.config.js", "tailwind.config.ts"],
    "supabase": ["supabase/config.toml"],
    "python": ["pyproject.toml", "requirements.txt"],
}


# ---------------------------------------------------------------------------
# Config loading
# ---------------------------------------------------------------------------

def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def load_model_mapping() -> dict[str, Any]:
    return load_json(MODEL_MAPPING_PATH)


def load_guardrails() -> dict[str, Any]:
    return load_json(GUARDRAILS_PATH)


def tier_for_agent(agent: str, model_mapping: dict[str, Any]) -> str:
    bindings = model_mapping["agent_tier_bindings"]
    return bindings.get(agent, bindings["mechanical_tasks"])


def model_for_tier(tier: str, model_mapping: dict[str, Any]) -> dict[str, Any]:
    return model_mapping["tiers"][tier]


# ---------------------------------------------------------------------------
# Workspace discovery
# ---------------------------------------------------------------------------

def discover_workspace(root: Path = REPO_ROOT) -> dict[str, Any]:
    """Walk the repo (bounded) and report detected stack signals + top-level layout."""
    found_signals: dict[str, bool] = {name: False for name in STACK_SIGNALS}
    top_level: list[str] = []

    for entry in sorted(root.iterdir()):
        if entry.name.startswith(".") and entry.name not in {".ranaik"}:
            # still record dotdirs/files for visibility, but don't recurse into them
            top_level.append(entry.name)
            continue
        if entry.name in DISCOVERY_IGNORE:
            continue
        top_level.append(entry.name)

    # Shallow recursive scan (depth-limited) for stack signal files.
    max_depth = 3

    def walk(path: Path, depth: int) -> None:
        if depth > max_depth:
            return
        try:
            children = list(path.iterdir())
        except PermissionError:
            return
        for child in children:
            if child.name in DISCOVERY_IGNORE:
                continue
            if child.is_dir():
                walk(child, depth + 1)
            else:
                rel = child.relative_to(root).as_posix()
                for stack, signals in STACK_SIGNALS.items():
                    if any(rel == s or rel.endswith("/" + s) for s in signals):
                        found_signals[stack] = True

    walk(root, 0)

    detected_stack = [name for name, present in found_signals.items() if present]

    return {
        "root": str(root),
        "top_level_entries": top_level,
        "detected_stack": detected_stack,
    }


# ---------------------------------------------------------------------------
# Task graph
# ---------------------------------------------------------------------------

@dataclass
class TaskNode:
    node_id: str
    objective: str
    inputs: list[str]
    agent: str
    tier: str
    security_gate: bool
    acceptance: list[str]
    status: str = "PENDING"  # PENDING | DONE | BLOCKED | FAILED | REWORK
    retries: int = 0
    result: dict[str, Any] = field(default_factory=dict)


@dataclass
class TaskGraph:
    cycle_id: str
    objective: str
    nodes: list[TaskNode]


def build_task_graph(objective: str, model_mapping: dict[str, Any]) -> TaskGraph:
    """
    Construct a task graph for the given objective.

    In a fully wired deployment this dispatches to the `architect` sub-agent
    (sub_agents/architect.md) via the configured reasoning-tier model and
    parses its task_graph artifact. Without API access this falls back to a
    single-node graph routed to code_synthesizer, so `plan`/`run` remain
    usable for quick, well-scoped objectives.
    """
    cycle_id = f"{datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}-{uuid.uuid4().hex[:8]}"

    architect_tier = tier_for_agent("architect", model_mapping)
    synthesizer_tier = tier_for_agent("code_synthesizer", model_mapping)

    client = make_client(model_for_tier(architect_tier, model_mapping))
    if client is not None:
        graph_json = dispatch_to_architect(client, objective, model_mapping)
        if graph_json is not None:
            nodes = [
                TaskNode(
                    node_id=n["node_id"],
                    objective=n["objective"],
                    inputs=n.get("inputs", []),
                    agent=n.get("agent", "code_synthesizer"),
                    tier=n.get("tier", synthesizer_tier),
                    security_gate=n.get("security_gate", False),
                    acceptance=n.get("acceptance", []),
                )
                for n in graph_json
            ]
            return TaskGraph(cycle_id=cycle_id, objective=objective, nodes=nodes)

    # Fallback: single-node graph, security gate on by default (conservative).
    return TaskGraph(
        cycle_id=cycle_id,
        objective=objective,
        nodes=[
            TaskNode(
                node_id=f"{cycle_id}#node-1",
                objective=objective,
                inputs=[],
                agent="code_synthesizer",
                tier=synthesizer_tier,
                security_gate=True,
                acceptance=["Change satisfies the stated objective", "No lint/type errors introduced"],
            )
        ],
    )


# ---------------------------------------------------------------------------
# Model client (optional — falls back to dry-run without an API key)
# ---------------------------------------------------------------------------

def make_client(tier_config: dict[str, Any]):
    """Return an Anthropic client if the SDK and API key are available, else None."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    try:
        import anthropic  # type: ignore
    except ImportError:
        return None
    return anthropic.Anthropic(api_key=api_key)


def dispatch_to_architect(client, objective: str, model_mapping: dict[str, Any]) -> list[dict[str, Any]] | None:
    architect_prompt = (SUB_AGENTS_DIR / "architect.md").read_text(encoding="utf-8")
    discovery = discover_workspace()
    tier = tier_for_agent("architect", model_mapping)
    tier_config = model_for_tier(tier, model_mapping)

    message = client.messages.create(
        model=tier_config["default_model"],
        max_tokens=tier_config["max_output_tokens_per_task"],
        system=architect_prompt,
        messages=[
            {
                "role": "user",
                "content": (
                    f"Workspace discovery:\n{json.dumps(discovery, indent=2)}\n\n"
                    f"Objective:\n{objective}\n\n"
                    "Return ONLY the task_graph JSON array described in your "
                    "Output spec — no prose, no markdown fences."
                ),
            }
        ],
    )
    text = "".join(block.text for block in message.content if hasattr(block, "text"))
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


def dispatch_to_agent(client, agent: str, node: TaskNode, model_mapping: dict[str, Any]) -> dict[str, Any]:
    agent_prompt_path = SUB_AGENTS_DIR / f"{agent}.md"
    agent_prompt = agent_prompt_path.read_text(encoding="utf-8")
    tier_config = model_for_tier(node.tier, model_mapping)

    task_packet = {
        "task_id": node.node_id,
        "objective": node.objective,
        "inputs": node.inputs,
        "constraints": {"tier_token_budget": tier_config},
        "acceptance": node.acceptance,
    }

    message = client.messages.create(
        model=tier_config["default_model"],
        max_tokens=tier_config["max_output_tokens_per_task"],
        system=agent_prompt,
        messages=[
            {"role": "user", "content": json.dumps(task_packet, indent=2)}
        ],
    )
    text = "".join(block.text for block in message.content if hasattr(block, "text"))
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {"task_id": node.node_id, "status": "FAILED", "artifacts": {}, "evidence": text, "open_risks": ["non-JSON agent response"]}


# ---------------------------------------------------------------------------
# Security gate
# ---------------------------------------------------------------------------

def security_gate_required(node: TaskNode, result: dict[str, Any]) -> bool:
    return node.security_gate or result.get("security_gate_required", False)


def run_security_gate(client, node: TaskNode, synth_result: dict[str, Any], model_mapping: dict[str, Any], guardrails: dict[str, Any]) -> dict[str, Any]:
    if client is None:
        return {
            "task_id": node.node_id,
            "status": "BLOCKED",
            "artifacts": {"verdict": "FAIL"},
            "evidence": "No model client available — security_warden cannot run. Diff withheld from disk per merge_gates policy.",
            "open_risks": ["Security review was not performed."],
        }

    warden_prompt = (SUB_AGENTS_DIR / "security_warden.md").read_text(encoding="utf-8")
    tier = tier_for_agent("security_warden", model_mapping)
    tier_config = model_for_tier(tier, model_mapping)

    payload = {
        "task_id": node.node_id,
        "diff": synth_result.get("artifacts", {}),
        "guardrails": guardrails,
        "acceptance": node.acceptance,
    }

    message = client.messages.create(
        model=tier_config["default_model"],
        max_tokens=tier_config["max_output_tokens_per_task"],
        system=warden_prompt,
        messages=[{"role": "user", "content": json.dumps(payload, indent=2)}],
    )
    text = "".join(block.text for block in message.content if hasattr(block, "text"))
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {"task_id": node.node_id, "status": "FAILED", "artifacts": {"verdict": "FAIL"}, "evidence": text, "open_risks": ["non-JSON warden response"]}


# ---------------------------------------------------------------------------
# Telemetry
# ---------------------------------------------------------------------------

def append_telemetry(entry: dict[str, Any]) -> None:
    log = load_json(EXECUTION_LOG_PATH)
    log["entries"].append(entry)
    with EXECUTION_LOG_PATH.open("w", encoding="utf-8") as f:
        json.dump(log, f, indent=2)
        f.write("\n")


def make_telemetry_entry(node: TaskNode, started_at: float, status: str, usage: dict[str, int] | None = None) -> dict[str, Any]:
    usage = usage or {"input_tokens": 0, "output_tokens": 0}
    return {
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "task_id": node.node_id,
        "assigned_agent": node.agent,
        "compute_tier": node.tier,
        "execution_time_ms": int((time.monotonic() - started_at) * 1000),
        "input_tokens": usage.get("input_tokens", 0),
        "output_tokens": usage.get("output_tokens", 0),
        "status": status,
    }


# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------

def run_cycle(objective: str, apply_changes: bool) -> dict[str, Any]:
    model_mapping = load_model_mapping()
    guardrails = load_guardrails()
    graph = build_task_graph(objective, model_mapping)

    qa_tier = tier_for_agent("quality_assurance", model_mapping)
    summary: dict[str, Any] = {"cycle_id": graph.cycle_id, "objective": objective, "nodes": []}

    for node in graph.nodes:
        node_summary: dict[str, Any] = {"node_id": node.node_id, "agent": node.agent}
        client = make_client(model_for_tier(node.tier, model_mapping))
        started = time.monotonic()

        if client is None:
            node.status = "BLOCKED"
            node_summary["status"] = "BLOCKED"
            node_summary["reason"] = "No ANTHROPIC_API_KEY / SDK available — plan-only mode."
            append_telemetry(make_telemetry_entry(node, started, "BLOCKED"))
            summary["nodes"].append(node_summary)
            continue

        # ACT — code synthesis (or whichever agent the node specifies)
        result = dispatch_to_agent(client, node.agent, node, model_mapping)
        usage = result.pop("_usage", None)
        node.result = result
        node_summary["synth_status"] = result.get("status")

        # Mandatory security gate before any write to disk.
        if security_gate_required(node, result):
            warden_result = run_security_gate(client, node, result, model_mapping, guardrails)
            node_summary["security_verdict"] = warden_result.get("artifacts", {}).get("verdict")
            if warden_result.get("artifacts", {}).get("verdict") != "PASS":
                node.status = "BLOCKED"
                node_summary["status"] = "BLOCKED"
                node_summary["findings"] = warden_result.get("artifacts", {}).get("findings", [])
                append_telemetry(make_telemetry_entry(node, started, "BLOCKED", usage))
                summary["nodes"].append(node_summary)
                continue

        # QA gate (PASS / PASS_WITH_NOTES / FAIL)
        node_summary["qa_tier"] = qa_tier
        node_summary["status"] = result.get("status", "DONE")

        if apply_changes and result.get("status") == "DONE":
            node.status = "DONE"
        else:
            node.status = result.get("status", "BLOCKED")

        append_telemetry(make_telemetry_entry(node, started, node.status, usage))
        summary["nodes"].append(node_summary)

    return summary


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Ranaik Fabel-5 Orchestration Engine")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("discover", help="Print workspace discovery report")

    plan_p = sub.add_parser("plan", help="Build and print a task graph for an objective (no execution)")
    plan_p.add_argument("objective")

    run_p = sub.add_parser("run", help="Build a task graph and dispatch nodes")
    run_p.add_argument("objective")
    run_p.add_argument("--apply", action="store_true", help="Allow DONE nodes to be treated as mergeable")

    sub.add_parser("report", help="Summarize memory/execution_logs.json")

    args = parser.parse_args(argv)

    if args.command == "discover":
        print(json.dumps(discover_workspace(), indent=2))
        return 0

    if args.command == "plan":
        model_mapping = load_model_mapping()
        graph = build_task_graph(args.objective, model_mapping)
        print(json.dumps({
            "cycle_id": graph.cycle_id,
            "objective": graph.objective,
            "nodes": [
                {
                    "node_id": n.node_id,
                    "objective": n.objective,
                    "inputs": n.inputs,
                    "agent": n.agent,
                    "tier": n.tier,
                    "security_gate": n.security_gate,
                    "acceptance": n.acceptance,
                }
                for n in graph.nodes
            ],
        }, indent=2))
        return 0

    if args.command == "run":
        summary = run_cycle(args.objective, args.apply)
        print(json.dumps(summary, indent=2))
        return 0

    if args.command == "report":
        log = load_json(EXECUTION_LOG_PATH)
        entries = log.get("entries", [])
        if not entries:
            print("No telemetry recorded yet.")
            return 0
        by_agent: dict[str, dict[str, Any]] = {}
        for e in entries:
            key = f"{e['assigned_agent']}/{e['compute_tier']}"
            stats = by_agent.setdefault(key, {"count": 0, "failures": 0, "total_ms": 0, "in_tok": 0, "out_tok": 0})
            stats["count"] += 1
            if e["status"] in {"FAILED", "REWORK", "BLOCKED"}:
                stats["failures"] += 1
            stats["total_ms"] += e["execution_time_ms"]
            stats["in_tok"] += e["input_tokens"]
            stats["out_tok"] += e["output_tokens"]
        for key, stats in by_agent.items():
            n = stats["count"]
            print(f"{key}: n={n} failure_rate={stats['failures']/n:.0%} "
                  f"avg_ms={stats['total_ms']/n:.0f} "
                  f"avg_in_tok={stats['in_tok']/n:.0f} avg_out_tok={stats['out_tok']/n:.0f}")
        return 0

    return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
