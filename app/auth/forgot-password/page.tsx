
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function Page() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#F6F8FC] px-4 py-10 text-[#17263D] sm:px-6">

      <div className="w-full max-w-md space-y-8">

        {/* BRANDING */}
        <header className="text-center">
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
        </header>

        {/* PAGE DESCRIPTION */}
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[#2448A5]">
            Account Recovery
          </p>
        </div>

        {/* EXISTING PASSWORD RECOVERY FORM */}
        <ForgotPasswordForm />

        {/* BACK NAVIGATION */}
        <div className="text-center">
          <Link
            href="/auth/login"
            className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-[#2448A5] hover:text-[#172B52] hover:underline"
          >
            ← Back to Sign In
          </Link>
        </div>

        <p className="text-center text-xs text-slate-400">
          Attendly • BSIS 2B-G2 • AY 2026–2027
        </p>
      </div>

    </main>
  );
}