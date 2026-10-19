"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LogoutButton } from "@/components/logout-button";
import { ROLE_LABELS, roleHome, type AppRole } from "@/lib/roles";

const classNavItems = [
  {
    href: "/students",
    label: "Students",
    icon: "students",
  },
  {
    href: "/attendance",
    label: "Attendance",
    icon: "attendance",
  },
  {
    href: "/attendance/history",
    label: "Reports",
    icon: "reports",
  },
] as const;

type NavIconName = "dashboard" | "students" | "attendance" | "reports";
type NavItem = { href: string; label: string; icon: NavIconName };

function NavIcon({ name }: { name: NavIconName }) {
  return (
    <svg
      aria-hidden="true"
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      {name === "dashboard" && (
        <>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </>
      )}

      {name === "students" && (
        <>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20v-2a6 6 0 0 1 12 0v2" />
          <path d="M17 5a3 3 0 0 1 0 6" />
          <path d="M17 15a5 5 0 0 1 4 5" />
        </>
      )}

      {name === "attendance" && (
        <>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M7 3v4M17 3v4M3 10h18" />
          <path d="m8 16 2 2 5-5" />
        </>
      )}

      {name === "reports" && (
        <>
          <path d="M4 20h16" />
          <rect x="5" y="12" width="3" height="7" rx="1" />
          <rect x="11" y="8" width="3" height="11" rx="1" />
          <rect x="17" y="4" width="3" height="15" rx="1" />
        </>
      )}
    </svg>
  );
}

function Brand({ home }: { home: string }) {
  return (
    <Link href={home} className="inline-flex items-center gap-3">
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
  );
}

export default function AttendlyShell({
  children,
  role,
}: {
  children: ReactNode;
  role: AppRole;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const home = roleHome(role);
  const navItems: NavItem[] = [
    { href: home, label: "Dashboard", icon: "dashboard" },
    ...(role === "student" ? [] : classNavItems),
    ...(role === "admin"
      ? [{ href: "/admin/users", label: "Accounts", icon: "students" as const }]
      : []),
  ];

  // Match complete paths or their child routes.
  function matchesRoute(route: string) {
    return pathname === route || pathname.startsWith(`${route}/`);
  }

  // Reports must take priority over the parent
  // /attendance route when highlighting navigation.
  const activeHref = matchesRoute("/attendance/history")
    ? "/attendance/history"
    : matchesRoute("/admin")
      ? "/admin/users"
      : navItems.find((item) => matchesRoute(item.href))?.href;

  function navigationLinks() {
    return navItems.map((item) => {
      const isActive = item.href === activeHref;

      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setMenuOpen(false)}
          aria-current={isActive ? "page" : undefined}
          className={`flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2448A5] ${
            isActive
              ? "bg-[#EAF0FF] text-[#2448A5]"
              : "text-slate-600 hover:bg-[#F6F8FC] hover:text-[#172B52]"
          }`}
        >
          <NavIcon name={item.icon} />
          <span>{item.label}</span>
        </Link>
      );
    });
  }

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#17263D] lg:flex">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden w-64 shrink-0 border-r border-[#DDE5F0] bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:p-5">
        <div className="px-2 py-3">
          <Brand home={home} />
        </div>

        <div className="mt-10">
          <p className="mb-4 px-4 text-xs font-bold uppercase tracking-widest text-slate-400">
            Workspace
          </p>

          <nav aria-label="Main navigation" className="space-y-2">
            {navigationLinks()}
          </nav>
        </div>

        {/* SIDEBAR FOOTER */}
        <div className="mt-auto space-y-3">
          <p className="px-4 text-xs font-semibold text-[#2448A5]">
            {ROLE_LABELS[role]}
          </p>
          <div className="rounded-xl bg-[#F6F8FC] p-4">
            <p className="text-sm font-bold text-[#172B52]">BSIS 2B-G2</p>

            <p className="mt-1 text-xs text-slate-500">Academic Year 2026–2027</p>
          </div>

          <LogoutButton className="h-11 w-full rounded-xl" />
        </div>
      </aside>

      {/* PAGE CONTENT */}
      <div className="min-w-0 flex-1">
        {/* MOBILE HEADER */}
        <header className="sticky top-0 z-40 border-b border-[#DDE5F0] bg-white/95 backdrop-blur-sm lg:hidden">
          <div className="flex min-h-20 items-center justify-between gap-3 px-4 sm:px-6">
            <Brand home={home} />

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={
                menuOpen ? "Close navigation menu" : "Open navigation menu"
              }
              aria-expanded={menuOpen}
              aria-controls="attendly-mobile-menu"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#DDE5F0] bg-white text-[#172B52] transition-colors hover:bg-[#EAF0FF]"
            >
              <svg
                aria-hidden="true"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                {menuOpen ? (
                  <path d="M18 6 6 18M6 6l12 12" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>

          {/* MOBILE NAVIGATION MENU */}
          <nav
            id="attendly-mobile-menu"
            aria-label="Mobile navigation"
            className={`border-t border-[#DDE5F0] bg-white px-4 py-3 sm:px-6 ${
              menuOpen ? "block" : "hidden"
            }`}
          >
            <div className="space-y-1">{navigationLinks()}</div>
            <p className="mt-4 px-4 text-xs font-semibold text-[#2448A5]">
              {ROLE_LABELS[role]}
            </p>

            <p className="mt-4 border-t border-[#DDE5F0] pt-4 text-xs text-slate-500">
              BSIS 2B-G2 • AY 2026–2027
            </p>
            <LogoutButton className="mt-4 h-11 w-full rounded-xl" />
          </nav>
        </header>

        {/* EXISTING NEXT.JS PAGE */}
        {children}
      </div>
    </div>
  );
}
