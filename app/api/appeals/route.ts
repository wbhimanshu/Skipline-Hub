import { NextRequest } from "next/server";
import { z } from "zod";
import { one, run } from "@/lib/db";
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
import { nowIso, randomId } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const appealSchema = z.object({
  restrictionId: z.string().min(3),
  message: z.string().trim().min(20, "Please explain your situation (at least 20 characters).").max(2000),
});

export async function POST(req: NextRequest) {
  const blocked = guardMutation(req);
  if (blocked) return blocked;
  const auth = await requireApi(["user"]);
  if (auth.response) return auth.response;
  const parsed = await parseBody(req, appealSchema);
  if (parsed.error) return parsed.error;
  const ip = clientIp(req);
  const limit = rateLimit(`appeal:${auth.user.id}`, 3, 24 * 60 * 60_000, 24 * 60 * 60_000);
  if (!limit.ok) return jsonError("You can submit up to 3 appeals per day.", 429);

  try {
    const restriction = await one<{ id: string; user_id: string; status: string }>(
      "SELECT id, user_id, status FROM restrictions WHERE id = ?",
      parsed.data.restrictionId,
    );
    if (!restriction || restriction.user_id !== auth.user.id) {
      return jsonError("Restriction not found.", 404);
    }
    const existing = await one<{ id: string }>(
      "SELECT id FROM appeals WHERE restriction_id = ? AND status = 'pending'",
      restriction.id,
    );
    if (existing) {
      return jsonError("An appeal for this restriction is already pending review.", 409);
    }
    const id = randomId("apl_");
    await run(
      `INSERT INTO appeals (id, restriction_id, user_id, message, status, created_at)
       VALUES (?, ?, ?, ?, 'pending', ?)`,
      id,
      restriction.id,
      auth.user.id,
      parsed.data.message,
      nowIso(),
    );
    await logAudit({
      actorId: auth.user.id,
      actorRole: "user",
      action: "appeal.submitted",
      entity: "appeal",
      entityId: id,
      details: { restrictionId: restriction.id },
      ip,
    });
    return jsonOk({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
