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
import { appealDecisionSchema } from "@/lib/validation";
import { nowIso } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const blocked = guardMutation(req);
  if (blocked) return blocked;
  const auth = await requireApi(["admin"]);
  if (auth.response) return auth.response;
  const parsed = await parseBody(req, appealDecisionSchema);
  if (parsed.error) return parsed.error;
  const { id } = await params;
  const appeal = await one<{
    id: string;
    user_id: string;
    restriction_id: string;
    status: string;
  }>(
    "SELECT id, user_id, restriction_id, status FROM appeals WHERE id = ?",
    id,
  );
  if (!appeal) return jsonError("Appeal not found.", 404);
  if (appeal.status !== "pending") return jsonError("This appeal has already been reviewed.");

  const { decision, note } = parsed.data;
  if (decision === "accepted") {
    await run(
      `UPDATE appeals SET status = 'accepted', admin_note = ?, resolved_at = ?, resolved_by = ?
       WHERE id = ?`,
      note,
      nowIso(),
      auth.user.id,
      appeal.id,
    );
    await run(
      `UPDATE restrictions SET status = 'reversed', reversed_by = ?, reversed_at = ?
       WHERE id = ?`,
      auth.user.id,
      nowIso(),
      appeal.restriction_id,
    );
    await run(
      "UPDATE users SET restricted_until = NULL, restriction_reason = NULL WHERE id = ?",
      appeal.user_id,
    );
    await notify({
      userId: appeal.user_id,
      type: "appeal",
      title: "Appeal accepted",
      body: `Your appeal was accepted and booking access has been restored.${note ? ` Note: ${note}` : ""}`,
    });
  } else {
    await run(
      `UPDATE appeals SET status = 'rejected', admin_note = ?, resolved_at = ?, resolved_by = ?
       WHERE id = ?`,
      note,
      nowIso(),
      auth.user.id,
      appeal.id,
    );
    await notify({
      userId: appeal.user_id,
      type: "appeal",
      title: "Appeal reviewed",
      body: `Your appeal was not accepted.${note ? ` Note: ${note}` : ""}`,
    });
  }

  await logAudit({
    actorId: auth.user.id,
    actorRole: "admin",
    action: `appeal.${decision}`,
    entity: "appeal",
    entityId: appeal.id,
    details: { restrictionId: appeal.restriction_id, note },
    ip: clientIp(req),
  });

  return jsonOk({});
}
