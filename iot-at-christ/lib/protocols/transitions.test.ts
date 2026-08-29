import { describe, expect, it } from "vitest";
import { mqttScenario } from "@/content/protocols/mqtt";
import { createProtocolState, lastWillDelivery, retainedDelivery, transition } from "./transitions";

describe("MQTT protocol transitions", () => {
  it("delivers the normal QoS handshake", () => {
    let state = createProtocolState(mqttScenario.initialEvents);
    while (state.cursor < state.events.length) state = transition(state, { type: "step" });
    expect(state.events.every(event => event.delivery === "delivered")).toBe(true);
    expect(state.deliveredPacketIds).toContain(42);
  });
  it("keeps packet loss visible", () => {
    const state = transition(createProtocolState(mqttScenario.initialEvents), { type: "drop" });
    expect(state.events[0].delivery).toBe("dropped");
    expect(transition(state, { type: "step" }).events[0].delivery).toBe("dropped");
  });
  it("inserts a DUP retransmission", () => {
    const state = transition(createProtocolState(mqttScenario.initialEvents), { type: "duplicate" });
    expect(state.events[1].duplicate).toBe(true);
  });
  it("suppresses a repeated QoS 2 packet identifier", () => {
    const base = { ...createProtocolState([mqttScenario.initialEvents[4]]), deliveredPacketIds: [42] };
    expect(transition(base, { type: "duplicate" }).events[1].delivery).toBe("suppressed");
  });
  it("restores or creates session state on reconnect", () => {
    expect(transition(createProtocolState([]), { type: "reconnect", sessionPresent: true }).session).toBe("present");
    expect(transition(createProtocolState([]), { type: "reconnect" }).session).toBe("new");
  });
  it("marks retained delivery", () => expect(retainedDelivery(mqttScenario.initialEvents[4], "new-board").retained).toBe(true));
  it("creates an LWT publish", () => expect(lastWillDelivery("sensor", "room/status")).toMatchObject({ packet: "PUBLISH", payload: { online: false } }));
});
