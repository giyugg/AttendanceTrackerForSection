"use server";

import { revalidatePath } from "next/cache";
import { isEducationalEmail } from "@/lib/account-validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type CreateAccountState = {
  success: boolean;
  message: string;
};

export async function createAccount(
  _previousState: CreateAccountState,
  formData: FormData,
): Promise<CreateAccountState> {
  const fail = (message: string) => ({ success: false, message });

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return fail("Please sign in before creating an account.");
    }

    const { data: admin, error: adminError } = await supabase
      .from("app_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminError || !admin) {
      return fail("Administrator access is required to create accounts.");
    }

    const emailField = formData.get("email");
    const password = formData.get("password");
    const email = typeof emailField === "string" ? emailField.trim().toLowerCase() : "";

    if (!isEducationalEmail(email)) {
      return fail("Use a valid educational email ending in .edu or .edu followed by a country code, such as .edu.ph. Gmail and other personal email providers are not accepted.");
    }

    if (typeof password !== "string" || password.length < 8) {
      return fail("Use a temporary password with at least 8 characters.");
    }

    if (Buffer.byteLength(password, "utf8") > 72) {
      return fail("This temporary password is too long. Use a shorter password.");
    }

    if (formData.get("verified_request") !== "on") {
      return fail("Verify the account request and educational email before creating the account.");
    }

    // Never construct the privileged client before checking app_admins.
    const adminClient = createAdminClient();
    if (!adminClient) {
      return fail("Account creation is unavailable. Ask the site maintainer to finish setting up administrator access.");
    }

    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      // The administrator has verified the request before provisioning access.
      email_confirm: true,
    });

    if (error) {
      if (error.code === "email_exists" || error.code === "user_already_exists") {
        return fail("An account with this email already exists.");
      }

      if (error.code === "weak_password") {
        return fail("This password does not meet the account password requirements. Choose a stronger password.");
      }

      return fail("Unable to create the account. Check the email and password requirements, then try again.");
    }

    if (!data.user) {
      return fail("Account creation could not be confirmed. Check whether the account exists before trying again.");
    }

    revalidatePath("/admin/users");

    return {
      success: true,
      message: `Student account created for ${email}. You can change the role in Accounts & Permissions. Share the temporary password privately. The account holder can use Forgot Password on the sign-in page to choose their own password.`,
    };
  } catch {
    return fail("Account creation could not be confirmed. Check whether the account exists before trying again.");
  }
}
