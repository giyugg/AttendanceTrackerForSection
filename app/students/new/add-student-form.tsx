"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { addStudent, type AddStudentState } from "./actions";

const initialState: AddStudentState = {
  success: false,
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#2448A5] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#172B52] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
    >
      {pending ? "Saving Student..." : "Save Student"}
    </button>
  );
}

export default function AddStudentForm() {
  const [state, formAction] = useActionState(addStudent, initialState);

  return (
    <form
      action={formAction}
      className="overflow-hidden rounded-2xl border border-[#DDE5F0] bg-white shadow-sm"
    >
      {/* Form Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DDE5F0] bg-[#FAFBFE] p-5 sm:p-6">
        <div>
          <h2 className="text-xl font-bold text-[#172B52]">
            Student Information
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Please provide accurate student details.
          </p>
        </div>

        <span className="rounded-full bg-[#EAF0FF] px-3 py-2 text-xs font-semibold text-[#2448A5]">
          BSIS 2B-G2
        </span>
      </div>

      {/* Form Fields */}
      <div className="space-y-6 p-5 sm:p-6">
        {/* Student Number */}
        <div>
          <label
            htmlFor="student_number"
            className="mb-2 block text-sm font-semibold text-[#172B52]"
          >
            Student Number
          </label>

          <input
            id="student_number"
            name="student_number"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{3,32}"
            placeholder="e.g. 2025009999"
            required
            minLength={3}
            maxLength={32}
            className="min-h-12 w-full rounded-lg border border-[#DDE5F0] bg-white px-4 py-3 text-sm text-[#17263D] outline-none transition-colors placeholder:text-slate-400 focus:border-[#2448A5] focus:ring-2 focus:ring-[#2448A5]/10"
          />

          <p className="mt-2 text-xs text-slate-500">
            Enter the student's official numeric ID.
          </p>
        </div>

        {/* STUDENT NAME FIELDS */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* LAST NAME */}
          <div className="min-w-0">
            <label
              htmlFor="last_name"
              className="mb-2 block text-sm font-semibold text-[#172B52]"
            >
              Last Name
            </label>

            <input
              id="last_name"
              name="last_name"
              type="text"
              autoComplete="family-name"
              placeholder="e.g. Dela Cruz"
              required
              maxLength={80}
              className="min-h-12 w-full rounded-lg border border-[#DDE5F0] bg-white px-4 py-3 text-sm text-[#17263D] outline-none transition-colors placeholder:text-slate-400 focus:border-[#2448A5] focus:ring-2 focus:ring-[#2448A5]/10"
            />
          </div>

          {/* FIRST NAME */}
          <div className="min-w-0">
            <label
              htmlFor="first_name"
              className="mb-2 block text-sm font-semibold text-[#172B52]"
            >
              First Name
            </label>

            <input
              id="first_name"
              name="first_name"
              type="text"
              autoComplete="given-name"
              placeholder="e.g. Juan"
              required
              maxLength={80}
              className="min-h-12 w-full rounded-lg border border-[#DDE5F0] bg-white px-4 py-3 text-sm text-[#17263D] outline-none transition-colors placeholder:text-slate-400 focus:border-[#2448A5] focus:ring-2 focus:ring-[#2448A5]/10"
            />
          </div>
        </div>

        {/* MIDDLE INITIAL */}
        <div>
          <label
            htmlFor="middle_initial"
            className="mb-2 block text-sm font-semibold text-[#172B52]"
          >
            Middle Initial
            <span className="ml-2 text-xs font-normal text-slate-400">
              (Optional)
            </span>
          </label>

          <input
            id="middle_initial"
            name="middle_initial"
            type="text"
            placeholder="e.g. P"
            maxLength={2}
            className="min-h-12 w-full rounded-lg border border-[#DDE5F0] bg-white px-4 py-3 text-sm text-[#17263D] outline-none transition-colors placeholder:text-slate-400 focus:border-[#2448A5] focus:ring-2 focus:ring-[#2448A5]/10 sm:max-w-40"
          />

          <p className="mt-2 text-xs text-slate-500">
            Enter one letter, or leave blank if not applicable.
          </p>
        </div>

        {/* Success and Error Messages */}
        {state.message && (
          <p
            role="status"
            className={`rounded-lg border p-4 text-sm ${
              state.success
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {state.message}
          </p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex flex-col gap-3 border-t border-[#DDE5F0] bg-[#FAFBFE] p-5 sm:flex-row sm:items-center sm:p-6">
        <SubmitButton />

        <Link
          href="/students"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#DDE5F0] bg-white px-6 py-3 text-sm font-semibold text-[#172B52] transition-colors hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
