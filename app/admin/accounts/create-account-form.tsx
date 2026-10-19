"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createAccount, type CreateAccountState } from "./actions";

const initialState: CreateAccountState = { success: false, message: "" };
const inputClassName = "mt-2 min-h-12 w-full rounded-xl border border-[#DDE5F0] bg-white px-4 py-3 text-sm text-[#17263D] outline-none focus:border-[#2448A5] focus:ring-2 focus:ring-[#2448A5]/10";

function AccountFields() {
  const { pending } = useFormStatus();

  return (
    <fieldset disabled={pending} className="space-y-6 disabled:opacity-60">
      <div>
        <label htmlFor="account-email" className="text-sm font-semibold text-[#172B52]">
          Educational email
        </label>
        <input id="account-email" name="email" type="email" required maxLength={254} autoComplete="off" placeholder="name@ms.bulsu.edu.ph" aria-describedby="account-email-help" className={inputClassName} />
        <p id="account-email-help" className="mt-2 text-sm leading-6 text-slate-500">
          Use an educational email ending in .edu or .edu with a country code, such as .edu.ph. Gmail and other personal email providers are not accepted.
        </p>
      </div>

      <div>
        <label htmlFor="account-password" className="text-sm font-semibold text-[#172B52]">
          Temporary password
        </label>
        <input id="account-password" name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" aria-describedby="account-password-help" className={inputClassName} />
        <p id="account-password-help" className="mt-2 text-sm leading-6 text-slate-500">
          Use at least 8 characters. Share this password privately after creating the account. The account holder can choose a new password using Forgot Password on the sign-in page.
        </p>
      </div>

      <label className="flex items-start gap-3 text-sm leading-6 text-slate-600">
        <input name="verified_request" type="checkbox" required className="mt-1 h-4 w-4 shrink-0 accent-[#2448A5]" />
        <span>I have verified this account request and the account holder&apos;s educational email.</span>
      </label>

      <button type="submit" disabled={pending} className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#2448A5] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#172B52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2448A5] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
        {pending ? "Creating account..." : "Create account"}
      </button>
    </fieldset>
  );
}

export default function CreateAccountForm() {
  const [state, formAction, pending] = useActionState(createAccount, initialState);

  return (
    <form action={formAction} aria-busy={pending} className="space-y-6 rounded-2xl border border-[#DDE5F0] bg-white p-5 shadow-sm sm:p-8">
      <AccountFields />
      {state.message && (
        <p role={state.success ? "status" : "alert"} className={`rounded-xl border p-4 text-sm leading-7 ${state.success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
