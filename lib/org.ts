import { all, one } from "./db";
import { todayKey } from "./utils";
import { getOrganisation, type Organisation } from "./centres";
import type { Ticket } from "./queue";

export type Counter = {
  id: string;
  org_id: string;
  name: string;
  is_active: number;
  created_at: string;
};

export type QueueTicket = Ticket & {
  emergency_id: string | null;
  emergency_status: string | null;
  priority_reason: string;
};

export function orgCounters(orgId: string) {
  return all<Counter>(
    "SELECT * FROM counters WHERE org_id = ? ORDER BY created_at ASC, name ASC",
    orgId,
  );
}

export function orgQueue(orgId: string) {
  const waiting = all<QueueTicket>(
    `SELECT t.*, u.name AS user_name, u.email AS user_email,
            e.id AS emergency_id, e.status AS emergency_status
     FROM tickets t
     JOIN users u ON u.id = t.user_id
     LEFT JOIN emergency_requests e ON e.ticket_id = t.id AND e.status IN ('pending','approved')
     WHERE t.org_id = ? AND t.queue_date = date('now','localtime') AND t.status = 'waiting'
     ORDER BY CASE t.priority WHEN 'emergency' THEN 0 WHEN 'senior' THEN 1 WHEN 'disability' THEN 1 ELSE 2 END,
              t.created_at ASC`,
    orgId,
  );
  const serving = all<QueueTicket>(
    `SELECT t.*, u.name AS user_name, u.email AS user_email,
            c.name AS counter_name,
            e.id AS emergency_id, e.status AS emergency_status
     FROM tickets t
     JOIN users u ON u.id = t.user_id
     LEFT JOIN counters c ON c.id = t.counter_id
     LEFT JOIN emergency_requests e ON e.ticket_id = t.id AND e.status IN ('pending','approved')
     WHERE t.org_id = ? AND t.queue_date = date('now','localtime') AND t.status = 'serving'
     ORDER BY t.called_at ASC`,
    orgId,
  );
  const booked = all<QueueTicket>(
    `SELECT t.*, u.name AS user_name, u.email AS user_email,
            e.id AS emergency_id, e.status AS emergency_status
     FROM tickets t
     JOIN users u ON u.id = t.user_id
     LEFT JOIN emergency_requests e ON e.ticket_id = t.id AND e.status IN ('pending','approved')
     WHERE t.org_id = ? AND t.kind = 'appointment'
       AND t.status IN ('booked','waiting','serving')
     ORDER BY t.scheduled_for ASC`,
    orgId,
  );
  return { waiting, serving, booked };
}

export function orgAppointments(orgId: string, limit = 100) {
  return all<QueueTicket>(
    `SELECT t.*, u.name AS user_name, u.email AS user_email,
            e.id AS emergency_id, e.status AS emergency_status
     FROM tickets t
     JOIN users u ON u.id = t.user_id
     LEFT JOIN emergency_requests e ON e.ticket_id = t.id AND e.status IN ('pending','approved')
     WHERE t.org_id = ? AND t.kind = 'appointment'
     ORDER BY t.scheduled_for DESC LIMIT ?`,
    orgId,
    limit,
  );
}

export function orgEmergencyRequests(orgId: string) {
  return all<{
    id: string;
    ticket_id: string;
    user_id: string;
    reason: string;
    status: string;
    review_note: string;
    created_at: string;
    resolved_at: string | null;
    reviewed_by: string | null;
    token_no: string;
    priority: string;
    ticket_status: string;
    user_name: string;
    user_email: string;
    user_phone: string;
  }>(
    `SELECT e.*, t.token_no, t.priority, t.status AS ticket_status,
            u.name AS user_name, u.email AS user_email, u.phone AS user_phone
     FROM emergency_requests e
     JOIN tickets t ON t.id = e.ticket_id
     JOIN users u ON u.id = e.user_id
     WHERE e.org_id = ?
     ORDER BY CASE e.status WHEN 'pending' THEN 0 ELSE 1 END, e.created_at DESC LIMIT 100`,
    orgId,
  );
}

export function orgSnapshot(orgId: string) {
  const org = getOrganisation(orgId) as Organisation;
  const today = todayKey();
  const stats = one<{
    visitors: number;
    waiting: number;
    serving: number;
    completed: number;
    cancelled: number;
  }>(
    `SELECT COUNT(*) AS visitors,
       SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) AS waiting,
       SUM(CASE WHEN status = 'serving' THEN 1 ELSE 0 END) AS serving,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
     FROM tickets WHERE org_id = ? AND queue_date = ?`,
    orgId,
    today,
  );
  const pendingEmergency = one<{ c: number }>(
    "SELECT COUNT(*) AS c FROM emergency_requests WHERE org_id = ? AND status = 'pending'",
    orgId,
  );
  return {
    org,
    visitors: Number(stats?.visitors ?? 0),
    waiting: Number(stats?.waiting ?? 0),
    serving: Number(stats?.serving ?? 0),
    completed: Number(stats?.completed ?? 0),
    cancelled: Number(stats?.cancelled ?? 0),
    pendingEmergency: Number(pendingEmergency?.c ?? 0),
  };
}
