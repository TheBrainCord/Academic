'use client'

const SESSION_KEY = 'iot-at-christ:telemetry:session'

export type SimulatorEventType = 'lab_view' | 'challenge_completed' | 'sketch_run'

/** Stable anonymous id for this browser, used to count unique visitors. */
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server'
  try {
    let id = window.localStorage.getItem(SESSION_KEY)
    if (!id) {
      id = crypto.randomUUID()
      window.localStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return 'unknown'
  }
}

/**
 * Fire-and-forget usage event for the Virtual Lab / Simulator. Failures are
 * swallowed — telemetry must never break the simulator for students.
 */
export function trackEvent(eventType: SimulatorEventType, data: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  try {
    const body = JSON.stringify({
      eventType,
      sessionId: getSessionId(),
      path: window.location.pathname,
      ...data,
    })
    fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch {
    // Telemetry is best-effort only.
  }
}
