import { NextRequest } from "next/server";
import { createTicket } from "@/lib/queue";
import {
  clientIp,
  guardMutation,
  handleApiError,
  jsonError,
  jsonOk,
  parseBody,
  requireApi,
} from "@/lib/http";
import { joinSchema } from "@/lib/validation";
import { isRestricted } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const blocked = guardMutation(req);
  if (blocked) return blocked;

  const auth = await requireApi(["user"]);
  if (auth.response) return auth.response;
  const user = auth.user;

  const parsed = await parseBody(req, joinSchema);
  if (parsed.error) return parsed.error;
  const input = parsed.data;

  try {
    if (input.emergency && !input.emergencyReason?.trim()) {
      return jsonError("Please describe why emergency triage is needed.");
    }
    if (isRestricted(user) && !input.emergency) {
      return jsonError(
        "New bookings are temporarily limited. You can appeal from your dashboard.",
        403,
      );
    }
    const result = createTicket({
      orgId: input.orgId,
      userId: user.id,
      kind: input.kind,
      scheduledFor: input.slot ?? null,
      priority: "normal",
      emergencyReason: input.emergency ? input.emergencyReason : null,
      actorRole: "user",
      ip: clientIp(req),
    });
    return jsonOk({
      ticket: result.ticket,
      ticketId: result.ticket.id,
      emergencyId: result.emergencyId,
      redirect: `/dashboard/tickets/${result.ticket.id}`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

