import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  HeartPulse,
  ListOrdered,
  MapPin,
  MonitorSmartphone,
  ShieldAlert,
  Timer,
  Users,
} from "lucide-react";
import { requireOrgStaff } from "@/lib/auth";
import { orgAnalytics } from "@/lib/analytics";
import { orgCounters, orgEmergencyRequests, orgQueue, orgSnapshot } from "@/lib/org";
import { predictionForOrg } from "@/lib/prediction";
import { PageHeader, PriorityBadge, StatCard, StatusBadge } from "@/components/ui";
import { CallNext, OrgTicketActions } from "@/components/org-queue-actions";
import { AutoRefresh } from "@/components/auto-refresh";
import { formatDateTime, formatTime, relativeTime } from "@/lib/utils";

export const metadata = { title: "Operations overview" };

export default async function OrgOverviewPage() {
  const user = await requireOrgStaff();
  const orgId = user.org_id!;
  const snapshot = await orgSnapshot(orgId);
  const analytics = await orgAnalytics(orgId);
  const counters = await orgCounters(orgId);
  const queue = await orgQueue(orgId);
  const emergencies = (await orgEmergencyRequests(orgId)).filter(
    (item) => item.status === "pending",
  );
  const prediction = await predictionForOrg(orgId);
  const upcoming = queue.booked.slice(0, 4);

  return (
    <div className="space-y-6">
      <AutoRefresh interval={30000} />
      <PageHeader
        eyebrow="Operations desk"
        title={snapshot.org.name}
        description={`${prediction.waiting} waiting · ${prediction.serving} being served · estimated wait ${prediction.minMinutes}–${prediction.maxMinutes} min`}
        actions={
          <>
            <Link href="/org/queue" className="btn-primary">
              <ListOrdered className="h-4 w-4" />
              Open live queue
            </Link>
            <Link href="/org/analytics" className="btn-secondary">
              Analytics
            </Link>
          </>
        }
      />

      {user.org_status === "pending" ? (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.06] p-4 text-sm text-amber-100">
          <p className="flex items-center gap-2 font-semibold">
            <ShieldAlert className="h-4 w-4" />
            Approval pending
          </p>
          <p className="mt-1 text-xs leading-relaxed text-amber-100/70">
            You can prepare counters and settings, but public queue and appointment operations remain
            locked until a platform administrator approves the organisation.
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Visitors today" value={snapshot.visitors} icon={Users} tone="brand" hint="All tokens created today" />
        <StatCard label="Waiting now" value={snapshot.waiting} icon={Clock3} tone="amber" hint={`${snapshot.serving} currently serving`} />
        <StatCard label="Completed today" value={snapshot.completed} icon={CheckCircle2} tone="emerald" hint={`${analytics.summary.completionRate ?? 0}% completion rate`} />
        <StatCard label="Pending triage" value={snapshot.pendingEmergency} icon={HeartPulse} tone={snapshot.pendingEmergency > 0 ? "rose" : "emerald"} hint="Emergency requests awaiting review" />
      </div>

      {emergencies.length > 0 ? (
        <div className="rounded-2xl border border-rose-400/25 bg-rose-500/[0.07] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-rose-100">
                <HeartPulse className="h-4 w-4" />
                {emergencies.length} emergency triage request{emergencies.length === 1 ? "" : "s"} waiting
              </p>
              <p className="mt-1 text-xs text-rose-200/70">
                Review immediately. Life-threatening cases must be directed to local emergency services.
              </p>
            </div>
            <Link href="/org/emergency" className="btn-danger btn-sm">
              Review now
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-5">
          <div className="card">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-base font-semibold text-white">Live queue</h2>
              <Link href="/org/queue" className="text-xs font-semibold text-brand-300 hover:text-brand-200">
                Manage queue
              </Link>
            </div>
            <div className="mt-4">
              <CallNext counters={counters} />
            </div>

            {queue.waiting.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-white/10 p-6 text-center">
                <Clock3 className="mx-auto h-5 w-5 text-slate-600" />
                <p className="mt-2 text-xs text-slate-500">No one is waiting right now.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {queue.waiting.slice(0, 6).map((ticket) => (
                  <div key={ticket.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <span className="grid h-9 w-9 place-items-center rounded-lg border border-brand-400/20 bg-brand-500/10 font-display text-xs font-bold text-brand-700">
                      {ticket.token_no.split("-")[1] ?? ticket.token_no}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-xs font-semibold text-slate-200">{ticket.user_name}</p>
                        <PriorityBadge priority={ticket.priority} />
                        {ticket.emergency_status === "pending" ? (
                          <span className="badge border-rose-400/25 bg-rose-500/10 text-rose-200">Triage pending</span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        {ticket.token_no} · waiting {relativeTime(ticket.created_at)} · {ticket.kind}
                      </p>
                    </div>
                    <OrgTicketActions ticketId={ticket.id} status={ticket.status} priority={ticket.priority} compact />
                  </div>
                ))}
                {queue.waiting.length > 6 ? (
                  <Link href="/org/queue" className="block pt-1 text-center text-[11px] font-semibold text-brand-300">
                    +{queue.waiting.length - 6} more waiting
                  </Link>
                ) : null}
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-base font-semibold text-white">Upcoming appointments</h2>
              <Link href="/org/appointments" className="text-xs font-semibold text-brand-300 hover:text-brand-200">
                View all
              </Link>
            </div>
            {upcoming.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No upcoming appointments.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {upcoming.map((ticket) => (
                  <div key={ticket.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-semibold text-slate-200">{ticket.token_no}</p>
                        <StatusBadge status={ticket.status} />
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {ticket.user_name} · {formatDateTime(ticket.scheduled_for)}
                      </p>
                    </div>
                    <OrgTicketActions ticketId={ticket.id} status={ticket.status} priority={ticket.priority} compact />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-white">
              <Timer className="h-4 w-4 text-cyan-300" />
              Today at a glance
            </h2>
            <dl className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Average wait</dt>
                <dd className="font-semibold text-slate-200">
                  {analytics.summary.avgWaitMinutes != null ? `${analytics.summary.avgWaitMinutes} min` : "No data yet"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Average service</dt>
                <dd className="font-semibold text-slate-200">
                  {analytics.summary.avgServiceMinutes != null ? `${analytics.summary.avgServiceMinutes} min` : "No data yet"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Active counters</dt>
                <dd className="font-semibold text-slate-200">
                  {analytics.summary.activeCounters}/{analytics.summary.totalCounters}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Busiest hours</dt>
                <dd className="font-semibold text-slate-200">{analytics.busyHours.join(", ") || "Collecting data"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">30-day completion</dt>
                <dd className="font-semibold text-slate-200">{analytics.summary.completionRate ?? 0}%</dd>
              </div>
            </dl>
            <Link href="/org/analytics" className="btn-secondary btn-sm mt-4 w-full">
              Open analytics
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-white">Counters</h2>
              <Link href="/org/counters" className="text-xs font-semibold text-brand-300">Manage</Link>
            </div>
            <div className="mt-3 space-y-2">
              {counters.length === 0 ? (
                <p className="text-xs text-slate-500">No counters configured yet.</p>
              ) : (
                counters.slice(0, 5).map((counter) => (
                  <div key={counter.id} className="flex items-center gap-2 text-xs">
                    <MonitorSmartphone className={`h-3.5 w-3.5 ${counter.is_active ? "text-emerald-300" : "text-slate-600"}`} />
                    <span className="flex-1 text-slate-300">{counter.name}</span>
                    <span className={counter.is_active ? "badge-green" : "badge-slate"}>
                      {counter.is_active ? "Open" : "Closed"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <p className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <MapPin className="h-3.5 w-3.5 text-slate-500" />
              Public listing
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
              {snapshot.org.address}, {snapshot.org.city}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Hours {snapshot.org.open_time}–{snapshot.org.close_time} · {snapshot.org.phone}
            </p>
            <Link href={`/centres/${snapshot.org.slug}`} className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-300">
              View public page <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
