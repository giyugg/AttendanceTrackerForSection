
import Link from "next/link";

const features = [
  {
    number: "01",
    title: "Student Management",
    description:
      "Keep your class roster organized, manage student information, and track active enrollments.",
  },
  {
    number: "02",
    title: "Attendance Monitoring",
    description:
      "Create attendance sessions and record students as Present, Late, Absent, or Excused.",
  },
  {
    number: "03",
    title: "Reports & History",
    description:
      "Review attendance records, explore statistics, and export reports in CSV format.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F6F8FC] text-[#17263D]">

      {/* NAVIGATION */}
      <header className="border-b border-[#DDE5F0] bg-white">
        <nav
          aria-label="Landing page navigation"
          className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:flex-nowrap sm:px-8 sm:py-0"
        >

          {/* LOGO */}
          <Link
            href="/"
            className="inline-flex items-center gap-3"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2448A5] text-xl font-bold text-white">
              A
            </span>

            <span>
              <span className="block text-xl font-bold tracking-tight text-[#172B52]">
                Attendly
              </span>

              <span className="block text-xs text-slate-500">
                Attendance Monitoring
              </span>
            </span>
          </Link>

          {/* NAVIGATION BUTTONS */}
          <div className="flex items-center gap-3">
            <Link
              href="#features"
              className="hidden text-sm font-semibold text-slate-600 transition-colors hover:text-[#2448A5] sm:inline"
            >
              Features
            </Link>

            <Link
              href="/auth/login"
              className="hidden min-h-11 items-center justify-center rounded-lg border border-[#DDE5F0] bg-white px-5 py-3 text-sm font-semibold text-[#172B52] transition-colors hover:bg-[#EAF0FF] sm:inline-flex"
            >
              Sign In
            </Link>

            <Link
              href="/auth/sign-up"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#2448A5] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#172B52]"
            >
              Need an account?
            </Link>
          </div>
        </nav>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden px-5 py-20 sm:px-8 sm:py-28 lg:py-36">

        {/* SOFT BACKGROUND ACCENT */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-[#EAF0FF] blur-3xl"
        />

        <div className="relative mx-auto max-w-5xl text-center">

          {/* EYEBROW LABEL */}
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#DDE5F0] bg-white px-4 py-2 text-xs font-bold tracking-wide text-[#2448A5]">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            CLASS ATTENDANCE MONITORING
          </div>

          {/* MAIN HEADING */}
          <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight tracking-tight text-[#172B52] sm:text-5xl lg:text-6xl">
            Attendance made{" "}
            <span className="text-[#2448A5]">
              simple.
            </span>
          </h1>

          {/* HERO DESCRIPTION */}
          <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            Meet Attendly, a centralized workspace designed
            to help class officers manage students, record
            attendance, and monitor class participation
            with ease.
          </p>

          {/* HERO ACTIONS */}
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/auth/login"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#2448A5] px-8 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#172B52] hover:shadow-md sm:w-auto"
            >
              Get Started →
            </Link>

            <Link
              href="/auth/sign-up"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-[#DDE5F0] bg-white px-8 py-3 text-sm font-semibold text-[#172B52] transition-colors hover:bg-[#EAF0FF] sm:w-auto"
            >
              Request account access
            </Link>
          </div>

          {/* CLASS INFORMATION */}
          <p className="mt-8 text-xs font-medium text-slate-500">
            Built for BSIS 2B-G2 • Academic Year 2026–2027
          </p>
        </div>
      </section>

      {/* WORKFLOW HIGHLIGHT */}
      <section className="px-5 pb-20 sm:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-[#DDE5F0] bg-white p-6 shadow-sm sm:p-10">

          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[#2448A5]">
              Your Attendance Workspace
            </p>

            <h2 className="mt-3 text-2xl font-bold text-[#172B52] sm:text-3xl">
              Everything in one place.
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
              From creating attendance sessions to
              reviewing class reports, Attendly helps
              keep your records organized.
            </p>
          </div>

          {/* WORKFLOW */}
          <div className="mt-10 grid gap-4 md:grid-cols-3">

            {[
              {
                step: "1",
                title: "Manage Students",
                text: "Keep your class roster up to date.",
              },
              {
                step: "2",
                title: "Record Attendance",
                text: "Mark and save attendance by session.",
              },
              {
                step: "3",
                title: "Review Reports",
                text: "Explore records and export summaries.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-xl border border-[#DDE5F0] bg-[#FAFBFE] p-5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF0FF] text-sm font-bold text-[#2448A5]">
                  {item.step}
                </span>

                <h3 className="mt-5 text-lg font-bold text-[#172B52]">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="scroll-mt-20 bg-white px-5 py-20 sm:px-8 sm:py-24"
      >
        <div className="mx-auto max-w-6xl">

          {/* FEATURES HEADING */}
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[#2448A5]">
              Attendly Features
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#172B52] sm:text-4xl">
              Made for better class management.
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-500">
              The essential tools class officers need
              to maintain organized attendance records.
            </p>
          </div>

          {/* FEATURE CARDS */}
          <div className="mt-12 grid gap-5 md:grid-cols-3">

            {features.map((feature) => (
              <article
                key={feature.number}
                className="rounded-2xl border border-[#DDE5F0] bg-[#FAFBFE] p-7 transition-shadow hover:shadow-md"
              >
                <span className="text-sm font-bold text-[#2448A5]">
                  {feature.number}
                </span>

                <div className="mt-6 h-1 w-12 rounded-full bg-[#2448A5]" />

                <h3 className="mt-6 text-xl font-bold text-[#172B52]">
                  {feature.title}
                </h3>

                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-6xl rounded-3xl bg-gradient-to-r from-[#172B52] to-[#2448A5] px-6 py-14 text-center text-white sm:px-10">

          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to get organized?
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-blue-100">
            Access your class workspace and start
            managing attendance with Attendly.
          </p>

          <Link
            href="/auth/login"
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-8 py-3 text-sm font-bold text-[#2448A5] transition-colors hover:bg-blue-50"
          >
            Sign In to Attendly →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#DDE5F0] bg-white px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">

          <p className="text-sm font-bold text-[#172B52]">
            Attendly
          </p>

          <p className="text-xs text-slate-500">
            Class Attendance Monitoring • BSIS 2B-G2
          </p>

          <p className="text-xs text-slate-400">
            Designed &amp; developed by Kyle A. Acuña
          </p>
        </div>
      </footer>

    </main>
  );
}
