import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock3,
  MapPin,
  Phone,
  QrCode,
  ShieldCheck,
  Sparkles,
  Timer,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { one, all } from "@/lib/db";
import { getTicket, viewTicket } from "@/lib/queue";
import { categoryLabel } from "@/lib/centres";
import {
  ConfidenceBadge,
  InlineNotice,
  PriorityBadge,
  StatusBadge,
} from "@/components/ui";
import { TicketActions } from "@/components/ticket-actions";
import { AutoRefresh } from "@/components/auto-refresh";
import { formatDateTime, formatTime, relativeTime } from "@/lib/utils";

export const metadata = { title: "Live token" };

type EmergencyRow = {
  id: string;
  reason: string;
  status: string;
  review_note: string;
  created_at: string;
  resolved_at: string | null;
};

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("user");
  const { id } = await params;
  const raw = await getTicket(id);
  if (!raw || raw.user_id !== user.id) notFound();
  const ticket = await viewTicket(raw);
  const active = ["booked", "waiting", "serving"].includes(ticket.status);
  const emergency = await one<EmergencyRow>(
    "SELECT * FROM emergency_requests WHERE ticket_id = ? ORDER BY created_at DESC LIMIT 1",
    ticket.id,
  );
  const alerts = await all<{ id: string; title: string; body: string; created_at: string }>(
    "SELECT id, title, body, created_at FROM notifications WHERE ticket_id = ? ORDER BY created_at DESC LIMIT 6",
    ticket.id,
  );

  const timeline = [
    { label: "Token created", at: ticket.created_at, done: true },
    {
      label: ticket.kind === "appointment" ? "Appointment booked" : "Joined live queue",
      at: ticket.created_at,
      done: true,
    },
    { label: "Checked in", at: ticket.checked_in_at, done: Boolean(ticket.checked_in_at) },
    { label: "Called to counter", at: ticket.called_at, done: Boolean(ticket.called_at) },
    {
      label: ticket.status === "cancelled" ? "Cancelled" : "Visit completed",
      at: ticket.completed_at || ticket.cancelled_at,
      done: Boolean(ticket.completed_at || ticket.cancelled_at),
    },
  ];

  return (
    <div className="space-y-6">
      {active ? <AutoRefresh interval={20000} /> : null}
      <Link
        href="/dashboard/tickets"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All tokens
      </Link>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-5">
          <div className="glass-panel relative overflow-hidden p-6 sm:p-8">
            <div className="glow-line" />
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <span className="badge-slate">
                {ticket.kind === "appointment" ? "Appointment" : "Live queue"}
              </span>
              {active ? (
                <span className="badge border-emerald-400/20 bg-emerald-500/[0.07] text-emerald-200">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  Live
                </span>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Token number</p>
                <p className="mt-1 font-display text-5xl font-bold tracking-tight text-white sm:text-6xl">
                  {ticket.token_no}
                </p>
                <p className="mt-3 text-sm font-semibold text-slate-200">{ticket.org.name}</p>
                <p className="mt-1 text-xs text-slate-500">{categoryLabel(ticket.org.category)}</p>
              </div>
              {active ? (
                <div className="grid place-items-center gap-2">
                  <div className="overflow-hidden rounded-2xl border border-brand-500/10 bg-[#FFFFFF] p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/tickets/${ticket.id}/qr`}
                      alt={`QR code for token ${ticket.token_no}`}
                      width={148}
                      height={148}
                      className="h-[148px] w-[148px]"
                    />
                  </div>
                  <p className="flex items-center gap-1 text-[10px] text-slate-500">
                    <QrCode className="h-3 w-3" /> Show this at the centre
                  </p>
                </div>
              ) : null}
            </div>

            {active ? (
              <div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-5 sm:grid-cols-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Position</p>
                  <p className="mt-1 font-display text-xl font-bold text-white">
                    {ticket.status === "serving" ? "Now" : `#${ticket.position}`}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Ahead</p>
                  <p className="mt-1 font-display text-xl font-bold text-white">{ticket.ahead}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Estimate</p>
                  <p className="mt-1 font-display text-xl font-bold text-white">
                    {ticket.estimate.minMinutes}–{ticket.estimate.maxMinutes}m
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Counters</p>
                  <p className="mt-1 font-display text-xl font-bold text-white">
                    {ticket.prediction.activeCounters}
                  </p>
                </div>
              </div>
            ) : null}

            {active ? (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <TicketActions
                  ticketId={ticket.id}
                  status={ticket.status}
                  kind={ticket.kind}
                  emergencyEnabled={Boolean(ticket.org.emergency_enabled)}
                  checkedIn={Boolean(ticket.checked_in_at)}
                />
              </div>
            ) : null}
          </div>

          {ticket.status === "serving" ? (
            <InlineNotice tone="success" title="It is your turn">
              Please proceed to {ticket.counter_name || "the service counter"} and show token{" "}
              {ticket.token_no}. If you need help finding the counter, speak to reception.
            </InlineNotice>
          ) : null}

          {emergency ? (
            <div
              className={`rounded-2xl border p-4 ${
                emergency.status === "approved"
                  ? "border-emerald-400/20 bg-emerald-500/[0.05]"
                  : emergency.status === "declined"
                    ? "border-rose-400/20 bg-rose-500/[0.05]"
                    : "border-amber-400/20 bg-amber-500/[0.05]"
              }`}
            >
              <p className="flex items-center gap-2 text-xs font-semibold text-white">
                <AlertTriangle className="h-4 w-4" />
                Emergency triage · <span className="capitalize">{emergency.status}</span>
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{emergency.reason}</p>
              {emergency.review_note ? (
                <p className="mt-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-2.5 text-[11px] text-slate-300">
                  Staff note: {emergency.review_note}
                </p>
              ) : (
                <p className="mt-2 text-[11px] text-amber-200/70">
                  Waiting for clinical or operational review. For life-threatening symptoms, call 108 now.
                </p>
              )}
            </div>
          ) : null}

          <div className="card">
            <h2 className="font-display text-base font-semibold text-white">Visit timeline</h2>
            <ol className="mt-5 space-y-4">
              {timeline.map((item, index) => (
                <li key={`${item.label}-${index}`} className="flex gap-3">
                  <span
                    className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border ${
                      item.done
                        ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
                        : "border-white/10 bg-white/[0.025] text-slate-600"
                    }`}
                  >
                    {item.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                  </span>
                  <div className="flex-1 border-b border-white/[0.05] pb-4 last:border-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className={`text-xs font-semibold ${item.done ? "text-slate-200" : "text-slate-500"}`}>
                        {item.label}
                      </p>
                      <p className="text-[10px] text-slate-600">
                        {item.at ? formatDateTime(item.at) : "Pending"}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {alerts.length > 0 ? (
            <div className="card">
              <h2 className="font-display text-base font-semibold text-white">Token alerts</h2>
              <div className="mt-4 space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <p className="text-xs font-semibold text-slate-200">{alert.title}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{alert.body}</p>
                    <p className="mt-1.5 text-[10px] text-slate-600">{relativeTime(alert.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card">
            <h2 className="text-sm font-semibold text-white">Visit details</h2>
            <dl className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Type</dt>
                <dd className="text-right font-medium text-slate-200">
                  {ticket.kind === "appointment" ? "Appointment" : "Live queue"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Queue date</dt>
                <dd className="text-right font-medium text-slate-200">{ticket.queue_date}</dd>
              </div>
              {ticket.scheduled_for ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Scheduled</dt>
                  <dd className="text-right font-medium text-slate-200">{formatDateTime(ticket.scheduled_for)}</dd>
                </div>
              ) : (
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Joined</dt>
                  <dd className="text-right font-medium text-slate-200">{formatTime(ticket.created_at)}</dd>
                </div>
              )}
              {ticket.counter_name ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Counter</dt>
                  <dd className="text-right font-medium text-slate-200">{ticket.counter_name}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Confidence</dt>
                <dd className="text-right"><ConfidenceBadge confidence={ticket.estimate.confidence} /></dd>
              </div>
            </dl>
            <p className="mt-4 border-t border-white/[0.06] pt-3 text-[10px] leading-relaxed text-slate-600">
              {ticket.prediction.message}
            </p>
          </div>

          <div className="card">
            <h2 className="text-sm font-semibold text-white">Centre</h2>
            <p className="mt-3 flex items-start gap-2 text-xs text-slate-300">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <span>
                {ticket.org.address}
                <br />
                {ticket.org.city}
              </span>
            </p>
            <p className="mt-2 flex items-center gap-2 text-xs text-slate-400">
              <Clock3 className="h-4 w-4 text-slate-500" />
              {formatTime(`2000-01-01T${ticket.org.open_time}:00`)} –{" "}
              {formatTime(`2000-01-01T${ticket.org.close_time}:00`)}
            </p>
            <p className="mt-2 flex items-center gap-2 text-xs text-slate-400">
              <Phone className="h-4 w-4 text-slate-500" />
              <a href={`tel:${ticket.org.phone}`} className="hover:text-white">{ticket.org.phone}</a>
            </p>
            <a
              href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(`${ticket.org.name}, ${ticket.org.address}, ${ticket.org.city}`)}`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary btn-sm mt-4 w-full"
            >
              Open directions
            </a>
          </div>

          {ticket.org.emergency_enabled ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/[0.05] p-4">
              <p className="flex items-center gap-2 text-xs font-semibold text-rose-100">
                <AlertTriangle className="h-4 w-4" />
                Life-threatening symptoms?
              </p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-rose-200/70">
                Call <a href="tel:108" className="font-bold underline">108</a> or go to the nearest
                emergency department. A queue token is not a substitute for emergency care.
              </p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <p className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
              Need help?
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
              If the centre cannot resolve the issue, submit a report from Settings. Platform staff review
              queue fairness complaints.
            </p>
            <Link href="/dashboard/settings" className="mt-2 inline-flex text-[11px] font-semibold text-brand-300">
              Go to settings
            </Link>
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-600">
            <Timer className="h-3 w-3" />
            Auto-refreshes every 20 seconds
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-600">
            <Sparkles className="h-3 w-3" />
            Estimates are based on recorded visits, not guesses
          </div>
        </aside>
      </div>
    </div>
  );
}
