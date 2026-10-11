
export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />

        <header>
          <h1 className="text-3xl font-bold">
            Add New Student
          </h1>
          <p className="mt-2 text-slate-600">
            Loading student registration...
          </p>
        </header>

        <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-2">
            <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
            <div className="h-12 w-full animate-pulse rounded-lg bg-slate-200" />
          </div>

          <div className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
            <div className="h-12 w-full animate-pulse rounded-lg bg-slate-200" />
          </div>

          <div className="h-12 w-36 animate-pulse rounded-lg bg-slate-200" />
        </div>
      </div>
    </main>
  );
}
