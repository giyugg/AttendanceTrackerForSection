
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { addStudent } from "./actions";

const initialState = {
  success: false,
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
    >
      {pending ? "Saving..." : "Save Student"}
    </button>
  );
}

export default function AddStudentForm() {
  const [state, formAction] = useActionState(
    addStudent,
    initialState
  );

  return (
    <form
      action={formAction}
      className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <label
          htmlFor="student_number"
          className="mb-2 block text-sm font-semibold"
        >
          Student Number
        </label>

        <input
          id="student_number"
          name="student_number"
          type="text"
          inputMode="numeric"
          pattern="[0-9]+"
          title="Student ID must contain numbers only"
          placeholder="e.g. 2025000000"
          required
          maxLength={10}
          className="w-full rounded-lg border border-slate-300 px-4 py-3"
        />
      </div>

      <div>
        <label
          htmlFor="full_name"
          className="mb-2 block text-sm font-semibold"
        >
          Full Name
        </label>

        <input
          id="full_name"
          name="full_name"
          type="text"
          placeholder="e.g. Test Student Six"
          required
          maxLength={120}
          className="w-full rounded-lg border border-slate-300 px-4 py-3"
        />
      </div>

      <SubmitButton />

      {state.message && (
        <p
          role="status"
          className={`rounded-lg p-3 text-sm ${
            state.success
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}