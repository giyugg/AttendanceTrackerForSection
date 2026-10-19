"use server";

import { revalidatePath } from "next/cache";
import { isAppRole, ROLE_LABELS } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export type ChangeRoleState = {
  success: boolean;
  message: string;
};

export async function changeUserRole(
  _previousState: ChangeRoleState,
  formData: FormData,
): Promise<ChangeRoleState> {
  const fail = (message: string): ChangeRoleState => ({ success: false, message });

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return fail("Please sign in before changing roles.");

    const { data: admin, error: adminError } = await supabase
      .from("app_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminError || !admin) {
      return fail("Administrator access is required to change user roles.");
    }

    const userId = formData.get("user_id");
    const role = formData.get("role");
    if (
      typeof userId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
    ) {
      return fail("Choose a valid user account.");
    }
    if (!isAppRole(role)) return fail("Choose a valid account role.");
    if (userId.toLowerCase() === user.id.toLowerCase()) {
      return fail("You cannot change your own role. Ask another administrator to change it.");
    }

    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("id")
      .eq("code", "BSIS 2B-G2")
      .eq("academic_year", "2026-2027")
      .eq("term", "1st Semester")
      .maybeSingle();

    if (classError || !classData) {
      return fail("The current class could not be found. No role was changed.");
    }

    // The database checks auth.uid() again and applies all assignments atomically.
    const { error } = await supabase.rpc("set_class_user_role", {
      p_user_id: userId,
      p_class_id: classData.id,
      p_role: role,
    });

    if (error) {
      if (error.code === "PGRST202" || error.code === "42883") {
        return fail("Role updates are not configured yet. Ask the site maintainer to apply the role-permissions database update.");
      }
      if (error.code === "42501") {
        return fail("Your administrator access could not be verified. Refresh the page and sign in again.");
      }
      if (error.code === "P0002" || error.code === "23503") {
        return fail("This account or class no longer exists. Refresh the page before trying again.");
      }
      return fail("Unable to change this role. Refresh the account list and try again.");
    }

    revalidatePath("/", "layout");
    return { success: true, message: `Role updated to ${ROLE_LABELS[role]}.` };
  } catch {
    return fail("The role update could not be confirmed. Refresh the account list before trying again.");
  }
}
