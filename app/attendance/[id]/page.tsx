import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AttendanceForm from "./attendance-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function MarkAttendancePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Authenticate user.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // 2. Find BSIS 2B-G2.
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("id, code")
    .eq("code", "BSIS 2B-G2")
    .eq("academic_year", "2026-2027")
    .eq("term", "1st Semester")
    .maybeSingle();

  if (classError) {
    throw new Error(classError.message);
  }

  if (!classData) {
    notFound();
  }

  // 3. Retrieve the selected attendance session.
  const { data: session, error: sessionError } = await supabase
    .from("attendance_sessions")
    .select("id, label, session_date")
    .eq("id", id)
    .eq("class_id", classData.id)
    .maybeSingle();

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  if (!session) {
    notFound();
  }

  // 4. Check user permissions.
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

  const canMark =
    Boolean(admin) ||
    officer?.role === "president" ||
    officer?.role === "secretary";

  // 5. Retrieve active class enrollments.
  const { data: enrollments, error: enrollmentError } = await supabase
    .from("class_enrollments")
    .select("student_id")
    .eq("class_id", classData.id)
    .eq("is_active", true);

  if (enrollmentError) {
    throw new Error(enrollmentError.message);
  }

  const studentIds = (enrollments ?? []).map(
    (enrollment) => enrollment.student_id,
  );

  type Student = {
    id: string;
    student_number: string;
    full_name: string;
  };

  let students: Student[] = [];

  // 6. Retrieve students' names and numbers.
  if (studentIds.length > 0) {
    const { data, error } = await supabase
      .from("students")
      .select("id, student_number, full_name")
      .in("id", studentIds)
      .order("full_name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    students = data ?? [];
  }

  // 7. Load previously saved attendance statuses.
  const initialStatuses: Record<string, string> = {};

  if (studentIds.length > 0) {
    const { data: existingRecords, error } = await supabase
      .from("attendance_records")
      .select("student_id, status")
      .eq("session_id", session.id)
      .in("student_id", studentIds);

    if (error) {
      throw new Error(error.message);
    }

    for (const record of existingRecords ?? []) {
      initialStatuses[record.student_id] = record.status;
    }
  }

  return (
    <main className="min-h-screen bg-[#F6F8FC] px-4 py-8 text-[#17263D] sm:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* PAGE HEADER */}
        <header>
          <Link
            href="/attendance"
            className="inline-flex items-center text-sm font-semibold text-[#2448A5] transition-colors hover:text-[#172B52]"
          >
            ← Back to Attendance Sessions
          </Link>

          <div className="mt-7 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#2448A5]">
                Attendly / Attendance
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#172B52] sm:text-4xl">
                {canMark ? "Mark Attendance" : "View Attendance"}
              </h1>

              <p className="mt-3 text-sm text-slate-500">
                BSIS 2B-G2 • Class Attendance Monitoring
              </p>
            </div>

            <span className="rounded-full bg-[#EAF0FF] px-4 py-2 text-xs font-semibold text-[#2448A5]">
              {canMark ? "Editing Enabled" : "Read Only"}
            </span>
          </div>
        </header>

        {/* SESSION INFORMATION BANNER */}
        <section className="rounded-2xl bg-gradient-to-r from-[#172B52] to-[#2448A5] p-6 text-white shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
            Current Attendance Session
          </p>

          <h2 className="mt-3 break-words text-2xl font-bold sm:text-3xl">
            {session.label}
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
            {canMark
              ? "Record student attendance and save your updates for this session."
              : "Review the recorded attendance for this session."}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white">
              Date: {session.session_date}
            </span>

            <span className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white">
              Active Students: {students.length}
            </span>
          </div>
        </section>

        {/* ATTENDANCE FORM */}
        <AttendanceForm
          sessionId={session.id}
          students={students}
          initialStatuses={initialStatuses}
          canMark={canMark}
        />

        {/* PAGE FOOTER */}
        <footer className="border-t border-[#DDE5F0] pt-5 text-center text-xs text-slate-400">
          Attendly • Class Attendance Monitoring
        </footer>
      </div>
    </main>
  );
}
