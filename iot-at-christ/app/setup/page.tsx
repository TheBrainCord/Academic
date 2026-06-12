// Static page shown by middleware when the deployment has no Supabase
// configuration yet (e.g. fresh Vercel project before env vars are added).
// Must not import any Supabase client — it has to render with zero env.
export default function SetupPage() {
  return (
    <div className="min-h-screen bg-christ-bg flex items-center justify-center px-4">
      <div className="max-w-lg w-full rounded-lg border border-christ-navy/10 bg-white p-8 space-y-4">
        <p className="text-3xl" aria-hidden>
          🛠️
        </p>
        <h1 className="text-2xl font-display font-bold text-christ-navy">
          Almost there — configuration needed
        </h1>
        <p className="text-sm font-body text-christ-navy/70">
          IoT at CHRIST is deployed, but this environment isn&apos;t connected to its
          database yet. An administrator needs to add the Supabase environment
          variables and redeploy.
        </p>
        <div className="rounded-md bg-christ-bg p-4">
          <p className="text-xs font-display font-semibold text-christ-navy mb-2">
            For the administrator
          </p>
          <ol className="list-decimal pl-4 space-y-1 text-xs font-body text-christ-navy/70">
            <li>
              Open the Vercel project → Settings → Environment Variables and add{' '}
              <code className="font-mono text-christ-saffron">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
              <code className="font-mono text-christ-saffron">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{' '}
              (full list in <code className="font-mono">DEPLOYMENT.md</code>).
            </li>
            <li>Trigger a new deployment so the build picks the values up.</li>
          </ol>
        </div>
        <p className="text-xs font-body text-christ-navy/40">
          Students: nothing is broken on your side — please check back soon.
        </p>
      </div>
    </div>
  )
}
