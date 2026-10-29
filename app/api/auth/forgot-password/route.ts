import { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { one, run } from "@/lib/db";
import { forgotSchema } from "@/lib/validation";
import {
  clientIp,
  guardMutation,
  jsonOk,
  parseBody,
} from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { devLinksEnabled, resetEmail, sendMail } from "@/lib/mailer";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const blocked = guardMutation(req);
  if (blocked) return blocked;
  const ip = clientIp(req);
  const parsed = await parseBody(req, forgotSchema);
  if (parsed.error) return parsed.error;
  const email = parsed.data.email;
  const limit = rateLimit(`forgot:${ip}`, 5, 30 * 60_000, 30 * 60_000);
  if (!limit.ok) {
    return jsonOk({
      message:
        "If an account exists for that email, a reset link will be sent shortly.",
    });
  }

  const user = one<{
    id: string;
    name: string;
    email: string;
    role: string;
    org_id: string | null;
  }>("SELECT id, name, email, role, org_id FROM users WHERE email = ?", email);

  let devLink: string | undefined;
  if (user) {
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60_000).toISOString();
    run(
      "UPDATE users SET reset_token = ?, reset_expires_at = ? WHERE id = ?",
      token,
      expires,
      user.id,
    );
    const mail = resetEmail(user.name, token);
    await sendMail({
      to: user.email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      actionUrl: mail.url,
    });
    if (devLinksEnabled()) devLink = mail.url;
    logAudit({
      actorId: user.id,
      actorRole: user.role,
      orgId: user.org_id,
      action: "auth.password_reset_requested",
      entity: "user",
      entityId: user.id,
      ip,
    });
  }

  return jsonOk({
    message:
      "If an account exists for that email, a password reset link will arrive shortly. The link expires in 60 minutes.",
    devLink,
  });
}
