import { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { one, run } from "@/lib/db";
import { resendSchema } from "@/lib/validation";
import {
  clientIp,
  guardMutation,
  jsonOk,
  parseBody,
} from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { devLinksEnabled, sendMail, verificationEmail } from "@/lib/mailer";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const blocked = guardMutation(req);
  if (blocked) return blocked;
  const ip = clientIp(req);
  const parsed = await parseBody(req, resendSchema);
  if (parsed.error) return parsed.error;
  const email = parsed.data.email;

  const limit = rateLimit(`resend:${ip}:${email}`, 3, 15 * 60_000, 15 * 60_000);
  if (!limit.ok) {
    return jsonOk({
      message:
        "If the account needs verification, a new link will be sent shortly. Please wait before requesting again.",
    });
  }

  const user = one<{
    id: string;
    name: string;
    email: string;
    email_verified_at: string | null;
    role: string;
    org_id: string | null;
  }>("SELECT id, name, email, email_verified_at, role, org_id FROM users WHERE email = ?", email);

  let devLink: string | undefined;
  if (user && !user.email_verified_at) {
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60_000).toISOString();
    run(
      "UPDATE users SET verification_token = ?, verification_expires_at = ? WHERE id = ?",
      token,
      expires,
      user.id,
    );
    const mail = verificationEmail(user.name, token);
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
      action: "auth.verification_resent",
      entity: "user",
      entityId: user.id,
      ip,
    });
  }

  return jsonOk({
    message:
      "If the account needs verification, a fresh verification link will arrive shortly.",
    devLink,
  });
}
