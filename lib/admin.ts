import { all, getSetting, one } from "./db";

export type AdminOrganisation = {
  id: string;
  name: string;
  slug: string;
  category: string;
  city: string;
  status: string;
  status_reason: string | null;
  email: string;
  phone: string;
  created_at: string;
  approved_at: string | null;
  owner_name: string | null;
  owner_email: string | null;
  staff_count: number;
  ticket_count: number;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  org_name: string | null;
  email_verified_at: string | null;
  created_at: string;
  last_login_at: string | null;
  restricted_until: string | null;
  restriction_reason: string | null;
  ticket_count: number;
  open_appeals: number;
};

export type AdminReport = {
  id: string;
  subject: string;
  message: string;
  status: string;
  admin_note: string;
  created_at: string;
  resolved_at: string | null;
  user_name: string | null;
  user_email: string | null;
  org_name: string | null;
};

export type AdminAppeal = {
  id: string;
  message: string;
  status: string;
  admin_note: string;
  created_at: string;
  resolved_at: string | null;
  user_id: string;
  user_name: string;
  user_email: string;
  restriction_id: string;
  restriction_reason: string;
  restriction_detail: string;
  restriction_status: string;
  restriction_starts: string;
  restriction_ends: string;
};

export type AdminAuditRow = {
  id: string;
  actor_id: string | null;
  actor_role: string;
  org_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  details: string;
  ip: string;
  created_at: string;
  actor_name: string | null;
  org_name: string | null;
};

export function adminOrganisations(status = "all"): AdminOrganisation[] {
  const rows = all<AdminOrganisation>(
    `SELECT o.id, o.name, o.slug, o.category, o.city, o.status, o.status_reason,
            o.email, o.phone, o.created_at, o.approved_at,
            u.name AS owner_name, u.email AS owner_email,
            (SELECT COUNT(*) FROM users s WHERE s.org_id = o.id) AS staff_count,
            (SELECT COUNT(*) FROM tickets t WHERE t.org_id = o.id) AS ticket_count
     FROM organizations o
     LEFT JOIN users u ON u.id = o.owner_user_id
     ORDER BY CASE o.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
              o.created_at DESC`,
  );
  if (status === "all") return rows;
  return rows.filter((row) => row.status === status);
}

export function adminUsers(query = ""): AdminUser[] {
  const rows = all<AdminUser>(
    `SELECT u.id, u.name, u.email, u.role, u.phone, u.email_verified_at, u.created_at,
            u.last_login_at, u.restricted_until, u.restriction_reason,
            o.name AS org_name,
            (SELECT COUNT(*) FROM tickets t WHERE t.user_id = u.id) AS ticket_count,
            (SELECT COUNT(*) FROM appeals a WHERE a.user_id = u.id AND a.status = 'pending') AS open_appeals
     FROM users u
     LEFT JOIN organizations o ON o.id = u.org_id
     WHERE u.role != 'admin'
     ORDER BY u.created_at DESC`,
  );
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) =>
    [row.name, row.email, row.org_name || "", row.role].join(" ").toLowerCase().includes(q),
  );
}

export function adminReports(): AdminReport[] {
  return all<AdminReport>(
    `SELECT r.*, u.name AS user_name, u.email AS user_email, o.name AS org_name
     FROM reports r
     LEFT JOIN users u ON u.id = r.user_id
     LEFT JOIN organizations o ON o.id = r.org_id
     ORDER BY CASE r.status WHEN 'open' THEN 0 WHEN 'reviewing' THEN 1 ELSE 2 END,
              r.created_at DESC`,
  );
}

export function adminAppeals(): AdminAppeal[] {
  return all<AdminAppeal>(
    `SELECT a.*, u.name AS user_name, u.email AS user_email,
            r.reason AS restriction_reason, r.detail AS restriction_detail,
            r.status AS restriction_status, r.starts_at AS restriction_starts,
            r.ends_at AS restriction_ends
     FROM appeals a
     JOIN users u ON u.id = a.user_id
     JOIN restrictions r ON r.id = a.restriction_id
     ORDER BY CASE a.status WHEN 'pending' THEN 0 ELSE 1 END, a.created_at DESC`,
  );
}

export function adminAuditLogs(limit = 200): AdminAuditRow[] {
  return all<AdminAuditRow>(
    `SELECT a.*, u.name AS actor_name, o.name AS org_name
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.actor_id
     LEFT JOIN organizations o ON o.id = a.org_id
     ORDER BY a.created_at DESC LIMIT ?`,
    limit,
  );
}

export type FairnessSettings = {
  thresholdCount: number;
  windowDays: number;
  restrictionDays: number;
};

export function fairnessSettings(): FairnessSettings {
  return {
    thresholdCount: Number(getSetting("cancellation_threshold_count", "3")),
    windowDays: Number(getSetting("cancellation_window_days", "30")),
    restrictionDays: Number(getSetting("restriction_days", "7")),
  };
}

export function adminCounts() {
  const users = one<{ c: number }>("SELECT COUNT(*) AS c FROM users WHERE role != 'admin'");
  const orgs = one<{ c: number }>("SELECT COUNT(*) AS c FROM organizations");
  const pendingOrgs = one<{ c: number }>(
    "SELECT COUNT(*) AS c FROM organizations WHERE status = 'pending'",
  );
  const pendingAppeals = one<{ c: number }>(
    "SELECT COUNT(*) AS c FROM appeals WHERE status = 'pending'",
  );
  const openReports = one<{ c: number }>(
    "SELECT COUNT(*) AS c FROM reports WHERE status != 'resolved'",
  );
  return {
    users: Number(users?.c ?? 0),
    orgs: Number(orgs?.c ?? 0),
    pendingOrgs: Number(pendingOrgs?.c ?? 0),
    pendingAppeals: Number(pendingAppeals?.c ?? 0),
    openReports: Number(openReports?.c ?? 0),
  };
}
