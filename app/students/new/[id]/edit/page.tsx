
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditStudentForm from "./edit-student-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditStudentPage({
  params,
}: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Check authentication.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // Only administrators may edit student profiles.
  const { data: admin, error: adminError } =
    await supabase
      .from("app_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

  if (adminError) {
    throw new Error("Unable to verify administrator access.");
  }

  if (!admin) {
    return <main className="p-8">Access denied.</main>;
  }

  // Find the BSIS 2B-G2 class.
  const { data: classData, error: classError } =
    await supabase
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
  const { data: enrollment, error: enrollmentError } =
    await supabase
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
  const { data: student, error: studentError } =
    await supabase
      .from("students")
      .select("id, student_number, full_name")
      .eq("id", id)
      .maybeSingle();

  if (studentError || !student) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href="/students"
          className="text-sm text-slate-600 hover:underline"
        >
          ← Back to Student Roster
        </Link>

        <header>
          <h1 className="text-3xl font-bold">
            Edit Student Information
          </h1>

          <p className="mt-2 text-slate-600">
            Update student information for BSIS 2B-G2.
          </p>
        </header>

        <EditStudentForm student={student} />
      </div>
    </main>
  );
}