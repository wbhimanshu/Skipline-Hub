import Link from "next/link";
import { ArrowRight, CalendarClock, CalendarDays, Clock3, MapPin, Search } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getUserTickets, viewTicket } from "@/lib/queue";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { TicketActions } from "@/components/ticket-actions";
import { formatDateTime, minutesUntil } from "@/lib/utils";

export const metadata = { title: "Appointments" };

export default async function AppointmentsPage() {
  const user = await requireRole("user");
  const appointments = getUserTickets(user.id, 500)
    .filter((ticket) => ticket.kind === "appointment")
    .map(viewTicket);
  const active = appointments.filter((ticket) =>
    ["booked", "waiting", "serving"].includes(ticket.status),
  );
  const past = appointments.filter(
    (ticket) => !["booked", "waiting", "serving"].includes(ticket.status),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Plan ahead"
        title="Appointments"
        description="Booked slots, check-in windows and past appointments. Check in up to 90 minutes before your slot."
        actions={
          <Link href="/centres" className="btn-primary">
            <Search className="h-4 w-4" />
            Book a slot
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="stat-label">Upcoming</p>
          <p className="mt-2 font-display text-2xl font-bold text-white">{active.length}</p>
        </div>
        <div className="card p-4">
          <p className="stat-label">Completed visits</p>
          <p className="mt-2 font-display text-2xl font-bold text-white">
            {appointments.filter((ticket) => ticket.status === "completed").length}
          </p>
        </div>
        <div className="card col-span-2 p-4 sm:col-span-1">
          <p className="stat-label">Cancelled</p>
          <p className="mt-2 font-display text-2xl font-bold text-white">
            {appointments.filter((ticket) => ticket.status === "cancelled").length}
          </p>
        </div>
      </div>

      <section>
        <h2 className="font-display text-lg font-semibold text-white">Upcoming</h2>
        {active.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon={CalendarClock}
              title="No upcoming appointments"
              description="Book a slot at a centre where you would rather reserve a time than wait in a live queue."
              action={
                <Link href="/centres" className="btn-primary">
                  Find a centre
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {active.map((ticket) => {
              const mins = minutesUntil(ticket.scheduled_for);
              return (
                <div key={ticket.id} className="glass-panel p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-200">
                        <CalendarDays className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-base font-semibold text-white">{ticket.org.name}</h3>
                          <StatusBadge status={ticket.status} />
                        </div>
                        <p className="mt-1 text-sm font-medium text-slate-300">
                          {formatDateTime(ticket.scheduled_for)}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <MapPin className="h-3.5 w-3.5" />
                          {ticket.org.address}, {ticket.org.city}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock3 className="h-3.5 w-3.5" />
                          Token {ticket.token_no}
                          {mins != null && mins > 0 ? ` · in ${mins} minutes` : " · check-in open"}
                        </p>
                      </div>
                    </div>
                    <Link href={`/dashboard/tickets/${ticket.id}`} className="btn-secondary btn-sm">
                      Details
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <div className="mt-4 border-t border-white/[0.06] pt-4">
                    <TicketActions
                      ticketId={ticket.id}
                      status={ticket.status}
                      kind={ticket.kind}
                      emergencyEnabled={Boolean(ticket.org.emergency_enabled)}
                      checkedIn={Boolean(ticket.checked_in_at)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {past.length > 0 ? (
        <section>
          <h2 className="font-display text-lg font-semibold text-white">Past appointments</h2>
          <div className="mt-3 space-y-2">
            {past.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/dashboard/tickets/${ticket.id}`}
                className="card flex items-center gap-3 p-4 glass-hover"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-200">{ticket.org.name}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {formatDateTime(ticket.scheduled_for)} · {ticket.token_no}
                  </p>
                </div>
                <StatusBadge status={ticket.status} />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
