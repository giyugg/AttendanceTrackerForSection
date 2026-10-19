import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/access";
import EditStudentForm from "./edit-student-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditStudentPage({ params }: PageProps) {
  const { id } = await params;
  const { supabase } = await requireRole(["admin"]);

  // Find the BSIS 2B-G2 class.
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("id")
    .eq("code", "BSIS 2B-G2")
    .eq("academic_year", "2026-2027")
    .eq("term", "1st Semester")
    .maybeSingle();

  if (classError || !classData) {
    notFound();
  }

  // Verify this student is actively enrolled in G2.
  const { data: enrollment, error: enrollmentError } = await supabase
    .from("class_enrollments")
    .select("student_id")
    .eq("class_id", classData.id)
    .eq("student_id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (enrollmentError || !enrollment) {
    notFound();
  }

  // Load the existing student details.
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id, student_number, full_name, last_name, first_name, middle_initial")
    .eq("id", id)
    .maybeSingle();

  if (studentError || !student) {
    notFound();
  }

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
            Edit Student Information
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Update student information for BSIS 2B-G2. Changes will be saved to
            the student record.
          </p>
        </header>

        {/* Edit Form */}
        <EditStudentForm student={student} />

        {/* Page Footer */}
        <footer className="border-t border-[#DDE5F0] pt-5 text-center text-xs text-slate-400">
          Attendly • Class Attendance Monitoring
        </footer>
      </div>
    </main>
  );
}
