import { NextRequest } from "next/server";
import { logAudit } from "@/lib/audit";
import { setSetting } from "@/lib/db";
import {
  clientIp,
  guardMutation,
  jsonOk,
  parseBody,
  requireApi,
} from "@/lib/http";
import { adminSettingsSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const blocked = guardMutation(req);
  if (blocked) return blocked;
  const auth = await requireApi(["admin"]);
  if (auth.response) return auth.response;
  const parsed = await parseBody(req, adminSettingsSchema);
  if (parsed.error) return parsed.error;
  const { thresholdCount, windowDays, restrictionDays } = parsed.data;

  await setSetting("cancellation_threshold_count", String(thresholdCount));
  await setSetting("cancellation_window_days", String(windowDays));
  await setSetting("restriction_days", String(restrictionDays));

  await logAudit({
    actorId: auth.user.id,
    actorRole: "admin",
    action: "settings.fairness_updated",
    entity: "settings",
    entityId: "fairness",
    details: { thresholdCount, windowDays, restrictionDays },
    ip: clientIp(req),
  });

  return jsonOk({});
}
