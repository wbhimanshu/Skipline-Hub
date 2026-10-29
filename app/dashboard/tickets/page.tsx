import Link from "next/link";
import { ArrowRight, CalendarClock, Search, Ticket as TicketIcon } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getUserTickets, viewTicket } from "@/lib/queue";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { cn, formatDateTime } from "@/lib/utils";

export const metadata = { title: "My tokens" };

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
] as const;

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireRole("user");
  const query = await searchParams;
  const filter = FILTERS.some((item) => item.key === query.status) ? query.status! : "all";
  const tickets = getUserTickets(user.id, 500);
  const filtered = tickets.filter((ticket) => {
    if (filter === "all") return true;
    if (filter === "active") return ["booked", "waiting", "serving"].includes(ticket.status);
    if (filter === "completed") return ticket.status === "completed";
    return ["cancelled", "no_show"].includes(ticket.status);
  });
  const active = tickets.filter((ticket) => ["booked", "waiting", "serving"].includes(ticket.status));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tokens and visits"
        title="My tokens"
        description="Every queue token and appointment in one place. Active tokens update automatically."
        actions={
          <Link href="/centres" className="btn-primary">
            <Search className="h-4 w-4" />
            New token
          </Link>
        }
      />

      {active.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {active.map((ticket) => {
            const view = viewTicket(ticket);
            return (
              <Link key={ticket.id} href={`/dashboard/tickets/${ticket.id}`} className="glass-panel glass-hover p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-2xl font-bold text-white">{ticket.token_no}</p>
                    <p className="mt-1 text-xs font-medium text-slate-300">{ticket.org_name}</p>
                  </div>
                  <StatusBadge status={ticket.status} />
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1.5">
                    {ticket.kind === "appointment" ? <CalendarClock className="h-3.5 w-3.5" /> : <TicketIcon className="h-3.5 w-3.5" />}
                    {ticket.kind === "appointment" ? formatDateTime(ticket.scheduled_for) : `Position #${view.position}`}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-brand-300">
                    Track <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((item) => (
          <Link
            key={item.key}
            href={item.key === "all" ? "/dashboard/tickets" : `/dashboard/tickets?status=${item.key}`}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
              filter === item.key
                ? "border-brand-400/40 bg-brand-500/15 text-brand-100"
                : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white",
            )}
          >
            {item.label}
          </Link>
        ))}
        <span className="ml-auto text-xs text-slate-600">{filtered.length} tokens</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={TicketIcon}
          title={filter === "all" ? "No tokens yet" : `No ${filter} tokens`}
          description="Join a queue or book an appointment and it will appear here with live status updates."
          action={
            <Link href="/centres" className="btn-primary">
              Find a centre
            </Link>
          }
        />
      ) : (
        <>
          <div className="table-shell hidden md:block">
            <table className="table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Centre</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-right">Open</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="font-display font-semibold text-white">{ticket.token_no}</td>
                    <td>
                      <p className="text-xs font-medium text-slate-200">{ticket.org_name}</p>
                      <p className="text-[11px] text-slate-500">{ticket.org_city}</p>
                    </td>
                    <td className="text-xs">{ticket.kind === "appointment" ? "Appointment" : "Live queue"}</td>
                    <td className="text-xs text-slate-400">
                      {ticket.scheduled_for ? formatDateTime(ticket.scheduled_for) : formatDateTime(ticket.created_at)}
                    </td>
                    <td><StatusBadge status={ticket.status} /></td>
                    <td className="text-right">
                      <Link href={`/dashboard/tickets/${ticket.id}`} className="btn-ghost btn-sm">
                        View <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 md:hidden">
            {filtered.map((ticket) => (
              <Link key={ticket.id} href={`/dashboard/tickets/${ticket.id}`} className="card flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-display text-lg font-bold text-white">{ticket.token_no}</p>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-300">{ticket.org_name}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {ticket.scheduled_for ? formatDateTime(ticket.scheduled_for) : formatDateTime(ticket.created_at)}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-600" />
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
