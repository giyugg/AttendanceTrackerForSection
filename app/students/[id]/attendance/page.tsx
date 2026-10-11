import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StudentReport, { type AttendanceEntry } from "./student-report";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function StudentAttendancePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Validate the student UUID.
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(id)) {
    notFound();
  }

  // 1. Verify authentication.
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
    .select("id, code, academic_year, term")
    .eq("code", "BSIS 2B-G2")
    .eq("academic_year", "2026-2027")
    .eq("term", "1st Semester")
    .maybeSingle();

  if (classError) {
    throw new Error("Unable to load G2 class.");
  }

  if (!classData) {
    notFound();
  }

  // 3. Verify the student belongs to G2.
  // Include both active and inactive enrollments.
  const { data: enrollment, error: enrollmentError } = await supabase
    .from("class_enrollments")
    .select("student_id, is_active")
    .eq("class_id", classData.id)
    .eq("student_id", id)
    .maybeSingle();

  if (enrollmentError) {
    throw new Error("Unable to load student enrollment.");
  }

  if (!enrollment) {
    notFound();
  }

  // 4. Retrieve student information.
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id, student_number, full_name")
    .eq("id", id)
    .maybeSingle();

  if (studentError) {
    throw new Error("Unable to load student details.");
  }

  if (!student) {
    notFound();
  }

  // 5. Retrieve all saved G2 attendance records
  // for this student, including historical records.
  const records: {
    session_id: string;
    status: string;
  }[] = [];

  const pageSize = 200;

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("attendance_records")
      .select("session_id, status")
      .eq("class_id", classData.id)
      .eq("student_id", student.id)
      .order("session_id", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error("Unable to load attendance records.");
    }

    const batch = data ?? [];
    records.push(...batch);

    if (batch.length < pageSize) {
      break;
    }
  }

  // 6. Retrieve session dates and names
  // for the saved attendance records.
  const sessionIds = [...new Set(records.map((record) => record.session_id))];

  const sessionMap = new Map<string, { label: string; date: string }>();

  // Batch queries to avoid oversized ID lists.
  for (let i = 0; i < sessionIds.length; i += 100) {
    const batchIds = sessionIds.slice(i, i + 100);

    const { data, error } = await supabase
      .from("attendance_sessions")
      .select("id, label, session_date")
      .eq("class_id", classData.id)
      .in("id", batchIds);

    if (error) {
      throw new Error("Unable to load session details.");
    }

    for (const session of data ?? []) {
      sessionMap.set(session.id, {
        label: session.label,
        date: session.session_date,
      });
    }
  }

  // 7. Combine records with session information.
  const entries: AttendanceEntry[] = records
    .flatMap((record) => {
      const session = sessionMap.get(record.session_id);

      if (!session) {
        return [];
      }

      return [
        {
          sessionId: record.session_id,
          label: session.label,
          date: session.date,
          status: record.status,
        },
      ];
    })
    .sort(
      (a, b) => b.date.localeCompare(a.date) || b.label.localeCompare(a.label),
    );

  // 8. Display the individual report.

  return (
    <main className="min-h-screen bg-[#F6F8FC] px-4 py-8 text-[#17263D] sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* PAGE HEADER */}
        <header>
          <Link
            href="/students"
            className="inline-flex items-center text-sm font-semibold text-[#2448A5] transition-colors hover:text-[#172B52]"
          >
            ← Back to Student Roster
          </Link>

          <div className="mt-7">
            <p className="text-xs font-bold uppercase tracking-widest text-[#2448A5]">
              Attendly / Student Report
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#172B52] sm:text-4xl">
              Student Attendance Report
            </h1>

            <p className="mt-3 text-sm text-slate-500">
              {classData.code} • AY {classData.academic_year}
              {" • "}
              {classData.term}
            </p>
          </div>
        </header>

        {/* REPORT BANNER */}
        <section className="rounded-2xl bg-gradient-to-r from-[#172B52] to-[#2448A5] p-6 text-white shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
            Individual Attendance
          </p>

          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
            Every student's attendance, organized.
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
            Review individual attendance records, explore attendance statistics,
            and download student reports for BSIS 2B-G2.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium">
              BSIS 2B-G2
            </span>

            <span className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium">
              Academic Year {classData.academic_year}
            </span>
          </div>
        </section>

        {/* STUDENT REPORT COMPONENT */}
        <StudentReport
          student={{
            fullName: student.full_name,
            studentNumber: student.student_number,
            isActive: enrollment.is_active,
          }}
          entries={entries}
        />

        {/* PAGE FOOTER */}
        <footer className="border-t border-[#DDE5F0] pt-5 text-center text-xs text-slate-400">
          Attendly • Class Attendance Monitoring
        </footer>
      </div>
    </main>
  );
}
