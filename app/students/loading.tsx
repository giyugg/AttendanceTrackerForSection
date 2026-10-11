export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="h-8 w-64 rounded bg-slate-200" />
        <div className="mt-6 h-5 w-48 rounded bg-slate-200" />
        <div className="mt-8 h-80 rounded-xl bg-slate-200" />
      </div>
    </main>
  );
}