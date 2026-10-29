import { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { one, run, withTransaction } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { orgRegisterSchema } from "@/lib/validation";
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
import { nowIso, randomId, slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const blocked = guardMutation(req);
  if (blocked) return blocked;

  const ip = clientIp(req);
  const limit = rateLimit(`register-org:${ip}`, 5, 60 * 60_000, 60 * 60_000);
  if (!limit.ok) {
    return jsonError(
      "Too many organisation applications. Please try again later.",
      429,
      { retryAfter: limit.retryAfter },
    );
  }

  const parsed = await parseBody(req, orgRegisterSchema);
  if (parsed.error) return parsed.error;
  const data = parsed.data;

  if (data.openTime >= data.closeTime) {
    return jsonError("Closing time must be after opening time.", 422, {
      fields: { closeTime: "Closing time must be after opening time." },
    });
  }

  const existing = one<{ id: string }>("SELECT id FROM users WHERE email = ?", data.email);
  if (existing) {
    return jsonError("An account with this email already exists.", 409, {
      fields: { email: "This email is already registered." },
    });
  }

  const passwordHash = await hashPassword(data.password);
  const token = randomBytes(32).toString("hex");
  const userId = randomId("usr_");
  const orgId = randomId("org_");
  let baseSlug = slugify(data.orgName) || "service-centre";
  let slug = baseSlug;
  let n = 1;
  while (one("SELECT id FROM organizations WHERE slug = ?", slug)) {
    n += 1;
    slug = `${baseSlug}-${n}`;
  }
  const expires = new Date(Date.now() + 24 * 60 * 60_000).toISOString();

  withTransaction(() => {
    run(
      `INSERT INTO organizations
        (id, name, slug, category, description, address, city, state, pincode, lat, lng, phone, email,
         open_time, close_time, slot_minutes, status, owner_user_id, services, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 15, 'pending', ?, ?, ?)`,
      orgId,
      data.orgName,
      slug,
      data.category,
      data.description,
      data.address,
      data.city,
      data.state || "",
      data.pincode,
      data.lat,
      data.lng,
      data.phone,
      data.email,
      data.openTime,
      data.closeTime,
      userId,
      data.services || "",
      nowIso(),
    );
    run(
      `INSERT INTO users
        (id, name, email, password_hash, role, org_id, phone, verification_token,
         verification_expires_at, created_at)
       VALUES (?, ?, ?, ?, 'org', ?, ?, ?, ?, ?)`,
      userId,
      data.ownerName,
      data.email,
      passwordHash,
      orgId,
      data.phone,
      token,
      expires,
      nowIso(),
    );
  });

  const mail = verificationEmail(data.ownerName, token);
  const delivery = await sendMail({
    to: data.email,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
    actionUrl: mail.url,
  });

  logAudit({
    actorId: userId,
    actorRole: "org",
    orgId,
    action: "organization.applied",
    entity: "organization",
    entityId: orgId,
    details: { name: data.orgName, category: data.category },
    ip,
  });

  return jsonOk({
    requiresVerification: true,
    pendingApproval: true,
    emailDelivered: delivery.delivered,
    message:
      "Application submitted. Verify your email, then our team will review the organisation before queue management is enabled.",
    devLink: devLinksEnabled() ? mail.url : undefined,
  });
}
