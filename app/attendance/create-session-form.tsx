
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createAttendanceSession,
  type SessionState,
} from "./actions";

const initialState: SessionState = {
  success: false,
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 rounded-lg bg-slate-900 px-6 font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
    >
      {pending ? "Creating..." : "Create Session"}
    </button>
  );
}

export default function CreateSessionForm() {
  const [state, formAction] = useActionState(
    createAttendanceSession,
    initialState
  );

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <h2 className="text-xl font-semibold">
          Create Attendance Session
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Create a session for BSIS 2B-G2.
        </p>
      </div>

      <div>
        <label
          htmlFor="session_date"
          className="mb-2 block text-sm font-semibold"
        >
          Attendance Date
        </label>

        <input
          id="session_date"
          name="session_date"
          type="date"
          required
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900"
        />
      </div>

      <div>
        <label
          htmlFor="label"
          className="mb-2 block text-sm font-semibold"
        >
          Session Name
        </label>

        <input
          id="label"
          name="label"
          type="text"
          placeholder="e.g. Morning Attendance"
          minLength={3}
          maxLength={80}
          required
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900"
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