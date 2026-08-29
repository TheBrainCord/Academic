import type { PacketEvent, ProtocolScenario } from "@/types/protocol";

const lesson = (event: Omit<PacketEvent, "explanation" | "misconception">, explanation: string, misconception: string): PacketEvent => ({
  ...event, explanation, misconception,
});

export const mqttScenario: ProtocolScenario = {
  id: "mqtt-delivery-lab",
  title: "MQTT: reliable messages on an unreliable link",
  summary: "An offline classroom simulation of a sensor publisher, MQTT broker, and dashboard subscriber.",
  participants: [
    { id: "sensor", label: "Room sensor (publisher)", role: "publisher", clientId: "room-204-sensor" },
    { id: "broker", label: "Campus broker", role: "broker" },
    { id: "dashboard", label: "Facilities dashboard (subscriber)", role: "subscriber", clientId: "facilities-board" },
  ],
  topicHierarchy: ["campus", "campus/christ", "campus/christ/room-204", "campus/christ/room-204/telemetry/temperature", "campus/christ/room-204/command/fan", "campus/christ/room-204/state/{desired,reported}", "campus/christ/room-204/status"],
  qosExplanations: {
    0: "At most once: one PUBLISH, with no protocol acknowledgement or retry.",
    1: "At least once: PUBLISH is retried until PUBACK; the receiver must tolerate duplicates.",
    2: "Exactly once to the MQTT receiver: PUBLISH/PUBREC/PUBREL/PUBCOMP prevents duplicate application delivery.",
  },
  payloadContracts: [
    { kind: "telemetry", contentType: "application/json", required: ["value", "unit", "observedAt"], example: { value: 24.1, unit: "°C", observedAt: "2026-08-29T10:00:00Z" } },
    { kind: "command", contentType: "application/json", required: ["commandId", "value", "expiresAt"], example: { commandId: "fan-104", value: "ON", expiresAt: "2026-08-29T10:05:00Z" } },
    { kind: "command-ack", contentType: "application/json", required: ["commandId", "status"], example: { commandId: "fan-104", status: "applied" } },
    { kind: "state", contentType: "application/json", required: ["value", "version"], example: { value: "ON", version: 8 } },
    { kind: "will", contentType: "application/json", required: ["online"], example: { online: false, reason: "connection-lost" } },
  ],
  initialEvents: [
    lesson({ id: "connect", packet: "CONNECT", from: "sensor", to: "broker", delivery: "delivered", handshake: "none" }, "CONNECT establishes the client identity, session preference, and optional Last Will.", "CONNECT does not itself publish sensor data."),
    lesson({ id: "connack", packet: "CONNACK", from: "broker", to: "sensor", delivery: "delivered", handshake: "none" }, "CONNACK tells the client whether the connection was accepted and whether a prior session exists.", "A TCP connection alone does not mean MQTT CONNECT was accepted."),
    lesson({ id: "subscribe", packet: "SUBSCRIBE", from: "dashboard", to: "broker", topic: "campus/christ/room-204/#", qos: 2, packetId: 1, delivery: "delivered", handshake: "none" }, "A topic filter can select a hierarchy; # matches all remaining levels.", "Subscribers subscribe to filters, not to publishers."),
    lesson({ id: "suback", packet: "SUBACK", from: "broker", to: "dashboard", packetId: 1, delivery: "delivered", handshake: "complete" }, "SUBACK reports the granted QoS for each requested filter.", "Requested QoS is not guaranteed to be granted."),
    lesson({ id: "publish", packet: "PUBLISH", from: "sensor", to: "broker", topic: "campus/christ/room-204/telemetry/temperature", qos: 2, packetId: 42, delivery: "in-flight", handshake: "awaiting-pubrec", payload: { value: 24.1, unit: "°C" } }, "QoS 2 begins a four-packet handshake and carries a packet identifier.", "Exactly once is scoped to the MQTT protocol hop, not every downstream business process."),
    lesson({ id: "pubrec", packet: "PUBREC", from: "broker", to: "sensor", packetId: 42, delivery: "delivered", handshake: "awaiting-pubcomp" }, "PUBREC records receipt so the sender can advance to PUBREL.", "PUBREC is not the final QoS 2 acknowledgement."),
    lesson({ id: "pubrel", packet: "PUBREL", from: "sensor", to: "broker", packetId: 42, delivery: "delivered", handshake: "awaiting-pubcomp" }, "PUBREL asks the receiver to complete the stored QoS 2 exchange.", "A repeated PUBREL must not cause a second application delivery."),
    lesson({ id: "pubcomp", packet: "PUBCOMP", from: "broker", to: "sensor", packetId: 42, delivery: "delivered", handshake: "complete" }, "PUBCOMP finishes QoS 2 and allows packet-id reuse.", "QoS 2 is not complete at PUBREC."),
  ],
  explanatoryText: [
    "A dropped QoS 0 message is lost; QoS 1/2 exchanges can retransmit with the DUP flag.",
    "Duplicate QoS 1 delivery is valid. Use commandId as an idempotency key, reject expired commands, and publish an acknowledgement containing that ID.",
    "With a non-zero session expiry, subscriptions and queued QoS messages can survive reconnect; a clean/expired session cannot.",
    "A retained message is the broker's latest value for a topic and is sent immediately to a new matching subscription; it is not message history.",
    "The broker publishes a configured Last Will after an ungraceful disconnect, but not after a normal DISCONNECT.",
    "A second connection using the same client ID displaces the first: client IDs identify MQTT sessions and must be unique.",
    "Desired state expresses intent; reported state records what the device actually applied. They can temporarily differ.",
  ],
  references: [
    { label: "OASIS MQTT Version 5.0", url: "https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html", section: "4.3 Quality of Service levels" },
    { label: "MQTT topic and session concepts", url: "https://mqtt.org/", section: "Learn MQTT" },
  ],
  verifiedOn: "2026-08-29",
};
