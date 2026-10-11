"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={logout}
      className={`border-[#DDE5F0] bg-white text-slate-600 shadow-none hover:border-red-200 hover:bg-red-50 hover:text-red-700 ${className}`}
    >
      <LogOut aria-hidden="true" />
      Log out
    </Button>
  );
}
