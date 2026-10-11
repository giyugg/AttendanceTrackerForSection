"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type HistorySession = {
  id: string;
  label: string;
  date: string;
  marked: number;
  present: number;
  late: number;
  absent: number;
  excused: number;
};

type Props = {
  sessions: HistorySession[];
};

export default function HistoryReport({ sessions }: Props) {
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // Filter sessions by name and date
  const filtered = useMemo(() => {
    return sessions.filter((session) => {
      const matchesName = session.label
        .toLowerCase()
        .includes(search.trim().toLowerCase());

      const matchesDate = !selectedDate || session.date === selectedDate;

      return matchesName && matchesDate;
    });
  }, [sessions, search, selectedDate]);

  // Aggregate statistics for visible sessions
  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, session) => ({
        sessions: acc.sessions + 1,
        marked: acc.marked + session.marked,
        present: acc.present + session.present,
        late: acc.late + session.late,
        absent: acc.absent + session.absent,
        excused: acc.excused + session.excused,
      }),
      {
        sessions: 0,
        marked: 0,
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
      },
    );
  }, [filtered]);

  // Protect CSV values from spreadsheet formula injection
  function csvCell(value: string | number) {
    const raw = String(value);
    const safe = /^\s*[=+\-@]/.test(raw) ? "'" + raw : raw;

    return `"${safe.replace(/"/g, '""')}"`;
  }

  // Download filtered session summaries as CSV
  function downloadCSV() {
    const rows = [
      [
        "Date",
        "Session",
        "Total Marked",
        "Present",
        "Late",
        "Absent",
        "Excused",
      ],
      ...filtered.map((session) => [
        session.date,
        session.label,
        session.marked,
        session.present,
        session.late,
        session.absent,
        session.excused,
      ]),
    ];

    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "attendly-g2-attendance-history.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  const statCards = [
    { label: "Sessions", value: totals.sessions },
    { label: "Total Marked", value: totals.marked },
    { label: "Present", value: totals.present },
    { label: "Late", value: totals.late },
    { label: "Absent", value: totals.absent },
    { label: "Excused", value: totals.excused },
  ];

  return (
    <div className="space-y-8">
      {/* ATTENDANCE STATISTICS */}
      <section>
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-widest text-[#2448A5]">
            Attendance Statistics
          </p>

          <h2 className="mt-2 text-xl font-bold text-[#172B52]">
            Attendance Overview
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Summary of attendance records matching your filters.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 sm:gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-[#DDE5F0] bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
            >
              <p className="text-sm font-medium text-slate-500">{card.label}</p>

              <p
                className={`mt-4 text-3xl font-bold ${
                  card.label === "Present"
                    ? "text-emerald-600"
                    : card.label === "Absent"
                      ? "text-red-600"
                      : card.label === "Late"
                        ? "text-amber-600"
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

      {/* SEARCH & FILTER */}
      <section className="overflow-hidden rounded-2xl border border-[#DDE5F0] bg-white shadow-sm">
        {/* FILTER HEADER */}
        <div className="border-b border-[#DDE5F0] bg-[#FAFBFE] p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#2448A5]">
            Find Attendance Records
          </p>

          <h2 className="mt-2 text-xl font-bold text-[#172B52]">
            Search Attendance
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Search and filter the 50 most recent attendance sessions.
          </p>
        </div>

        {/* FILTER INPUTS */}
        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          {/* SESSION NAME SEARCH */}
          <div>
            <label
              htmlFor="search"
              className="mb-2 block text-sm font-semibold text-[#172B52]"
            >
              Session Name
            </label>

            <input
              id="search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search session name..."
              className="min-h-12 w-full rounded-lg border border-[#DDE5F0] bg-white px-4 py-3 text-sm text-[#17263D] outline-none transition-colors placeholder:text-slate-400 focus:border-[#2448A5] focus:ring-2 focus:ring-[#2448A5]/10"
            />

            <p className="mt-2 text-xs text-slate-500">
              Enter a session name or keyword.
            </p>
          </div>

          {/* ATTENDANCE DATE FILTER */}
          <div>
            <label
              htmlFor="date"
              className="mb-2 block text-sm font-semibold text-[#172B52]"
            >
              Attendance Date
            </label>

            <input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="min-h-12 w-full rounded-lg border border-[#DDE5F0] bg-white px-4 py-3 text-sm text-[#17263D] outline-none transition-colors focus:border-[#2448A5] focus:ring-2 focus:ring-[#2448A5]/10"
            />

            <p className="mt-2 text-xs text-slate-500">
              Filter sessions by a specific date.
            </p>
          </div>
        </div>

        {/* FILTER ACTIONS */}
        <div className="flex flex-col gap-3 border-t border-[#DDE5F0] bg-[#FAFBFE] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedDate("");
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

      {/* SESSION HISTORY */}
      <section className="space-y-5">
        {/* SECTION HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#2448A5]">
              Attendance Records
            </p>

            <h2 className="mt-2 text-xl font-bold text-[#172B52]">
              Session History
            </h2>
          </div>

          <span className="rounded-full bg-[#EAF0FF] px-4 py-2 text-xs font-semibold text-[#2448A5]">
            {filtered.length} Sessions
          </span>
        </div>

        {/* SESSION CARDS */}
        <div className="space-y-4">
          {filtered.map((session) => (
            <article
              key={session.id}
              className="overflow-hidden rounded-2xl border border-[#DDE5F0] bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              {/* SESSION INFORMATION */}
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#2448A5]">
                    Attendance Session
                  </p>

                  <h3 className="mt-2 break-words text-lg font-bold text-[#172B52]">
                    {session.label}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Date: {session.date}
                  </p>
                </div>

                <Link
                  href={`/attendance/${session.id}`}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-[#DDE5F0] bg-white px-5 py-3 text-sm font-semibold text-[#2448A5] transition-colors hover:border-[#2448A5] hover:bg-[#EAF0FF]"
                >
                  View Session →
                </Link>
              </div>

              {/* SESSION STATISTICS */}
              <div className="grid grid-cols-2 gap-3 border-t border-[#DDE5F0] bg-[#FAFBFE] p-5 sm:grid-cols-5 sm:p-6">
                {[
                  {
                    label: "Marked",
                    value: session.marked,
                    color: "text-[#2448A5]",
                  },
                  {
                    label: "Present",
                    value: session.present,
                    color: "text-emerald-600",
                  },
                  {
                    label: "Late",
                    value: session.late,
                    color: "text-amber-600",
                  },
                  {
                    label: "Absent",
                    value: session.absent,
                    color: "text-red-600",
                  },
                  {
                    label: "Excused",
                    value: session.excused,
                    color: "text-blue-600",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-[#DDE5F0] bg-white p-4"
                  >
                    <p className="text-xs font-medium text-slate-500">
                      {stat.label}
                    </p>

                    <p className={`mt-3 text-2xl font-bold ${stat.color}`}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))}

          {/* EMPTY STATE */}
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-[#DDE5F0] bg-white p-10 text-center shadow-sm">
              <h3 className="text-lg font-bold text-[#172B52]">
                No Matching Sessions
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {sessions.length === 0
                  ? "No attendance sessions have been created yet."
                  : "Try adjusting your search or date filters."}
              </p>

              {(search || selectedDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSelectedDate("");
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
          About this report
        </p>

        <p className="mt-2 text-xs leading-6 text-slate-600">
          Statistics are based on saved attendance records from the 50 most
          recent sessions. These counts represent attendance entries, not unique
          students. Search and date filters affect both statistics and CSV
          exports.
        </p>
      </div>
    </div>
  );
}