import Link from "next/link";
import { requireRole } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLE_LABELS, ROLE_DESCRIPTIONS, type AppRole } from "@/lib/roles";
import RoleSelectForm from "./role-select-form";

const roles: AppRole[] = ["admin", "president", "secretary", "student"];
const pageSize = 20;

async function UserDirectory({ page, viewerId, classId }: { page: number; viewerId: string; classId: string }) {
  const adminClient = createAdminClient();
  if (!adminClient) {
    return <p role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm leading-7 text-amber-900">Account management is unavailable. Ask the site maintainer to finish setting up administrator access.</p>;
  }

  const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: pageSize });
  if (error) {
    return <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm leading-7 text-red-700">Unable to load user accounts. Check the server account-management configuration and try again.</p>;
  }

  const userIds = data.users.map((account) => account.id);
  const [admins, officers, profiles] = userIds.length > 0
    ? await Promise.all([
        adminClient.from("app_admins").select("user_id").in("user_id", userIds),
        adminClient.from("class_officers").select("user_id,role").eq("class_id", classId).in("user_id", userIds),
        adminClient.from("profiles").select("id,full_name").in("id", userIds),
      ])
    : [{ data: [], error: null }, { data: [], error: null }, { data: [], error: null }];

  if (admins.error || officers.error || profiles.error) {
    return <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm leading-7 text-red-700">Unable to verify account roles. No role controls are available until permissions can be loaded.</p>;
  }

  const adminIds = new Set((admins.data ?? []).map((row) => row.user_id));
  const officerRoles = new Map((officers.data ?? []).map((row) => [row.user_id, row.role]));
  const profileNames = new Map((profiles.data ?? []).map((row) => [row.id, row.full_name]));
  const hasNextPage = data.total > 0 ? page * pageSize < data.total : data.users.length === pageSize;

  return (
    <section aria-labelledby="account-list-heading" className="overflow-hidden rounded-2xl border border-[#DDE5F0] bg-white shadow-sm">
      <div className="border-b border-[#DDE5F0] px-5 py-5 sm:px-6">
        <h2 id="account-list-heading" className="text-xl font-bold text-[#172B52]">User accounts</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Officer roles apply to BSIS 2B-G2. Administrator access applies across the application.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead className="border-b border-[#DDE5F0] bg-[#FAFBFE] text-[#172B52]">
            <tr><th scope="col" className="px-5 py-4 font-semibold sm:px-6">Account</th><th scope="col" className="px-5 py-4 font-semibold">Current role</th><th scope="col" className="px-5 py-4 font-semibold sm:px-6">Change role</th></tr>
          </thead>
          <tbody className="divide-y divide-[#DDE5F0]">
            {data.users.map((account) => {
              const officerRole = officerRoles.get(account.id);
              const role: AppRole = adminIds.has(account.id) ? "admin" : officerRole === "president" || officerRole === "secretary" ? officerRole : "student";
              const email = account.email ?? "No email address";
              const name = profileNames.get(account.id);
              return (
                <tr key={account.id}>
                  <td className="px-5 py-5 align-top sm:px-6">
                    <p className="font-semibold text-[#172B52]">{name || email}</p>
                    {name && <p className="mt-1 break-all text-xs text-slate-500">{email}</p>}
                    {account.id === viewerId && <p className="mt-2 text-xs font-semibold text-[#2448A5]">You</p>}
                  </td>
                  <td className="px-5 py-5 align-top"><span className="inline-flex whitespace-nowrap rounded-full bg-[#EAF0FF] px-3 py-1.5 text-xs font-bold text-[#2448A5]">{ROLE_LABELS[role]}</span></td>
                  <td className="px-5 py-5 align-top sm:px-6"><RoleSelectForm key={`${account.id}-${role}`} userId={account.id} currentRole={role} isSelf={account.id === viewerId} accountLabel={email} /></td>
                </tr>
              );
            })}
            {data.users.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-slate-500">No accounts on this page.</td></tr>}
          </tbody>
        </table>
      </div>
      <nav aria-label="Account list pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-[#DDE5F0] px-5 py-4 text-sm sm:px-6">
        <p className="text-slate-500">Page {page}</p>
        <div className="flex gap-4">
          {page > 1 && <Link href={`/admin/users?page=${page - 1}`} className="inline-flex min-h-11 items-center font-semibold text-[#2448A5] hover:underline">Previous</Link>}
          {hasNextPage && <Link href={`/admin/users?page=${page + 1}`} className="inline-flex min-h-11 items-center font-semibold text-[#2448A5] hover:underline">Next</Link>}
        </div>
      </nav>
    </section>
  );
}

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  const access = await requireRole(["admin"]);
  const params = await searchParams;
  const pageParam = typeof params.page === "string" ? params.page : "1";
  const page = /^\d{1,6}$/.test(pageParam) ? Math.max(1, Number(pageParam)) : 1;

  return (
    <main className="min-h-screen bg-[#F6F8FC] px-4 py-8 text-[#17263D] sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#2448A5]">Attendly / Administration</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#172B52] sm:text-4xl">Accounts &amp; permissions</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">Review each user&apos;s role and choose what they can access. New accounts start as Students.</p>
          </div>
          <Link href="/admin/accounts" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#2448A5] px-5 py-3 text-sm font-bold text-white hover:bg-[#172B52]">Create account</Link>
        </header>
        <section aria-label="Role permissions" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {roles.map((role) => <div key={role} className="rounded-2xl border border-[#DDE5F0] bg-white p-5"><h2 className="font-bold text-[#172B52]">{ROLE_LABELS[role]}</h2><p className="mt-3 text-sm leading-6 text-slate-500">{ROLE_DESCRIPTIONS[role]}</p></div>)}
        </section>
        {access.classId ? <UserDirectory page={page} viewerId={access.user.id} classId={access.classId} /> : <p role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm leading-7 text-amber-900">The current class could not be found. Set up BSIS 2B-G2 before assigning roles.</p>}
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-[#2448A5]">
          <Link href="/officer" className="inline-flex min-h-11 items-center hover:underline">Preview President / Secretary dashboard</Link>
          <Link href="/student" className="inline-flex min-h-11 items-center hover:underline">Preview Student dashboard</Link>
        </div>
      </div>
    </main>
  );
}
