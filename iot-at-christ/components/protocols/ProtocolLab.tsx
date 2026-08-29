"use client";

import { useEffect, useReducer } from "react";
import { mqttScenario } from "@/content/protocols/mqtt";
import { createProtocolState, transition } from "@/lib/protocols/transitions";
import { PacketJourney } from "./PacketJourney";

const control = "min-h-12 rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600";

export function ProtocolLab() {
  const [state, dispatch] = useReducer(transition, mqttScenario.initialEvents, createProtocolState);
  useEffect(() => {
    if (state.paused) return;
    const timer = window.setTimeout(() => dispatch({ type: "step" }), 900);
    return () => window.clearTimeout(timer);
  }, [state.cursor, state.paused]);

  return (
    <section className="mx-auto max-w-6xl space-y-6 rounded-2xl bg-slate-50 p-4 text-slate-900 md:p-8" aria-labelledby="protocol-lab-title">
      <header>
        <p className="font-semibold uppercase tracking-wide text-blue-700">Offline classroom simulation</p>
        <h2 id="protocol-lab-title" className="text-3xl font-bold">{mqttScenario.title}</h2>
        <p className="mt-2 max-w-3xl text-slate-700">{mqttScenario.summary} No public broker or network connection is used.</p>
      </header>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Simulation controls">
        <button className={control} onClick={() => dispatch({ type: "pause" })}>{state.paused ? "▶ Play" : "⏸ Pause"}</button>
        <button className={control} onClick={() => dispatch({ type: "step" })}>Step</button>
        <button className={control} onClick={() => dispatch({ type: "replay" })}>Replay</button>
        <button className={control} onClick={() => dispatch({ type: "drop" })}>Drop packet</button>
        <button className={control} onClick={() => dispatch({ type: "duplicate" })}>Duplicate</button>
        <button className={control} onClick={() => dispatch({ type: "reconnect", sessionPresent: true })}>Reconnect</button>
        <button className={control} onClick={() => dispatch({ type: "reset", events: mqttScenario.initialEvents })}>Reset</button>
      </div>
      <div className="rounded-lg bg-slate-900 p-3 text-white" aria-live="polite">
        Packet {Math.min(state.cursor + 1, state.events.length)} of {state.events.length} · Connection: {state.connection} · Session: {state.session}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <PacketJourney events={state.events} participants={mqttScenario.participants} cursor={state.cursor} />
        <aside className="space-y-5">
          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h3 className="text-xl font-bold">QoS revision</h3>
            {([0, 1, 2] as const).map(qos => <p className="mt-3 text-sm" key={qos}><b>QoS {qos}:</b> {mqttScenario.qosExplanations[qos]}</p>)}
          </section>
          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h3 className="text-xl font-bold">Topic hierarchy</h3>
            <ul className="mt-2 space-y-1">{mqttScenario.topicHierarchy.map(topic => <li key={topic}><code className="break-all text-xs">{topic}</code></li>)}</ul>
          </section>
          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h3 className="text-xl font-bold">Failure & state checklist</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm">{mqttScenario.explanatoryText.map(text => <li key={text}>{text}</li>)}</ul>
          </section>
          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h3 className="text-xl font-bold">Payload contracts</h3>
            {mqttScenario.payloadContracts.map(contract => <details className="mt-2" key={contract.kind}><summary className="cursor-pointer font-semibold">{contract.kind}</summary><code className="mt-1 block overflow-auto rounded bg-slate-100 p-2 text-xs">{JSON.stringify(contract.example)}</code></details>)}
          </section>
        </aside>
      </div>
      <footer className="text-xs text-slate-600">Verified {mqttScenario.verifiedOn}. {mqttScenario.references.map((reference, index) => <span key={reference.url}>{index > 0 && " · "}<a className="underline" href={reference.url} target="_blank" rel="noreferrer">{reference.label}</a></span>)}</footer>
    </section>
  );
}
