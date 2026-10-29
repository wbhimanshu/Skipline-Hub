import { NextRequest } from "next/server";
import { reviewEmergency } from "@/lib/queue";
import {
  clientIp,
  guardMutation,
  handleApiError,
  jsonOk,
  parseBody,
  requireOrgApi,
} from "@/lib/http";
import { emergencyDecisionSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const blocked = guardMutation(req);
  if (blocked) return blocked;
  const auth = await requireOrgApi();
  if (auth.response) return auth.response;
  const { id } = await params;
  const parsed = await parseBody(req, emergencyDecisionSchema);
  if (parsed.error) return parsed.error;
  try {
    const result = reviewEmergency({
      emergencyId: id,
      orgId: auth.user.org_id!,
      actorId: auth.user.id,
      decision: parsed.data.decision,
      note: parsed.data.note,
      ip: clientIp(req),
    });
    return jsonOk(result);
  } catch (error) {
    return handleApiError(error);
  }
}
