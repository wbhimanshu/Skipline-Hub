import Link from "next/link";
import { CalendarClock, QrCode } from "lucide-react";
import { requireOrgStaff } from "@/lib/auth";
import { orgAppointments } from "@/lib/org";
import { EmptyState, PageHeader, PriorityBadge, StatusBadge } from "@/components/ui";
import { OrgTicketActions } from "@/components/org-queue-actions";
import { AutoRefresh } from "@/components/auto-refresh";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Appointments" };

export default async function OrgAppointmentsPage() {
  const user = await requireOrgStaff();
  const appointments = await orgAppointments(user.org_id!);
  const active = appointments.filter((ticket) =>
    ["booked", "waiting", "serving"].includes(ticket.status),
  );
  const past = appointments.filter(
    (ticket) => !["booked", "waiting", "serving"].includes(ticket.status),
  );

  return (
    <div className="space-y-6">
      <AutoRefresh interval={30000} />
      <PageHeader
        eyebrow="Scheduled care"
        title="Appointments"
        description="Tokens booked into future slots. Customers may check in themselves or staff can scan the token QR on arrival."
        actions={
          <Link href="/org/scan" className="btn-primary">
            <QrCode className="h-4 w-4" />
            Scan check-in
          </Link>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="stat-label">Active</p>
          <p className="mt-2 font-display text-2xl font-bold text-white">{active.length}</p>
        </div>
        <div className="card p-4">
          <p className="stat-label">Completed</p>
          <p className="mt-2 font-display text-2xl font-bold text-white">
            {appointments.filter((ticket) => ticket.status === "completed").length}
          </p>
        </div>
        <div className="card p-4">
          <p className="stat-label">No-shows</p>
          <p className="mt-2 font-display text-2xl font-bold text-white">
            {appointments.filter((ticket) => ticket.status === "no_show").length}
          </p>
        </div>
      </div>

      <section>
        <h2 className="font-display text-lg font-semibold text-white">Active bookings</h2>
        {active.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon={CalendarClock}
              title="No active appointments"
              description="New customer bookings will appear here with check-in status and arrival time."
            />
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {active.map((ticket) => (
              <div key={ticket.id} className="glass-panel flex flex-wrap items-center gap-3 p-4 sm:p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-lg font-bold text-white">{ticket.token_no}</p>
                    <StatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                    {ticket.emergency_status === "pending" ? (
                      <span className="badge border-rose-400/25 bg-rose-500/10 text-rose-200">Triage pending</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs font-medium text-slate-300">
                    {ticket.user_name} · {ticket.user_email}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {formatDateTime(ticket.scheduled_for)}
                    {ticket.checked_in_at ? " · checked in" : " · not checked in"}
                  </p>
                </div>
                <OrgTicketActions ticketId={ticket.id} status={ticket.status} priority={ticket.priority} compact />
              </div>
            ))}
          </div>
        )}
      </section>

      {past.length > 0 ? (
        <section>
          <h2 className="font-display text-lg font-semibold text-white">Past appointments</h2>
          <div className="mt-3 table-shell overflow-x-auto">
            <table className="table min-w-[680px]">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Customer</th>
                  <th>Scheduled</th>
                  <th>Status</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {past.map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="font-display font-semibold text-white">{ticket.token_no}</td>
                    <td className="text-xs">{ticket.user_name}</td>
                    <td className="text-xs text-slate-400">{formatDateTime(ticket.scheduled_for)}</td>
                    <td><StatusBadge status={ticket.status} /></td>
                    <td><PriorityBadge priority={ticket.priority} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
