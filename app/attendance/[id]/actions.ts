
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type AttendanceState = {
  success: boolean;
  message: string;
};

const validStatuses = [
  "present",
  "late",
  "absent",
  "excused",
];

export async function saveAttendance(
  _previousState: AttendanceState,
  formData: FormData
): Promise<AttendanceState> {
  const fail = (message: string): AttendanceState => ({
    success: false,
    message,
  });

  const sessionId = String(
    formData.get("session_id") ?? ""
  );

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(sessionId)) {
    return fail("Invalid attendance session.");
  }

  const supabase = await createClient();

  // 1. Verify authenticated user.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return fail("Please sign in again.");
  }

  // 2. Find BSIS 2B-G2.
  const { data: classData, error: classError } =
    await supabase
      .from("classes")
      .select("id")
      .eq("code", "BSIS 2B-G2")
      .eq("academic_year", "2026-2027")
      .eq("term", "1st Semester")
      .maybeSingle();

  if (classError || !classData) {
    return fail("BSIS 2B-G2 was not found.");
  }

  // 3. Verify permission to mark attendance.
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
    return fail("Unable to verify permissions.");
  }

  const canMark =
    Boolean(admin) ||
    officer?.role === "president" ||
    officer?.role === "secretary";

  if (!canMark) {
    return fail("You are not authorized to mark attendance.");
  }

  // 4. Verify that the session belongs to G2.
  const { data: session, error: sessionError } =
    await supabase
      .from("attendance_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("class_id", classData.id)
      .maybeSingle();

  if (sessionError || !session) {
    return fail("Attendance session not found.");
  }

  // 5. Retrieve active G2 students from the database.
  const { data: enrollments, error: enrollmentError } =
    await supabase
      .from("class_enrollments")
      .select("student_id")
      .eq("class_id", classData.id)
      .eq("is_active", true);

  if (enrollmentError) {
    return fail("Unable to retrieve active students.");
  }

  // 6. Collect submitted attendance statuses.
  // Only database-verified student IDs are accepted.
  const records: {
    session_id: string;
    class_id: string;
    student_id: string;
    status: string;
    marked_by: string;
  }[] = [];

  for (const enrollment of enrollments ?? []) {
    const value = formData.get(
      `status_${enrollment.student_id}`
    );

    // Unmarked students are skipped.
    if (value === null || value === "") {
      continue;
    }

    if (
      typeof value !== "string" ||
      !validStatuses.includes(value)
    ) {
      return fail("Invalid attendance status submitted.");
    }

    records.push({
      session_id: session.id,
      class_id: classData.id,
      student_id: enrollment.student_id,
      status: value,
      marked_by: user.id,
    });
  }

  if (records.length === 0) {
    return fail(
      "Mark at least one student before saving."
    );
  }

  // 7. Insert or update attendance records.
  const { error: saveError } = await supabase
    .from("attendance_records")
    .upsert(records, {
      onConflict: "session_id,student_id",
    });

  if (saveError) {
    return fail(
      `Unable to save attendance: ${saveError.message}`
    );
  }

  // 8. Refresh attendance and dashboard information.
  revalidatePath(`/attendance/${session.id}`);
  revalidatePath("/attendance");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: `${records.length} attendance records saved successfully!`,
  };
}