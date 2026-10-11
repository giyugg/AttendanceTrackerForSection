
"use client";

import { useMemo, useState } from "react";

export type AttendanceEntry = {
  sessionId: string;
  label: string;
  date: string;
  status: string;
};

type StudentInfo = {
  fullName: string;
  studentNumber: string;
  isActive: boolean;
};

type Props = {
  student: StudentInfo;
  entries: AttendanceEntry[];
};

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "absent", label: "Absent" },
  { value: "excused", label: "Excused" },
];

const statusStyles: Record<string, string> = {
  present: "bg-green-50 text-green-700",
  late: "bg-amber-50 text-amber-700",
  absent: "bg-red-50 text-red-700",
  excused: "bg-blue-50 text-blue-700",
};

export default function StudentReport({
  student,
  entries,
}: Props) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // 1. Filter the student's records.
  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      const matchesStatus =
        statusFilter === "all" ||
        entry.status === statusFilter;

      const matchesStart =
        !startDate || entry.date >= startDate;

      const matchesEnd =
        !endDate || entry.date <= endDate;

      return matchesStatus && matchesStart && matchesEnd;
    });
  }, [entries, statusFilter, startDate, endDate]);

  // 2. Calculate totals from filtered records.
  const totals = useMemo(() => {
    return {
      recorded: filtered.length,
      present: filtered.filter(
        (entry) => entry.status === "present"
      ).length,
      late: filtered.filter(
        (entry) => entry.status === "late"
      ).length,
      absent: filtered.filter(
        (entry) => entry.status === "absent"
      ).length,
      excused: filtered.filter(
        (entry) => entry.status === "excused"
      ).length,
    };
  }, [filtered]);

  const cards = [
    { label: "Recorded", value: totals.recorded },
    { label: "Present", value: totals.present },
    { label: "Late", value: totals.late },
    { label: "Absent", value: totals.absent },
    { label: "Excused", value: totals.excused },
  ];

  // Protect CSV fields from spreadsheet formulas.
  function csvCell(value: string) {
    const safe = /^\s*[=+\-@]/.test(value)
      ? "'" + value
      : value;

    return `"${safe.replace(/"/g, '""')}"`;
  }

  // 3. Export filtered attendance history.
  function downloadCSV() {
    const rows = [
      [
        "Student Number",
        "Full Name",
        "Date",
        "Session",
        "Status",
      ],
      ...filtered.map((entry) => [
        student.studentNumber,
        student.fullName,
        entry.date,
        entry.label,
        entry.status,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map((value) => csvCell(value)).join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "attendly-student-attendance.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">

      {/* Student Information */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">
              {student.fullName}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Student Number: {student.studentNumber}
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              student.isActive
                ? "bg-green-50 text-green-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {student.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </section>

      {/* Attendance Statistics */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">
          Attendance Overview
        </h2>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-slate-500">
                {card.label}
              </p>

              <p className="mt-3 text-3xl font-bold">
                {card.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Report Filters */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">
          Filter Attendance
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-medium"
            >
              Attendance Status
            </label>

            <select
              id="status"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3"
            >
              {statusOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="start_date"
              className="mb-2 block text-sm font-medium"
            >
              From Date
            </label>

            <input
              id="start_date"
              type="date"
              value={startDate}
              onChange={(e) =>
                setStartDate(e.target.value)
              }
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3"
            />
          </div>

          <div>
            <label
              htmlFor="end_date"
              className="mb-2 block text-sm font-medium"
            >
              To Date
            </label>

            <input
              id="end_date"
              type="date"
              value={endDate}
              onChange={(e) =>
                setEndDate(e.target.value)
              }
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setStatusFilter("all");
              setStartDate("");
              setEndDate("");
            }}
            className="text-sm font-medium text-slate-600 hover:underline"
          >
            Clear Filters
          </button>

          <button
            type="button"
            onClick={downloadCSV}
            disabled={filtered.length === 0}
            className="min-h-11 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            Download CSV
          </button>
        </div>
      </section>

      {/* Individual Attendance Records */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">
            Attendance Records
          </h2>

          <span className="text-sm text-slate-500">
            {filtered.length} records
          </span>
        </div>

        {filtered.map((entry) => (
          <article
            key={entry.sessionId}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">
                  {entry.label}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {entry.date}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  statusStyles[entry.status] ??
                  "bg-slate-100 text-slate-600"
                }`}
              >
                {entry.status.charAt(0).toUpperCase() +
                  entry.status.slice(1)}
              </span>
            </div>
          </article>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            {entries.length === 0
              ? "No saved attendance records for this student yet."
              : "No attendance records match your filters."}
          </div>
        )}
      </section>

      <p className="text-xs text-slate-500">
        This report includes saved attendance records only.
        Missing records are not automatically counted as absences.
        Statistics and CSV exports reflect the selected filters.
      </p>

    </div>
  );
}