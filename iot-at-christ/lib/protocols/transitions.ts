import type { PacketEvent, ProtocolLabState } from "@/types/protocol";

export type ProtocolAction =
  | { type: "pause" }
  | { type: "step" }
  | { type: "replay" }
  | { type: "reset"; events?: readonly PacketEvent[] }
  | { type: "drop" }
  | { type: "duplicate" }
  | { type: "reconnect"; sessionPresent?: boolean };

export function createProtocolState(events: readonly PacketEvent[]): ProtocolLabState {
  return { events: events.map(copyEvent), cursor: 0, paused: true, connection: "connected", session: "new", deliveredPacketIds: [], retainedTopics: {} };
}

const copyEvent = (event: PacketEvent): PacketEvent => ({ ...event, payload: event.payload && { ...event.payload } });

export function transition(state: ProtocolLabState, action: ProtocolAction): ProtocolLabState {
  switch (action.type) {
    case "pause": return { ...state, paused: !state.paused };
    case "step": return advance(state);
    case "replay": return { ...state, cursor: 0, paused: false, deliveredPacketIds: [] };
    case "reset": return createProtocolState(action.events ?? state.events);
    case "drop": return changeCurrent(state, event => ({ ...event, delivery: "dropped", explanation: `${event.explanation} This injected loss lets you compare the QoS recovery path.`, misconception: `${event.misconception} Packet loss is expected on real networks.` }));
    case "duplicate": {
      const current = state.events[state.cursor];
      if (!current) return state;
      const duplicate = { ...copyEvent(current), id: `${current.id}-duplicate-${state.events.length}`, duplicate: true, delivery: current.qos === 2 && current.packetId !== undefined && state.deliveredPacketIds.includes(current.packetId) ? "suppressed" as const : "in-flight" as const, explanation: `${current.explanation} This copy has DUP set for retransmission.`, misconception: `${current.misconception} DUP signals a possible repeat; it does not mean corrupt data.` };
      return { ...state, events: [...state.events.slice(0, state.cursor + 1), duplicate, ...state.events.slice(state.cursor + 1)] };
    }
    case "reconnect": return { ...state, connection: "connected", session: action.sessionPresent ? "present" : "new", paused: true };
  }
}

function changeCurrent(state: ProtocolLabState, update: (event: PacketEvent) => PacketEvent): ProtocolLabState {
  if (!state.events[state.cursor]) return state;
  return { ...state, events: state.events.map((event, index) => index === state.cursor ? update(event) : event) };
}

function advance(state: ProtocolLabState): ProtocolLabState {
  const event = state.events[state.cursor];
  if (!event) return { ...state, paused: true };
  const delivered = event.delivery === "dropped" ? event : { ...event, delivery: event.delivery === "suppressed" ? "suppressed" as const : "delivered" as const };
  const ids = delivered.delivery === "delivered" && delivered.packet === "PUBLISH" && delivered.packetId !== undefined
    ? [...new Set([...state.deliveredPacketIds, delivered.packetId])] : state.deliveredPacketIds;
  const next = state.cursor + 1;
  return { ...state, events: state.events.map((item, index) => index === state.cursor ? delivered : item), cursor: next, deliveredPacketIds: ids, paused: next >= state.events.length };
}

export function retainedDelivery(template: PacketEvent, subscriberId: string): PacketEvent {
  return { ...copyEvent(template), id: `${template.id}-retained-${subscriberId}`, from: "broker", to: subscriberId, retained: true, delivery: "in-flight", explanation: "The broker immediately sends its retained snapshot to a new matching subscriber.", misconception: "Retained messages are one latest value per topic, not a replay log." };
}

export function lastWillDelivery(clientId: string, topic: string): PacketEvent {
  return { id: `will-${clientId}`, packet: "PUBLISH", from: "broker", to: "subscriber", topic, qos: 1, delivery: "in-flight", handshake: "awaiting-puback", payload: { online: false, clientId }, explanation: "The broker publishes the stored Last Will because the client connection ended unexpectedly.", misconception: "A graceful DISCONNECT suppresses the normal Last Will path." };
}
