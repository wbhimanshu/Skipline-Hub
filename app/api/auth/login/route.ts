import { NextRequest } from "next/server";
import { one, run } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validation";
import {
  clientIp,
  guardMutation,
  jsonError,
  jsonOk,
  parseBody,
} from "@/lib/http";
import { createSession, roleHome } from "@/lib/auth";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import type { Role } from "@/lib/auth";

export const dynamic = "force-dynamic";

type LoginUser = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  org_id: string | null;
  email_verified_at: string | null;
  org_status: string | null;
};

export async function POST(req: NextRequest) {
  const blocked = guardMutation(req);
  if (blocked) return blocked;

  const ip = clientIp(req);
  const parsed = await parseBody(req, loginSchema);
  if (parsed.error) return parsed.error;
  const { email, password, remember, expectedRole } = parsed.data;

  const ipLimit = rateLimit(`login-ip:${ip}`, 20, 15 * 60_000, 15 * 60_000);
  const accountLimit = rateLimit(`login-account:${email}`, 8, 15 * 60_000, 15 * 60_000);
  if (!ipLimit.ok || !accountLimit.ok) {
    return jsonError(
      "Too many sign-in attempts. Please wait a few minutes before trying again.",
      429,
      { retryAfter: Math.max(ipLimit.retryAfter, accountLimit.retryAfter) },
    );
  }

  const user = await one<LoginUser>(
    `SELECT u.id, u.name, u.email, u.password_hash, u.role, u.org_id, u.email_verified_at,
            o.status AS org_status
     FROM users u LEFT JOIN organizations o ON o.id = u.org_id
     WHERE lower(u.email) = lower(?)`,
    email,
  );

  const valid = user
    ? await verifyPassword(password, user.password_hash)
    : await verifyPassword(password, "s2$00000000000000000000000000000000$00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000");

  if (!user || !valid) {
    await logAudit({
      actorId: null,
      actorRole: "anonymous",
      action: "auth.login_failed",
      entity: "user",
      entityId: user?.id ?? null,
      details: { email },
      ip,
    });
    return jsonError("Email or password is incorrect.", 401);
  }

  if (!user.email_verified_at) {
    return jsonError(
      "Verify your email before signing in. You can request a new verification link below.",
      403,
      { code: "unverified", email: user.email },
    );
  }

  if (expectedRole && user.role !== expectedRole) {
    return jsonError(
      `This account is registered in a different portal. Please use the ${
        user.role === "admin" ? "admin" : user.role === "org" ? "organisation" : "customer"
      } sign-in page.`,
      403,
      { code: "role_mismatch" },
    );
  }

  await createSession(user.id, Boolean(remember));
  resetRateLimit(`login-account:${email}`);
  await logAudit({
    actorId: user.id,
    actorRole: user.role,
    orgId: user.org_id,
    action: "auth.login",
    entity: "user",
    entityId: user.id,
    details: { role: user.role },
    ip,
  });
  await run("UPDATE users SET last_login_at = ? WHERE id = ?", new Date().toISOString(), user.id);

  return jsonOk({
    redirect: roleHome(user.role),
    role: user.role,
    name: user.name,
    orgStatus: user.org_status,
  });
}
