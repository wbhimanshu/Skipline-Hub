import { createHmac, randomBytes } from "node:crypto";
import { all, getSetting, one, run, withTransaction } from "./db";
import { logAudit, notify } from "./audit";
import {
  estimateForAhead,
  predictionForOrg,
  priorityRank,
  queueAheadForTicket,
  type Prediction,
} from "./prediction";
import { getOrganisation, isOpenNow, type Organisation } from "./centres";
import { nowIso, randomId, todayKey } from "./utils";

export class AppError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status = 400, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export type Ticket = {
  id: string;
  org_id: string;
  user_id: string;
  token_no: string;
  kind: "queue" | "appointment";
  status: "booked" | "waiting" | "serving" | "completed" | "cancelled" | "no_show";
  priority: "normal" | "senior" | "disability" | "emergency";
  priority_reason: string;
  scheduled_for: string | null;
  counter_id: string | null;
  checked_in_at: string | null;
  called_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  cancel_category: string | null;
  service_seconds: number | null;
  queue_date: string;
  created_at: string;
  updated_at: string;
  org_name?: string;
  org_category?: string;
  org_address?: string;
  org_city?: string;
  org_phone?: string;
  org_open_time?: string;
  org_close_time?: string;
  org_emergency?: number;
  user_name?: string;
  user_email?: string;
  counter_name?: string | null;
};

export type TicketView = Ticket & {
  position: number;
  ahead: number;
  prediction: Prediction;
  estimate: ReturnType<typeof estimateForAhead>;
  org: {
    id: string;
    name: string;
    category: string;
    address: string;
    city: string;
    phone: string;
    open_time: string;
    close_time: string;
    emergency_enabled: number;
  };
};

export const TICKET_JOIN_SELECT = `
  SELECT t.*, o.name AS org_name, o.category AS org_category, o.address AS org_address,
         o.city AS org_city, o.phone AS org_phone, o.open_time AS org_open_time,
         o.close_time AS org_close_time, o.emergency_enabled AS org_emergency,
         u.name AS user_name, u.email AS user_email, c.name AS counter_name
  FROM tickets t
  JOIN organizations o ON o.id = t.org_id
  JOIN users u ON u.id = t.user_id
  LEFT JOIN counters c ON c.id = t.counter_id
`;

export function getTicket(id: string): Ticket | undefined {
  return one<Ticket>(`${TICKET_JOIN_SELECT} WHERE t.id = ?`, id);
}

export function getActiveTicketFor(orgId: string, userId: string) {
  return one<Ticket>(
    `${TICKET_JOIN_SELECT} WHERE t.org_id = ? AND t.user_id = ? AND t.status IN ('booked','waiting','serving')`,
    orgId,
    userId,
  );
}

export function getActiveTicketsFor(userId: string) {
  return all<Ticket>(
    `${TICKET_JOIN_SELECT} WHERE t.user_id = ? AND t.status IN ('booked','waiting','serving') ORDER BY t.created_at DESC`,
    userId,
  );
}

export function getUserTickets(userId: string, limit = 25) {
  return all<Ticket>(
    `${TICKET_JOIN_SELECT} WHERE t.user_id = ? ORDER BY t.created_at DESC LIMIT ?`,
    userId,
    limit,
  );
}

export function viewTicket(ticket: Ticket): TicketView {
  const org = getOrganisation(ticket.org_id);
  const ahead = queueAheadForTicket(
    ticket.org_id,
    ticket.id,
    ticket.priority,
    ticket.created_at,
    ticket.status,
  );
  const prediction = predictionForOrg(ticket.org_id);
  return {
    ...ticket,
    ahead,
    position: ahead + 1,
    prediction,
    estimate: estimateForAhead(ticket.org_id, ahead),
    org: {
      id: ticket.org_id,
      name: org?.name ?? ticket.org_name ?? "Service centre",
      category: org?.category ?? ticket.org_category ?? "service",
      address: org?.address ?? ticket.org_address ?? "",
      city: org?.city ?? ticket.org_city ?? "",
      phone: org?.phone ?? ticket.org_phone ?? "",
      open_time: org?.open_time ?? ticket.org_open_time ?? "09:00",
      close_time: org?.close_time ?? ticket.org_close_time ?? "18:00",
      emergency_enabled: org?.emergency_enabled ?? ticket.org_emergency ?? 0,
    },
  };
}

