import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import CreateAccountForm from "./create-account-form";

export default async function AccountsPage() {
  // Supabase Auth reads the current time; initialize it only at request time.
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  const { data: admin, error: adminError } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) {
    throw new Error("Unable to verify administrator access.");
  }

  if (!admin) {
    return (
      <main className="min-h-screen bg-[#F6F8FC] p-8 text-[#17263D]">
        <h1 className="text-2xl font-bold text-[#172B52]">Access Denied</h1>
        <p className="mt-3">Only application administrators can create accounts.</p>
        <Link href="/dashboard" className="mt-5 inline-flex min-h-11 items-center font-semibold text-[#2448A5] hover:underline">Back to Dashboard</Link>
      </main>
    );
  }

  const isConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  return (
    <main className="min-h-screen bg-[#F6F8FC] px-4 py-8 text-[#17263D] sm:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <Link href="/admin/users" className="inline-flex min-h-11 items-center text-sm font-semibold text-[#2448A5] hover:underline">Back to Accounts &amp; Permissions</Link>
        <header>
          <p className="text-xs font-bold uppercase tracking-widest text-[#2448A5]">Attendly / Administration</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#172B52] sm:text-4xl">Create an account</h1>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Create an account after verifying the request from the account holder&apos;s educational email. New accounts start as Students. You can change their role in Accounts &amp; Permissions.
          </p>
        </header>
        {isConfigured ? (
          <CreateAccountForm />
        ) : (
          <p role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm leading-7 text-amber-900">
            Account creation is unavailable. Ask the site maintainer to finish setting up administrator access.
          </p>
        )}
      </div>
    </main>
  );
}
