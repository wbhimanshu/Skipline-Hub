import { NextRequest } from "next/server";
import { run } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  clientIp,
  guardMutation,
  handleApiError,
  jsonOk,
  parseBody,
  requireApi,
} from "@/lib/http";
import { profileSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const blocked = guardMutation(req);
  if (blocked) return blocked;
  const auth = await requireApi();
  if (auth.response) return auth.response;
  const parsed = await parseBody(req, profileSchema);
  if (parsed.error) return parsed.error;
  try {
    await run(
      "UPDATE users SET name = ?, phone = ? WHERE id = ?",
      parsed.data.name,
      parsed.data.phone ?? "",
      auth.user.id,
    );
    await logAudit({
      actorId: auth.user.id,
      actorRole: auth.user.role,
      orgId: auth.user.org_id,
      action: "profile.updated",
      entity: "user",
      entityId: auth.user.id,
      details: {},
      ip: clientIp(req),
    });
    return jsonOk({ name: parsed.data.name, phone: parsed.data.phone ?? "" });
  } catch (error) {
    return handleApiError(error);
  }
}