function nextToken(orgId: string, queueDate: string, prefix: string) {
  const row = one<{ max_token: number | null }>(
    `SELECT MAX(CAST(substr(token_no, instr(token_no, '-') + 1) AS INTEGER)) AS max_token
     FROM tickets WHERE org_id = ? AND queue_date = ?`,
    orgId,
    queueDate,
  );
  const next = Number(row?.max_token ?? 0) + 1;
  return `${prefix}-${String(next).padStart(3, "0")}`;
}

export function tokenPrefix(org: Organisation) {
  return (org.name.match(/[A-Za-z]/)?.[0] || "Q").toUpperCase();
}

export function getActiveRestriction(userId: string) {
  return one<{
    id: string;
    user_id: string;
    reason: string;
    detail: string;
    status: string;
    starts_at: string;
    ends_at: string;
    appeal_status?: string | null;
    appeal_id?: string | null;
  }>(
    `SELECT r.*, a.status AS appeal_status, a.id AS appeal_id
     FROM restrictions r
     LEFT JOIN appeals a ON a.restriction_id = r.id
     WHERE r.user_id = ? AND r.status = 'active' AND r.ends_at > ?
     ORDER BY r.created_at DESC LIMIT 1`,
    userId,
    nowIso(),
  );
}

export function cancellationStats(userId: string) {
  const days = Number(getSetting("cancellation_window_days", "30"));
  const threshold = Number(getSetting("cancellation_threshold_count", "3"));
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const row = one<{ late: number; total: number }>(
    `SELECT
       SUM(CASE WHEN cancel_category = 'late_user' THEN 1 ELSE 0 END) AS late,
       COUNT(*) AS total
     FROM tickets WHERE user_id = ? AND status = 'cancelled' AND cancelled_at >= ?`,
    userId,
    since,
  );
  return {
    late: Number(row?.late ?? 0),
    total: Number(row?.total ?? 0),
    threshold,
    windowDays: days,
  };
}

