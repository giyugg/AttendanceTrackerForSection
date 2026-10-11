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

export default function StudentReport({ student, entries }: Props) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // 1. Filter the student's records.
  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      const matchesStatus =
        statusFilter === "all" || entry.status === statusFilter;

      const matchesStart = !startDate || entry.date >= startDate;

      const matchesEnd = !endDate || entry.date <= endDate;

      return matchesStatus && matchesStart && matchesEnd;
    });
  }, [entries, statusFilter, startDate, endDate]);

  // 2. Calculate totals from filtered records.
  const totals = useMemo(() => {
    return {
      recorded: filtered.length,
      present: filtered.filter((entry) => entry.status === "present").length,
      late: filtered.filter((entry) => entry.status === "late").length,
      absent: filtered.filter((entry) => entry.status === "absent").length,
      excused: filtered.filter((entry) => entry.status === "excused").length,
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
    const safe = /^\s*[=+\-@]/.test(value) ? "'" + value : value;

    return `"${safe.replace(/"/g, '""')}"`;
  }

  // 3. Export filtered attendance history.
  function downloadCSV() {
    const rows = [
      ["Student Number", "Full Name", "Date", "Session", "Status"],
      ...filtered.map((entry) => [
        student.studentNumber,
        student.fullName,
        entry.date,
        entry.label,
        entry.status,
      ]),
    ];

    const csv = rows
      .map((row) => row.map((value) => csvCell(value)).join(","))
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
      {/* STUDENT INFORMATION */}
      <section className="overflow-hidden rounded-2xl border border-[#DDE5F0] bg-white shadow-sm">
        <div className="border-b border-[#DDE5F0] bg-[#FAFBFE] p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#2448A5]">
            Student Profile
          </p>

          <h2 className="mt-2 text-xl font-bold text-[#172B52]">
            Student Information
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-5 p-5 sm:p-6">
          <div className="flex min-w-0 items-center gap-4">
            {/* STUDENT AVATAR */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EAF0FF] text-xl font-bold text-[#2448A5]">
              {student.fullName.trim().charAt(0).toUpperCase()}
            </div>

            {/* STUDENT DETAILS */}
            <div className="min-w-0">
              <h3 className="break-words text-xl font-bold text-[#172B52] sm:text-2xl">
                {student.fullName}
              </h3>

              <p className="mt-2 break-all text-sm text-slate-500">
                Student Number: {student.studentNumber}
              </p>

              <p className="mt-1 text-xs text-slate-400">BSIS 2B-G2</p>
            </div>
          </div>

          {/* ENROLLMENT STATUS */}
          <span
            className={`rounded-full px-4 py-2 text-xs font-semibold ${
              student.isActive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {student.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </section>

      {/* ATTENDANCE STATISTICS */}
      <section>
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-widest text-[#2448A5]">
            Student Analytics
          </p>

          <h2 className="mt-2 text-xl font-bold text-[#172B52]">
            Attendance Overview
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Attendance statistics based on the selected filters.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-[#DDE5F0] bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
            >
              <p className="text-sm font-medium text-slate-500">{card.label}</p>

              <p
                className={`mt-4 text-3xl font-bold ${
                  card.label === "Present"
                    ? "text-emerald-600"
                    : card.label === "Late"
                      ? "text-amber-600"
                      : card.label === "Absent"
                        ? "text-red-600"
                        : card.label === "Excused"
                          ? "text-blue-600"
                          : "text-[#2448A5]"
                }`}
              >
                {card.value}
              </p>

              <div className="mt-4 h-1 w-10 rounded-full bg-[#DDE5F0]" />
            </div>
          ))}
        </div>
      </section>

      {/* ATTENDANCE FILTERS */}
      <section className="overflow-hidden rounded-2xl border border-[#DDE5F0] bg-white shadow-sm">
        {/* FILTER HEADER */}
        <div className="border-b border-[#DDE5F0] bg-[#FAFBFE] p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#2448A5]">
            Find Attendance Records
          </p>

          <h2 className="mt-2 text-xl font-bold text-[#172B52]">
            Filter Attendance
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Filter records by attendance status or date range.
          </p>
        </div>

        {/* FILTER INPUTS */}
        <div className="grid gap-5 p-5 sm:grid-cols-3 sm:p-6">
          {/* STATUS FILTER */}
          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-semibold text-[#172B52]"
            >
              Attendance Status
            </label>

            <select
              id="status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="min-h-12 w-full rounded-lg border border-[#DDE5F0] bg-white px-4 py-3 text-sm text-[#17263D] outline-none transition-colors focus:border-[#2448A5] focus:ring-2 focus:ring-[#2448A5]/10"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* START DATE */}
          <div>
            <label
              htmlFor="start_date"
              className="mb-2 block text-sm font-semibold text-[#172B52]"
            >
              From Date
            </label>

            <input
              id="start_date"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="min-h-12 w-full rounded-lg border border-[#DDE5F0] bg-white px-4 py-3 text-sm text-[#17263D] outline-none transition-colors focus:border-[#2448A5] focus:ring-2 focus:ring-[#2448A5]/10"
            />
          </div>

          {/* END DATE */}
          <div>
            <label
              htmlFor="end_date"
              className="mb-2 block text-sm font-semibold text-[#172B52]"
            >
              To Date
            </label>

            <input
              id="end_date"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
              className="min-h-12 w-full rounded-lg border border-[#DDE5F0] bg-white px-4 py-3 text-sm text-[#17263D] outline-none transition-colors focus:border-[#2448A5] focus:ring-2 focus:ring-[#2448A5]/10"
            />
          </div>
        </div>

        {/* FILTER ACTIONS */}
        <div className="flex flex-col gap-3 border-t border-[#DDE5F0] bg-[#FAFBFE] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <button
            type="button"
            onClick={() => {
              setStatusFilter("all");
              setStartDate("");
              setEndDate("");
            }}
            className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-slate-600 hover:text-[#2448A5] hover:underline sm:justify-start"
          >
            Clear Filters
          </button>

          <button
            type="button"
            onClick={downloadCSV}
            disabled={filtered.length === 0}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#2448A5] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#172B52] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Download CSV
          </button>
        </div>
      </section>

      {/* INDIVIDUAL ATTENDANCE RECORDS */}
      <section className="space-y-5">
        {/* SECTION HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#2448A5]">
              Individual Records
            </p>

            <h2 className="mt-2 text-xl font-bold text-[#172B52]">
              Attendance Records
            </h2>
          </div>

          <span className="rounded-full bg-[#EAF0FF] px-4 py-2 text-xs font-semibold text-[#2448A5]">
            {filtered.length} Records
          </span>
        </div>

        {/* RECORD CARDS */}
        <div className="space-y-3">
          {filtered.map((entry) => (
            <article
              key={entry.sessionId}
              className="overflow-hidden rounded-2xl border border-[#DDE5F0] bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
                {/* RECORD INFORMATION */}
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#2448A5]">
                    Attendance Session
                  </p>

                  <h3 className="mt-2 break-words text-lg font-bold text-[#172B52]">
                    {entry.label}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Date: {entry.date}
                  </p>
                </div>

                {/* ATTENDANCE STATUS */}
                <span
                  className={`rounded-full px-4 py-2 text-xs font-bold ${
                    statusStyles[entry.status] ?? "bg-slate-100 text-slate-600"
                  }`}
                >
                  {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                </span>
              </div>
            </article>
          ))}

          {/* EMPTY STATE */}
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-[#DDE5F0] bg-white p-10 text-center shadow-sm">
              <h3 className="text-lg font-bold text-[#172B52]">
                No Attendance Records Found
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {entries.length === 0
                  ? "No saved attendance records are available for this student yet."
                  : "No records match the selected filters."}
              </p>

              {entries.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("all");
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#EAF0FF] px-5 py-3 text-sm font-semibold text-[#2448A5] hover:bg-blue-100"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* REPORT INFORMATION */}
      <div className="rounded-xl border border-[#DDE5F0] bg-[#EAF0FF] p-5">
        <p className="text-sm font-semibold text-[#172B52]">
          About this student report
        </p>

        <p className="mt-2 text-xs leading-6 text-slate-600">
          This report includes saved attendance records only. Missing records
          are not automatically counted as absences. Statistics and CSV exports
          reflect the selected filters. Historical records remain available when
          a student becomes inactive.
        </p>
      </div>
    </div>
  );
}
