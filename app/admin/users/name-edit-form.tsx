"use client";

import { useActionState, useState } from "react";
import type { AccountNameParts } from "@/lib/account-profile";
import { updateAccountName, type AccountNameState } from "./name-actions";

const initialState: AccountNameState = { success: false, message: "" };

type NameEditFormProps = {
  userId: string;
  nameParts: AccountNameParts;
  accountLabel: string;
  disabled?: boolean;
};

function NameEditor({ userId, nameParts, accountLabel, onCancel }: NameEditFormProps & { onCancel: () => void }) {
  const [state, formAction, pending] = useActionState(updateAccountName, initialState);
  const messageId = `account-name-message-${userId}`;
  const fields = [
    { name: "first_name", label: "First name", value: nameParts.firstName, autoComplete: "given-name", maxLength: 80, required: true },
    { name: "middle_initial", label: "Middle initial (optional)", value: nameParts.middleInitial, autoComplete: "additional-name", maxLength: 2, required: false },
    { name: "last_name", label: "Last name", value: nameParts.lastName, autoComplete: "family-name", maxLength: 80, required: true },
  ];

  return (
    <form action={formAction} aria-busy={pending} className="mt-3 w-full max-w-xs space-y-2">
      <input type="hidden" name="user_id" value={userId} />
      {fields.map((field) => <div key={field.name} className="space-y-1">
        <label htmlFor={`${field.name}-${userId}`} className="block text-xs font-semibold text-[#172B52]">{field.label}</label>
        <input
          key={field.value}
          id={`${field.name}-${userId}`}
          name={field.name}
          type="text"
          autoComplete={field.autoComplete}
          defaultValue={field.value}
          aria-label={`${field.label} for ${accountLabel}`}
          aria-describedby={state.message ? messageId : undefined}
          aria-invalid={state.message && !state.success ? true : undefined}
          maxLength={field.maxLength}
          required={field.required}
          disabled={pending}
          className="min-h-11 w-full min-w-0 rounded-lg border border-[#DDE5F0] bg-white px-3 py-2 text-sm text-[#172B52] focus:outline-none focus:ring-2 focus:ring-[#2448A5] disabled:opacity-50"
        />
      </div>)}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className="min-h-11 rounded-lg bg-[#2448A5] px-3 py-2 text-xs font-semibold text-white hover:bg-[#172B52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2448A5] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
          {pending ? "Saving..." : "Save name"}
        </button>
        <button type="button" onClick={onCancel} disabled={pending} className="min-h-11 rounded-lg border border-[#DDE5F0] px-3 py-2 text-xs font-semibold text-[#2448A5] hover:bg-[#F6F8FC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2448A5] disabled:cursor-not-allowed disabled:opacity-50">Cancel</button>
      </div>
      {state.message && <p id={messageId} role={state.success ? "status" : "alert"} className={`text-xs leading-5 ${state.success ? "text-emerald-700" : "text-red-700"}`}>{state.message}</p>}
    </form>
  );
}

export default function NameEditForm(props: NameEditFormProps) {
  const [editing, setEditing] = useState(false);

  if (editing) return <NameEditor {...props} onCancel={() => setEditing(false)} />;

  return (
    <button type="button" onClick={() => setEditing(true)} disabled={props.disabled} aria-label={`Edit name for ${props.accountLabel}`} className="mt-1 inline-flex min-h-11 items-center rounded-lg text-xs font-semibold text-[#2448A5] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2448A5] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">Edit name</button>
  );
}
