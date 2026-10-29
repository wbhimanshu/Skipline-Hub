import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock3,
  MapPin,
  Search,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Ticket,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { one, all } from "@/lib/db";
import {
  cancellationStats,
  getActiveRestriction,
  getActiveTicketsFor,
  getUserTickets,
  viewTicket,
} from "@/lib/queue";
import { getOrganisation, categoryLabel } from "@/lib/centres";
import {
  EmptyState,
  InlineNotice,
  PageHeader,
  PriorityBadge,
  StatCard,
  StatusBadge,
} from "@/components/ui";
import { TicketActions } from "@/components/ticket-actions";
import { formatDateTime, formatTime, minutesUntil, relativeTime } from "@/lib/utils";

export const metadata = { title: "Your dashboard" };

export default async function DashboardPage() {
  const user = await requireRole("user");
  const active = getActiveTicketsFor(user.id).map(viewTicket);
  const history = getUserTickets(user.id, 6);
  const allTickets = getUserTickets(user.id, 500);
  const notifications = all<{
    id: string;
    title: string;
    body: string;
    type: string;
    read_at: string | null;
    created_at: string;
    ticket_id: string | null;
  }>(
    "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 4",
    user.id,
  );
  const restriction = getActiveRestriction(user.id);
  const appeal = restriction
    ? one<{ id: string; status: string }>(
        "SELECT id, status FROM appeals WHERE restriction_id = ? ORDER BY created_at DESC LIMIT 1",
        restriction.id,
      )
    : null;
  const cancellation = cancellationStats(user.id);
  const completed = allTickets.filter((ticket) => ticket.status === "completed").length;
  const cancelled = allTickets.filter((ticket) => ticket.status === "cancelled").length;
  const activeAppointment = active.find((ticket) => ticket.kind === "appointment");
  const activeQueue = active.find((ticket) => ticket.kind === "queue");
  const primary = activeQueue ?? activeAppointment ?? active[0];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Your healthcare, without the wait"
        title={`${greeting}, ${user.name.split(" ")[0]}`}
        description="Your live tokens, bookings and alerts are together here. We will tell you when your turn is close."
        actions={
          <Link href="/centres" className="btn-primary">
            <Search className="h-4 w-4" />
            Find a centre
          </Link>
        }
      />

      {restriction ? (
        <InlineNotice
          tone="warning"
          title={`New bookings are limited until ${formatDateTime(restriction.ends_at)}`}
          icon={ShieldAlert}
        >
          <p>{restriction.reason}</p>
          <p className="mt-1">
            {appeal
              ? `Your appeal is ${appeal.status}. We will notify you when it is reviewed.`
              : "If this happened because of a medical emergency or a centre issue, you can submit an appeal."}
          </p>
          {!appeal ? (
            <Link href="/dashboard/settings#restriction" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold underline">
              Review and appeal <ArrowRight className="h-3 w-3" />
            </Link>
          ) : null}
        </InlineNotice>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Visits completed" value={completed} icon={CheckCircle2} tone="emerald" hint="Across all centres" />
        <StatCard label="Active tokens" value={active.length} icon={Ticket} tone="brand" hint={active.length ? "Live right now" : "No active visit"} />
        <StatCard
          label="Time saved"
          value={`${Math.round(completed * 32 / 60)}h`}
          icon={TrendingUp}
          tone="cyan"
          hint="Estimated travel/queue time avoided"
        />
        <StatCard
          label="Late cancellations"
          value={`${cancellation.late}/${cancellation.threshold}`}
          icon={XCircle}
          tone={cancellation.late > 0 ? "amber" : "emerald"}
          hint={`Within ${cancellation.windowDays} days`}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-white">Active visit</h2>
            <Link href="/dashboard/tickets" className="text-xs font-semibold text-brand-300 hover:text-brand-200">
              All tokens
            </Link>
          </div>

          {primary ? (
            <div className="glass-panel relative overflow-hidden p-5 sm:p-6">
              <div className="glow-line" />
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={primary.status} />
                    <PriorityBadge priority={primary.priority} />
                    <span className="badge-slate">{primary.kind === "appointment" ? "Appointment" : "Live queue"}</span>
                  </div>
                  <p className="mt-4 text-xs uppercase tracking-[0.16em] text-slate-500">Your token</p>
                  <p className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
                    {primary.token_no}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-200">{primary.org.name}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {primary.org.address}, {primary.org.city}
                  </p>
                </div>
                <div className="rounded-2xl border border-brand-400/20 bg-brand-500/[0.08] p-4 text-center">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-brand-200/70">Position</p>
                  <p className="font-display text-3xl font-bold text-white">
                    {primary.status === "serving" ? "Now" : `#${primary.position}`}
                  </p>
                  <p className="mt-1 text-[11px] text-brand-100/70">
                    {primary.status === "serving"
                      ? "Proceed to counter"
                      : `~${primary.estimate.minMinutes}–${primary.estimate.maxMinutes} min`}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 border-t border-white/[0.06] pt-5 sm:grid-cols-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Queue date</p>
                  <p className="mt-1 text-sm font-medium text-slate-200">{primary.queue_date}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
                    {primary.kind === "appointment" ? "Scheduled" : "Joined"}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-200">
                    {primary.scheduled_for ? formatDateTime(primary.scheduled_for) : formatTime(primary.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Ahead of you</p>
                  <p className="mt-1 text-sm font-medium text-slate-200">
                    {primary.ahead} {primary.status === "serving" ? "· being served" : "people"}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Link href={`/dashboard/tickets/${primary.id}`} className="btn-primary">
                  Track live token
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <TicketActions
                  ticketId={primary.id}
                  status={primary.status}
                  kind={primary.kind}
                  emergencyEnabled={Boolean(primary.org.emergency_enabled)}
                  checkedIn={Boolean(primary.checked_in_at)}
                  compact
                />
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Ticket}
              title="No active visit"
              description="Compare live waits near you and join a queue only when you are ready. You can leave and return before your turn."
              action={
                <Link href="/centres" className="btn-primary">
                  <Search className="h-4 w-4" />
                  Find a centre
                </Link>
              }
            />
          )}

          {active.length > 1 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {active
                .filter((ticket) => ticket.id !== primary?.id)
                .map((ticket) => (
                  <Link key={ticket.id} href={`/dashboard/tickets/${ticket.id}`} className="card glass-hover">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-xl font-bold text-white">{ticket.token_no}</span>
                      <StatusBadge status={ticket.status} />
                    </div>
                    <p className="mt-2 truncate text-xs font-medium text-slate-300">{ticket.org.name}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {ticket.kind === "appointment" ? "Appointment" : `Position #${ticket.position}`}
                    </p>
                  </Link>
                ))}
            </div>
          ) : null}

          <div className="card">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-white">Recent visits</h2>
              <Link href="/dashboard/tickets" className="text-xs font-semibold text-brand-300 hover:text-brand-200">
                View all
              </Link>
            </div>
            {history.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">Your visit history will appear here.</p>
            ) : (
              <div className="mt-4 divide-y divide-white/[0.06]">
                {history.map((ticket) => (
                  <div key={ticket.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-slate-400">
                      <Stethoscope className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-200">{ticket.org_name}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {ticket.token_no} · {formatDateTime(ticket.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={ticket.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card">
            <h2 className="font-display text-base font-semibold text-white">Next appointment</h2>
            {activeAppointment ? (
              <div className="mt-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{activeAppointment.org.name}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{categoryLabel(activeAppointment.org.category)}</p>
                  </div>
                  <StatusBadge status={activeAppointment.status} />
                </div>
                <p className="mt-4 font-display text-2xl font-bold text-white">
                  {formatDateTime(activeAppointment.scheduled_for)}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {minutesUntil(activeAppointment.scheduled_for) != null &&
                  (minutesUntil(activeAppointment.scheduled_for) ?? 0) > 0
                    ? `In ${minutesUntil(activeAppointment.scheduled_for)} minutes`
                    : "Check-in window is open"}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/dashboard/tickets/${activeAppointment.id}`} className="btn-secondary btn-sm">
                    Open appointment
                  </Link>
                  <TicketActions
                    ticketId={activeAppointment.id}
                    status={activeAppointment.status}
                    kind={activeAppointment.kind}
                    emergencyEnabled={Boolean(activeAppointment.org.emergency_enabled)}
                    checkedIn={Boolean(activeAppointment.checked_in_at)}
                    compact
                  />
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-white/10 p-4 text-center">
                <CalendarClock className="mx-auto h-5 w-5 text-slate-600" />
                <p className="mt-2 text-xs text-slate-500">No upcoming appointment.</p>
                <Link href="/centres" className="mt-3 inline-flex text-xs font-semibold text-brand-300 hover:text-brand-200">
                  Find a centre to book
                </Link>
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-white">Latest alerts</h2>
              <Link href="/dashboard/notifications" className="text-xs font-semibold text-brand-300 hover:text-brand-200">
                Inbox
              </Link>
            </div>
            {notifications.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No alerts yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {notifications.map((notification) => (
                  <div key={notification.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                          notification.read_at ? "bg-slate-600" : "bg-brand-400"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200">{notification.title}</p>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
                          {notification.body}
                        </p>
                        <p className="mt-1.5 text-[10px] text-slate-600">{relativeTime(notification.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-cyan-400/15 bg-cyan-500/[0.04] p-4">
            <p className="flex items-center gap-2 text-xs font-semibold text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" />
              A fairer queue
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-cyan-100/60">
              Emergency and accessibility priority is verified by centre staff. It is never sold or
              automatically granted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
