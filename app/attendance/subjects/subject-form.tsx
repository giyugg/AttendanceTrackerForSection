"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import { addSubject, type SubjectState } from "./actions";

const initialState: SubjectState = {
  success: false,
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#2448A5] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#172B52] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
    >
      {pending ? "Adding Subject..." : "+ Add Subject"}
    </button>
  );
}

export default function SubjectForm() {
  const [state, formAction] = useActionState(addSubject, initialState);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="overflow-hidden rounded-2xl border border-[#DDE5F0] bg-white shadow-sm"
    >
      <div className="border-b border-[#DDE5F0] bg-[#FAFBFE] p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-[#2448A5]">
          Subject Management
        </p>

        <h2 className="mt-2 text-xl font-bold text-[#172B52]">
          Add New Subject
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Register a subject for BSIS 2B-G2.
        </p>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        <div>
          <label
            htmlFor="code"
            className="mb-2 block text-sm font-semibold text-[#172B52]"
          >
            Subject Code
          </label>

          <input
            id="code"
            name="code"
            type="text"
            placeholder="e.g. ITEC 201"
            minLength={2}
            maxLength={30}
            required
            className="min-h-12 w-full rounded-xl border border-[#DDE5F0] bg-white px-4 py-3 text-sm text-[#17263D] outline-none placeholder:text-slate-400 focus:border-[#2448A5] focus:ring-2 focus:ring-[#2448A5]/10"
          />

          <p className="mt-2 text-xs text-slate-500">
            Enter the official subject code.
          </p>
        </div>

        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-semibold text-[#172B52]"
          >
            Subject Name
          </label>

          <input
            id="name"
            name="name"
            type="text"
            placeholder="e.g. Information Management"
            minLength={2}
            maxLength={120}
            required
            className="min-h-12 w-full rounded-xl border border-[#DDE5F0] bg-white px-4 py-3 text-sm text-[#17263D] outline-none placeholder:text-slate-400 focus:border-[#2448A5] focus:ring-2 focus:ring-[#2448A5]/10"
          />

          <p className="mt-2 text-xs text-slate-500">
            Enter the complete subject name.
          </p>
        </div>

        {state.message && (
          <p
            role="status"
            aria-live="polite"
            className={`rounded-xl border p-4 text-sm ${
              state.success
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {state.message}
          </p>
        )}
      </div>

      <div className="border-t border-[#DDE5F0] bg-[#FAFBFE] p-5 sm:p-6">
        <SubmitButton />
      </div>
    </form>
  );
}