import Link from "next/link";
import { ArrowLeft, BadgeCheck, Building2, ChartNoAxesCombined, ShieldCheck } from "lucide-react";
import { OrgRegisterForm } from "@/components/auth/auth-forms";
import { OrgLoginScene } from "@/components/illustrations";

export const metadata = { title: "Register your organisation" };

export default function OrganizationRegisterPage() {
  return (
    <div className="container-shell py-10 sm:py-14">
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <div>
          <Link
            href="/login/organization"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Organisation sign in
          </Link>
          <div className="glass-panel relative overflow-hidden p-6 sm:p-8">
            <div className="glow-line" />
            <div className="mb-7">
              <span className="eyebrow">
                <Building2 className="h-3.5 w-3.5" />
                Partner application
              </span>
              <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Bring your service centre to Skipline Hub
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
                Submit your organisation details and owner account. Email verification
                activates the account; platform approval activates queue management.
              </p>
            </div>
            <OrgRegisterForm />
          </div>
        </div>

        <aside className="sticky top-24 hidden space-y-4 lg:block">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 shadow-panel">
            <OrgLoginScene className="h-auto w-full" />
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
            <p className="text-sm font-semibold text-white">What happens after applying?</p>
            <ol className="mt-4 space-y-4">
              {[
                ["Verify your email", "The owner account activates after email verification."],
                ["Manual review", "We check organisation details before enabling public queues."],
                ["Set up operations", "Add counters, hours, services and cancellation policy."],
                ["Go live", "Customers can compare waits, join queues and book slots."],
              ].map(([title, body], index) => (
                <li key={title} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-brand-400/25 bg-brand-500/10 text-[10px] font-bold text-brand-200">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
              <BadgeCheck className="h-4 w-4 text-emerald-300" />
              <p className="mt-2 text-xs font-semibold text-white">Verified approval</p>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-500">No auto-activated listings.</p>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
              <ChartNoAxesCombined className="h-4 w-4 text-cyan-300" />
              <p className="mt-2 text-xs font-semibold text-white">Real analytics</p>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-500">Based on recorded visits only.</p>
            </div>
          </div>
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-600">
            <ShieldCheck className="h-3.5 w-3.5" />
            Role permissions enforced on the server
          </p>
        </aside>
      </div>
    </div>
  );
}
