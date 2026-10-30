import { NextRequest } from "next/server";
import { one, run } from "@/lib/db";
import { verifySchema } from "@/lib/validation";
import {
  clientIp,
  guardMutation,
  jsonError,
  jsonOk,
  parseBody,
} from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { createSession, roleHome, type Role } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { nowIso } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const blocked = guardMutation(req);
  if (blocked) return blocked;
  const ip = clientIp(req);
  const limit = rateLimit(`verify:${ip}`, 15, 15 * 60_000, 15 * 60_000);
  if (!limit.ok) return jsonError("Too many attempts. Please try again later.", 429);

  const parsed = await parseBody(req, verifySchema);
  if (parsed.error) return parsed.error;

  const user = await one<{
    id: string;
    name: string;
    email: string;
    role: Role;
    org_id: string | null;
    email_verified_at: string | null;
    verification_expires_at: string | null;
  }>(
    `SELECT id, name, email, role, org_id, email_verified_at, verification_expires_at
     FROM users WHERE verification_token = ?`,
    parsed.data.token,
  );

  if (!user) {
    return jsonError("This verification link is invalid or has already been used.", 400);
  }
  if (user.email_verified_at) {
    return jsonOk({
      alreadyVerified: true,
      message: "Your email is already verified. You can sign in.",
      loginPath: user.role === "admin" ? "/login/admin" : user.role === "org" ? "/login/organization" : "/login/user",
    });
  }
  if (
    user.verification_expires_at &&
    new Date(user.verification_expires_at).getTime() < Date.now()
  ) {
    return jsonError(
      "This verification link has expired. Request a new one from the sign-in page.",
      410,
      { code: "expired" },
    );
  }

  await run(
    `UPDATE users SET email_verified_at = ?, verification_token = NULL,
       verification_expires_at = NULL WHERE id = ?`,
    nowIso(),
    user.id,
  );

  await createSession(user.id, false);
  await logAudit({
    actorId: user.id,
    actorRole: user.role,
    orgId: user.org_id,
    action: "auth.email_verified",
    entity: "user",
    entityId: user.id,
    ip,
  });

  return jsonOk({
    message: "Email verified. Welcome to Skipline Hub.",
    redirect: roleHome(user.role),
  });
}
