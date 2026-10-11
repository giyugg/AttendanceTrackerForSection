
"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  saveAttendance,
  type AttendanceState,
} from "./actions";

type Student = {
  id: string;
  student_number: string;
  full_name: string;
};

type Props = {
  sessionId: string;
  students: Student[];
  initialStatuses: Record<string, string>;
  canMark: boolean;
};

const options = [
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "absent", label: "Absent" },
  { value: "excused", label: "Excused" },
];

const selectedStyles: Record<string, string> = {
  present: "border-green-500 bg-green-50 text-green-800",
  late: "border-amber-500 bg-amber-50 text-amber-800",
  absent: "border-red-500 bg-red-50 text-red-800",
  excused: "border-blue-500 bg-blue-50 text-blue-800",
};

const initialState: AttendanceState = {
  success: false,
  message: "",
};

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 w-full rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 sm:w-auto"
    >
      {pending ? "Saving Attendance..." : "Save Attendance"}
    </button>
  );
}

export default function AttendanceForm({
  sessionId,
  students,
  initialStatuses,
  canMark,
}: Props) {
  const [state, formAction] = useActionState(
    saveAttendance,
    initialState
  );

  const [statuses, setStatuses] = useState(
    initialStatuses
  );

  const totalMarked = students.filter(
    (student) => Boolean(statuses[student.id])
  ).length;

  return (
    <form action={formAction} className="space-y-5">
      <input
        type="hidden"
        name="session_id"
        value={sessionId}
      />

      {/* Attendance Progress */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">
            Attendance Progress
          </h2>

          <span className="text-sm text-slate-600">
            {totalMarked} / {students.length} Marked
          </span>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{
              width: `${
                students.length > 0
                  ? (totalMarked / students.length) * 100
                  : 0
              }%`,
            }}
          />
        </div>
      </div>

      {/* Student Attendance List */}
      <div className="space-y-3">
        {students.map((student) => {
          const selected = statuses[student.id] ?? "";

          return (
            <div
              key={student.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-4">
                <h3 className="font-semibold">
                  {student.full_name}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {student.student_number}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {options.map((option) => {
                  const isSelected =
                    selected === option.value;

                  return (
                    <label
                      key={option.value}
                      className={`
                        flex min-h-11 cursor-pointer
                        items-center justify-center
                        rounded-lg border px-3 py-2
                        text-sm font-medium
                        transition-colors
                        ${
                          isSelected
                            ? selectedStyles[option.value]
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }
                        ${!canMark ? "cursor-default opacity-75" : ""}
                      `}
                    >
                      <input
                        type="radio"
                        name={`status_${student.id}`}
                        value={option.value}
                        checked={isSelected}
                        disabled={!canMark}
                        onChange={() => {
                          setStatuses((previous) => ({
                            ...previous,
                            [student.id]: option.value,
                          }));
                        }}
                        className="sr-only"
                      />

                      {option.label}
                    </label>
                  );
                })}
              </div>

              {!selected && (
                <p className="mt-3 text-xs text-slate-500">
                  Not Marked
                </p>
              )}
            </div>
          );
        })}

        {students.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            No active students found in G2.
          </div>
        )}
      </div>

      {/* Save Attendance */}
      {canMark && students.length > 0 && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
          <SaveButton />

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
        </div>
      )}
    </form>
  );
}