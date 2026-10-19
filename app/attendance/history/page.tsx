import Link from "next/link";
import { requireRole } from "@/lib/access";
import HistoryReport, { type HistorySession } from "./history-report";

export default async function AttendanceHistoryPage() {
  const { supabase } = await requireRole(["admin", "president", "secretary"]);

  // 2. Find BSIS 2B-G2
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
    return <main className="p-8">Class not found or access denied.</main>;
  }

  // 3. Retrieve the 50 most recent sessions
  const { data: sessions, error: sessionError } = await supabase
    .from("attendance_sessions")
    .select("id, label, session_date")
    .eq("class_id", classData.id)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  const sessionIds = (sessions ?? []).map((session) => session.id);

  // 4. Retrieve saved attendance records.
  // Include historical records of inactive students.
  const savedRecords: {
    session_id: string;
    status: string;
  }[] = [];

  if (sessionIds.length > 0) {
    const pageSize = 200;
    let offset = 0;

    // Pagination avoids Supabase's default row cap.
    while (true) {
      const { data, error } = await supabase
        .from("attendance_records")
        .select("session_id, status")
        .eq("class_id", classData.id)
        .in("session_id", sessionIds)
        .order("session_id", { ascending: true })
        .order("student_id", { ascending: true })
        .range(offset, offset + pageSize - 1);

      if (error) {
        throw new Error(error.message);
      }

      const batch = data ?? [];
      savedRecords.push(...batch);

      if (batch.length < pageSize) {
        break;
      }

      offset += pageSize;
    }
  }

  // 5. Calculate statistics per session
  const counts = new Map<
    string,
    {
      marked: number;
      present: number;
      late: number;
      absent: number;
      excused: number;
    }
  >();

  for (const record of savedRecords) {
    const current = counts.get(record.session_id) ?? {
      marked: 0,
      present: 0,
      late: 0,
      absent: 0,
      excused: 0,
    };

    current.marked++;

    switch (record.status) {
      case "present":
        current.present++;
        break;
      case "late":
        current.late++;
        break;
      case "absent":
        current.absent++;
        break;
      case "excused":
        current.excused++;
        break;
    }

    counts.set(record.session_id, current);
  }

  // 6. Prepare data for the report component
  const report: HistorySession[] = (sessions ?? []).map((session) => {
    const stats = counts.get(session.id) ?? {
      marked: 0,
      present: 0,
      late: 0,
      absent: 0,
      excused: 0,
    };

    return {
      id: session.id,
      label: session.label,
      date: session.session_date,
      ...stats,
    };
  });

  // 7. Render the page

  return (
    <main className="min-h-screen bg-[#F6F8FC] px-4 py-8 text-[#17263D] sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* PAGE HEADER */}
        <header>
          <Link
            href="/attendance"
            className="inline-flex items-center text-sm font-semibold text-[#2448A5] transition-colors hover:text-[#172B52]"
          >
            ← Back to Attendance
          </Link>

          <div className="mt-7">
            <p className="text-xs font-bold uppercase tracking-widest text-[#2448A5]">
              Attendly / Reports
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#172B52] sm:text-4xl">
              Attendance History
            </h1>

            <p className="mt-3 text-sm text-slate-500">
              {classData.code} • AY {classData.academic_year}
              {" • "}
              {classData.term}
            </p>
          </div>
        </header>

        {/* REPORTS BANNER */}
        <section className="rounded-2xl bg-gradient-to-r from-[#172B52] to-[#2448A5] p-6 text-white shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
            Attendance Analytics
          </p>

          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
            Your class attendance, organized.
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
            Review previous attendance sessions, explore attendance statistics,
            and download reports for BSIS 2B-G2.
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

        {/* REPORTS COMPONENT */}
        <HistoryReport sessions={report} />

        {/* PAGE FOOTER */}
        <footer className="border-t border-[#DDE5F0] pt-5 text-center text-xs text-slate-400">
          Attendly • Class Attendance Monitoring
        </footer>
      </div>
    </main>
  );
}
