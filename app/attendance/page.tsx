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
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <header>
          <Link
            href="/dashboard"
            className="text-sm text-slate-600 hover:underline"
          >
            ← Back to Dashboard
          </Link>

          <p className="mt-6 text-sm font-semibold text-slate-500">
            ATTENDLY / ATTENDANCE
          </p>

          <h1 className="mt-2 text-3xl font-bold">Attendance Management</h1>

          <p className="mt-2 text-slate-600">
            BSIS 2B-G2 • AY {classData.academic_year} • {classData.term}
          </p>
        </header>

        {/* Attendance History Navigation */}
        <div>
          <Link
            href="/attendance/history"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
          >
            View Attendance History →
          </Link>
        </div>

        {canCreate && <CreateSessionForm />}

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-xl font-semibold">Attendance Sessions</h2>
            <p className="mt-1 text-sm text-slate-500">
              {sessions?.length ?? 0} sessions recorded
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {sessions?.map((session) => (
              <div
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-3 p-5"
              >
                <div>
                  <p className="font-semibold">{session.label}</p>

                  <p className="mt-1 text-sm text-slate-500">
                    {session.session_date}
                  </p>
                </div>

                <Link
                  href={`/attendance/${session.id}`}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                >
                  {canCreate ? "Mark Attendance →" : "View Attendance →"}
                </Link>
              </div>
            ))}

            {(!sessions || sessions.length === 0) && (
              <p className="p-8 text-center text-slate-500">
                No attendance sessions yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
