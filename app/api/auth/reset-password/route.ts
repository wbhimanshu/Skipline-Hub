import { NextRequest } from "next/server";
import { one, run } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { resetSchema } from "@/lib/validation";
import {
  clientIp,
  guardMutation,
  jsonError,
  jsonOk,
  parseBody,
} from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { nowIso } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const blocked = guardMutation(req);
  if (blocked) return blocked;
  const ip = clientIp(req);
  const limit = rateLimit(`reset:${ip}`, 8, 30 * 60_000, 30 * 60_000);
  if (!limit.ok) return jsonError("Too many attempts. Please try again later.", 429);

  const parsed = await parseBody(req, resetSchema);
  if (parsed.error) return parsed.error;

  const user = one<{
    id: string;
    role: string;
    org_id: string | null;
    reset_expires_at: string | null;
  }>(
    "SELECT id, role, org_id, reset_expires_at FROM users WHERE reset_token = ?",
    parsed.data.token,
  );
  if (!user) {
    return jsonError("This password reset link is invalid or has already been used.", 400);
  }
  if (!user.reset_expires_at || new Date(user.reset_expires_at).getTime() < Date.now()) {
    return jsonError("This password reset link has expired. Request a new one.", 410);
  }

  const passwordHash = await hashPassword(parsed.data.password);
  run(
    `UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires_at = NULL
     WHERE id = ?`,
    passwordHash,
    user.id,
  );
  run("DELETE FROM sessions WHERE user_id = ?", user.id);
  logAudit({
    actorId: user.id,
    actorRole: user.role,
    orgId: user.org_id,
    action: "auth.password_reset",
    entity: "user",
    entityId: user.id,
    details: { at: nowIso() },
    ip,
  });

  return jsonOk({
    message: "Password updated. Sign in with your new password.",
    redirect: "/login",
  });
}