export function createTicket(opts: {
  orgId: string;
  userId: string;
  kind: "queue" | "appointment";
  scheduledFor?: string | null;
  priority?: "normal" | "senior" | "disability";
  emergencyReason?: string | null;
  actorRole: string;
  ip?: string;
}): { ticket: TicketView; emergencyId?: string } {
  const org = getOrganisation(opts.orgId);
  if (!org) throw new AppError("Service centre not found.", 404);
  if (org.status !== "approved") {
    throw new AppError("This service centre is not currently accepting queues.", 400);
  }

  const restriction = getActiveRestriction(opts.userId);
  if (restriction && !opts.emergencyReason) {
    throw new AppError(
      `New bookings are temporarily limited. ${restriction.reason}. You can appeal this from your dashboard.`,
      403,
      "restricted",
    );
  }

  if (opts.emergencyReason && !org.emergency_enabled) {
    throw new AppError(
      "Emergency priority requests are only available at supported healthcare centres.",
      400,
    );
  }

  let scheduled: Date | null = null;
  if (opts.kind === "appointment") {
    if (!opts.scheduledFor) throw new AppError("Choose an available appointment slot.");
    scheduled = new Date(opts.scheduledFor);
    if (Number.isNaN(scheduled.getTime())) throw new AppError("Invalid appointment slot.");
    if (scheduled.getTime() < Date.now() + 20 * 60_000) {
      throw new AppError("Please choose a slot at least 20 minutes in the future.");
    }
    if (scheduled.getTime() > Date.now() + 14 * 86_400_000) {
      throw new AppError("Appointments can be booked up to 14 days ahead.");
    }
    const hhmm = `${String(scheduled.getHours()).padStart(2, "0")}:${String(scheduled.getMinutes()).padStart(2, "0")}`;
    if (hhmm < org.open_time || hhmm >= org.close_time) {
      throw new AppError("That slot is outside the centre's operating hours.");
    }
    const slotKey = scheduled.toISOString().slice(0, 16);
    const countRow = one<{ c: number }>(
      `SELECT COUNT(*) AS c FROM tickets
       WHERE org_id = ? AND kind = 'appointment' AND status IN ('booked','waiting','serving')
         AND substr(scheduled_for, 1, 16) = ?`,
      org.id,
      slotKey,
    );
    if (Number(countRow?.c ?? 0) >= 3) {
      throw new AppError("That slot has just filled up. Please choose another time.", 409);
    }
  }

  const result = withTransaction(() => {
    const existing = getActiveTicketFor(org.id, opts.userId);
    if (existing) {
      throw new AppError(
        `You already have an active token (${existing.token_no}) at this centre.`,
        409,
        "duplicate",
      );
    }
    const queueDate = opts.kind === "appointment" && scheduled ? todayKey(scheduled) : todayKey();
    const token = nextToken(org.id, queueDate, tokenPrefix(org));
    const id = randomId("tkt_");
    const priority = opts.priority ?? "normal";
    run(
      `INSERT INTO tickets
        (id, org_id, user_id, token_no, kind, status, priority, priority_reason, scheduled_for,
         queue_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      org.id,
      opts.userId,
      token,
      opts.kind,
      opts.kind === "appointment" ? "booked" : "waiting",
      priority,
      priority === "senior" ? "Senior citizen priority" : priority === "disability" ? "Accessibility priority" : "",
      scheduled ? scheduled.toISOString() : null,
      queueDate,
      nowIso(),
      nowIso(),
    );

    let emergencyId: string | undefined;
    if (opts.emergencyReason) {
      emergencyId = randomId("emg_");
      run(
        `INSERT INTO emergency_requests (id, ticket_id, org_id, user_id, reason, status, created_at)
         VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
        emergencyId,
        id,
        org.id,
        opts.userId,
        opts.emergencyReason.trim().slice(0, 800),
        nowIso(),
      );
      const staff = all<{ id: string }>(
        "SELECT id FROM users WHERE org_id = ? AND role = 'org'",
        org.id,
      );
      for (const member of staff) {
        notify({
          userId: member.id,
          type: "emergency",
          title: "Emergency triage request",
          body: "A patient has requested emergency assessment. Please review immediately. Life-threatening cases must be directed to local emergency services.",
          ticketId: id,
        });
      }
      logAudit({
        actorId: opts.userId,
        actorRole: opts.actorRole,
        orgId: org.id,
        action: "emergency.requested",
        entity: "ticket",
        entityId: id,
        details: { token, reason: opts.emergencyReason },
        ip: opts.ip,
      });
    }

    notify({
      userId: opts.userId,
      type: opts.kind === "appointment" ? "booking" : "queue",
      title: opts.kind === "appointment" ? "Appointment confirmed" : "You joined the queue",
      body:
        opts.kind === "appointment"
          ? `Token ${token} is booked at ${org.name} for ${scheduled?.toLocaleString("en-IN")}. Check in when you arrive.`
          : `Token ${token} created at ${org.name}. Track your position and turn alerts in your dashboard.`,
      ticketId: id,
    });

    logAudit({
      actorId: opts.userId,
      actorRole: opts.actorRole,
      orgId: org.id,
      action: opts.kind === "appointment" ? "ticket.booked" : "ticket.joined",
      entity: "ticket",
      entityId: id,
      details: { token, kind: opts.kind, priority },
      ip: opts.ip,
    });

    return { ticket: getTicket(id)!, emergencyId };
  });

  return { ticket: viewTicket(result.ticket), emergencyId: result.emergencyId };
}

