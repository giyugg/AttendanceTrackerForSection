import Link from "next/link";
import { requireRole } from "@/lib/access";
import AddStudentForm from "./add-student-form";

export default async function NewStudentPage() {
  await requireRole(["admin"]);

  return (
    <main className="min-h-screen bg-[#F6F8FC] px-4 py-8 text-[#17263D] sm:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Back Navigation */}
        <Link
          href="/students"
          className="inline-flex items-center text-sm font-semibold text-[#2448A5] hover:text-[#172B52]"
        >
          ← Back to Student Roster
        </Link>

        {/* Page Header */}
        <header>
          <p className="text-xs font-bold uppercase tracking-widest text-[#2448A5]">
            Attendly / Students
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#172B52] sm:text-4xl">
            Add New Student
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Register a new student under BSIS 2B-G2. Enter the student&apos;s
            information below.
          </p>
        </header>

        {/* Student Registration Form */}
        <AddStudentForm />

        {/* Page Footer */}
        <footer className="border-t border-[#DDE5F0] pt-5 text-center text-xs text-slate-400">
          Attendly • Class Attendance Monitoring
        </footer>
      </div>
    </main>
  );
}
