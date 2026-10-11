"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";

import { useFormStatus } from "react-dom";

import {
  deleteSessionPermanently,
  type DeleteSessionState,
} from "./delete-session-actions";

const initialState: DeleteSessionState = {
  success: false,
  message: "",
};

function DialogActions({
  confirmed,
  onCancel,
}: {
  confirmed: boolean;
  onCancel: () => void;
}) {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
      <button
        type="button"
        disabled={pending}
        onClick={onCancel}
        className="min-h-11 rounded-lg border border-[#DDE5F0] bg-white px-5 py-3 text-sm font-semibold text-[#172B52] hover:bg-slate-50 disabled:opacity-50"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={!confirmed || pending}
        className="min-h-11 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Deleting..." : "Delete Permanently"}
      </button>
    </div>
  );
}

export default function DeleteSessionButton({
  sessionId,
  sessionLabel,
  sessionDate,
  sessionTime,
}: {
  sessionId: string;
  sessionLabel: string;
  sessionDate: string;
  sessionTime?: string | null;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const titleId = useId();
  const descriptionId = useId();
  const inputId = useId();

  const [confirmation, setConfirmation] = useState("");

  const [state, formAction] = useActionState(
    deleteSessionPermanently,
    initialState,
  );

  const confirmed = confirmation === "DELETE";

  useEffect(() => {
    if (state.success) {
      dialogRef.current?.close();
    }
  }, [state.success]);

  return (
    <>
      {/* DELETE BUTTON */}
      <button
        type="button"
        onClick={() => {
          setConfirmation("");
          dialogRef.current?.showModal();
        }}
        className="inline-flex h-10 items-center justify-center rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
      >
        Delete
      </button>

      {/* CONFIRMATION DIALOG */}
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClose={() => setConfirmation("")}
        className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-[#DDE5F0] bg-white p-0 text-[#17263D] shadow-xl backdrop:bg-slate-950/60"
      >
        <div className="p-6 sm:p-8">
          {/* WARNING ICON */}
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <span
              className="text-2xl font-bold text-red-600"
              aria-hidden="true"
            >
              !
            </span>
          </div>

          {/* HEADING */}
          <h2 id={titleId} className="mt-5 text-2xl font-bold text-[#172B52]">
            Delete Attendance Session?
          </h2>

          <p
            id={descriptionId}
            className="mt-3 text-sm leading-7 text-slate-600"
          >
            You are about to permanently delete this attendance session and all
            attendance records associated with it.
          </p>

          {/* SESSION DETAILS */}
          <div className="mt-5 rounded-xl border border-[#DDE5F0] bg-[#F6F8FC] p-4">
            <p className="font-bold text-[#172B52]">{sessionLabel}</p>

            <p className="mt-2 text-sm text-slate-500">Date: {sessionDate}</p>

            {sessionTime && (
              <p className="mt-1 text-sm text-slate-500">
                Time: {sessionTime.slice(0, 5)}
              </p>
            )}
          </div>

          {/* DELETION FORM */}
          <form action={formAction} className="mt-6 space-y-5">
            <input type="hidden" name="session_id" value={sessionId} />

            {/* CONFIRMATION INPUT */}
            <div>
              <label
                htmlFor={inputId}
                className="block text-sm font-semibold text-[#172B52]"
              >
                Confirm Deletion
              </label>

              <p className="mt-2 text-xs leading-6 text-slate-500">
                Type <strong>DELETE</strong> to enable permanent deletion.
              </p>

              <input
                id={inputId}
                name="confirmation"
                type="text"
                autoComplete="off"
                required
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder="Type DELETE"
                className="mt-3 min-h-12 w-full rounded-lg border border-[#DDE5F0] bg-white px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
              />
            </div>

            {/* ERROR MESSAGE */}
            {state.message && !state.success && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {state.message}
              </p>
            )}

            {/* WARNING */}
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-700">
                Permanent Action
              </p>

              <p className="mt-2 text-xs leading-6 text-red-700">
                All saved attendance records under this session will be deleted
                permanently. Student profiles and subjects will remain
                unchanged.
              </p>
            </div>

            {/* ACTION BUTTONS */}
            <DialogActions
              confirmed={confirmed}
              onCancel={() => dialogRef.current?.close()}
            />
          </form>
        </div>
      </dialog>
    </>
  );
}