export function cancelTicket(opts: {
  ticketId: string;
  actorId: string;
  actorRole: "user" | "org" | "admin";
  reason: string;
  reasonCategory?: "personal" | "medical_emergency" | "other" | "centre_closure" | "provider_change" | "system_failure" | "admin_action";
  orgId?: string | null;
  ip?: string;
}) {
  const ticket = getTicket(opts.ticketId);
  if (!ticket) throw new AppError("Ticket not found.", 404);
  if (opts.actorRole === "user" && ticket.user_id !== opts.actorId) {
    throw new AppError("You can only cancel your own token.", 403);
  }
  if (opts.actorRole === "org" && ticket.org_id !== opts.orgId) {
    throw new AppError("This ticket does not belong to your organisation.", 403);
  }
  if (["completed", "cancelled", "no_show"].includes(ticket.status)) {
    throw new AppError("This token is already closed.", 400);
  }
  const reason = opts.reason.trim().slice(0, 500);
  if (!reason) throw new AppError("Please provide a cancellation reason.");

  let category: string;
  if (opts.actorRole === "user") {
    const late =
      ticket.kind === "appointment" &&
      ticket.scheduled_for &&
      Date.now() > new Date(ticket.scheduled_for).getTime() - 30 * 60_000;
    category =
      opts.reasonCategory === "medical_emergency"
        ? "medical_emergency"
        : late
          ? "late_user"
          : "user_early";
  } else if (opts.actorRole === "org") {
    category = opts.reasonCategory || "centre_closure";
  } else {
    category = "admin_action";
  }

  const result = withTransaction(() => {
    run(
      `UPDATE tickets SET status = 'cancelled', cancelled_at = ?, cancel_reason = ?,
         cancel_category = ?, updated_at = ? WHERE id = ? AND status IN ('booked','waiting','serving')`,
      nowIso(),
      reason,
      category,
      nowIso(),
      ticket.id,
    );
    run(
      "UPDATE emergency_requests SET status = 'withdrawn', resolved_at = ? WHERE ticket_id = ? AND status = 'pending'",
      nowIso(),
      ticket.id,
    );

    if (opts.actorRole !== "user") {
      notify({
        userId: ticket.user_id,
        type: "cancellation",
        title: "Token cancelled by the service centre",
        body: `Your token ${ticket.token_no} at ${ticket.org_name} was cancelled. Reason: ${reason}. This cancellation does not count against you.`,
        ticketId: ticket.id,
      });
    }

    let restrictionCreated = false;
    if (opts.actorRole === "user" && category === "late_user") {
      const stats = cancellationStats(ticket.user_id);
      if (stats.late >= stats.threshold) {
        const existing = getActiveRestriction(ticket.user_id);
        if (!existing) {
          const days = Number(getSetting("restriction_days", "7"));
          const id = randomId("rst_");
          run(
            `INSERT INTO restrictions (id, user_id, reason, detail, status, starts_at, ends_at, created_by, created_at)
             VALUES (?, ?, ?, ?, 'active', ?, ?, NULL, ?)`,
            id,
            ticket.user_id,
            `${stats.late} unexplained late cancellations within ${stats.windowDays} days`,
            "Temporary booking limit applied by the fairness policy. You can appeal this decision from your dashboard.",
            nowIso(),
            new Date(Date.now() + days * 86_400_000).toISOString(),
            nowIso(),
          );
          notify({
            userId: ticket.user_id,
            type: "restriction",
            title: "Temporary booking limit applied",
            body: `Repeated late cancellations temporarily limit new bookings for ${days} days. You can review the reason and submit an appeal from your dashboard.`,
          });
          restrictionCreated = true;
        }
      }
    }

    logAudit({
      actorId: opts.actorId,
      actorRole: opts.actorRole,
      orgId: ticket.org_id,
      action: "ticket.cancelled",
      entity: "ticket",
      entityId: ticket.id,
      details: { token: ticket.token_no, category, reason, restrictionCreated },
      ip: opts.ip,
    });
    return { restrictionCreated, category };
  });

  return {
    ticket: viewTicket(getTicket(ticket.id)!),
    ...result,
  };
}

