import { cn } from "@/lib/utils";
import { ACCOUNT_REQUEST_EMAIL, ACCOUNT_REQUEST_MAILTO } from "@/lib/account-access";
import Link from "next/link";

export function AccountRequestNotice({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("w-full", className)} {...props}>
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-widest text-[#2448A5]">Account access</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#172B52] sm:text-4xl">Need an account?</h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          Accounts are created by an administrator. Email{" "}
          <a href={ACCOUNT_REQUEST_MAILTO} className="break-all font-bold text-[#2448A5] underline underline-offset-4 hover:text-[#172B52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2448A5] focus-visible:ring-offset-2">
            {ACCOUNT_REQUEST_EMAIL}
          </a>{" "}
          to request access.
        </p>
      </div>

      <div className="rounded-xl border border-[#DDE5F0] bg-[#F6F8FC] p-5 text-sm leading-7 text-slate-600">
        Use your educational email. Gmail and other personal email providers are not accepted.
      </div>

      <div className="mt-7 border-t border-[#DDE5F0] pt-5 text-center">
        <p className="text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-bold text-[#2448A5] hover:text-[#172B52] hover:underline">Sign In</Link>
        </p>
      </div>

      <p className="mt-6 text-center text-xs leading-6 text-slate-400">Built for BSIS 2B-G2 · Academic Year 2026–2027</p>
    </div>
  );
}
