export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-8 p-8">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <p className="mb-3 text-sm uppercase tracking-[0.2em] text-violet-400">Relay</p>
        <h1 className="text-4xl font-semibold">Campaign infrastructure for wallet-connected landing pages.</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          Create campaigns, manage configs, run deterministic builds, attach domains, track wallet connections and grants,
          and stream live events to the dashboard.
        </p>
        <div className="mt-8 flex gap-4">
          <a href="/login" className="rounded-lg bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-500">Sign in</a>
          <a href="/dashboard" className="rounded-lg border border-slate-700 px-4 py-2 text-slate-200 hover:bg-slate-800">Dashboard</a>
        </div>
      </div>
    </main>
  );
}
