import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EnrollmentToggle from "./enrollment-toggle";

type Student = {
  id: string;
  student_number: string;
  full_name: string;
  is_active: boolean;
};

export default async function StudentsPage() {
  const supabase = await createClient();

  // 1. Verify authentication.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // 2. Check administrator permissions.
  const { data: adminRecord } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const canManageStudents = Boolean(adminRecord);

  // 3. Find BSIS 2B-G2.
  const { data: classData, error: classError } = await supabase
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

  // 4. Retrieve ALL enrollments.
  // Do not filter by is_active here.
  const { data: enrollments, error: enrollmentError } = await supabase
    .from("class_enrollments")
    .select("student_id, is_active")
    .eq("class_id", classData.id);

  if (enrollmentError) {
    return <p>Enrollment error: {enrollmentError.message}</p>;
  }

  // 5. Map student IDs to enrollment status.
  const enrollmentMap = new Map(
    (enrollments ?? []).map((enrollment) => [
      enrollment.student_id,
      enrollment.is_active,
    ]),
  );

  const studentIds = Array.from(enrollmentMap.keys());

  let students: Student[] = [];

  // 6. Retrieve student details.
  if (studentIds.length > 0) {
    const { data, error } = await supabase
      .from("students")
      .select("id, student_number, full_name")
      .in("id", studentIds)
      .order("full_name", { ascending: true });

    if (error) {
      return <p>Student error: {error.message}</p>;
    }

    students = (data ?? []).map((student) => ({
      ...student,
      is_active: enrollmentMap.get(student.id) === true,
    }));
  }

  // 7. Calculate enrollment counts.
  const activeCount = students.filter((student) => student.is_active).length;

  const inactiveCount = students.filter((student) => !student.is_active).length;

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

          <h1 className="mt-2 text-3xl font-bold">G2 Student Roster</h1>

          <p className="mt-2 text-slate-600">
            BSIS 2B-G2 • AY {classData.academic_year} • {classData.term}
          </p>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Roster Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
            <div>
              <h2 className="text-xl font-semibold">Enrolled Students</h2>

              <p className="mt-1 text-sm text-slate-500">
                {activeCount} Active • {inactiveCount} Inactive
              </p>
            </div>

            {canManageStudents && (
              <Link
                href="/students/new"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                + Add Student
              </Link>
            )}
          </div>

          {/* Student Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-sm text-slate-600">
                <tr>
                  <th className="px-5 py-4 font-semibold">Student Number</th>
                  <th className="px-5 py-4 font-semibold">Full Name</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold">Actions</th>
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
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          student.is_active
                            ? "bg-green-50 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {student.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-5 py-4 align-middle">
                      {canManageStudents ? (
                        <div className="flex flex-wrap items-start justify-end gap-2">
                          {student.is_active && (
                            <Link
                              href={`/students/${student.id}/edit`}
                              className="
            inline-flex h-10 min-w-[72px]
            items-center justify-center
            whitespace-nowrap rounded-lg
            border border-slate-300 bg-white
            px-4 text-sm font-medium text-slate-700
            transition-colors duration-150
            hover:bg-slate-100"
                            >
                              Edit
                            </Link>
                          )}

                          <EnrollmentToggle
                            studentId={student.id}
                            active={student.is_active}
                          />
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}

                {students.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-12 text-center text-slate-500"
                    >
                      No students found in BSIS 2B-G2.
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
