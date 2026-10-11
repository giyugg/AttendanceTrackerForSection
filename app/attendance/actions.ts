
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type SessionState = {
  success: boolean;
  message: string;
};

export async function createAttendanceSession(
  _previousState: SessionState,
  formData: FormData
): Promise<SessionState> {
  const sessionDate = String(
    formData.get("session_date") ?? ""
  ).trim();

  const subjectId = String(
    formData.get("subject_id") ?? ""
  ).trim();


  const fail = (message: string): SessionState => ({
    success: false,
    message,
  });

  // Validate the submitted session information.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) {
    return fail("Please select a valid session date.");
  }

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      subjectId
    )
  ) {
    return fail("Please select a valid subject.");
  }


  const supabase = await createClient();

  // Verify the logged-in user.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return fail("Please sign in to create attendance.");
  }

  // Find BSIS 2B-G2.
  const { data: classData, error: classError } =
    await supabase
      .from("classes")
      .select("id")
      .eq("code", "BSIS 2B-G2")
      .eq("academic_year", "2026-2027")
      .eq("term", "1st Semester")
      .maybeSingle();

  if (classError || !classData) {
    return fail("BSIS 2B-G2 could not be found.");
  }

  // Check administrator authorization.
  const { data: admin, error: adminError } =
    await supabase
      .from("app_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

  // Check class-specific officer authorization.
  const { data: officer, error: officerError } =
    await supabase
      .from("class_officers")
      .select("role")
      .eq("class_id", classData.id)
      .eq("user_id", user.id)
      .maybeSingle();

  if (adminError || officerError) {
    return fail("Unable to verify your permissions.");
  }

  const authorized =
    Boolean(admin) ||
    officer?.role === "president" ||
    officer?.role === "secretary";

  if (!authorized) {
    return fail(
      "Only authorized officers can create sessions."
    );
  }
  // Verify the selected subject in Supabase.
  const { data: subject, error: subjectError } =
    await supabase
      .from("subjects")
      .select("id, code, name")
      .eq("id", subjectId)
      .eq("class_id", classData.id)
      .eq("is_active", true)
      .maybeSingle();

  if (subjectError || !subject) {
    return fail(
      "The selected subject is unavailable. Please choose an active subject."
    );
  }

  // Generate the attendance session name
  // from the selected subject.
  const label = `${subject.code} — ${subject.name}`.slice(
    0,
    80
  );

  // Save the attendance session with its subject.
  const { error: insertError } = await supabase
    .from("attendance_sessions")
    .insert({
      class_id: classData.id,
      session_date: sessionDate,
      subject_id: subject.id,
      label,
      created_by: user.id,
    });

  if (insertError) {
    if (insertError.code === "23505") {
      return fail(
        "An attendance session for this subject and date already exists."
      );
    }

    return fail(
      `Unable to create session: ${insertError.message}`
    );
  }

  // Refresh pages using attendance data.
  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  revalidatePath("/attendance/history");

  return {
    success: true,
    message: "Attendance session created successfully!",
  };
}