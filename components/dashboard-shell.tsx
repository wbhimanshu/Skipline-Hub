"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  CalendarClock,
  ClipboardList,
  FileWarning,
  Gauge,
  HeartPulse,
  LayoutDashboard,
  LifeBuoy,
  ListOrdered,
  LogOut,
  Menu,
  MonitorSmartphone,
  QrCode,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/ui";
import { Logo } from "@/components/logo";
import { LanguageToggle } from "@/components/language-toggle";
import { useToast } from "@/components/providers";
import { cn } from "@/lib/utils";

type Role = "user" | "org" | "admin";

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };

const NAV: Record<Role, NavItem[]> = {
  user: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/dashboard/tickets", label: "My tokens", icon: Ticket },
    { href: "/dashboard/appointments", label: "Appointments", icon: CalendarClock },
    { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
    { href: "/centres", label: "Find centres", icon: Search },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ],
  org: [
    { href: "/org", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/org/queue", label: "Live queue", icon: ListOrdered },
    { href: "/org/appointments", label: "Appointments", icon: CalendarClock },
    { href: "/org/emergency", label: "Emergency triage", icon: HeartPulse },
    { href: "/org/scan", label: "Scan token", icon: QrCode },
    { href: "/org/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/org/counters", label: "Counters", icon: MonitorSmartphone },
    { href: "/org/settings", label: "Settings", icon: Settings },
  ],
  admin: [
    { href: "/admin", label: "Overview", icon: Gauge, exact: true },
    { href: "/admin/organisations", label: "Organisations", icon: Building2 },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/reports", label: "Reports", icon: FileWarning },
    { href: "/admin/appeals", label: "Appeals", icon: LifeBuoy },
    { href: "/admin/audit", label: "Audit trail", icon: ClipboardList },
    { href: "/admin/settings", label: "Fairness settings", icon: Settings },
  ],
};

const PORTAL: Record<Role, { label: string; tone: string }> = {
  user: { label: "Customer portal", tone: "text-brand-200 border-brand-400/25 bg-brand-500/10" },
  org: { label: "Operations desk", tone: "text-cyan-200 border-cyan-400/25 bg-cyan-500/10" },
  admin: { label: "Admin console", tone: "text-emerald-200 border-emerald-400/25 bg-emerald-500/10" },
};

export function DashboardShell({
  role,
  name,
  email,
  orgName,
  orgStatus,
  unread,
  children,
}: {
  role: Role;
  name: string;
  email: string;
  orgName?: string | null;
  orgStatus?: string | null;
  unread: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function logout() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      push("success", "You have been signed out.");
      router.push("/");
      router.refresh();
    } catch {
      setSigningOut(false);
      push("error", "Could not sign out. Please try again.");
    }
  }

  const nav = NAV[role];
  const portal = PORTAL[role];

  const sidebar = (
    <div className="flex h-full flex-col">
      <Logo href="/" className="px-2 py-1" />

      <div className={cn("mt-5 flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-semibold", portal.tone)}>
        {role === "admin" ? <ShieldCheck className="h-3.5 w-3.5" /> : role === "org" ? <Activity className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
        {portal.label}
      </div>

      <nav className="mt-5 flex-1 space-y-1 overflow-y-auto pb-4">
        {nav.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("sidebar-link", active && "sidebar-link-active")}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.href.endsWith("/notifications") && unread > 0 ? (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-cream">
                  {unread > 9 ? "9+" : unread}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={name} tone={role === "admin" ? "emerald" : role === "org" ? "cyan" : "brand"} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{name}</p>
            <p className="truncate text-[10px] text-slate-500">{orgName || email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            disabled={signingOut}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-white"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <div className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-white/[0.06] bg-ink-950 px-3 py-4 lg:flex lg:flex-col">
        {sidebar}
      </div>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 border-b border-brand-500/10 bg-ink-950/90 backdrop-blur-md">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-slate-300 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-slate-500">
                {orgName ? `${orgName} · ` : ""}Signed in as {email}
              </p>
            </div>
            <LanguageToggle className="hidden sm:inline-flex" />
            <Link
              href={role === "user" ? "/dashboard/notifications" : role === "org" ? "/org/queue" : "/admin/reports"}
              className="relative rounded-xl border border-white/10 bg-white/[0.04] p-2 text-slate-300 transition hover:text-white"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unread > 0 ? (
                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-0.5 text-[9px] font-bold text-cream">
                  {unread > 9 ? "9+" : unread}
                </span>
              ) : null}
            </Link>
          </div>
          {orgStatus === "pending" ? (
            <div className="border-t border-amber-400/20 bg-amber-500/[0.07] px-4 py-2 text-center text-[11px] text-amber-100 sm:px-6">
              Your organisation is awaiting platform approval. Queue operations unlock after review.
            </div>
          ) : orgStatus === "suspended" ? (
            <div className="border-t border-rose-400/20 bg-rose-500/[0.07] px-4 py-2 text-center text-[11px] text-rose-100 sm:px-6">
              Your organisation is suspended. Contact platform support for review.
            </div>
          ) : null}
        </header>

        <main id="main-content" className="px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-brand-900/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          />
          <div className="absolute inset-y-0 left-0 w-[280px] border-r border-white/10 bg-ink-950 px-3 py-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:text-white"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
            {sidebar}
          </div>
        </div>
      ) : null}
    </div>
  );
}
