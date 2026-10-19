import { Suspense, type ReactNode } from "react";
import AttendlyShell from "@/components/attendly-shell";
import { requireRole } from "@/lib/access";

function WorkspaceLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F6F8FC] px-4">
      <p role="status" className="text-sm font-semibold text-[#2448A5]">
        Loading Attendly...
      </p>
    </main>
  );
}

async function ResolvedShell({ children }: { children: ReactNode }) {
  const { role, displayName } = await requireRole(["admin", "president", "secretary", "student"]);

  return (
    <AttendlyShell role={role} displayName={displayName}>
      <Suspense fallback={<WorkspaceLoading />}>{children}</Suspense>
    </AttendlyShell>
  );
}

export default function AuthorizedShell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<WorkspaceLoading />}>
      <ResolvedShell>{children}</ResolvedShell>
    </Suspense>
  );
}
