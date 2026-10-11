
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AttendanceForm from "./attendance-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function MarkAttendancePage({
  params,
}: PageProps) {
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
  const { data: classData, error: classError } =
    await supabase
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
  const { data: session, error: sessionError } =
    await supabase
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
  const { data: admin, error: adminError } =
    await supabase
      .from("app_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

  const { data: officer, error: officerError } =
    await supabase
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
  const { data: enrollments, error: enrollmentError } =
    await supabase
      .from("class_enrollments")
      .select("student_id")
      .eq("class_id", classData.id)
      .eq("is_active", true);

  if (enrollmentError) {
    throw new Error(enrollmentError.message);
  }

  const studentIds = (enrollments ?? []).map(
    (enrollment) => enrollment.student_id
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
    const { data: existingRecords, error } =
      await supabase
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
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-4xl space-y-8">

        <header>
          <Link
            href="/attendance"
            className="text-sm text-slate-600 hover:underline"
          >
            ← Back to Attendance Sessions
          </Link>

          <p className="mt-6 text-sm font-semibold text-slate-500">
            ATTENDLY / ATTENDANCE
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            {canMark ? "Mark Attendance" : "View Attendance"}
          </h1>

          <p className="mt-2 text-slate-600">
            BSIS 2B-G2
          </p>
        </header>

        {/* Session Information */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">
            {session.label}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Date: {session.session_date}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Total Active Students: {students.length}
          </p>
        </section>

        {/* Attendance Form */}
        <AttendanceForm
          sessionId={session.id}
          students={students}
          initialStatuses={initialStatuses}
          canMark={canMark}
        />

      </div>
    </main>
  );
}