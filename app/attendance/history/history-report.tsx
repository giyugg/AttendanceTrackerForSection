
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

export default function HistoryReport({
  sessions,
}: Props) {
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // Filter sessions by name and date
  const filtered = useMemo(() => {
    return sessions.filter((session) => {
      const matchesName = session.label
        .toLowerCase()
        .includes(search.trim().toLowerCase());

      const matchesDate =
        !selectedDate || session.date === selectedDate;

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
      }
    );
  }, [filtered]);

  // Protect CSV values from spreadsheet formula injection
  function csvCell(value: string | number) {
    const raw = String(value);
    const safe = /^\s*[=+\-@]/.test(raw)
      ? "'" + raw
      : raw;

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

    const csv = rows
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");

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
      {/* Statistics */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">
          Attendance Overview
        </h2>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {statCards.map((card) => (
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

      {/* Search and Filter */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">
            Search Attendance
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Search the 50 most recent sessions.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="search"
              className="mb-2 block text-sm font-medium"
            >
              Session Name
            </label>

            <input
              id="search"
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search session..."
              className="h-11 w-full rounded-lg border border-slate-300 px-4"
            />
          </div>

          <div>
            <label
              htmlFor="date"
              className="mb-2 block text-sm font-medium"
            >
              Attendance Date
            </label>

            <input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(event) =>
                setSelectedDate(event.target.value)
              }
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-4"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedDate("");
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

      {/* Session History */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">
            Session History
          </h2>

          <span className="text-sm text-slate-500">
            {filtered.length} sessions
          </span>
        </div>

        {filtered.map((session) => (
          <article
            key={session.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">
                  {session.label}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {session.date}
                </p>
              </div>

              <Link
                href={`/attendance/${session.id}`}
                className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                View Session →
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {[
                ["Marked", session.marked],
                ["Present", session.present],
                ["Late", session.late],
                ["Absent", session.absent],
                ["Excused", session.excused],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg bg-slate-50 p-3"
                >
                  <p className="text-xs text-slate-500">
                    {label}
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </article>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            No matching attendance sessions found.
          </div>
        )}
      </section>

      <p className="text-xs text-slate-500">
        Statistics count saved attendance records, not
        the number of unique students. Filters also apply
        to the statistics and CSV export.
      </p>
    </div>
  );
}