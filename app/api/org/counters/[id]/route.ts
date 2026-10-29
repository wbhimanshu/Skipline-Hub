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
import { counterToggleSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const blocked = guardMutation(req);
  if (blocked) return blocked;
  const auth = await requireOrgApi();
  if (auth.response) return auth.response;
  const { id } = await params;
  const parsed = await parseBody(req, counterToggleSchema);
  if (parsed.error) return parsed.error;
  try {
    const counter = one<{ id: string; name: string }>(
      "SELECT id, name FROM counters WHERE id = ? AND org_id = ?",
      id,
      auth.user.org_id!,
    );
    if (!counter) return jsonError("Counter not found.", 404);
    if (!parsed.data.isActive) {
      const serving = one<{ c: number }>(
        "SELECT COUNT(*) AS c FROM tickets WHERE counter_id = ? AND status = 'serving'",
        id,
      );
      if (Number(serving?.c ?? 0) > 0) {
        return jsonError("Complete the customer currently being served before closing this counter.", 409);
      }
    }
    run(
      "UPDATE counters SET is_active = ? WHERE id = ? AND org_id = ?",
      parsed.data.isActive ? 1 : 0,
      id,
      auth.user.org_id!,
    );
    logAudit({
      actorId: auth.user.id,
      actorRole: "org",
      orgId: auth.user.org_id,
      action: parsed.data.isActive ? "counter.opened" : "counter.closed",
      entity: "counter",
      entityId: id,
      details: { name: counter.name },
      ip: clientIp(req),
    });
    return jsonOk({});
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireOrgApi();
  if (auth.response) return auth.response;
  const { id } = await params;
  try {
    const counter = one<{ id: string; name: string }>(
      "SELECT id, name FROM counters WHERE id = ? AND org_id = ?",
      id,
      auth.user.org_id!,
    );
    if (!counter) return jsonError("Counter not found.", 404);
    const used = one<{ c: number }>(
      "SELECT COUNT(*) AS c FROM tickets WHERE counter_id = ?",
      id,
    );
    if (Number(used?.c ?? 0) > 0) {
      return jsonError("This counter has visit history and cannot be deleted. Close it instead.", 409);
    }
    run("DELETE FROM counters WHERE id = ? AND org_id = ?", id, auth.user.org_id!);
    logAudit({
      actorId: auth.user.id,
      actorRole: "org",
      orgId: auth.user.org_id,
      action: "counter.deleted",
      entity: "counter",
      entityId: id,
      details: { name: counter.name },
      ip: clientIp(req),
    });
    return jsonOk({});
  } catch (error) {
    return handleApiError(error);
  }
}
