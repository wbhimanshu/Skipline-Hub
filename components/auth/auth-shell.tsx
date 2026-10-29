import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export function AuthShell({
  title,
  subtitle,
  children,
  illustration,
  footer,
  backHref = "/login",
  backLabel = "All portals",
  sideTitle,
  sidePoints,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  illustration: ReactNode;
  footer?: ReactNode;
  backHref?: string;
  backLabel?: string;
  sideTitle?: string;
  sidePoints?: string[];
}) {
  return (
    <div className="container-shell relative py-10 sm:py-16">
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
        <div className="mx-auto w-full max-w-[520px]">
          <Link
            href={backHref}
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {backLabel}
          </Link>
          <div className="glass-panel relative overflow-hidden p-6 sm:p-8">
            <div className="glow-line" />
            <div className="mb-6">
              <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-[1.7rem]">
                {title}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{subtitle}</p>
            </div>
            {children}
            {footer ? <div className="mt-6 border-t border-white/[0.07] pt-5">{footer}</div> : null}
          </div>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-600">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure session cookies · server-side role checks
          </p>
        </div>

        <div className="relative hidden lg:block">
          <div className="sticky top-24">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 shadow-panel">
              {illustration}
            </div>
            {sideTitle ? (
              <div className="mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                <p className="text-sm font-semibold text-white">{sideTitle}</p>
                <ul className="mt-3 space-y-2.5">
                  {(sidePoints ?? []).map((point) => (
                    <li key={point} className="flex gap-2.5 text-xs leading-relaxed text-slate-400">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
