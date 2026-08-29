import type { PacketEvent, ProtocolParticipant } from "@/types/protocol";

const deliveryStyle: Record<PacketEvent["delivery"], string> = {
  queued: "border-slate-300", "in-flight": "border-blue-400", delivered: "border-emerald-400", dropped: "border-red-400 opacity-70", suppressed: "border-amber-400",
};

export function PacketJourney({ events, participants, cursor }: { events: readonly PacketEvent[]; participants: readonly ProtocolParticipant[]; cursor: number }) {
  const name = (id: string) => participants.find(participant => participant.id === id)?.label ?? id;
  return (
    <ol className="space-y-3" aria-label="MQTT packet journey">
      {events.map((event, index) => (
        <li key={event.id} aria-current={index === cursor ? "step" : undefined} className={`rounded-xl border-l-4 bg-white p-4 shadow-sm ${deliveryStyle[event.delivery]} ${index === cursor ? "ring-2 ring-blue-500" : ""}`}>
          <div className="flex flex-wrap items-center gap-2">
            <strong className="rounded bg-slate-900 px-2 py-1 text-sm text-white">{event.packet}</strong>
            <span>{name(event.from)} <span aria-hidden>→</span> {name(event.to)}</span>
            {event.qos !== undefined && <span className="rounded bg-blue-50 px-2 text-sm">QoS {event.qos}</span>}
            {event.duplicate && <span className="rounded bg-amber-100 px-2 text-sm font-semibold">DUP</span>}
            {event.retained && <span className="rounded bg-violet-100 px-2 text-sm font-semibold">RETAIN</span>}
            <span className="ml-auto text-sm capitalize text-slate-600">{event.delivery}</span>
          </div>
          {event.topic && <code className="mt-2 block break-all text-sm text-blue-800">{event.topic}</code>}
          <p className="mt-3 text-sm"><b>Exam revision:</b> {event.explanation}</p>
          <p className="mt-1 text-sm text-amber-900"><b>Misconception check:</b> {event.misconception}</p>
        </li>
      ))}
    </ol>
  );
}