export function checkInTicket(opts: {
  ticketId: string;
  userId: string;
  ip?: string;
}) {
  const ticket = getTicket(opts.ticketId);
  if (!ticket) throw new AppError("Ticket not found.", 404);
  if (ticket.user_id !== opts.userId) {
    throw new AppError("This token does not belong to you.", 403);
  }
  if (ticket.status === "waiting") {
    run(
      "UPDATE tickets SET checked_in_at = COALESCE(checked_in_at, ?), updated_at = ? WHERE id = ?",
      nowIso(),
      nowIso(),
      ticket.id,
    );
    return { ticket: viewTicket(getTicket(ticket.id)!) };
  }
  if (ticket.status !== "booked") {
    throw new AppError("This token cannot be checked in right now.", 400);
  }
  if (ticket.scheduled_for) {
    const diff = Date.now() - new Date(ticket.scheduled_for).getTime();
    if (diff < -90 * 60_000) {
      throw new AppError("Check-in opens 90 minutes before your appointment.", 400);
    }
    if (diff > 3 * 60 * 60_000) {
      throw new AppError("Your appointment window has passed. Please contact the centre.", 400);
    }
  }
  withTransaction(() => {
    run(
      `UPDATE tickets SET status = 'waiting', checked_in_at = ?, updated_at = ?
       WHERE id = ? AND status = 'booked'`,
      nowIso(),
      nowIso(),
      ticket.id,
    );
    notify({
      userId: ticket.user_id,
      type: "checkin",
      title: "Check-in confirmed",
      body: `You are checked in at ${ticket.org_name}. Token ${ticket.token_no} is now in the live queue.`,
      ticketId: ticket.id,
    });
    logAudit({
      actorId: opts.userId,
      actorRole: "user",
      orgId: ticket.org_id,
      action: "ticket.checked_in",
      entity: "ticket",
      entityId: ticket.id,
      details: { token: ticket.token_no },
      ip: opts.ip,
    });
  });
  return { ticket: viewTicket(getTicket(ticket.id)!) };
}

export function callNextCustomer(opts: {
  orgId: string;
  counterId: string;
  actorId: string;
  ip?: string;
}) {
  return withTransaction(() => {
    const counter = one<{ id: string; name: string; org_id: string; is_active: number }>(
      "SELECT * FROM counters WHERE id = ? AND org_id = ?",
      opts.counterId,
      opts.orgId,
    );
    if (!counter) throw new AppError("Counter not found for your organisation.", 404);
    if (!counter.is_active) throw new AppError("This counter is currently closed.", 400);
    const busy = one<{ id: string; token_no: string }>(
      "SELECT id, token_no FROM tickets WHERE counter_id = ? AND status = 'serving'",
      opts.counterId,
    );
    if (busy) {
      throw new AppError(
        `Counter ${counter.name} is already serving token ${busy.token_no}. Complete it before calling the next customer.`,
        409,
        "counter_busy",
      );
    }
    const next = one<Ticket>(
      `SELECT * FROM tickets
       WHERE org_id = ? AND queue_date = date('now','localtime') AND status = 'waiting'
       ORDER BY CASE priority WHEN 'emergency' THEN 0 WHEN 'senior' THEN 1 WHEN 'disability' THEN 1 ELSE 2 END,
                created_at ASC
       LIMIT 1`,
      opts.orgId,
    );
    if (!next) throw new AppError("No customers are waiting in this queue.", 400);
    const updated = run(
      `UPDATE tickets SET status = 'serving', called_at = ?, counter_id = ?, updated_at = ?
       WHERE id = ? AND status = 'waiting'`,
      nowIso(),
      opts.counterId,
      nowIso(),
      next.id,
    );
    if (Number(updated.changes) !== 1) {
      throw new AppError("The queue changed. Please try again.", 409, "conflict");
    }
    notify({
      userId: next.user_id,
      type: "turn",
      title: "It's your turn",
      body: `Token ${next.token_no} is now being called at ${counter.name}. Please proceed to the counter.`,
      ticketId: next.id,
    });
    logAudit({
      actorId: opts.actorId,
      actorRole: "org",
      orgId: opts.orgId,
      action: "ticket.called",
      entity: "ticket",
      entityId: next.id,
      details: { token: next.token_no, counter: counter.name },
      ip: opts.ip,
    });
    return { ticket: viewTicket(getTicket(next.id)!) };
  });
}

