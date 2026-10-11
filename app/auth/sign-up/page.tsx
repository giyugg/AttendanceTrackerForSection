
import Link from "next/link";
import { SignUpForm } from "@/components/sign-up-form";

export default function Page() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#F6F8FC] px-4 py-10 text-[#17263D] sm:px-6">

      <div className="w-full max-w-lg">

        {/* BACK NAVIGATION */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center text-sm font-semibold text-[#2448A5] hover:text-[#172B52]"
        >
          ← Back to Home
        </Link>

        {/* BRANDING */}
        <div className="mb-8 text-center">
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
            Class Attendance Monitoring • BSIS 2B-G2
          </p>
        </div>

        {/* EXISTING SIGN-UP FORM */}
        <SignUpForm />

        <p className="mt-8 text-center text-xs text-slate-400">
          Attendly • Academic Year 2026–2027
        </p>
      </div>
    </main>
  );
}