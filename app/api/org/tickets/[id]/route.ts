import { NextRequest } from "next/server";
import { z } from "zod";
import { setPriority, updateTicketStatus } from "@/lib/queue";
import {
  clientIp,
  guardMutation,
  handleApiError,
  jsonOk,
  parseBody,
  requireOrgApi,
} from "@/lib/http";
import { prioritySchema, statusSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("status"),
    status: statusSchema.shape.status,
    reason: statusSchema.shape.reason,
  }),
  z.object({
    action: z.literal("priority"),
    priority: prioritySchema.shape.priority,
    reason: prioritySchema.shape.reason,
  }),
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const blocked = guardMutation(req);
  if (blocked) return blocked;
  const auth = await requireOrgApi();
  if (auth.response) return auth.response;
  const { id } = await params;
  const parsed = await parseBody(req, schema);
  if (parsed.error) return parsed.error;
  const ip = clientIp(req);
  try {
    if (parsed.data.action === "status") {
      const result = await updateTicketStatus({
        ticketId: id,
        orgId: auth.user.org_id!,
        actorId: auth.user.id,
        status: parsed.data.status,
        reason: parsed.data.reason,
        ip,
      });
      return jsonOk(result);
    }
    const result = await setPriority({
      ticketId: id,
      orgId: auth.user.org_id!,
      actorId: auth.user.id,
      priority: parsed.data.priority,
      reason: parsed.data.reason,
      ip,
    });
    return jsonOk(result);
  } catch (error) {
    return handleApiError(error);
  }
}
