import { NextRequest } from "next/server";
import { destroySession, getCurrentUser } from "@/lib/auth";
import { guardMutation, jsonOk } from "@/lib/http";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const blocked = guardMutation(req);
  if (blocked) return blocked;
  const user = await getCurrentUser();
  await destroySession();
  if (user) {
    logAudit({
      actorId: user.id,
      actorRole: user.role,
      orgId: user.org_id,
      action: "auth.logout",
      entity: "user",
      entityId: user.id,
      ip: clientIp(req),
    });
  }
  return jsonOk({ redirect: "/" });
}
