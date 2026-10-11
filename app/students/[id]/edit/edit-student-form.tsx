"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  updateStudent,
  type EditStudentState,
} from "./actions";

type Student = {
  id: string;
  student_number: string;
  full_name: string;
};

const initialState: EditStudentState = {
  success: false,
  message: "",
};

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#2448A5] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#172B52] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
    >
      {pending ? "Saving Changes..." : "Save Changes"}
    </button>
  );
}

export default function EditStudentForm({
  student,
}: {
  student: Student;
}) {
  const [state, formAction] = useActionState(
    updateStudent,
    initialState
  );

  return (
    <form
      action={formAction}
      className="overflow-hidden rounded-2xl border border-[#DDE5F0] bg-white shadow-sm"
    >
      <input
        type="hidden"
        name="student_id"
        value={student.id}
      />

      {/* Form Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DDE5F0] bg-[#FAFBFE] p-5 sm:p-6">
        <div>
          <h2 className="text-xl font-bold text-[#172B52]">
            Edit Student Details
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Review and update the student's information.
          </p>
        </div>

        <span className="rounded-full bg-[#EAF0FF] px-3 py-2 text-xs font-semibold text-[#2448A5]">
          BSIS 2B-G2
        </span>
      </div>

      {/* Student Information Fields */}
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
            defaultValue={student.student_number}
            required
            maxLength={32}
            className="min-h-12 w-full rounded-lg border border-[#DDE5F0] bg-white px-4 py-3 text-sm text-[#17263D] outline-none transition-colors focus:border-[#2448A5] focus:ring-2 focus:ring-[#2448A5]/10"
          />

          <p className="mt-2 text-xs text-slate-500">
            Changed student numbers must contain digits only.
            Existing demo IDs may remain unchanged.
          </p>
        </div>

        {/* Full Name */}
        <div>
          <label
            htmlFor="full_name"
            className="mb-2 block text-sm font-semibold text-[#172B52]"
          >
            Full Name
          </label>

          <input
            id="full_name"
            name="full_name"
            type="text"
            defaultValue={student.full_name}
            required
            minLength={2}
            maxLength={120}
            className="min-h-12 w-full rounded-lg border border-[#DDE5F0] bg-white px-4 py-3 text-sm text-[#17263D] outline-none transition-colors focus:border-[#2448A5] focus:ring-2 focus:ring-[#2448A5]/10"
          />

          <p className="mt-2 text-xs text-slate-500">
            Enter the corrected full name.
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
        <SaveButton />

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