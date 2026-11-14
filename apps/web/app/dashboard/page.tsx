export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-violet-400">Workspace</p>
          <h1 className="text-3xl font-semibold">Demo Workspace</h1>
        </div>
        <button className="rounded-lg bg-violet-600 px-4 py-2 font-medium text-white">Create campaign</button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <StatCard label="Campaigns" value="2" />
        <StatCard label="Connections" value="200" />
        <StatCard label="Health" value="healthy" />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Panel title="Recent events">
          <ul className="space-y-2 text-sm text-slate-300">
            <li>connection.created — wallet 0xAB… connected on evm</li>
            <li>grant.granted — USDC approved</li>
            <li>deployment.health_changed — healthy → degraded</li>
          </ul>
        </Panel>

        <Panel title="Campaigns">
          <ul className="space-y-2 text-sm text-slate-300">
            <li>Demo Campaign • live</li>
            <li>Launch Sprint • draft</li>
          </ul>
        </Panel>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="mb-4 font-semibold text-white">{title}</h2>
      {children}
    </div>
  );
}
