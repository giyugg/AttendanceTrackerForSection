"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveAttendance, type AttendanceState } from "./actions";

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
  {
    value: "present",
    label: "Present",
    color: "bg-emerald-500",
  },
  {
    value: "late",
    label: "Late",
    color: "bg-amber-500",
  },
  {
    value: "absent",
    label: "Absent",
    color: "bg-red-500",
  },
  {
    value: "excused",
    label: "Excused",
    color: "bg-blue-500",
  },
];

const selectedStyles: Record<string, string> = {
  present: "border-emerald-500 bg-emerald-50 text-emerald-800",
  late: "border-amber-500 bg-amber-50 text-amber-800",
  absent: "border-red-500 bg-red-50 text-red-800",
  excused: "border-blue-500 bg-blue-50 text-blue-800",
};

const initialState: AttendanceState = {
  success: false,
  message: "",
};

// SAVE BUTTON
function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#2448A5] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#172B52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2448A5] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
  const [state, formAction] = useActionState(saveAttendance, initialState);

  const [statuses, setStatuses] =
    useState<Record<string, string>>(initialStatuses);

  // COUNT SELECTED ATTENDANCE STATUSES
  const totalMarked = students.filter((student) =>
    Boolean(statuses[student.id]),
  ).length;

  const notMarked = students.length - totalMarked;

  const percentage =
    students.length > 0 ? Math.round((totalMarked / students.length) * 100) : 0;

  const statusCounts = options.map((option) => ({
    ...option,
    count: students.filter((student) => statuses[student.id] === option.value)
      .length,
  }));

  return (
    <form action={formAction} className="space-y-8">
      {/* SESSION ID */}
      <input type="hidden" name="session_id" value={sessionId} />

      {/* ATTENDANCE PROGRESS */}
      <section className="rounded-2xl border border-[#DDE5F0] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#2448A5]">
              Session Overview
            </p>

            <h2 className="mt-2 text-xl font-bold text-[#172B52]">
              Attendance Progress
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Track attendance selections for this session.
            </p>
          </div>

          <div className="rounded-xl bg-[#EAF0FF] px-4 py-3 text-center">
            <p className="text-xl font-bold text-[#2448A5]">{percentage}%</p>

            <p className="text-xs font-medium text-[#2448A5]">Complete</p>
          </div>
        </div>

        {/* PROGRESS NUMBERS */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[#172B52]">
            {totalMarked} of {students.length} Marked
          </p>

          <p className="text-sm text-slate-500">{notMarked} Remaining</p>
        </div>

        {/* PROGRESS BAR */}
        <div
          role="progressbar"
          aria-label="Attendance marking progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentage}
          className="mt-3 h-3 overflow-hidden rounded-full bg-[#EAF0FF]"
        >
          <div
            className="h-full rounded-full bg-[#2448A5] transition-all duration-300"
            style={{
              width: `${percentage}%`,
            }}
          />
        </div>

        {/* STATUS COUNTS */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statusCounts.map((status) => (
            <div
              key={status.value}
              className="rounded-xl border border-[#DDE5F0] bg-[#FAFBFE] p-4"
            >
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${status.color}`} />

                <p className="text-xs font-medium text-slate-500">
                  {status.label}
                </p>
              </div>

              <p className="mt-3 text-2xl font-bold text-[#172B52]">
                {status.count}
              </p>
            </div>
          ))}
        </div>

        {canMark && (
          <p className="mt-5 text-xs text-slate-500">
            Changes are not saved until you select Save Attendance.
          </p>
        )}
      </section>

      {/* STUDENT ATTENDANCE HEADER */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#2448A5]">
          Student Attendance
        </p>

        <h2 className="mt-2 text-xl font-bold text-[#172B52]">
          {canMark ? "Mark Student Attendance" : "Student Records"}
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          {canMark
            ? "Select one attendance status for each student. Select it again to clear it."
            : "View attendance statuses recorded for this session."}
        </p>
      </div>

      {/* STUDENT ATTENDANCE CARDS */}
      <div className="space-y-4">
        {students.map((student) => {
          const selected = statuses[student.id] ?? "";

          const selectedOption = options.find(
            (option) => option.value === selected,
          );

          return (
            <section
              key={student.id}
              className="rounded-2xl border border-[#DDE5F0] bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
            >
              {/* STUDENT INFORMATION */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-base font-bold text-[#172B52] sm:text-lg">
                    {student.full_name}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Student Number: {student.student_number}
                  </p>
                </div>

                {/* SELECTED STATUS */}
                {selectedOption ? (
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      selectedStyles[selected]
                    }`}
                  >
                    {selectedOption.label}
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                    Not Marked
                  </span>
                )}
              </div>

              {/* STATUS SELECTION */}
              <fieldset
                disabled={!canMark}
                className="mt-5 border-t border-[#DDE5F0] pt-5"
              >
                <legend className="sr-only">
                  Attendance status for {student.full_name}
                </legend>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                  {options.map((option) => {
                    const isSelected = selected === option.value;

                    return (
                      <label
                        key={option.value}
                        className={`
                          flex min-h-12 items-center justify-center
                          rounded-xl border px-3 py-3
                          text-sm font-semibold
                          transition-colors
                          focus-within:ring-2
                          focus-within:ring-[#2448A5]
                          focus-within:ring-offset-2
                          ${
                            isSelected
                              ? selectedStyles[option.value]
                              : "border-[#DDE5F0] bg-white text-slate-600 hover:bg-[#F6F8FC]"
                          }
                          ${
                            canMark
                              ? "cursor-pointer"
                              : "cursor-default opacity-80"
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name={`status_${student.id}`}
                          value={option.value}
                          checked={isSelected}
                          disabled={!canMark}
                          onClick={(event) => {
                            if (!isSelected) {
                              return;
                            }

                            event.preventDefault();
                            setStatuses((previous) => {
                              const next = { ...previous };
                              delete next[student.id];
                              return next;
                            });
                          }}
                          onChange={() => {
                            setStatuses((previous) => ({
                              ...previous,
                              [student.id]: option.value,
                            }));
                          }}
                          className="sr-only"
                        />

                        <span
                          aria-hidden="true"
                          className={`mr-2 h-2 w-2 shrink-0 rounded-full ${option.color}`}
                        />

                        {option.label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {/* NOT MARKED MESSAGE */}
              {!selected && (
                <p className="mt-4 text-xs text-slate-500">
                  No attendance status has been selected for this student.
                </p>
              )}
            </section>
          );
        })}

        {/* EMPTY STATE */}
        {students.length === 0 && (
          <div className="rounded-2xl border border-[#DDE5F0] bg-white p-10 text-center shadow-sm">
            <h3 className="text-lg font-bold text-[#172B52]">
              No Active Students
            </h3>

            <p className="mt-3 text-sm text-slate-500">
              No active students were found in BSIS 2B-G2.
            </p>
          </div>
        )}
      </div>

      {/* SAVE ATTENDANCE */}
      {canMark && students.length > 0 && (
        <div className="sticky bottom-3 z-10 rounded-2xl border border-[#DDE5F0] bg-white/95 p-4 shadow-lg backdrop-blur-sm sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-[#172B52]">
                Ready to save attendance?
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {totalMarked} of {students.length} students marked
              </p>
            </div>

            <SaveButton />
          </div>

          {/* SUCCESS / ERROR MESSAGE */}
          {state.message && (
            <p
              role="status"
              aria-live="polite"
              className={`mt-4 rounded-lg border p-4 text-sm ${
                state.success
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
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
