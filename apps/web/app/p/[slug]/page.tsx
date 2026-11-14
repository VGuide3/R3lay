export default function PublicCampaignPage() {
  return (
    <main className="mx-auto max-w-3xl p-8 text-center">
      <div className="rounded-3xl border border-violet-500/30 bg-slate-900 p-10 shadow-2xl">
        <p className="text-sm uppercase tracking-[0.2em] text-violet-400">Demo Campaign</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">Connect your wallet to get started.</h1>
        <p className="mt-4 text-slate-300">
          Review the asset permissions and sign the request to continue.
        </p>
        <button className="mt-8 rounded-xl bg-violet-600 px-5 py-3 font-medium text-white">Connect wallet</button>
      </div>
    </main>
  );
}
