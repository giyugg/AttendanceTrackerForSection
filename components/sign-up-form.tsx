"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignUpForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    const supabase = createClient();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/protected` },
      });
      if (error) throw error;
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClassName = "min-h-12 w-full rounded-xl border border-[#DDE5F0] bg-white px-4 py-3 text-sm text-[#17263D] outline-none transition-colors placeholder:text-slate-400 focus:border-[#2448A5] focus:ring-2 focus:ring-[#2448A5]/10";

  return (
    <div className={cn("w-full", className)} {...props}>
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-widest text-[#2448A5]">Join Attendly</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#172B52] sm:text-4xl">Create your account</h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          Set up your account and start managing class attendance in one organized workspace.
        </p>
      </div>

      <form onSubmit={handleSignUp} className="space-y-5" aria-busy={isLoading}>
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#172B52]">Email Address</label>
          <input id="email" name="email" type="email" placeholder="Enter your email address" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClassName} />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#172B52]">Password</label>
          <input id="password" name="password" type="password" placeholder="Create a password" autoComplete="new-password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClassName} />
          <p className="mt-2 text-xs text-slate-400">Use at least 6 characters.</p>
        </div>

        <div>
          <label htmlFor="repeat-password" className="mb-2 block text-sm font-semibold text-[#172B52]">Confirm Password</label>
          <input id="repeat-password" name="repeat-password" type="password" placeholder="Enter your password again" autoComplete="new-password" minLength={6} required value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)} className={inputClassName} />
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">{error}</div>
        )}

        <button type="submit" disabled={isLoading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2448A5] px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#172B52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2448A5] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
          {isLoading ? "Creating your account..." : "Create Account →"}
        </button>

        <div className="border-t border-[#DDE5F0] pt-5 text-center">
          <p className="text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-bold text-[#2448A5] hover:text-[#172B52] hover:underline">Sign In</Link>
          </p>
        </div>
      </form>

      <p className="mt-6 text-center text-xs leading-6 text-slate-400">Built for BSIS 2B-G2 • Academic Year 2026–2027</p>
    </div>
  );
}
