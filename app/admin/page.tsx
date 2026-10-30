import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileWarning,
  LifeBuoy,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { adminAnalytics } from "@/lib/analytics";
import { adminAuditLogs, adminCounts } from "@/lib/admin";
import { fairnessSettings } from "@/lib/admin";
import { PageHeader, StatCard } from "@/components/ui";
import { AdminSignupChart } from "@/components/analytics-charts";
import { formatDateTime, relativeTime } from "@/lib/utils";

export const metadata = { title: "Admin overview" };

export default async function AdminOverviewPage() {
  const user = await requireRole("admin");
  const analytics = await adminAnalytics();
  const counts = await adminCounts();
  const settings = await fairnessSettings();
  const recentAudit = await adminAuditLogs(8);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform console"
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="Moderation, fairness and platform health across every participating organisation."
        actions={
          counts.pendingOrgs > 0 ? (
            <Link href="/admin/organisations?status=pending" className="btn-primary">
              <ShieldCheck className="h-4 w-4" />
              Review {counts.pendingOrgs} application{counts.pendingOrgs === 1 ? "" : "s"}
            </Link>
          ) : (
            <span className="badge-green">
              <CheckCircle2 className="h-3 w-3" />
              No pending approvals
            </span>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Customers & staff" value={analytics.users} icon={Users} tone="brand" hint={`${analytics.customers} customers · ${analytics.orgStaff} org staff`} />
        <StatCard label="Organisations" value={analytics.organisations} icon={Building2} tone="cyan" hint={`${analytics.approvedOrganisations} approved · ${analytics.pendingOrganisations} pending`} />
        <StatCard label="Visitors today" value={analytics.ticketsToday} icon={TrendingUp} tone="emerald" hint={`${analytics.completedToday} completed · ${analytics.waitingNow} waiting now`} />
        <StatCard label="Open reports" value={analytics.openReports} icon={FileWarning} tone={analytics.openReports > 0 ? "rose" : "emerald"} hint={`${counts.pendingAppeals} pending appeals`} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/admin/organisations?status=pending" className="card-interactive flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-amber-400/20 bg-amber-500/10 text-amber-200">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white">Organisation approvals</p>
            <p className="text-[11px] text-slate-500">{counts.pendingOrgs} awaiting review</p>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-500" />
        </Link>
        <Link href="/admin/appeals" className="card-interactive flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-200">
            <LifeBuoy className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white">Restriction appeals</p>
            <p className="text-[11px] text-slate-500">{counts.pendingAppeals} pending decision</p>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-500" />
        </Link>
        <Link href="/admin/reports" className="card-interactive flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-rose-400/20 bg-rose-500/10 text-rose-200">
            <FileWarning className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white">Customer reports</p>
            <p className="text-[11px] text-slate-500">{counts.openReports} unresolved</p>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-500" />
        </Link>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
        <div className="card">
          <h2 className="font-display text-base font-semibold text-white">Platform growth</h2>
          <p className="mt-1 text-[11px] text-slate-500">New customers and organisations · last 14 days</p>
          <div className="mt-4">
            <AdminSignupChart data={analytics.signups} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Average wait (7d)</p>
              <p className="mt-1 font-display text-xl font-bold text-white">
                {analytics.avgWaitMinutes != null ? `${analytics.avgWaitMinutes} min` : "No data"}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Active restrictions</p>
              <p className="mt-1 font-display text-xl font-bold text-white">{analytics.activeRestrictions}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-white">Busiest centres</h2>
              <Link href="/admin/organisations" className="text-[11px] font-semibold text-brand-300">await all</Link>
            </div>
            <div className="mt-3 space-y-2">
              {analytics.topOrgs.length === 0 ? (
                <p className="text-xs text-slate-500">No activity recorded yet.</p>
              ) : (
                analytics.topOrgs.map((org) => (
                  <div key={org.name} className="flex items-center gap-2 text-xs">
                    <span className="min-w-0 flex-1 truncate text-slate-300">{org.name}</span>
                    <span className="text-slate-500">{org.tickets} tokens</span>
                    <span className="badge-slate">{org.avgWait != null ? `${org.avgWait}m` : "—"}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <p className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Clock3 className="h-3.5 w-3.5 text-slate-500" />
              Fairness policy
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
              {settings.thresholdCount} late cancellations within {settings.windowDays} days triggers a{" "}
              {settings.restrictionDays}-day booking limit. Medical exceptions and appeals are always available.
            </p>
            <Link href="/admin/settings" className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-300">
              Adjust rules <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-white">
            <ClipboardList className="h-4 w-4 text-emerald-300" />
            Recent activity
          </h2>
          <Link href="/admin/audit" className="text-[11px] font-semibold text-brand-300">Full audit trail</Link>
        </div>
        <div className="mt-3 space-y-2">
          {recentAudit.length === 0 ? (
            <p className="text-xs text-slate-500">No audited actions yet.</p>
          ) : (
            recentAudit.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-[11px]">
                <span className="font-mono text-cyan-200">{row.action}</span>
                <span className="text-slate-500">{row.actor_name || row.actor_role}</span>
                {row.org_name ? <span className="text-slate-500">· {row.org_name}</span> : null}
                <span className="ml-auto text-slate-600" title={formatDateTime(row.created_at)}>
                  {relativeTime(row.created_at)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
