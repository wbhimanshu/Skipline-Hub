import { NextRequest } from "next/server";
import { z } from "zod";
import {
  cancelTicket,
  checkInTicket,
  createEmergencyRequest,
  getTicket,
  viewTicket,
} from "@/lib/queue";
import {
  clientIp,
  guardMutation,
  handleApiError,
  jsonError,
  jsonOk,
  parseBody,
  requireApi,
} from "@/lib/http";
import { cancelTicketSchema, emergencyRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("checkin") }),
  z.object({
    action: z.literal("cancel"),
    reason: cancelTicketSchema.shape.reason,
    reasonCategory: cancelTicketSchema.shape.reasonCategory,
  }),
  z.object({
    action: z.literal("emergency"),
    reason: emergencyRequestSchema.shape.reason,
  }),
]);

export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireApi();
  if (auth.response) return auth.response;
  const { id } = await params;
  try {
    const ticket = await getTicket(id);
    if (!ticket) return jsonError("Ticket not found.", 404);
    const user = auth.user;
    const canView =
      user.role === "admin" ||
      ticket.user_id === user.id ||
      (user.role === "org" && user.org_id === ticket.org_id);
    if (!canView) return jsonError("Ticket not found.", 404);
    return jsonOk({ ticket: await viewTicket(ticket) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const blocked = guardMutation(req);
  if (blocked) return blocked;
  const auth = await requireApi();
  if (auth.response) return auth.response;
  const { id } = await params;
  const parsed = await parseBody(req, actionSchema);
  if (parsed.error) return parsed.error;
  const input = parsed.data;
  const user = auth.user;
  const ip = clientIp(req);

  try {
    if (input.action === "checkin") {
      const result = await checkInTicket({ ticketId: id, userId: user.id, ip });
      return jsonOk(result);
    }
    if (input.action === "emergency") {
      const result = await createEmergencyRequest({
        ticketId: id,
        userId: user.id,
        reason: input.reason,
        ip,
      });
      return jsonOk({
        ...result,
        message:
          "Emergency triage request sent. Centre staff have been alerted. For life-threatening symptoms, call local emergency services now.",
      });
    }
    if (user.role === "user") {
      const result = await cancelTicket({
        ticketId: id,
        actorId: user.id,
        actorRole: "user",
        reason: input.reason,
        reasonCategory: input.reasonCategory,
        ip,
      });
      return jsonOk(result);
    }
    if (user.role === "org") {
      if (!user.org_id) return jsonError("Organisation not found.", 403);
      const result = await cancelTicket({
        ticketId: id,
        actorId: user.id,
        actorRole: "org",
        orgId: user.org_id,
        reason: input.reason,
        reasonCategory: "centre_closure",
        ip,
      });
      return jsonOk(result);
    }
    return jsonError("Administrators must use the admin console.", 403);
  } catch (error) {
    return handleApiError(error);
  }
}