export function updateTicketStatus(opts: {
  ticketId: string;
  orgId: string;
  actorId: string;
  status: "serving" | "completed" | "cancelled" | "no_show";
  reason?: string;
  ip?: string;
}) {
  const ticket = getTicket(opts.ticketId);
  if (!ticket) throw new AppError("Ticket not found.", 404);
  if (ticket.org_id !== opts.orgId) throw new AppError("Ticket not found.", 404);
  if (["completed", "cancelled", "no_show"].includes(ticket.status)) {
    throw new AppError("This token is already closed.", 400);
  }
  if (["booked", "waiting", "serving"].includes(ticket.status) === false) {
    throw new AppError("Unsupported status change.", 400);
  }
  if (opts.status === "cancelled") {
    return cancelTicket({
      ticketId: ticket.id,
      actorId: opts.actorId,
      actorRole: "org",
      reason: opts.reason || "Cancelled by service centre",
      reasonCategory: "centre_closure",
      orgId: opts.orgId,
      ip: opts.ip,
    });
  }
  withTransaction(() => {
    if (opts.status === "completed") {
      if (ticket.status !== "serving") {
        throw new AppError("Only a serving token can be completed.", 400);
      }
      const started = ticket.called_at || ticket.checked_in_at || ticket.created_at;
      const seconds = Math.max(
        30,
        Math.round((Date.now() - new Date(started).getTime()) / 1000),
      );
      run(
        `UPDATE tickets SET status = 'completed', completed_at = ?, service_seconds = ?, updated_at = ?
         WHERE id = ? AND status = 'serving'`,
        nowIso(),
        seconds,
        nowIso(),
        ticket.id,
      );
      notify({
        userId: ticket.user_id,
        type: "completed",
        title: "Visit completed",
        body: `Token ${ticket.token_no} at ${ticket.org_name} has been marked complete. Thank you for using Skipline Hub.`,
        ticketId: ticket.id,
      });
    } else if (opts.status === "no_show") {
      run(
        `UPDATE tickets SET status = 'no_show', updated_at = ? WHERE id = ? AND status IN ('waiting','booked')`,
        nowIso(),
        ticket.id,
      );
      notify({
        userId: ticket.user_id,
        type: "no_show",
        title: "Marked as no-show",
        body: `Your token ${ticket.token_no} at ${ticket.org_name} was marked as a no-show. If this is incorrect, please contact the centre.`,
        ticketId: ticket.id,
      });
    } else if (opts.status === "serving") {
      if (ticket.status !== "waiting") {
        throw new AppError("Only a waiting token can be called.", 400);
      }
      run(
        `UPDATE tickets SET status = 'serving', called_at = ?, updated_at = ? WHERE id = ? AND status = 'waiting'`,
        nowIso(),
        nowIso(),
        ticket.id,
      );
      notify({
        userId: ticket.user_id,
        type: "turn",
        title: "It's your turn",
        body: `Token ${ticket.token_no} is now being called at ${ticket.org_name}.`,
        ticketId: ticket.id,
      });
    }
    logAudit({
      actorId: opts.actorId,
      actorRole: "org",
      orgId: opts.orgId,
      action: `ticket.${opts.status}`,
      entity: "ticket",
      entityId: ticket.id,
      details: { token: ticket.token_no, reason: opts.reason },
      ip: opts.ip,
    });
  });
  return { ticket: viewTicket(getTicket(ticket.id)!) };
}

