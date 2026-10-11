
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type DeleteStudentState = {
  success: boolean;
  message: string;
};

export async function deleteStudentPermanently(
  _previousState: DeleteStudentState,
  formData: FormData
): Promise<DeleteStudentState> {
  const fail = (message: string): DeleteStudentState => ({
    success: false,
    message,
  });

  // 1. Read the submitted values.
  const studentId = String(
    formData.get("student_id") ?? ""
  ).trim();

  const confirmation = String(
    formData.get("confirm_student_number") ?? ""
  ).trim();

  // 2. Validate the student ID.
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(studentId)) {
    return fail("Invalid student record.");
  }

  if (!confirmation) {
    return fail("Please enter the student's number to confirm deletion.");
  }

  // 3. Connect to Supabase.
  const supabase = await createClient();

  // 4. Verify authentication.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return fail("Please sign in again.");
  }

  // 5. Verify administrator access.
  const { data: admin, error: adminError } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError || !admin) {
    return fail("Administrator access required.");
  }

  // 6. Call the database deletion function.
  // This deletes related records atomically.
  const { error: deleteError } = await supabase.rpc(
    "delete_g2_student",
    {
      p_student_id: studentId,
      p_confirm_student_number: confirmation,
    }
  );

  if (deleteError) {
    if (
      deleteError.message.includes(
        "Student number confirmation does not match"
      )
    ) {
      return fail("Student number does not match. Deletion cancelled.");
    }

    if (
      deleteError.message.includes(
        "Student belongs to another class"
      )
    ) {
      return fail(
        "This student belongs to another class and cannot be permanently deleted."
      );
    }

    return fail(
      "Unable to delete student. No changes were saved."
    );
  }

  // 7. Refresh affected pages.
  revalidatePath("/students");
  revalidatePath("/dashboard");
  revalidatePath("/attendance");
  revalidatePath("/attendance/history");

  return {
    success: true,
    message: "Student permanently deleted.",
  };
}