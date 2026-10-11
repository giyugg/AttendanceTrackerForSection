
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type AddStudentState = {
  success: boolean;
  message: string;
};

export async function addStudent(
  _previousState: AddStudentState,
  formData: FormData
): Promise<AddStudentState> {
  const studentNumber = String(
    formData.get("student_number") ?? ""
  ).trim().toUpperCase();

  const fullName = String(
    formData.get("full_name") ?? ""
  ).trim().replace(/\s+/g, " ");

  if (!/^[0-9]{3,32}$/.test(studentNumber)) {
    return {
      success: false,
      message: "Enter a valid student number (3–32 characters, letters, numbers or hyphens).",
    };
  }

  if (fullName.length < 2 || fullName.length > 120) {
    return {
      success: false,
      message: "Enter a name between 2 and 120 characters.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      message: "Please sign in before adding students.",
    };
  }

  // Verify administrator authorization.
  const { data: admin, error: adminError } =
    await supabase
      .from("app_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

  if (adminError || !admin) {
    return {
      success: false,
      message: "Administrator access is required.",
    };
  }

  // Create and enroll the student atomically.
  const { error } = await supabase.rpc(
    "add_g2_student",
    {
      p_student_number: studentNumber,
      p_full_name: fullName,
    }
  );

  if (error) {
    return {
      success: false,
      message:
        error.code === "23505"
          ? "This student number already exists."
          : `Unable to add student: ${error.message}`,
    };
  }

  revalidatePath("/students");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: `${fullName} was successfully added to BSIS 2B-G2!`,
  };
}