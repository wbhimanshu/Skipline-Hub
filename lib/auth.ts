import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { one, run } from "./db";
import { nowIso } from "./utils";

export const SESSION_COOKIE = "sk_session";

export type Role = "user" | "org" | "admin";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  org_id: string | null;
  org_name: string | null;
  org_status: string | null;
  org_category: string | null;
  email_verified_at: string | null;
  language: string;
  large_text: number;
  restricted_until: string | null;
  restriction_reason: string | null;
  created_at: string;
};

type UserRow = SessionUser & { expires_at: string };

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

const SESSION_SELECT = `
  SELECT u.id, u.name, u.email, u.role, u.org_id, u.email_verified_at, u.language,
         u.large_text, u.restricted_until, u.restriction_reason, u.created_at,
         o.name AS org_name, o.status AS org_status, o.category AS org_category,
         s.expires_at
  FROM sessions s
  JOIN users u ON u.id = s.user_id
  LEFT JOIN organizations o ON o.id = u.org_id
  WHERE s.token_hash = ? AND s.expires_at > ?
`;

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = await one<UserRow>(
    SESSION_SELECT,
    tokenHash(token),
    nowIso(),
  );
  if (!row) return null;
  const { expires_at: _expires, ...user } = row;
  return user;
});

export async function createSession(
  userId: string,
  remember: boolean,
): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const days = remember
    ? Number(process.env.SESSION_DAYS || 30)
    : Math.min(7, Number(process.env.SESSION_DAYS || 30));
  const expires = new Date(Date.now() + days * 86_400_000);
  const h = await headers();
  await run(
    `INSERT INTO sessions (id, token_hash, user_id, expires_at, created_at, user_agent, ip)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    randomBytes(9).toString("hex"),
    tokenHash(token),
    userId,
    expires.toISOString(),
    nowIso(),
    (h.get("user-agent") || "").slice(0, 300),
    (h.get("x-forwarded-for") || "").split(",")[0]?.trim() || "",
  );
  await run("UPDATE users SET last_login_at = ? WHERE id = ?", nowIso(), userId);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    expires,
  });
  return token;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await run("DELETE FROM sessions WHERE token_hash = ?", tokenHash(token));
  }
  jar.delete(SESSION_COOKIE);
}

export function roleHome(role: Role) {
  if (role === "admin") return "/admin";
  if (role === "org") return "/org";
  return "/dashboard";
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.email_verified_at) redirect("/verify-email/pending");
  return user;
}

export async function requireRole(role: Role): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== role) redirect(roleHome(user.role));
  return user;
}

export async function requireOrgStaff(): Promise<SessionUser> {
  const user = await requireRole("org");
  if (!user.org_id) redirect("/login/organization");
  return user;
}

export function isRestricted(user: SessionUser): boolean {
  return Boolean(
    user.restricted_until && new Date(user.restricted_until).getTime() > Date.now(),
  );
}

export function isApprovedOrg(user: SessionUser): boolean {
  return user.role === "org" && user.org_status === "approved";
}
