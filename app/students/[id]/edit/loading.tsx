export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="h-5 w-44 animate-pulse rounded bg-slate-200" />
        <div className="h-9 w-72 animate-pulse rounded bg-slate-200" />
        <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
          <div className="h-12 animate-pulse rounded bg-slate-200" />
          <div className="h-12 animate-pulse rounded bg-slate-200" />
          <div className="h-12 w-36 animate-pulse rounded bg-slate-200" />
        </div>
      </div>
    </main>
  );
}