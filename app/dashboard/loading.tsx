
export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <p className="text-sm font-semibold text-slate-500">
            ATTENDLY
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            BSIS 2B Dashboard
          </h1>

          <p className="mt-2 text-slate-600">
            Loading attendance information...
          </p>
        </header>

        <section>
          <h2 className="mb-4 text-xl font-semibold">
            Attendance Overview
          </h2>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-xl border border-slate-200 bg-white p-5"
              >
                <div className="h-4 w-24 rounded bg-slate-200" />
                <div className="mt-4 h-9 w-14 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </section>

        <section className="animate-pulse rounded-xl border border-slate-200 bg-white p-6">
          <div className="h-6 w-52 rounded bg-slate-200" />
          <div className="mt-6 h-4 w-40 rounded bg-slate-200" />
          <div className="mt-4 h-4 w-48 rounded bg-slate-200" />
          <div className="mt-6 h-3 w-full rounded bg-slate-200" />
        </section>
      </div>
    </main>
  );
}