import { NextRequest } from "next/server";
import { z } from "zod";
import { callNextCustomer } from "@/lib/queue";
import {
  clientIp,
  guardMutation,
  handleApiError,
  jsonOk,
  parseBody,
  requireOrgApi,
} from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ counterId: z.string().min(2) });

export async function POST(req: NextRequest) {
  const blocked = guardMutation(req);
  if (blocked) return blocked;
  const auth = await requireOrgApi();
  if (auth.response) return auth.response;
  const parsed = await parseBody(req, schema);
  if (parsed.error) return parsed.error;
  try {
    const result = callNextCustomer({
      orgId: auth.user.org_id!,
      counterId: parsed.data.counterId,
      actorId: auth.user.id,
      ip: clientIp(req),
    });
    return jsonOk(result);
  } catch (error) {
    return handleApiError(error);
  }
}
