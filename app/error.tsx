"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function ErrorPage({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F6F8FC] px-5 py-10 text-[#17263D]">
      <div role="alert" className="w-full max-w-lg rounded-2xl border border-[#DDE5F0] bg-white p-6 shadow-sm sm:p-10">
        <p className="text-xs font-bold uppercase tracking-widest text-[#2448A5]">Attendly</p>
        <h1 className="mt-4 text-2xl font-bold text-[#172B52]">Unable to load this page</h1>
        <p className="mt-4 text-sm leading-7 text-slate-500">The server couldn&apos;t finish loading the page. Try again, or return to sign in if your session has expired.</p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => { router.refresh(); reset(); })}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#2448A5] px-5 py-3 text-sm font-bold text-white hover:bg-[#172B52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2448A5] focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {pending ? "Retrying..." : "Try again"}
          </button>
          <Link href="/auth/login" className="inline-flex min-h-11 items-center text-sm font-semibold text-[#2448A5] hover:underline">Back to sign in</Link>
        </div>
      </div>
    </main>
  );
}
