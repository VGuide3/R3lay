export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center justify-center p-6">
      <div className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <div className="mt-6 space-y-4">
          <button className="w-full rounded-lg bg-violet-600 px-4 py-3 font-medium text-white">Continue with magic link</button>
          <button className="w-full rounded-lg border border-slate-700 px-4 py-3 font-medium text-slate-200">Continue with GitHub</button>
          {process.env.ENABLE_DEMO_LOGIN === 'true' && (
            <div className="mt-4 space-y-2 rounded-lg border border-slate-700 bg-slate-800 p-3 text-sm text-slate-200">
              <div>Demo login:</div>
              <button className="w-full rounded-md bg-slate-700 px-3 py-2">Sign in as Owner</button>
              <button className="w-full rounded-md bg-slate-700 px-3 py-2">Sign in as Operator</button>
              <button className="w-full rounded-md bg-slate-700 px-3 py-2">Sign in as Viewer</button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
