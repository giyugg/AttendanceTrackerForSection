
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AddStudentForm from "./add-student-form";

export default async function NewStudentPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: admin, error } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to verify administrator access.");
  }

  if (!admin) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">
          Access Denied
        </h1>
        <p>Only administrators can add student profiles.</p>
        <Link href="/students" className="underline">
          Back to Student Roster
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href="/students"
          className="text-sm text-slate-600 hover:underline"
        >
          ← Back to Student Roster
        </Link>

        <header>
          <h1 className="text-3xl font-bold">
            Add New Student
          </h1>

          <p className="mt-2 text-slate-600">
            Register a student under BSIS 2B-G2.
          </p>
        </header>

        <AddStudentForm />
      </div>
    </main>
  );
}