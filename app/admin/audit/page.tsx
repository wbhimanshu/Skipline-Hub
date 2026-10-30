import { ClipboardList, Search } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { adminAuditLogs } from "@/lib/admin";
import { PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Audit trail" };

function pretty(details: string) {
  try {
    const parsed = JSON.parse(details);
    return Object.entries(parsed)
      .filter(([, value]) => value !== null && value !== "" && value !== undefined)
      .map(([key, value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`)
      .join(" · ");
  } catch {
    return details;
  }
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireRole("admin");
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() || "";
  const rows = await adminAuditLogs(400);
  const logs = query
    ? rows.filter((row) =>
        [row.action, row.actor_name || "", row.org_name || "", row.entity, row.entity_id || ""]
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
    : rows;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Accountability"
        title="Audit trail"
        description="Every moderation decision, priority override and operational action is recorded with actor, target and reason."
      />

      <form action="/admin/audit" className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            name="q"
            defaultValue={params.q || ""}
            placeholder="Filter by action, actor, organisation or entity"
            className="input pl-10 text-sm"
            aria-label="Filter audit trail"
          />
        </div>
        <button type="submit" className="btn-secondary">Filter</button>
      </form>

      {logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
          <ClipboardList className="mx-auto h-6 w-6 text-slate-600" />
          <p className="mt-3 text-sm font-semibold text-white">No audit entries found</p>
          <p className="mt-1 text-xs text-slate-500">Actions will appear here as they happen.</p>
        </div>
      ) : (
        <div className="table-shell overflow-x-auto">
          <table className="table min-w-[980px]">
            <thead>
              <tr>
                <th>When</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Target</th>
                <th>Details</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap text-[11px] text-slate-400">{formatDateTime(row.created_at)}</td>
                  <td className="text-[11px]">
                    <p className="font-medium text-slate-200">{row.actor_name || row.actor_role}</p>
                    <p className="text-[10px] capitalize text-slate-500">{row.actor_role}</p>
                  </td>
                  <td>
                    <span className="font-mono text-[11px] text-cyan-200">{row.action}</span>
                  </td>
                  <td className="text-[11px] text-slate-400">
                    <p className="capitalize">{row.entity}</p>
                    {row.org_name ? <p className="text-[10px] text-slate-500">{row.org_name}</p> : null}
                    {row.entity_id ? <p className="font-mono text-[10px] text-slate-600">{row.entity_id}</p> : null}
                  </td>
                  <td className="max-w-[320px] text-[11px] leading-relaxed text-slate-500">{pretty(row.details) || "—"}</td>
                  <td className="font-mono text-[10px] text-slate-600">{row.ip || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
