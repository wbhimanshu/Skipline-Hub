import { run } from "./db";
import { nowIso, randomId } from "./utils";

export async function logAudit(opts: {
  actorId: string | null;
  actorRole: string;
  orgId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
  ip?: string;
}) {
  await run(
    `INSERT INTO audit_logs
      (id, actor_id, actor_role, org_id, action, entity, entity_id, details, ip, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    randomId("aud_"),
    opts.actorId,
    opts.actorRole,
    opts.orgId ?? null,
    opts.action,
    opts.entity,
    opts.entityId ?? null,
    JSON.stringify(opts.details ?? {}),
    opts.ip ?? "",
    nowIso(),
  );
}

export async function notify(opts: {
  userId: string;
  type: string;
  title: string;
  body: string;
  ticketId?: string | null;
}) {
  await run(
    `INSERT INTO notifications (id, user_id, type, title, body, ticket_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    randomId("notif_"),
    opts.userId,
    opts.type,
    opts.title,
    opts.body,
    opts.ticketId ?? null,
    nowIso(),
  );
}
