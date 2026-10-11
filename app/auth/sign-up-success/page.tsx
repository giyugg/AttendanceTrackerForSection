
import Link from "next/link";

export default function Page() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#F6F8FC] px-4 py-10 text-[#17263D] sm:px-6">
      <div className="w-full max-w-lg space-y-8">

        {/* ATTENDLY BRANDING */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-3"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2448A5] text-xl font-bold text-white">
              A
            </span>

            <span className="text-2xl font-bold text-[#172B52]">
              Attendly
            </span>
          </Link>

          <p className="mt-3 text-sm text-slate-500">
            Class Attendance Monitoring
          </p>
        </div>

        {/* SUCCESS CARD */}
        <section className="overflow-hidden rounded-2xl border border-[#DDE5F0] bg-white shadow-sm">

          <div className="px-6 pb-6 pt-10 text-center sm:px-10">

            {/* SUCCESS ICON */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#15803D"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
                <path d="m8 16 2 2 5-5" />
              </svg>
            </div>

            <p className="mt-7 text-xs font-bold uppercase tracking-widest text-[#2448A5]">
              Registration Submitted
            </p>

            <h1 className="mt-3 text-3xl font-bold text-[#172B52]">
              Check your email!
            </h1>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              Thank you for signing up for Attendly.
              Please check your email inbox for your
              account confirmation link.
            </p>
          </div>

          {/* INSTRUCTIONS */}
          <div className="mx-6 mb-8 rounded-xl border border-[#DDE5F0] bg-[#F6F8FC] p-5 sm:mx-10">
            <h2 className="text-sm font-bold text-[#172B52]">
              What happens next?
            </h2>

            <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li>1. Open your email inbox.</li>
              <li>2. Find the account confirmation email.</li>
              <li>3. Click the confirmation link.</li>
              <li>4. Return to Attendly and sign in.</li>
            </ol>

            <p className="mt-4 text-xs leading-6 text-slate-500">
              Can't find the email? Check your spam
              or junk folder.
            </p>
          </div>

          {/* ACTIONS */}
          <div className="space-y-3 border-t border-[#DDE5F0] bg-[#FAFBFE] p-6 sm:px-10">
            <Link
              href="/auth/login"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#2448A5] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#172B52]"
            >
              Go to Sign In →
            </Link>

            <Link
              href="/"
              className="inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-slate-600 hover:text-[#2448A5]"
            >
              ← Back to Home
            </Link>
          </div>
        </section>

        <p className="text-center text-xs text-slate-400">
          Attendly • BSIS 2B-G2 • AY 2026–2027
        </p>
      </div>
    </main>
  );
}