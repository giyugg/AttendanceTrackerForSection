
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HistoryReport, {
  type HistorySession,
} from "./history-report";

export default async function AttendanceHistoryPage() {
  const supabase = await createClient();

  // 1. Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // 2. Find BSIS 2B-G2
  const { data: classData, error: classError } =
    await supabase
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
    return (
      <main className="p-8">
        Class not found or access denied.
      </main>
    );
  }

  // 3. Retrieve the 50 most recent sessions
  const { data: sessions, error: sessionError } =
    await supabase
      .from("attendance_sessions")
      .select("id, label, session_date")
      .eq("class_id", classData.id)
      .order("session_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  const sessionIds = (sessions ?? []).map(
    (session) => session.id
  );

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
  const report: HistorySession[] = (sessions ?? []).map(
    (session) => {
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
    }
  );

  // 7. Render the page
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <Link
            href="/attendance"
            className="text-sm font-medium text-slate-600 hover:underline"
          >
            ← Back to Attendance
          </Link>

          <p className="mt-6 text-sm font-semibold text-slate-500">
            ATTENDLY / REPORTS
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Attendance History
          </h1>

          <p className="mt-2 text-slate-600">
            {classData.code} • AY {classData.academic_year}
            {" • "}{classData.term}
          </p>
        </header>

        <HistoryReport sessions={report} />
      </div>
    </main>
  );
}