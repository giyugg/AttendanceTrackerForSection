import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EnrollmentToggle from "./enrollment-toggle";
import DeleteStudentButton from "./delete-student-button";

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
    <main className="min-h-screen bg-[#F6F8FC] px-4 py-8 text-[#17263D] sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* PAGE HEADER */}
        <header>
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm font-medium text-[#2448A5] transition hover:text-[#172B52]"
          >
            ← Back to Dashboard
          </Link>

          <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#2448A5]">
                Attendly / Students
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#172B52] sm:text-4xl">
                G2 Student Roster
              </h1>

              <p className="mt-3 text-sm text-slate-500">
                BSIS 2B-G2 • AY {classData.academic_year} • {classData.term}
              </p>
            </div>

            <span className="rounded-full bg-[#EAF0FF] px-4 py-2 text-sm font-semibold text-[#2448A5]">
              G2 Workspace
            </span>
          </div>
        </header>

        {/* ENROLLMENT OVERVIEW */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-[#172B52]">
            Enrollment Overview
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {/* Total Students */}
            <div className="rounded-2xl border border-[#DDE5F0] bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Total Students
              </p>

              <p className="mt-3 text-3xl font-bold text-[#172B52]">
                {students.length}
              </p>
            </div>

            {/* Active Students */}
            <div className="rounded-2xl border border-[#DDE5F0] bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Active Students
              </p>

              <p className="mt-3 text-3xl font-bold text-emerald-600">
                {activeCount}
              </p>
            </div>

            {/* Inactive Students */}
            <div className="rounded-2xl border border-[#DDE5F0] bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Inactive Students
              </p>

              <p className="mt-3 text-3xl font-bold text-slate-500">
                {inactiveCount}
              </p>
            </div>
          </div>
        </section>

        {/* STUDENT MANAGEMENT */}
        <section className="overflow-hidden rounded-2xl border border-[#DDE5F0] bg-white shadow-sm">
          {/* Section Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DDE5F0] p-5 sm:p-6">
            <div>
              <h2 className="text-xl font-bold text-[#172B52]">
                Student Management
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                View and manage your BSIS 2B-G2 students.
              </p>
            </div>

            {canManageStudents && (
              <Link
                href="/students/new"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#2448A5] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#172B52]"
              >
                + Add Student
              </Link>
            )}
          </div>

          {/* MOBILE STUDENT CARDS */}
          <div className="space-y-3 p-4 md:hidden">
            {students.map((student) => (
              <article
                key={student.id}
                className="rounded-xl border border-[#DDE5F0] bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="break-words font-bold text-[#172B52]">
                      {student.full_name}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {student.student_number}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      student.is_active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {student.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#DDE5F0] pt-4">
                  <Link
                    href={`/students/${student.id}/attendance`}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-[#DDE5F0] px-4 text-sm font-semibold text-[#2448A5] hover:bg-[#EAF0FF]"
                  >
                    History
                  </Link>

                  {canManageStudents && (
                    <>
                      {student.is_active && (
                        <Link
                          href={`/students/${student.id}/edit`}
                          className="inline-flex h-10 items-center justify-center rounded-lg border border-[#DDE5F0] px-4 text-sm font-semibold text-[#172B52] hover:bg-slate-50"
                        >
                          Edit
                        </Link>
                      )}

                      <EnrollmentToggle
                        studentId={student.id}
                        active={student.is_active}
                      />

                      <EnrollmentToggle
                        studentId={student.id}
                        active={student.is_active}
                      />

                      <DeleteStudentButton
                        studentId={student.id}
                        studentNumber={student.student_number}
                        studentName={student.full_name}
                      />
                    </>
                  )}
                </div>
              </article>
            ))}

            {students.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-500">
                No students found in BSIS 2B-G2.
              </p>
            )}
          </div>

          {/* DESKTOP STUDENT TABLE */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[800px] text-left">
              <thead className="bg-[#F6F8FC] text-sm text-[#172B52]">
                <tr>
                  <th className="px-6 py-4 font-semibold">Student Number</th>

                  <th className="px-6 py-4 font-semibold">Full Name</th>

                  <th className="px-6 py-4 font-semibold">Status</th>

                  <th className="px-6 py-4 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#DDE5F0]">
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="transition-colors hover:bg-[#F6F8FC]"
                  >
                    <td className="px-6 py-5 text-sm font-medium text-[#2448A5]">
                      {student.student_number}
                    </td>

                    <td className="px-6 py-5 text-sm font-semibold text-[#172B52]">
                      {student.full_name}
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          student.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {student.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-6 py-5 align-middle">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Link
                          href={`/students/${student.id}/attendance`}
                          className="inline-flex h-10 items-center justify-center rounded-lg border border-[#DDE5F0] bg-white px-4 text-sm font-medium text-[#2448A5] hover:bg-[#EAF0FF]"
                        >
                          History
                        </Link>

                        {canManageStudents && (
                          <>
                            {student.is_active && (
                              <Link
                                href={`/students/${student.id}/edit`}
                                className="inline-flex h-10 items-center justify-center rounded-lg border border-[#DDE5F0] bg-white px-4 text-sm font-medium text-[#172B52] hover:bg-slate-50"
                              >
                                Edit
                              </Link>
                            )}

                            <EnrollmentToggle
                              studentId={student.id}
                              active={student.is_active}
                            />
                            
                            <DeleteStudentButton
                              studentId={student.id}
                              studentNumber={student.student_number}
                              studentName={student.full_name}
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {students.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      No students found in BSIS 2B-G2.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* TABLE FOOTER */}
          <div className="border-t border-[#DDE5F0] bg-[#FAFBFE] px-5 py-4 sm:px-6">
            <p className="text-xs font-medium text-slate-500">
              Showing {students.length} enrolled students • BSIS 2B-G2
            </p>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-[#DDE5F0] pt-5 text-center text-xs text-slate-400">
          Attendly • Class Attendance Monitoring
        </footer>
      </div>
    </main>
  );
}
