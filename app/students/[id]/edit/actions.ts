
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

  const lastName = String(
    formData.get("last_name") ?? ""
  ).trim().replace(/\s+/g, " ");

  const firstName = String(
    formData.get("first_name") ?? ""
  ).trim().replace(/\s+/g, " ");

  const middleInitial = String(
    formData.get("middle_initial") ?? ""
  ).trim().replace(/\.$/, "").toUpperCase();

  const fullName = `${lastName}, ${firstName}${middleInitial ? ` ${middleInitial}.` : ""
    }`;

  const fail = (message: string): EditStudentState => ({
    success: false,
    message,
  });

  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(studentId)) {
    return fail("Invalid student record.");
  }

  if (
    lastName.length < 1 ||
    lastName.length > 80 ||
    firstName.length < 1 ||
    firstName.length > 80
  ) {
    return fail(
      "First and last names must contain 1–80 characters."
    );
  }

  if (middleInitial && !/^[A-Z]$/.test(middleInitial)) {
    return fail(
      "Middle initial must be one letter (A–Z)."
    );
  }

  if (fullName.length > 120) {
    return fail("The combined student name is too long.");
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
        last_name: lastName,
        first_name: firstName,
        middle_initial: middleInitial || null,
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