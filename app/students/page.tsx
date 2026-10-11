
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Student = {
  id: string;
  student_number: string;
  full_name: string;
};

export default async function StudentsPage() {
  const supabase = await createClient();

  // 1. Check if the user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // Check whether the current user can edit students.
const { data: adminRecord } = await supabase
  .from("app_admins")
  .select("user_id")
  .eq("user_id", user.id)
  .maybeSingle();

const canManageStudents = Boolean(adminRecord);

  // 2. Find BSIS 2B Group 2
  const { data: classData, error: classError } =
    await supabase
      .from("classes")
      .select("id, code, academic_year, term")
      .eq("code", "BSIS 2B-G2")
      .eq("academic_year", "2026-2027")
      .eq("term", "1st Semester")
      .maybeSingle();

  if (classError) {
    return <p>Class error: {classError.message}</p>;
  }

  if (!classData) {
    return <p>G2 class not found or access denied.</p>;
  }

  // 3. Get active G2 enrollments
  const { data: enrollments, error: enrollmentError } =
    await supabase
      .from("class_enrollments")
      .select("student_id")
      .eq("class_id", classData.id)
      .eq("is_active", true);

  if (enrollmentError) {
    return <p>Enrollment error: {enrollmentError.message}</p>;
  }

  const studentIds = (enrollments ?? []).map(
    (enrollment) => enrollment.student_id
  );

  // 4. Get the enrolled students' information
  let students: Student[] = [];

  if (studentIds.length > 0) {
    const { data, error } = await supabase
      .from("students")
      .select("id, student_number, full_name")
      .in("id", studentIds)
      .order("full_name", { ascending: true });

    if (error) {
      return <p>Student error: {error.message}</p>;
    }

    students = data ?? [];
  }

  // 5. Display the roster
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Back to Dashboard
          </Link>

          <p className="mt-6 text-sm font-semibold text-slate-500">
            ATTENDLY / STUDENTS
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            G2 Student Roster
          </h1>

          <p className="mt-2 text-slate-600">
            BSIS 2B-G2 • AY {classData.academic_year} •{" "}
            {classData.term}
          </p>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
            <div>
              <h2 className="text-xl font-semibold">
                Enrolled Students
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Active students in Group 2
              </p>
            </div>

            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
              {students.length} Active
            </span>
            <Link
                href="/students/new"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
                + Add Student
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-sm text-slate-600">
                <tr>
                  <th className="px-5 py-4 font-semibold">
                    Student Number
                  </th>
                  <th className="px-5 py-4 font-semibold">
                    Full Name
                  </th>
                  <th className="px-5 py-4 font-semibold">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="px-5 py-4 text-sm">
                      {student.student_number}
                    </td>
                    <td className="px-5 py-4 text-sm font-medium">
                      {student.full_name}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}

                {students.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-5 py-12 text-center text-slate-500"
                    >
                      No active G2 students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}