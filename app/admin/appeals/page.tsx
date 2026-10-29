import { LifeBuoy, ShieldAlert } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { adminAppeals } from "@/lib/admin";
import { PageHeader } from "@/components/ui";
import { AdminAppealActions } from "@/components/admin-appeal-actions";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Appeals" };

function statusClass(status: string) {
  if (status === "pending") return "badge-amber";
  if (status === "accepted") return "badge-green";
  return "badge-slate";
}

export default async function AdminAppealsPage() {
  await requireRole("admin");
  const appeals = adminAppeals();
  const pending = appeals.filter((appeal) => appeal.status === "pending").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fairness review"
        title="Restriction appeals"
        description="Customers can appeal booking limits. Accepting an appeal reverses the restriction immediately."
        actions={
          <span className={pending > 0 ? "badge-amber" : "badge-green"}>
            <LifeBuoy className="h-3 w-3" />
            {pending} pending
          </span>
        }
      />

      {appeals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
          <LifeBuoy className="mx-auto h-6 w-6 text-slate-600" />
          <p className="mt-3 text-sm font-semibold text-white">No appeals submitted</p>
          <p className="mt-1 text-xs text-slate-500">Customers can appeal from their settings page.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appeals.map((appeal) => (
            <div key={appeal.id} className="glass-panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-base font-semibold text-white">{appeal.user_name}</h2>
                    <span className={statusClass(appeal.status)}>{appeal.status}</span>
                    <span className={appeal.restriction_status === "active" ? "badge-rose" : "badge-slate"}>
                      Restriction {appeal.restriction_status}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {appeal.user_email} · submitted {formatDateTime(appeal.created_at)}
                  </p>
                  <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                    <ShieldAlert className="h-3 w-3 text-amber-300" />
                    {appeal.restriction_reason} · {formatDateTime(appeal.restriction_starts)} →{" "}
                    {formatDateTime(appeal.restriction_ends)}
                  </p>
                </div>
                {appeal.status === "pending" ? (
                  <AdminAppealActions
                    id={appeal.id}
                    name={appeal.user_name}
                    restrictionReason={appeal.restriction_detail || appeal.restriction_reason}
                  />
                ) : null}
              </div>
              <p className="mt-3 whitespace-pre-line rounded-xl border border-white/[0.05] bg-white/[0.02] p-3.5 text-sm leading-relaxed text-slate-300">
                {appeal.message}
              </p>
              {appeal.admin_note ? (
                <div className="mt-3 rounded-xl border border-cyan-400/15 bg-cyan-500/[0.04] p-3">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-cyan-300/70">Decision note</p>
                  <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-cyan-100/80">{appeal.admin_note}</p>
                  {appeal.resolved_at ? (
                    <p className="mt-1 text-[10px] text-cyan-200/50">Reviewed {formatDateTime(appeal.resolved_at)}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
