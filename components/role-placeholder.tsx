import Link from "next/link";
import { ROLE_LABELS, type AppRole } from "@/lib/roles";

export default function RolePlaceholder({
  role,
  workspace,
  showAttendanceTools = false,
}: {
  role: AppRole;
  workspace: "officer" | "student";
  showAttendanceTools?: boolean;
}) {
  return (
    <main className="min-h-screen bg-[#F6F8FC] px-4 py-8 text-[#17263D] sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <p className="text-xs font-bold uppercase tracking-widest text-[#2448A5]">
            Attendly / {workspace === "officer" ? "Officers" : "Students"}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#172B52] sm:text-4xl">
            {workspace === "officer"
              ? role === "admin"
                ? "President / Secretary Dashboard"
                : `${ROLE_LABELS[role]} Dashboard`
              : "Student Dashboard"}
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Signed in as {ROLE_LABELS[role]} · BSIS 2B-G2
          </p>
        </header>

        <section className="rounded-2xl border border-[#DDE5F0] bg-white p-6 shadow-sm sm:p-8">
          <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
            Coming soon
          </span>
          <h2 className="mt-5 text-2xl font-bold text-[#172B52]">
            Under construction
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500">
            {workspace === "officer"
              ? "Your officer dashboard is being built. Your class roster, attendance tools, and reports are available below."
              : "Your student dashboard is being built. Please check back for updates."}
          </p>
        </section>

        {showAttendanceTools && (
          <section aria-labelledby="officer-tools-heading" className="space-y-4">
            <h2 id="officer-tools-heading" className="text-xl font-bold text-[#172B52]">
              Available tools
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { href: "/students", title: "Student Roster", description: "View enrolled students and individual attendance histories." },
                { href: "/attendance", title: "Attendance", description: "Create sessions and record class attendance." },
                { href: "/attendance/history", title: "Reports", description: "Review saved attendance sessions and reports." },
              ].map((tool) => (
                <Link key={tool.href} href={tool.href} className="rounded-2xl border border-[#DDE5F0] bg-white p-6 shadow-sm transition-colors hover:border-[#2448A5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2448A5]">
                  <h3 className="font-bold text-[#2448A5]">{tool.title} →</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{tool.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
