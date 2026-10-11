
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


  if (!/^[0-9]{3,32}$/.test(studentNumber)) {
    return {
      success: false,
      message: "Enter a valid student number (3–32 characters, letters, numbers or hyphens).",
    };
  }

  if (
    lastName.length < 1 ||
    lastName.length > 80 ||
    firstName.length < 1 ||
    firstName.length > 80
  ) {
    return {
      success: false,
      message: "First and last names must contain 1–80 characters.",
    };
  }

  if (middleInitial && !/^[A-Z]$/.test(middleInitial)) {
    return {
      success: false,
      message: "Middle initial must be one letter (A–Z).",
    };
  }

  if (fullName.length > 120) {
    return {
      success: false,
      message: "The combined student name is too long.",
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
    "add_g2_student_parts",
    {
      p_student_number: studentNumber,
      p_last_name: lastName,
      p_first_name: firstName,
      p_middle_initial: middleInitial,
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