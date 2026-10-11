import Link from "next/link";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import SubjectForm from "./subject-form";
import { setSubjectActive } from "./actions";

export default async function SubjectsPage() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // Administrator access only.
  const { data: admin, error: adminError } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) {
    throw new Error("Unable to verify administrator access.");
  }

  if (!admin) {
    notFound();
  }

  // Find the current class.
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("id")
    .eq("code", "BSIS 2B-G2")
    .eq("academic_year", "2026-2027")
    .eq("term", "1st Semester")
    .maybeSingle();

  if (classError || !classData) {
    notFound();
  }

  // Load subjects.
  const { data: subjects, error: subjectsError } = await supabase
    .from("subjects")
    .select("id, code, name, is_active")
    .eq("class_id", classData.id)
    .order("code", { ascending: true });

  if (subjectsError) {
    throw new Error("Unable to load class subjects.");
  }

  const subjectList = subjects ?? [];

  const activeCount = subjectList.filter((subject) => subject.is_active).length;

  return (
    <main className="min-h-screen bg-[#F6F8FC] px-4 py-8 text-[#17263D] sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* PAGE HEADER */}
        <header>
          <Link
            href="/attendance"
            className="text-sm font-semibold text-[#2448A5] hover:text-[#172B52]"
          >
            ← Back to Attendance
          </Link>

          <p className="mt-7 text-xs font-bold uppercase tracking-widest text-[#2448A5]">
            Attendly / Subjects
          </p>

          <h1 className="mt-3 text-3xl font-bold text-[#172B52] sm:text-4xl">
            Subject Management
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            Add and manage subjects for BSIS 2B-G2.
          </p>
        </header>

        {/* SUMMARY */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[#DDE5F0] bg-white p-5 shadow-sm sm:p-6">
            <p className="text-sm text-slate-500">Total Subjects</p>

            <p className="mt-3 text-3xl font-bold text-[#2448A5]">
              {subjectList.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[#DDE5F0] bg-white p-5 shadow-sm sm:p-6">
            <p className="text-sm text-slate-500">Active Subjects</p>

            <p className="mt-3 text-3xl font-bold text-[#2448A5]">
              {activeCount}
            </p>
          </div>
        </div>

        {/* ADD SUBJECT */}
        <SubjectForm />

        {/* SAVED SUBJECTS */}
        <section className="overflow-hidden rounded-2xl border border-[#DDE5F0] bg-white shadow-sm">
          <div className="border-b border-[#DDE5F0] p-5 sm:p-6">
            <h2 className="text-xl font-bold text-[#172B52]">Class Subjects</h2>

            <p className="mt-2 text-sm text-slate-500">
              {subjectList.length} registered subjects
            </p>
          </div>

          {subjectList.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <h3 className="text-lg font-bold text-[#172B52]">
                No Subjects Added Yet
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Use the form above to register your first subject.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#DDE5F0]">
              {subjectList.map((subject) => (
                <article
                  key={subject.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#2448A5]">
                      {subject.code}
                    </p>

                    <h3 className="mt-1 break-words text-lg font-bold text-[#172B52]">
                      {subject.name}
                    </h3>

                    <span
                      className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        subject.is_active
                          ? "bg-green-50 text-green-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {subject.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <form action={setSubjectActive}>
                    <input type="hidden" name="subject_id" value={subject.id} />

                    <input
                      type="hidden"
                      name="next_active"
                      value={subject.is_active ? "false" : "true"}
                    />

                    <button
                      type="submit"
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[#DDE5F0] bg-white px-5 py-3 text-sm font-semibold text-[#2448A5] hover:bg-[#EAF0FF] sm:w-auto"
                    >
                      {subject.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </form>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}