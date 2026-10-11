
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
      className="rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
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
      className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <input
        type="hidden"
        name="student_id"
        value={student.id}
      />

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
          defaultValue={student.student_number}
          required
          maxLength={32}
          className="w-full rounded-lg border border-slate-300 px-4 py-3"
        />

        <p className="mt-2 text-xs text-slate-500">
          Changed student numbers must contain digits only.
        </p>
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
          defaultValue={student.full_name}
          required
          maxLength={120}
          className="w-full rounded-lg border border-slate-300 px-4 py-3"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SaveButton />

        <Link
          href="/students"
          className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>

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