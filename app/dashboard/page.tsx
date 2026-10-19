import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  await connection (); // Ensure the database connection is established
  // Connect to Supabase using the logged-in user's session
  const supabase = await createClient();

  // 1. Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  const { data: admin, error: adminError } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  // 2. Get the BSIS 2B class
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
    return (
      <main className="p-8">
        <h1>Class not found or access denied.</h1>
        <p>Check your BSIS 2B account permissions.</p>
      </main>
    );
  }

  // 3. Retrieve active enrolled students
  const { data: activeEnrollments, error: studentError } = await supabase
    .from("class_enrollments")
    .select("student_id")
    .eq("class_id", classData.id)
    .eq("is_active", true);

  if (studentError) {
    return <p>Student error: {studentError.message}</p>;
  }

  const activeStudentIds = (activeEnrollments ?? []).map(
    (enrollment) => enrollment.student_id,
  );

  // 4. Get the latest attendance session
  const { data: latestSession, error: sessionError } = await supabase
    .from("attendance_sessions")
    .select("id, label, session_date")
    .eq("class_id", classData.id)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sessionError) {
    return <p>Session error: {sessionError.message}</p>;
  }

  // 5. Retrieve attendance for currently active students
  let attendanceRecords: { status: string }[] = [];

  if (latestSession && activeStudentIds.length > 0) {
    const { data, error } = await supabase
      .from("attendance_records")
      .select("status")
      .eq("session_id", latestSession.id)
      .in("student_id", activeStudentIds);

    if (error) {
      return <p>Attendance error: {error.message}</p>;
    }

    attendanceRecords = data ?? [];
  }

  // 6. Calculate attendance statistics
  const totalStudents = activeStudentIds.length;
  const totalMarked = attendanceRecords.length;

  const present = attendanceRecords.filter(
    (record) => record.status === "present",
  ).length;

  const late = attendanceRecords.filter(
    (record) => record.status === "late",
  ).length;

  const absent = attendanceRecords.filter(
    (record) => record.status === "absent",
  ).length;

  const excused = attendanceRecords.filter(
    (record) => record.status === "excused",
  ).length;

  const notMarked = Math.max(0, totalStudents - totalMarked);

  const cards = [
    { label: "Total Students", value: totalStudents },
    { label: "Present", value: present },
    { label: "Late", value: late },
    { label: "Absent", value: absent },
    { label: "Excused", value: excused },
    { label: "Not Marked", value: notMarked },
  ];

  // 7. Display the dashboard
  return (
    <main className="min-h-screen bg-[#F6F8FC] px-4 py-8 text-[#17263D] sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Dashboard Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-widest text-[#2448A5]">
              ATTENDLY
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#172B52] sm:text-4xl">
              Class Dashboard
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              BSIS 2B-G2 • AY {classData.academic_year} • {classData.term}
            </p>
          </div>

          <div className="rounded-full bg-[#EAF0FF] px-4 py-2 text-sm font-semibold text-[#2448A5]">
            BSIS 2B-G2
          </div>
        </header>

        {/* Dashboard Navigation */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/students"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-700 sm:w-auto"
          >
            View G2 Student Roster →
          </Link>
          <Link
            href="/attendance"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 sm:w-auto"
          >
            Manage Attendance →
          </Link>
          {!adminError && admin && (
            <Link
              href="/admin/accounts"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 sm:w-auto"
            >
              Create Account
            </Link>
          )}
        </div>

        {/* Welcome Banner */}
        <section className="rounded-2xl bg-gradient-to-r from-[#172B52] to-[#2448A5] p-6 text-white shadow-sm sm:p-8">
          <p className="text-sm font-medium text-blue-100">
            Academic Year {classData.academic_year}
          </p>

          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
            Welcome to Attendly!
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-7 text-blue-100">
            Your central workspace for monitoring attendance, managing students,
            and reviewing BSIS 2B-G2 class records.
          </p>

          <Link
            href="/attendance"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-bold text-[#2448A5] transition-colors hover:bg-blue-50"
          >
            Manage Attendance →
          </Link>
        </section>

        {/* Statistics Cards */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-[#172B52]">
            Attendance Overview
          </h2>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-[#DDE5F0] bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <p className="text-sm font-medium text-slate-500">
                  {card.label}
                </p>

                <p className="mt-4 text-3xl font-bold text-[#2448A5]">
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Latest Attendance Session */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Latest Attendance Session</h2>

          {latestSession ? (
            <div className="mt-4 space-y-3">
              <p>
                <strong>Session:</strong> {latestSession.label}
              </p>

              <p>
                <strong>Date:</strong> {latestSession.session_date}
              </p>

              <p>
                <strong>Attendance:</strong> {totalMarked} of {totalStudents}{" "}
                students marked
              </p>

              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: `${
                      totalStudents > 0
                        ? Math.min(100, (totalMarked / totalStudents) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <p className="mt-4 text-slate-500">
              No attendance sessions created yet.
            </p>
          )}
        </section>

        <footer className="text-center text-sm text-slate-500">
          Attendly — Class Attendance Monitoring System
        </footer>
      </div>
    </main>
  );
}
