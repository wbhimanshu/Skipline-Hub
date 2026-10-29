import { NextRequest } from "next/server";
import { logAudit } from "@/lib/audit";
import { one, run } from "@/lib/db";
import {
  clientIp,
  guardMutation,
  handleApiError,
  jsonError,
  jsonOk,
  parseBody,
  requireOrgApi,
} from "@/lib/http";
import { counterSchema } from "@/lib/validation";
import { nowIso, randomId } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const blocked = guardMutation(req);
  if (blocked) return blocked;
  const auth = await requireOrgApi();
  if (auth.response) return auth.response;
  const parsed = await parseBody(req, counterSchema);
  if (parsed.error) return parsed.error;
  try {
    const count = one<{ c: number }>(
      "SELECT COUNT(*) AS c FROM counters WHERE org_id = ?",
      auth.user.org_id!,
    );
    if (Number(count?.c ?? 0) >= 20) {
      return jsonError("A maximum of 20 counters is allowed.", 400);
    }
    const id = randomId("ctr_");
    run(
      "INSERT INTO counters (id, org_id, name, is_active, created_at) VALUES (?, ?, ?, 1, ?)",
      id,
      auth.user.org_id!,
      parsed.data.name,
      nowIso(),
    );
    logAudit({
      actorId: auth.user.id,
      actorRole: "org",
      orgId: auth.user.org_id,
      action: "counter.created",
      entity: "counter",
      entityId: id,
      details: { name: parsed.data.name },
      ip: clientIp(req),
    });
    return jsonOk({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
