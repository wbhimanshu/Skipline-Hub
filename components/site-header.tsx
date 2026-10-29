"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { Logo } from "./logo";
import { LanguageToggle } from "./language-toggle";
import { useLanguage, useToast } from "./providers";
import type { Role } from "@/lib/auth";
import { cn } from "@/lib/utils";

type HeaderUser = { id: string; name: string; role: Role } | null;

export function SiteHeader({ user }: { user: HeaderUser }) {
  const { t } = useLanguage();
  const { push } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const dashboardHref =
    user?.role === "admin" ? "/admin" : user?.role === "org" ? "/org" : "/dashboard";

  const links = [
    { href: "/", label: t("navHome") },
    { href: "/centres", label: t("navDiscover") },
    { href: "/#features", label: t("navFeatures") },
    { href: "/#how-it-works", label: t("navHow") },
  ];

  async function signOut() {
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
      push("error", "Could not sign out. Please try again.");
    } finally {
      setSigningOut(false);
      setOpen(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-brand-500/10 bg-ink-950/85 backdrop-blur-md">
      <div className="container-shell flex h-[68px] items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          <LanguageToggle />
          {user ? (
            <>
              <Link href={dashboardHref} className="btn-secondary !py-2 text-[13px]">
                <ShieldCheck className="h-4 w-4" />
                {t("navDashboard")}
              </Link>
              <button
                type="button"
                onClick={signOut}
                disabled={signingOut}
                className="btn-ghost !px-3 !py-2 text-[13px]"
              >
                <LogOut className="h-4 w-4" />
                {t("signOut")}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost !py-2 text-[13px]">
                {t("navLogin")}
              </Link>
              <Link href="/register" className="btn-primary !py-2 text-[13px]">
                {t("getStarted")}
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <LanguageToggle />
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        className={cn(
          "overflow-hidden border-t border-brand-500/10 bg-ink-950 transition-all duration-300 lg:hidden",
          open ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="container-shell flex flex-col gap-1 py-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/[0.05] hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-3 flex flex-col gap-2 border-t border-white/[0.06] pt-3">
            {user ? (
              <>
                <Link
                  href={dashboardHref}
                  onClick={() => setOpen(false)}
                  className="btn-secondary w-full"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {t("navDashboard")}
                </Link>
                <button type="button" onClick={signOut} className="btn-ghost w-full" disabled={signingOut}>
                  <LogOut className="h-4 w-4" />
                  {t("signOut")}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="btn-secondary w-full">
                  {t("navLogin")}
                </Link>
                <Link href="/register" onClick={() => setOpen(false)} className="btn-primary w-full">
                  {t("getStarted")}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
