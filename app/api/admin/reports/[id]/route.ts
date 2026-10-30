import { NextRequest } from "next/server";
import { logAudit, notify } from "@/lib/audit";
import { one, run } from "@/lib/db";
import {
  clientIp,
  guardMutation,
  jsonError,
  jsonOk,
  parseBody,
  requireApi,
} from "@/lib/http";
import { reportUpdateSchema } from "@/lib/validation";
import { nowIso } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const blocked = guardMutation(req);
  if (blocked) return blocked;
  const auth = await requireApi(["admin"]);
  if (auth.response) return auth.response;
  const parsed = await parseBody(req, reportUpdateSchema);
  if (parsed.error) return parsed.error;
  const { id } = await params;
  const report = await one<{ id: string; user_id: string | null; subject: string; status: string }>(
    "SELECT id, user_id, subject, status FROM reports WHERE id = ?",
    id,
  );
  if (!report) return jsonError("Report not found.", 404);

  const { status, note } = parsed.data;
  await run(
    `UPDATE reports SET status = ?, admin_note = ?,
       resolved_at = CASE WHEN ? = 'resolved' THEN ? ELSE NULL END
     WHERE id = ?`,
    status,
    note ?? "",
    status,
    nowIso(),
    report.id,
  );

  if (report.user_id) {
    await notify({
      userId: report.user_id,
      type: "report",
      title: status === "resolved" ? "Your report has been resolved" : "Your report is being reviewed",
      body:
        status === "resolved"
          ? `Support has resolved "${report.subject}".${note ? ` Note: ${note}` : ""}`
          : `Support is now reviewing "${report.subject}".`,
    });
  }

  await logAudit({
    actorId: auth.user.id,
    actorRole: "admin",
    action: `report.${status}`,
    entity: "report",
    entityId: report.id,
    details: { from: report.status, to: status, note: note ?? "" },
    ip: clientIp(req),
  });

  return jsonOk({});
}
