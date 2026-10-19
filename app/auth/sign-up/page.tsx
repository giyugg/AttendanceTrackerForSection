import Link from "next/link";
import { AccountRequestNotice } from "@/components/sign-up-form";

const benefits = [
  "Request access using your educational email",
  "Keep student records neatly organized",
  "Track every attendance session with ease",
];

export default function Page() {
  return (
    <main className="min-h-svh bg-[#F6F8FC] px-4 py-6 text-[#17263D] sm:px-6 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100svh-3rem)] max-w-6xl overflow-hidden rounded-3xl border border-[#DDE5F0] bg-white shadow-sm lg:grid-cols-2">
        <aside className="hidden flex-col justify-between bg-gradient-to-br from-[#172B52] to-[#2448A5] p-12 text-white lg:flex">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl font-bold text-[#2448A5]">A</span>
            <span>
              <span className="block text-2xl font-bold">Attendly</span>
              <span className="block text-xs text-blue-100">Class Attendance Monitoring</span>
            </span>
          </Link>

          <div className="my-12">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-blue-100">ACCOUNT ACCESS</span>
            <h2 className="mt-8 max-w-md text-4xl font-bold leading-tight tracking-tight xl:text-5xl">Your class, organized from day one.</h2>
            <p className="mt-6 max-w-md text-base leading-8 text-blue-100">
              Ask an administrator for account access to bring student records, attendance sessions, and class reports together in one convenient place.
            </p>
            <div className="mt-10 space-y-4">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3 text-sm text-blue-50">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs">✓</span>
                  {benefit}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/20 pt-6">
            <p className="text-sm font-semibold text-white">BSIS 2B-G2</p>
            <p className="mt-1 text-xs text-blue-100">Academic Year 2026–2027</p>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col px-5 py-7 sm:px-10 lg:px-14 lg:py-10">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="inline-flex items-center gap-2 lg:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2448A5] text-lg font-bold text-white">A</span>
              <span className="text-lg font-bold text-[#172B52]">Attendly</span>
            </Link>
            <Link href="/" className="ml-auto text-sm font-semibold text-[#2448A5] hover:text-[#172B52]">← Back to Home</Link>
          </div>

          <div className="flex flex-1 items-center justify-center py-10">
            <div className="w-full max-w-md"><AccountRequestNotice /></div>
          </div>

          <p className="text-center text-xs leading-6 text-slate-400">Attendly • Class Attendance Monitoring</p>
        </section>
      </div>
    </main>
  );
}
