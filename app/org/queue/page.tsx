import Link from "next/link";
import {
  Clock3,
  HeartPulse,
  ListOrdered,
  MonitorSmartphone,
  Users,
} from "lucide-react";
import { requireOrgStaff } from "@/lib/auth";
import { orgCounters, orgQueue } from "@/lib/org";
import { predictionForOrg } from "@/lib/prediction";
import { EmptyState, PageHeader, PriorityBadge, StatusBadge } from "@/components/ui";
import { CallNext, OrgTicketActions } from "@/components/org-queue-actions";
import { AutoRefresh } from "@/components/auto-refresh";
import { relativeTime } from "@/lib/utils";

export const metadata = { title: "Live queue" };

export default async function OrgQueuePage() {
  const user = await requireOrgStaff();
  const orgId = user.org_id!;
  const counters = await orgCounters(orgId);
  const queue = await orgQueue(orgId);
  const prediction = await predictionForOrg(orgId);
  const activeCounters = counters.filter((counter) => Boolean(counter.is_active));

  return (
    <div className="space-y-6">
      <AutoRefresh interval={20000} />
      <PageHeader
        eyebrow="Frontline operations"
        title="Live queue"
        description="Call the next eligible token, complete visits and manage verified priority. This view refreshes every 20 seconds."
        actions={
          <Link href="/org/emergency" className="btn-danger">
            <HeartPulse className="h-4 w-4" />
            Emergency triage
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="card p-4">
          <p className="stat-label">Waiting</p>
          <p className="mt-2 font-display text-2xl font-bold text-white">{queue.waiting.length}</p>
        </div>
        <div className="card p-4">
          <p className="stat-label">Serving</p>
          <p className="mt-2 font-display text-2xl font-bold text-white">{queue.serving.length}</p>
        </div>
        <div className="card p-4">
          <p className="stat-label">Open counters</p>
          <p className="mt-2 font-display text-2xl font-bold text-white">{activeCounters.length}</p>
        </div>
        <div className="card p-4">
          <p className="stat-label">Est. wait</p>
          <p className="mt-2 font-display text-2xl font-bold text-white">
            {prediction.minMinutes}–{prediction.maxMinutes}m
          </p>
        </div>
      </div>

      <CallNext counters={counters} />

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
            <MonitorSmartphone className="h-4 w-4 text-cyan-300" />
            Being served
          </h2>
          <span className="text-xs text-slate-600">{queue.serving.length} active</span>
        </div>
        {queue.serving.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-white/10 p-8 text-center">
            <Clock3 className="mx-auto h-5 w-5 text-slate-600" />
            <p className="mt-2 text-xs text-slate-500">No token is being served right now.</p>
          </div>
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {queue.serving.map((ticket) => (
              <div key={ticket.id} className="glass-panel border-cyan-400/20 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-2xl font-bold text-white">{ticket.token_no}</p>
                      <StatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-200">{ticket.user_name}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {ticket.counter_name || "Unassigned counter"} · called {relativeTime(ticket.called_at)}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <OrgTicketActions ticketId={ticket.id} status={ticket.status} priority={ticket.priority} compact />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
            <Users className="h-4 w-4 text-amber-300" />
            Waiting list
          </h2>
          <span className="text-xs text-slate-600">{queue.waiting.length} customers</span>
        </div>
        {queue.waiting.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon={ListOrdered}
              title="Queue is clear"
              description="New live tokens and checked-in appointments will appear here automatically."
            />
          </div>
        ) : (
          <div className="mt-3 table-shell overflow-x-auto">
            <table className="table min-w-[760px]">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Token</th>
                  <th>Customer</th>
                  <th>Priority</th>
                  <th>Waiting</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {queue.waiting.map((ticket, index) => (
                  <tr key={ticket.id}>
                    <td className="text-xs text-slate-500">#{index + 1}</td>
                    <td>
                      <span className="font-display font-semibold text-white">{ticket.token_no}</span>
                      {ticket.emergency_status === "pending" ? (
                        <span className="ml-2 badge border-rose-400/25 bg-rose-500/10 text-rose-200">Triage pending</span>
                      ) : null}
                    </td>
                    <td>
                      <p className="text-xs font-medium text-slate-200">{ticket.user_name}</p>
                      <p className="text-[10px] text-slate-500">{ticket.user_email}</p>
                    </td>
                    <td><PriorityBadge priority={ticket.priority} /></td>
                    <td className="text-xs text-slate-400">{relativeTime(ticket.created_at)}</td>
                    <td>
                      <OrgTicketActions ticketId={ticket.id} status={ticket.status} priority={ticket.priority} compact />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
        <p className="text-xs font-semibold text-slate-200">Queue rules in force</p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          Emergency priority is ordered first, followed by verified senior/accessibility priority, then
          arrival time. Call-next is conflict-safe and will not assign a busy counter.
        </p>
      </div>
    </div>
  );
}
