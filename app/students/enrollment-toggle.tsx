
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  changeEnrollmentStatus,
  type EnrollmentState,
} from "./enrollment-actions";

const initialState: EnrollmentState = {
  success: false,
  message: "",
};

function StatusButton({
  active,
}: {
  active: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`
        inline-flex h-10 min-w-[116px]
        items-center justify-center
        whitespace-nowrap rounded-lg border
        px-4 text-sm font-medium
        transition-colors duration-150
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${
          active
            ? "border-red-200 bg-white text-red-700 hover:bg-red-50"
            : "border-green-200 bg-white text-green-700 hover:bg-green-50"
        }
      `}
    >
      {pending
        ? "Saving..."
        : active
          ? "Deactivate"
          : "Reactivate"}
    </button>
  );
}

export default function EnrollmentToggle({
  studentId,
  active,
}: {
  studentId: string;
  active: boolean;
}) {
  const [state, formAction] = useActionState(
    changeEnrollmentStatus,
    initialState
  );

  return (
    <form
      action={formAction}
      className="inline-flex flex-col items-end gap-1"
    >
      <input
        type="hidden"
        name="student_id"
        value={studentId}
      />

      <input
        type="hidden"
        name="next_status"
        value={active ? "inactive" : "active"}
      />

      <StatusButton active={active} />

      {state.message && (
        <p
          role="status"
          className={`max-w-40 text-right text-xs ${
            state.success
              ? "text-green-700"
              : "text-red-700"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
