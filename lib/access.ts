import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { roleHome, type AppRole } from "@/lib/roles";
import { accountDisplayName } from "@/lib/account-profile";

// React shares this result only within the current server render. Every new
// request verifies the session and reads the current database permissions.
export const getUserAccess = cache(async function getUserAccess() {
  // Supabase initializes time-dependent auth state. Do this at request time.
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    if (
      authError.name === "AuthRetryableFetchError" ||
      authError.status === 0 ||
      (typeof authError.status === "number" && authError.status >= 500)
    ) {
      throw new Error("Unable to verify your session. Please try again.");
    }
    return null;
  }
  if (!user) return null;

  const [adminResult, classResult, profileResult] = await Promise.all([
    supabase
      .from("app_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("classes")
      .select("id, code, academic_year, term")
      .eq("code", "BSIS 2B-G2")
      .eq("academic_year", "2026-2027")
      .eq("term", "1st Semester")
      .maybeSingle(),
    Promise.resolve(
      supabase
        .from("profiles")
        .select("first_name, middle_initial, last_name, full_name")
        .eq("id", user.id)
        .maybeSingle(),
    )
      .then((result) => {
        // Existing installations can still display names before the profile
        // name-fields migration has been applied.
        if (
          result.error?.code === "42703" ||
          result.error?.code === "PGRST204"
        ) {
          return supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .maybeSingle();
        }
        return result;
      })
      .catch(() => ({ data: null, error: true })),
  ]);

  const { data: admin, error: adminError } = adminResult;
  if (adminError) throw new Error("Unable to verify administrator access.");

  const { data: currentClass, error: classError } = classResult;
  if (classError) throw new Error("Unable to verify class access.");

  const classId: string | null = currentClass?.id ?? null;
  let role: AppRole = admin ? "admin" : "student";

  if (!admin && classId) {
    const { data: officer, error: officerError } = await supabase
      .from("class_officers")
      .select("role")
      .eq("class_id", classId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (officerError) throw new Error("Unable to verify class role.");

    if (officer?.role === "president" || officer?.role === "secretary") {
      role = officer.role;
    }
  }

  const displayName = accountDisplayName(
    profileResult.error ? null : profileResult.data,
    user.email,
  );

  return { supabase, user, role, classId, classData: currentClass, displayName };
});

export async function requireRole(roles: readonly AppRole[]) {
  const access = await getUserAccess();

  if (!access) redirect("/auth/login");
  if (!roles.includes(access.role)) redirect(roleHome(access.role));

  return access;
}
