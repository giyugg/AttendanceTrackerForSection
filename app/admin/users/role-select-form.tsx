"use client";

import { useActionState, useState } from "react";
import { ROLE_LABELS, ROLE_DESCRIPTIONS, type AppRole } from "@/lib/roles";
import { changeUserRole, type ChangeRoleState } from "./actions";

const initialState: ChangeRoleState = { success: false, message: "" };
const roles: AppRole[] = ["admin", "president", "secretary", "student"];

export default function RoleSelectForm({
  userId,
  currentRole,
  isSelf,
  accountLabel,
}: {
  userId: string;
  currentRole: AppRole;
  isSelf: boolean;
  accountLabel: string;
}) {
  const [state, formAction, pending] = useActionState(changeUserRole, initialState);
  const [selectedRole, setSelectedRole] = useState<AppRole>(currentRole);

  if (isSelf) {
    return <p className="max-w-xs text-sm leading-6 text-slate-500">Your account. Another administrator can change your role.</p>;
  }

  return (
    <form action={formAction} aria-busy={pending} className="space-y-3">
      <input name="user_id" type="hidden" value={userId} />
      <div className="flex flex-wrap items-center gap-2">
        <select
          name="role"
          aria-label={`Role for ${accountLabel}`}
          aria-describedby={`role-description-${userId}`}
          value={selectedRole}
          onChange={(event) => setSelectedRole(event.target.value as AppRole)}
          disabled={pending}
          className="min-h-11 rounded-lg border border-[#DDE5F0] bg-white px-3 py-2 text-sm text-[#172B52] focus:outline-none focus:ring-2 focus:ring-[#2448A5] disabled:opacity-50"
        >
          {roles.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
        </select>
        <button type="submit" disabled={pending || selectedRole === currentRole} className="min-h-11 rounded-lg bg-[#2448A5] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#172B52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2448A5] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
          {pending ? "Saving..." : "Save role"}
        </button>
      </div>
      <p id={`role-description-${userId}`} className="max-w-md text-xs leading-5 text-slate-500">{ROLE_DESCRIPTIONS[selectedRole]}</p>
      {state.message && <p role={state.success ? "status" : "alert"} className={`max-w-md text-sm leading-6 ${state.success ? "text-emerald-700" : "text-red-700"}`}>{state.message}</p>}
    </form>
  );
}
