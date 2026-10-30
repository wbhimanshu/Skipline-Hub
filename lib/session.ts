import { cookies } from "next/headers";
import { one } from "./db";
import type { SessionUser } from "./auth";
import { SESSION_COOKIE } from "./auth";
import { createHash } from "node:crypto";
import { nowIso } from "./utils";

const SESSION_SELECT = `
  SELECT u.id, u.name, u.email, u.role, u.org_id, u.email_verified_at, u.language,
         u.large_text, u.restricted_until, u.restriction_reason, u.created_at,
         o.name AS org_name, o.status AS org_status, o.category AS org_category
  FROM sessions s
  JOIN users u ON u.id = s.user_id
  LEFT JOIN organizations o ON o.id = u.org_id
  WHERE s.token_hash = ? AND s.expires_at > ?
`;

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function currentUserSafe(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return (
    (await one<SessionUser>(SESSION_SELECT, tokenHash(token), nowIso())) ?? null
  );
}
