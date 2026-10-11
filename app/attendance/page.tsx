import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreateSessionForm from "./create-session-form";

export default async function AttendancePage() {
  const supabase = await createClient();

  // Verify authentication.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // Retrieve BSIS 2B-G2.
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("id, code, academic_year, term")
    .eq("code", "BSIS 2B-G2")
    .eq("academic_year", "2026-2027")
    .eq("term", "1st Semester")
    .maybeSingle();

  if (classError) {
    throw new Error(classError.message);
  }

  if (!classData) {
    return <p>G2 class not found or access denied.</p>;
  }

  // Determine whether the user can create sessions.
  const { data: admin, error: adminError } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: officer, error: officerError } = await supabase
    .from("class_officers")
    .select("role")
    .eq("class_id", classData.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError || officerError) {
    throw new Error("Unable to verify permissions.");
  }

  const canCreate =
    Boolean(admin) ||
    officer?.role === "president" ||
    officer?.role === "secretary";

  // Retrieve existing attendance sessions.
  const { data: sessions, error: sessionError } = await supabase
    .from("attendance_sessions")
    .select("id, session_date, label")
    .eq("class_id", classData.id)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  return (
    <main className="min-h-screen bg-[#F6F8FC] px-4 py-8 text-[#17263D] sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* PAGE HEADER */}
        <header>
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm font-semibold text-[#2448A5] transition-colors hover:text-[#172B52]"
          >
            ← Back to Dashboard
          </Link>

          <div className="mt-7">
            <p className="text-xs font-bold uppercase tracking-widest text-[#2448A5]">
              Attendly / Attendance
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#172B52] sm:text-4xl">
              Attendance Management
            </h1>

            <p className="mt-3 text-sm text-slate-500">
              BSIS 2B-G2 • AY {classData.academic_year} • {classData.term}
            </p>
          </div>
        </header>

        {/* WELCOME BANNER */}
        <section className="rounded-2xl bg-gradient-to-r from-[#172B52] to-[#2448A5] p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
                Class Attendance
              </p>

              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                Manage your class attendance
              </h2>

              <p className="mt-3 text-sm leading-7 text-blue-100">
                Create attendance sessions, manage class records, and keep track
                of student attendance in one place.
              </p>
            </div>

            <Link
              href="/attendance/history"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-bold text-[#2448A5] transition-colors hover:bg-blue-50"
            >
              View Attendance History →
            </Link>
          </div>
        </section>

        {/* ATTENDANCE OVERVIEW */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-[#172B52]">
            Attendance Overview
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Total Sessions */}
            <div className="rounded-2xl border border-[#DDE5F0] bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Sessions Created
              </p>

              <p className="mt-3 text-3xl font-bold text-[#2448A5]">
                {sessions?.length ?? 0}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Total attendance sessions for BSIS 2B-G2
              </p>
            </div>

            {/* Access Level */}
            <div className="rounded-2xl border border-[#DDE5F0] bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Attendance Access
              </p>

              <p className="mt-3 text-xl font-bold text-[#172B52]">
                {canCreate ? "Attendance Management" : "View Only"}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                {canCreate
                  ? "You can create and manage attendance sessions."
                  : "You can view available attendance sessions."}
              </p>
            </div>
          </div>
        </section>

        {/* CREATE ATTENDANCE SESSION */}

        {/* SUBJECT MANAGEMENT — ADMIN ONLY */}
        {Boolean(admin) && (
          <section className="flex flex-col gap-4 rounded-2xl border border-[#DDE5F0] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="text-lg font-bold text-[#172B52]">
                Class Subjects
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Register and manage the subjects used for attendance.
              </p>
            </div>

            <Link
              href="/attendance/subjects"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#2448A5] px-5 py-3 text-sm font-semibold text-white hover:bg-[#172B52]"
            >
              Manage Subjects →
            </Link>
          </section>
        )}

        {canCreate && (
          <section id="create-session" className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#2448A5]">
                New Attendance
              </p>

              <h2 className="mt-2 text-xl font-bold text-[#172B52]">
                Create Attendance Session
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Set up a new attendance session for BSIS 2B-G2.
              </p>
            </div>

            <CreateSessionForm />
          </section>
        )}

        {/* ATTENDANCE SESSIONS */}
        <section className="overflow-hidden rounded-2xl border border-[#DDE5F0] bg-white shadow-sm">
          {/* Sessions Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DDE5F0] p-5 sm:p-6">
            <div>
              <h2 className="text-xl font-bold text-[#172B52]">
                Attendance Sessions
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {sessions?.length ?? 0} sessions created
              </p>
            </div>

            <Link
              href="/attendance/history"
              className="text-sm font-semibold text-[#2448A5] hover:text-[#172B52] hover:underline"
            >
              View All History →
            </Link>
          </div>

          {/* Session List */}
          <div className="divide-y divide-[#DDE5F0]">
            {sessions?.map((session) => (
              <article
                key={session.id}
                className="flex flex-col gap-4 p-5 transition-colors hover:bg-[#FAFBFE] sm:flex-row sm:items-center sm:justify-between sm:p-6"
              >
                {/* Session Information */}
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#2448A5]">
                    Attendance Session
                  </p>

                  <h3 className="mt-2 break-words text-lg font-bold text-[#172B52]">
                    {session.label}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Date: {session.session_date}
                  </p>
                </div>

                {/* Session Action */}
                <Link
                  href={`/attendance/${session.id}`}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-[#DDE5F0] bg-white px-5 py-3 text-sm font-semibold text-[#2448A5] transition-colors hover:border-[#2448A5] hover:bg-[#EAF0FF]"
                >
                  {canCreate ? "Mark Attendance →" : "View Attendance →"}
                </Link>
              </article>
            ))}

            {/* Empty State */}
            {(!sessions || sessions.length === 0) && (
              <div className="px-5 py-12 text-center sm:px-8">
                <h3 className="text-lg font-bold text-[#172B52]">
                  No Attendance Sessions Yet
                </h3>

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                  {canCreate
                    ? "Create your first attendance session using the form above."
                    : "No attendance sessions are available to view yet."}
                </p>
              </div>
            )}
          </div>

          {/* Session List Footer */}
          <div className="border-t border-[#DDE5F0] bg-[#FAFBFE] px-5 py-4 sm:px-6">
            <p className="text-xs font-medium text-slate-500">
              Showing {sessions?.length ?? 0} attendance sessions
              {" • "}BSIS 2B-G2
            </p>
          </div>
        </section>

        {/* PAGE FOOTER */}
        <footer className="border-t border-[#DDE5F0] pt-5 text-center text-xs text-slate-400">
          Attendly • Class Attendance Monitoring
        </footer>
      </div>
    </main>
  );
}
