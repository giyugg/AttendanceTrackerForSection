
"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ACCOUNT_REQUEST_EMAIL, ACCOUNT_REQUEST_MAILTO } from "@/lib/account-access";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  // EXISTING SUPABASE LOGIN LOGIC
  const handleLogin = async (
    e: React.SubmitEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const supabase = createClient();

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Redirect to Attendly Dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn("w-full", className)}
      {...props}
    >

      {/* FORM HEADING */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[#2448A5]">
          Welcome to Attendly
        </p>

        <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#172B52] sm:text-4xl">
          Welcome back!
        </h2>

        <p className="mt-3 text-sm leading-7 text-slate-500">
          Sign in to your account to access your
          class attendance workspace.
        </p>
      </div>

      {/* LOGIN FORM */}
      <form
        onSubmit={handleLogin}
        className="space-y-6"
        aria-busy={isLoading}
      >

        {/* EMAIL */}
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-semibold text-[#172B52]"
          >
            Email Address
          </label>

          <input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email address"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-12 w-full rounded-xl border border-[#DDE5F0] bg-white px-4 py-3 text-sm text-[#17263D] outline-none transition-colors placeholder:text-slate-400 focus:border-[#2448A5] focus:ring-2 focus:ring-[#2448A5]/10"
          />
        </div>

        {/* PASSWORD */}
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="password"
              className="text-sm font-semibold text-[#172B52]"
            >
              Password
            </label>

            <Link
              href="/auth/forgot-password"
              className="text-xs font-semibold text-[#2448A5] hover:text-[#172B52] hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          <input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="min-h-12 w-full rounded-xl border border-[#DDE5F0] bg-white px-4 py-3 text-sm text-[#17263D] outline-none transition-colors placeholder:text-slate-400 focus:border-[#2448A5] focus:ring-2 focus:ring-[#2448A5]/10"
          />
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700"
          >
            {error}
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2448A5] px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#172B52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2448A5] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Signing In..." : "Sign In →"}
        </button>

        {/* ACCOUNT ACCESS */}
        <div className="border-t border-[#DDE5F0] pt-6 text-center">
          <p className="text-sm leading-7 text-slate-500">
            Need an account? Email{" "}
            <a
              href={ACCOUNT_REQUEST_MAILTO}
              className="break-all font-bold text-[#2448A5] underline underline-offset-4 hover:text-[#172B52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2448A5] focus-visible:ring-offset-2"
            >
              {ACCOUNT_REQUEST_EMAIL}
            </a>.
          </p>
          <p className="mt-2 text-xs leading-6 text-slate-500">
            Use your educational email. Gmail and other personal email providers are not accepted.
          </p>
        </div>
      </form>

      {/* FORM FOOTER */}
      <p className="mt-8 text-center text-xs leading-6 text-slate-400">
        Built for BSIS 2B-G2 • Academic Year 2026–2027
      </p>
    </div>
  );
}
