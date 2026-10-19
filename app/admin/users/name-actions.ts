"use server";

import { revalidatePath } from "next/cache";
import { formatAccountName, normalizeNameParts } from "@/lib/account-profile";
import { createClient } from "@/lib/supabase/server";

export type AccountNameState = {
  success: boolean;
  message: string;
};

export async function updateAccountName(
  _previousState: AccountNameState,
  formData: FormData,
): Promise<AccountNameState> {
  const fail = (message: string): AccountNameState => ({ success: false, message });

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return fail("Please sign in before editing account names.");

    const { data: admin, error: adminError } = await supabase
      .from("app_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminError || !admin) {
      return fail("Administrator access is required to edit account names.");
    }

    const userId = formData.get("user_id");
    if (
      typeof userId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
    ) {
      return fail("Choose a valid user account.");
    }

    const nameParts = normalizeNameParts({
      firstName: formData.get("first_name"),
      middleInitial: formData.get("middle_initial"),
      lastName: formData.get("last_name"),
    });
    if (!nameParts) return fail("Enter first and last names containing 1-80 characters each and an optional middle initial (A-Z). Keep the combined name within 120 characters.");

    // The cookie client keeps this write subject to the database's admin policy.
    const { data: profile, error } = await supabase
      .from("profiles")
      .update({
        first_name: nameParts.firstName,
        middle_initial: nameParts.middleInitial,
        last_name: nameParts.lastName,
        full_name: formatAccountName(nameParts),
      })
      .eq("id", userId)
      .select("id")
      .maybeSingle();

    if (error) {
      if (error.code === "42703" || error.code === "PGRST204") {
        return fail("Name editing needs the profile name fields database update. Ask the site maintainer to apply it in Supabase.");
      }
      return fail("Unable to save this name. Refresh the account list and try again.");
    }
    if (!profile) return fail("This account profile could not be found. Refresh the account list before trying again.");

    revalidatePath("/", "layout");
    return { success: true, message: "Account name saved." };
  } catch {
    return fail("The name update could not be confirmed. Refresh the account list before trying again.");
  }
}
