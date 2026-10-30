import { NextRequest } from "next/server";
import { z } from "zod";
import { all, one, run } from "@/lib/db";
import {
  guardMutation,
  handleApiError,
  jsonOk,
  parseBody,
  requireApi,
} from "@/lib/http";
import { nowIso } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApi();
  if (auth.response) return auth.response;
  try {
    const notifications = await all<Record<string, unknown>>(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 60`,
      auth.user.id,
    );
    const unread = await one<{ c: number }>(
      "SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read_at IS NULL",
      auth.user.id,
    );
    return jsonOk({ notifications, unread: Number(unread?.c ?? 0) });
  } catch (error) {
    return handleApiError(error);
  }
}

const readSchema = z.object({
  id: z.string().optional(),
  all: z.boolean().optional().default(false),
});

export async function PATCH(req: NextRequest) {
  const blocked = guardMutation(req);
  if (blocked) return blocked;
  const auth = await requireApi();
  if (auth.response) return auth.response;
  const parsed = await parseBody(req, readSchema);
  if (parsed.error) return parsed.error;
  try {
    if (parsed.data.all) {
      await run(
        "UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL",
        nowIso(),
        auth.user.id,
      );
    } else if (parsed.data.id) {
      await run(
        "UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ?",
        nowIso(),
        parsed.data.id,
        auth.user.id,
      );
    }
    return jsonOk({});
  } catch (error) {
    return handleApiError(error);
  }
}
