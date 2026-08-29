export type ParticipantRole = "publisher" | "broker" | "subscriber";
export type QosLevel = 0 | 1 | 2;
export type PacketKind =
  | "CONNECT" | "CONNACK" | "SUBSCRIBE" | "SUBACK" | "PUBLISH"
  | "PUBACK" | "PUBREC" | "PUBREL" | "PUBCOMP" | "DISCONNECT";
export type DeliveryState = "queued" | "in-flight" | "delivered" | "dropped" | "suppressed";
export type QosHandshakeState = "none" | "awaiting-puback" | "awaiting-pubrec" | "awaiting-pubcomp" | "complete";
export type ConnectionState = "disconnected" | "connecting" | "connected";
export type SessionState = "new" | "present" | "expired";
export type FaultAction = "drop" | "duplicate" | "reconnect";

export interface ProtocolParticipant {
  id: string;
  label: string;
  role: ParticipantRole;
  clientId?: string;
}

export interface PayloadContract {
  kind: "telemetry" | "command" | "command-ack" | "state" | "will";
  contentType: "application/json";
  required: readonly string[];
  example: Readonly<Record<string, unknown>>;
}

export interface ProtocolReference {
  label: string;
  url: string;
  section?: string;
}

export interface PacketEvent {
  id: string;
  packet: PacketKind;
  from: string;
  to: string;
  topic?: string;
  qos?: QosLevel;
  packetId?: number;
  duplicate?: boolean;
  retained?: boolean;
  delivery: DeliveryState;
  handshake: QosHandshakeState;
  payload?: Readonly<Record<string, unknown>>;
  explanation: string;
  misconception: string;
}

export interface ProtocolScenario {
  id: string;
  title: string;
  summary: string;
  participants: readonly ProtocolParticipant[];
  topicHierarchy: readonly string[];
  qosExplanations: Readonly<Record<QosLevel, string>>;
  payloadContracts: readonly PayloadContract[];
  initialEvents: readonly PacketEvent[];
  explanatoryText: readonly string[];
  references: readonly ProtocolReference[];
  verifiedOn: `${number}-${number}-${number}`;
}

export interface ProtocolLabState {
  events: readonly PacketEvent[];
  cursor: number;
  paused: boolean;
  connection: ConnectionState;
  session: SessionState;
  deliveredPacketIds: readonly number[];
  retainedTopics: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
}
