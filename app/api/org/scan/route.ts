import { NextRequest } from "next/server";
import { z } from "zod";
import { logAudit, notify } from "@/lib/audit";
import { all, one, run, withTransaction } from "@/lib/db";
import {
  clientIp,
  guardMutation,
  handleApiError,
  jsonError,
  jsonOk,
  parseBody,
  requireOrgApi,
} from "@/lib/http";
import { getTicket, verifyQrPayload, viewTicket } from "@/lib/queue";
import { nowIso, todayKey } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  code: z.string().trim().min(3).max(500),
  checkIn: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  const blocked = guardMutation(req);
  if (blocked) return blocked;
  const auth = await requireOrgApi();
  if (auth.response) return auth.response;
  const parsed = await parseBody(req, schema);
  if (parsed.error) return parsed.error;
  const orgId = auth.user.org_id!;
  const ip = clientIp(req);

  try {
    const code = parsed.data.code;
    let ticket = code.startsWith("SKIPLINE|") ? verifyQrPayload(code) : undefined;
    if (!ticket) {
      const token = code.toUpperCase().trim();
      const row = one<{ id: string }>(
        `SELECT id FROM tickets WHERE org_id = ? AND queue_date = ? AND upper(token_no) = ?`,
        orgId,
        todayKey(),
        token,
      );
      ticket = row ? getTicket(row.id) : undefined;
    }
    if (!ticket || ticket.org_id !== orgId) {
      return jsonError("Token not found for this organisation.", 404);
    }
    if (["completed", "cancelled", "no_show"].includes(ticket.status)) {
      return jsonError(`This token is already ${ticket.status.replace("_", " ")}.`, 400);
    }

    let checkedIn = false;
    if (parsed.data.checkIn && ticket.kind === "appointment" && ticket.status === "booked") {
      const diff = ticket.scheduled_for
        ? Date.now() - new Date(ticket.scheduled_for).getTime()
        : 0;
      if (diff < -90 * 60_000) {
        return jsonError("Check-in opens 90 minutes before the appointment.", 400);
      }
      withTransaction(() => {
        run(
          `UPDATE tickets SET status = 'waiting', checked_in_at = ?, updated_at = ?
           WHERE id = ? AND status = 'booked'`,
          nowIso(),
          nowIso(),
          ticket!.id,
        );
        notify({
          userId: ticket!.user_id,
          type: "checkin",
          title: "Checked in by staff",
          body: `Token ${ticket!.token_no} was checked in at ${ticket!.org_name}. You are now in the live queue.`,
          ticketId: ticket!.id,
        });
        logAudit({
          actorId: auth.user.id,
          actorRole: "org",
          orgId,
          action: "ticket.staff_checked_in",
          entity: "ticket",
          entityId: ticket!.id,
          details: { token: ticket!.token_no },
          ip,
        });
      });
      checkedIn = true;
    }

    const fresh = getTicket(ticket.id)!;
    logAudit({
      actorId: auth.user.id,
      actorRole: "org",
      orgId,
      action: "ticket.scanned",
      entity: "ticket",
      entityId: ticket.id,
      details: { token: ticket.token_no, checkedIn },
      ip,
    });
    return jsonOk({ ticket: viewTicket(fresh), checkedIn });
  } catch (error) {
    return handleApiError(error);
  }
}