export function setPriority(opts: {
  ticketId: string;
  orgId: string;
  actorId: string;
  priority: "normal" | "senior" | "disability" | "emergency";
  reason: string;
  ip?: string;
}) {
  const ticket = getTicket(opts.ticketId);
  if (!ticket) throw new AppError("Ticket not found.", 404);
  if (ticket.org_id !== opts.orgId) throw new AppError("Ticket not found.", 404);
  if (["completed", "cancelled", "no_show"].includes(ticket.status)) {
    throw new AppError("Closed tokens cannot be reprioritised.", 400);
  }
  const reason = opts.reason?.trim();
  if (!reason) throw new AppError("A verification reason is required for priority changes.");
  withTransaction(() => {
    run(
      "UPDATE tickets SET priority = ?, priority_reason = ?, updated_at = ? WHERE id = ?",
      opts.priority,
      reason.slice(0, 300),
      nowIso(),
      ticket.id,
    );
    if (opts.priority === "emergency") {
      run(
        `UPDATE emergency_requests SET status = 'approved', reviewed_by = ?, review_note = ?, resolved_at = ?
         WHERE ticket_id = ? AND status = 'pending'`,
        opts.actorId,
        reason.slice(0, 300),
        nowIso(),
        ticket.id,
      );
    }
    notify({
      userId: ticket.user_id,
      type: "priority",
      title: opts.priority === "normal" ? "Priority status updated" : "Priority support granted",
      body: `Your token ${ticket.token_no} at ${ticket.org_name} is now marked as ${opts.priority}. Reason: ${reason}.`,
      ticketId: ticket.id,
    });
    logAudit({
      actorId: opts.actorId,
      actorRole: "org",
      orgId: opts.orgId,
      action: "priority.changed",
      entity: "ticket",
      entityId: ticket.id,
      details: { token: ticket.token_no, priority: opts.priority, reason },
      ip: opts.ip,
    });
  });
  return { ticket: viewTicket(getTicket(ticket.id)!) };
}

