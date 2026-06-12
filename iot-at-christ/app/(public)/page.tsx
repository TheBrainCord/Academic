import Link from 'next/link'
import { CircuitBoard, Lightbulb, GraduationCap, ArrowRight } from 'lucide-react'

// Public homepage — works with zero configuration and no login.
// Middleware sends already-signed-in users straight to their dashboard.
export default function HomePage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="text-center pt-8 pb-2 space-y-4">
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-christ-navy leading-tight">
          Learn IoT hands-on.
          <br />
          <span className="text-christ-saffron">No hardware needed.</span>
        </h1>
        <p className="max-w-xl mx-auto text-sm sm:text-base font-body text-christ-navy/60">
          Wire Arduino, ESP32 and Raspberry Pi circuits in your browser, learn how every sensor
          really works and where industry uses it — then turn your best idea into a research paper.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            href="/lab"
            className="inline-flex items-center gap-2 rounded-md bg-christ-saffron px-5 py-2.5 text-sm font-body font-semibold text-white hover:bg-christ-saffron/90 transition-colors"
          >
            <CircuitBoard className="h-4 w-4" /> Open the Virtual Lab
          </Link>
          <Link
            href="/ideas"
            className="inline-flex items-center gap-2 rounded-md border border-christ-navy/20 bg-white px-5 py-2.5 text-sm font-body font-semibold text-christ-navy hover:border-christ-saffron/50 transition-colors"
          >
            <Lightbulb className="h-4 w-4" /> Browse Research Ideas
          </Link>
        </div>
      </section>

      {/* What you can do */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-christ-navy/10 bg-white p-5 space-y-2">
          <CircuitBoard className="h-6 w-6 text-christ-saffron" />
          <h2 className="font-display font-semibold text-christ-navy">Simulate real hardware</h2>
          <p className="text-xs font-body text-christ-navy/60">
            Drag sensors onto the bench, wire them to an Arduino Uno, ESP32 or Raspberry Pi, test
            your connections, and watch live readings stream into a serial monitor — exactly like
            the real thing, minus the burnt fingers.
          </p>
          <Link href="/lab" className="inline-flex items-center gap-1 text-xs font-body text-christ-saffron hover:underline">
            Start wiring <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="rounded-lg border border-christ-navy/10 bg-white p-5 space-y-2">
          <GraduationCap className="h-6 w-6 text-christ-green" />
          <h2 className="font-display font-semibold text-christ-navy">Learn how parts work</h2>
          <p className="text-xs font-body text-christ-navy/60">
            Every component has a built-in guide: the physics inside it, how to wire it safely, and
            real examples of where the IoT industry uses it — from smart parking in Bengaluru to
            cold-chain vaccine logging.
          </p>
          <Link href="/lab" className="inline-flex items-center gap-1 text-xs font-body text-christ-green hover:underline">
            Tap any ⓘ in the lab <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="rounded-lg border border-christ-navy/10 bg-white p-5 space-y-2">
          <Lightbulb className="h-6 w-6 text-christ-gold" />
          <h2 className="font-display font-semibold text-christ-navy">Find a research direction</h2>
          <p className="text-xs font-body text-christ-navy/60">
            23 curated, publishable IoT project ideas across healthcare, agriculture, smart cities,
            defence and more — each with its open research question, hardware list and suggested
            venues.
          </p>
          <Link href="/ideas" className="inline-flex items-center gap-1 text-xs font-body text-christ-gold hover:underline">
            Explore the Idea Bank <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </section>

      {/* Challenges teaser */}
      <section className="rounded-lg border border-christ-navy/10 bg-white p-6 text-center space-y-2">
        <h2 className="font-display font-bold text-christ-navy text-xl">
          Six guided wiring challenges, zero risk
        </h2>
        <p className="max-w-lg mx-auto text-xs font-body text-christ-navy/60">
          Light your first LED, build a hostel-room weather station, prototype a campus parking
          sensor — each challenge checks your wiring live and teaches the mistake before you'd ever
          make it on a real board.
        </p>
        <p className="text-xs font-body text-christ-navy/40">
          Enrolled at Christ University?{' '}
          <Link href="/auth/login" className="text-christ-saffron hover:underline">
            Sign in
          </Link>{' '}
          for lessons, missions, XP and the full Research Lab.
        </p>
      </section>
    </div>
  )
}
