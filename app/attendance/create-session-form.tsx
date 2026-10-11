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

// Submit Button with Loading State
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#2448A5] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#172B52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2448A5] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
    >
      <span aria-hidden="true">+</span>

      {pending ? "Creating Session..." : "Create Session"}
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
      className="overflow-hidden rounded-2xl border border-[#DDE5F0] bg-white shadow-sm"
    >
      {/* FORM HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DDE5F0] bg-[#FAFBFE] p-5 sm:p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#2448A5]">
            New Attendance
          </p>

          <h3 className="mt-2 text-xl font-bold text-[#172B52]">
            Session Details
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Set up a new attendance session for your class.
          </p>
        </div>

        <span className="rounded-full bg-[#EAF0FF] px-4 py-2 text-xs font-semibold text-[#2448A5]">
          BSIS 2B-G2
        </span>
      </div>

      {/* FORM FIELDS */}
      <div className="space-y-6 p-5 sm:p-6">

        {/* ATTENDANCE DATE */}
        <div>
          <label
            htmlFor="session_date"
            className="mb-2 block text-sm font-semibold text-[#172B52]"
          >
            Attendance Date
          </label>

          <input
            id="session_date"
            name="session_date"
            type="date"
            required
            aria-describedby="session-date-help"
            className="min-h-12 w-full rounded-lg border border-[#DDE5F0] bg-white px-4 py-3 text-sm text-[#17263D] outline-none transition-colors focus:border-[#2448A5] focus:ring-2 focus:ring-[#2448A5]/10"
          />

          <p
            id="session-date-help"
            className="mt-2 text-xs leading-5 text-slate-500"
          >
            Choose the date when attendance will be recorded.
          </p>
        </div>

        {/* SESSION NAME */}
        <div>
          <label
            htmlFor="label"
            className="mb-2 block text-sm font-semibold text-[#172B52]"
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
            aria-describedby="session-name-help"
            className="min-h-12 w-full rounded-lg border border-[#DDE5F0] bg-white px-4 py-3 text-sm text-[#17263D] outline-none transition-colors placeholder:text-slate-400 focus:border-[#2448A5] focus:ring-2 focus:ring-[#2448A5]/10"
          />

          <p
            id="session-name-help"
            className="mt-2 text-xs leading-5 text-slate-500"
          >
            Use a recognizable name to easily identify
            this session in attendance history.
          </p>
        </div>

        {/* INFORMATION NOTE */}
        <div className="rounded-xl border border-[#DDE5F0] bg-[#F6F8FC] p-4">
          <p className="text-sm font-semibold text-[#172B52]">
            Before creating a session
          </p>

          <p className="mt-2 text-xs leading-6 text-slate-600">
            Make sure the selected date and session name
            are correct. Once created, the session will
            appear in your attendance records.
          </p>
        </div>

        {/* SUCCESS / ERROR MESSAGE */}
        {state.message && (
          <p
            role="status"
            aria-live="polite"
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

      {/* FORM FOOTER */}
      <div className="flex flex-col gap-3 border-t border-[#DDE5F0] bg-[#FAFBFE] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <p className="text-xs text-slate-500">
          Attendance session • BSIS 2B-G2
        </p>

        <SubmitButton />
      </div>
    </form>
  );
}