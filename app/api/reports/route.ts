import { NextRequest } from "next/server";
import { run } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  clientIp,
  guardMutation,
  handleApiError,
  jsonError,
  jsonOk,
  parseBody,
  requireApi,
} from "@/lib/http";
import { reportSchema } from "@/lib/validation";
import { nowIso, randomId } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const blocked = guardMutation(req);
  if (blocked) return blocked;
  const auth = await requireApi(["user"]);
  if (auth.response) return auth.response;
  const parsed = await parseBody(req, reportSchema);
  if (parsed.error) return parsed.error;
  const limit = rateLimit(`report:${auth.user.id}`, 5, 24 * 60 * 60_000, 24 * 60 * 60_000);
  if (!limit.ok) return jsonError("You can submit up to 5 reports per day.", 429);

  try {
    const id = randomId("rpt_");
    await run(
      `INSERT INTO reports (id, user_id, org_id, subject, message, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'open', ?)`,
      id,
      auth.user.id,
      parsed.data.orgId || null,
      parsed.data.subject,
      parsed.data.message,
      nowIso(),
    );
    await logAudit({
      actorId: auth.user.id,
      actorRole: "user",
      orgId: parsed.data.orgId || null,
      action: "report.created",
      entity: "report",
      entityId: id,
      details: { subject: parsed.data.subject },
      ip: clientIp(req),
    });
    return jsonOk({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
