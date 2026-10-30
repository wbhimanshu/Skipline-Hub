import { NextRequest } from "next/server";
import { logAudit } from "@/lib/audit";
import { run } from "@/lib/db";
import {
  clientIp,
  guardMutation,
  handleApiError,
  jsonError,
  jsonOk,
  parseBody,
  requireOrgApi,
} from "@/lib/http";
import { orgSettingsSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const blocked = guardMutation(req);
  if (blocked) return blocked;
  const auth = await requireOrgApi();
  if (auth.response) return auth.response;
  const parsed = await parseBody(req, orgSettingsSchema);
  if (parsed.error) return parsed.error;
  const input = parsed.data;
  if (input.openTime >= input.closeTime) {
    return jsonError("Closing time must be after opening time.", 422, {
      fields: { closeTime: "Closing time must be after opening time." },
    });
  }
  try {
    await run(
      `UPDATE organizations SET name = ?, description = ?, phone = ?, email = ?, address = ?,
         city = ?, open_time = ?, close_time = ?, slot_minutes = ?, services = ?,
         priority_policy = ?, cancellation_policy = ?, emergency_enabled = ?
       WHERE id = ?`,
      input.name,
      input.description,
      input.phone,
      input.email,
      input.address,
      input.city,
      input.openTime,
      input.closeTime,
      input.slotMinutes,
      input.services,
      input.priorityPolicy,
      input.cancellationPolicy,
      input.emergencyEnabled ? 1 : 0,
      auth.user.org_id!,
    );
    await logAudit({
      actorId: auth.user.id,
      actorRole: "org",
      orgId: auth.user.org_id,
      action: "organization.settings_updated",
      entity: "organization",
      entityId: auth.user.org_id,
      details: { emergencyEnabled: input.emergencyEnabled },
      ip: clientIp(req),
    });
    return jsonOk({});
  } catch (error) {
    return handleApiError(error);
  }
}
