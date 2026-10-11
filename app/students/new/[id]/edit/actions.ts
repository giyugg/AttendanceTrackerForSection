
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type EditStudentState = {
  success: boolean;
  message: string;
};

export async function updateStudent(
  _previousState: EditStudentState,
  formData: FormData
): Promise<EditStudentState> {
  const studentId = String(
    formData.get("student_id") ?? ""
  );

  const studentNumber = String(
    formData.get("student_number") ?? ""
  ).trim().toUpperCase();

  const fullName = String(
    formData.get("full_name") ?? ""
  ).trim().replace(/\s+/g, " ");

  const fail = (message: string): EditStudentState => ({
    success: false,
    message,
  });

  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(studentId)) {
    return fail("Invalid student record.");
  }

  if (fullName.length < 2 || fullName.length > 120) {
    return fail("Full name must contain 2–120 characters.");
  }

  const supabase = await createClient();

  // Authenticate the user.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return fail("Please sign in again.");
  }

  // Verify administrator permissions.
  const { data: admin, error: adminError } =
    await supabase
      .from("app_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

  if (adminError || !admin) {
    return fail("Administrator access required.");
  }

  // Find the authorized G2 class.
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

  // Ensure the selected student is enrolled in G2.
  const { data: enrollment, error: enrollmentError } =
    await supabase
      .from("class_enrollments")
      .select("student_id")
      .eq("class_id", classData.id)
      .eq("student_id", studentId)
      .eq("is_active", true)
      .maybeSingle();

  if (enrollmentError || !enrollment) {
    return fail("Student is not actively enrolled in G2.");
  }

  // Retrieve the student's current Student ID.
  const { data: existing, error: existingError } =
    await supabase
      .from("students")
      .select("student_number")
      .eq("id", studentId)
      .maybeSingle();

  if (existingError || !existing) {
    return fail("Student record not found.");
  }

  // Any changed Student ID must contain numbers only.
  // Existing legacy demo IDs may stay unchanged.
  if (
    studentNumber !== existing.student_number &&
    !/^[0-9]{3,32}$/.test(studentNumber)
  ) {
    return fail("New Student ID must contain 3–32 digits only.");
  }

  // Update the student's information.
  const { data: updated, error: updateError } =
    await supabase
      .from("students")
      .update({
        student_number: studentNumber,
        full_name: fullName,
      })
      .eq("id", studentId)
      .select("id")
      .maybeSingle();

  if (updateError) {
    if (updateError.code === "23505") {
      return fail("This Student ID is already registered.");
    }

    return fail(`Unable to update student: ${updateError.message}`);
  }

  if (!updated) {
    return fail("Student record could not be updated.");
  }

  // Refresh relevant pages.
  revalidatePath("/students");
  revalidatePath(`/students/${studentId}/edit`);

  return {
    success: true,
    message: "Student information updated successfully!",
  };
}