export function createEmergencyRequest(opts: {
  ticketId: string;
  userId: string;
  reason: string;
  ip?: string;
}) {
  const ticket = getTicket(opts.ticketId);
  if (!ticket) throw new AppError("Ticket not found.", 404);
  if (ticket.user_id !== opts.userId) throw new AppError("This token does not belong to you.", 403);
  const org = getOrganisation(ticket.org_id);
  if (!org?.emergency_enabled) {
    throw new AppError("Emergency triage requests are not enabled at this centre.", 400);
  }
  if (["completed", "cancelled", "no_show"].includes(ticket.status)) {
    throw new AppError("Emergency triage can only be requested for an active token.", 400);
  }
  const reason = opts.reason.trim().slice(0, 800);
  if (reason.length < 10) {
    throw new AppError("Please briefly describe the situation so medical staff can assess it.");
  }
  const existing = one<{ id: string; status: string }>(
    "SELECT id, status FROM emergency_requests WHERE ticket_id = ? AND status IN ('pending','approved')",
    ticket.id,
  );
  if (existing) {
    throw new AppError("An emergency request is already open for this token.", 409);
  }
  const id = randomId("emg_");
  withTransaction(() => {
    run(
      `INSERT INTO emergency_requests (id, ticket_id, org_id, user_id, reason, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
      id,
      ticket.id,
      ticket.org_id,
      ticket.user_id,
      reason,
      nowIso(),
    );
    const staff = all<{ id: string }>(
      "SELECT id FROM users WHERE org_id = ? AND role = 'org'",
      ticket.org_id,
    );
    for (const member of staff) {
      notify({
        userId: member.id,
        type: "emergency",
        title: "Emergency triage request",
        body: `Token ${ticket.token_no}: a patient has requested emergency assessment. Review immediately.`,
        ticketId: ticket.id,
      });
    }
    logAudit({
      actorId: opts.userId,
      actorRole: "user",
      orgId: ticket.org_id,
      action: "emergency.requested",
      entity: "ticket",
      entityId: ticket.id,
      details: { token: ticket.token_no, reason },
      ip: opts.ip,
    });
  });
  return { id };
}

export function reviewEmergency(opts: {
  emergencyId: string;
  orgId: string;
  actorId: string;
  decision: "approved" | "declined";
  note: string;
  ip?: string;
}) {
  const request = one<{
    id: string;
    ticket_id: string;
    org_id: string;
    user_id: string;
    status: string;
  }>("SELECT * FROM emergency_requests WHERE id = ? AND org_id = ?", opts.emergencyId, opts.orgId);
  if (!request) throw new AppError("Emergency request not found.", 404);
  if (request.status !== "pending") throw new AppError("This request has already been reviewed.", 400);
  const ticket = getTicket(request.ticket_id);
  if (!ticket) throw new AppError("Linked token not found.", 404);
  withTransaction(() => {
    run(
      `UPDATE emergency_requests SET status = ?, reviewed_by = ?, review_note = ?, resolved_at = ?
       WHERE id = ? AND status = 'pending'`,
      opts.decision,
      opts.actorId,
      opts.note.trim().slice(0, 500),
      nowIso(),
      request.id,
    );
    if (opts.decision === "approved") {
      run(
        `UPDATE tickets SET priority = 'emergency', priority_reason = ?, updated_at = ?
         WHERE id = ? AND status IN ('waiting','serving','booked')`,
        `Emergency triage approved by medical staff: ${opts.note.trim().slice(0, 200)}`,
        nowIso(),
        ticket.id,
      );
      notify({
        userId: ticket.user_id,
        type: "emergency",
        title: "Emergency priority approved",
        body: `Medical staff have approved emergency priority for token ${ticket.token_no} at ${ticket.org_name}. Please follow staff instructions.`,
        ticketId: ticket.id,
      });
    } else {
      notify({
        userId: ticket.user_id,
        type: "emergency",
        title: "Emergency priority not approved",
        body: `The care team reviewed your request and did not classify it as an emergency priority. Your queue position is unchanged. If symptoms worsen, please contact the centre or local emergency services immediately.`,
        ticketId: ticket.id,
      });
    }
    logAudit({
      actorId: opts.actorId,
      actorRole: "org",
      orgId: opts.orgId,
      action: `emergency.${opts.decision}`,
      entity: "emergency_request",
      entityId: request.id,
      details: { token: ticket.token_no, decision: opts.decision, note: opts.note },
      ip: opts.ip,
    });
  });
  return { ok: true };
}

export function signTicket(ticket: Pick<Ticket, "id" | "token_no" | "org_id">) {
  const secret =
    process.env.QR_SECRET || "skipline-dev-qr-secret-change-me-in-production";
  return createHmac("sha256", secret)
    .update(`${ticket.id}:${ticket.token_no}:${ticket.org_id}`)
    .digest("base64url")
    .slice(0, 24);
}

export function qrPayload(ticket: Pick<Ticket, "id" | "token_no" | "org_id">) {
  return `SKIPLINE|v1|${ticket.id}|${ticket.token_no}|${ticket.org_id}|${signTicket(ticket)}`;
}

export function verifyQrPayload(payload: string) {
  const parts = payload.trim().split("|");
  if (parts.length !== 6 || parts[0] !== "SKIPLINE" || parts[1] !== "v1") {
    return null;
  }
  const [, , id, token, orgId, signature] = parts;
  const ticket = getTicket(id);
  if (!ticket) return null;
  if (ticket.token_no !== token || ticket.org_id !== orgId) return null;
  if (signTicket(ticket) !== signature) return null;
  return ticket;
}

export function randomTicketKey() {
  return randomBytes(8).toString("hex");
}
