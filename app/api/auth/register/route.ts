import { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { one, run } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/lib/validation";
import {
  clientIp,
  guardMutation,
  jsonError,
  jsonOk,
  parseBody,
} from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import {
  devLinksEnabled,
  sendMail,
  verificationEmail,
} from "@/lib/mailer";
import { logAudit } from "@/lib/audit";
import { nowIso, randomId } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const blocked = guardMutation(req);
  if (blocked) return blocked;

  const ip = clientIp(req);
  const limit = rateLimit(`register:${ip}`, 10, 60 * 60_000, 60 * 60_000);
  if (!limit.ok) {
    return jsonError(
      "Too many registration attempts. Please try again later.",
      429,
      { retryAfter: limit.retryAfter },
    );
  }

  const parsed = await parseBody(req, registerSchema);
  if (parsed.error) return parsed.error;
  const { name, email, password } = parsed.data;

  const existing = await one<{ id: string }>("SELECT id FROM users WHERE lower(email) = lower(?)", email);
  if (existing) {
    return jsonError("An account with this email already exists.", 409, {
      fields: { email: "This email is already registered. Try signing in instead." },
    });
  }

  const passwordHash = await hashPassword(password);
  const token = randomBytes(32).toString("hex");
  const userId = randomId("usr_");
  const expires = new Date(Date.now() + 24 * 60 * 60_000).toISOString();

  await run(
    `INSERT INTO users
      (id, name, email, password_hash, role, phone, verification_token, verification_expires_at, created_at)
     VALUES (?, ?, ?, ?, 'user', '', ?, ?, ?)`,
    userId,
    name,
    email,
    passwordHash,
    token,
    expires,
    nowIso(),
  );

  const mail = verificationEmail(name, token);
  const delivery = await sendMail({
    to: email,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
    actionUrl: mail.url,
  });

  await logAudit({
    actorId: userId,
    actorRole: "user",
    action: "account.registered",
    entity: "user",
    entityId: userId,
    details: { email, role: "user" },
    ip,
  });

  return jsonOk({
    requiresVerification: true,
    emailDelivered: delivery.delivered,
    message:
      "Account created. Check your inbox for the verification link to activate it.",
    devLink: devLinksEnabled() ? mail.url : undefined,
  });
}
