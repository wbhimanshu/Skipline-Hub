import { FileWarning } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { adminReports } from "@/lib/admin";
import { PageHeader } from "@/components/ui";
import { AdminReportActions } from "@/components/admin-report-actions";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Reports" };

function statusClass(status: string) {
  if (status === "open") return "badge-rose";
  if (status === "reviewing") return "badge-amber";
  return "badge-green";
}

export default async function AdminReportsPage() {
  await requireRole("admin");
  const reports = adminReports();
  const open = reports.filter((report) => report.status === "open").length;
  const reviewing = reports.filter((report) => report.status === "reviewing").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Customer support"
        title="Reports"
        description="Investigate customer concerns about centres, queue handling and platform behaviour. Notes are visible to the reporter."
        actions={
          <div className="flex gap-2">
            <span className="badge-rose">{open} open</span>
            <span className="badge-amber">{reviewing} reviewing</span>
          </div>
        }
      />

      {reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
          <FileWarning className="mx-auto h-6 w-6 text-slate-600" />
          <p className="mt-3 text-sm font-semibold text-white">No reports submitted</p>
          <p className="mt-1 text-xs text-slate-500">Customer reports will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="glass-panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-base font-semibold text-white">{report.subject}</h2>
                    <span className={statusClass(report.status)}>{report.status}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {report.user_name || "Deleted account"}
                    {report.user_email ? ` · ${report.user_email}` : ""}
                    {report.org_name ? ` · ${report.org_name}` : ""}
                    {" · "}
                    {formatDateTime(report.created_at)}
                  </p>
                </div>
                <AdminReportActions id={report.id} subject={report.subject} status={report.status} />
              </div>
              <p className="mt-3 whitespace-pre-line rounded-xl border border-white/[0.05] bg-white/[0.02] p-3.5 text-sm leading-relaxed text-slate-300">
                {report.message}
              </p>
              {report.admin_note ? (
                <div className="mt-3 rounded-xl border border-emerald-400/15 bg-emerald-500/[0.04] p-3">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-emerald-300/70">Resolution note</p>
                  <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-emerald-100/80">
                    {report.admin_note}
                  </p>
                  {report.resolved_at ? (
                    <p className="mt-1 text-[10px] text-emerald-200/50">
                      Resolved {formatDateTime(report.resolved_at)}
                    </p>
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
