import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
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
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Dashboard Header */}
        <header>
          <p className="text-sm font-semibold text-slate-500">ATTENDLY</p>

          <h1 className="mt-2 text-3xl font-bold">BSIS 2B-G2 Dashboard</h1>

          <p className="mt-2 text-slate-600">
            AY {classData.academic_year} • {classData.term}
          </p>
        </header>

        {/* Student Roster Navigation Button */}
        <div>
          <Link
            href="/students"
            className="inline-flex rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
          >
            View G2 Student Roster →
          </Link>
          <Link
            href="/attendance"
            className="inline-flex rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
          >
            Manage Attendance →
          </Link>
        </div>

        {/* Statistics Cards */}
        <section>
          <h2 className="mb-4 text-xl font-semibold">Attendance Overview</h2>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm text-slate-500">{card.label}</p>

                <p className="mt-3 text-3xl font-bold">{card.value}</p>
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
