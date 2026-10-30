import { NextRequest } from "next/server";
import { logAudit, notify } from "@/lib/audit";
import { one, run } from "@/lib/db";
import {
  clientIp,
  guardMutation,
  handleApiError,
  jsonError,
  jsonOk,
  parseBody,
  requireApi,
} from "@/lib/http";
import { channelSchema } from "@/lib/validation";
import { nowIso } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const blocked = guardMutation(req);
  if (blocked) return blocked;
  const auth = await requireApi(["admin"]);
  if (auth.response) return auth.response;
  const parsed = await parseBody(req, channelSchema);
  if (parsed.error) return parsed.error;
  const { id } = await params;
  const org = await one<{
    id: string;
    name: string;
    status: string;
    owner_user_id: string | null;
  }>("SELECT id, name, status, owner_user_id FROM organizations WHERE id = ?", id);
  if (!org) return jsonError("Organisation not found.", 404);

  const { action } = parsed.data;
  const reason = parsed.data.reason?.trim() || "";
  if ((action === "reject" || action === "suspend") && reason.length < 5) {
    return jsonError("A reason of at least 5 characters is required.", 422, {
      fields: { reason: "Add a brief reason for the record." },
    });
  }

  let status: string;
  if (action === "approve" || action === "restore") {
    if (action === "approve" && org.status === "approved") {
      return jsonError("This organisation is already approved.");
    }
    status = "approved";
  } else if (action === "reject") {
    if (org.status !== "pending") {
      return jsonError("Only pending organisations can be rejected.");
    }
    status = "rejected";
  } else {
    if (org.status !== "approved") {
      return jsonError("Only approved organisations can be suspended.");
    }
    status = "suspended";
  }

  const approvedAt = status === "approved" ? nowIso() : null;
  const finalReason =
    reason ||
    (action === "approve"
      ? "Application reviewed and approved by the platform team."
      : action === "restore"
        ? "Suspension lifted after platform review."
        : "");

  await run(
    `UPDATE organizations SET status = ?, status_reason = ?,
       approved_at = CASE WHEN ? IS NOT NULL THEN COALESCE(approved_at, ?) ELSE approved_at END
     WHERE id = ?`,
    status,
    finalReason,
    approvedAt,
    approvedAt,
    org.id,
  );

  if (org.owner_user_id) {
    const title =
      status === "approved"
        ? `${org.name} is approved`
        : status === "suspended"
          ? `${org.name} has been suspended`
          : `${org.name} application was not approved`;
    await notify({
      userId: org.owner_user_id,
      type: "organisation",
      title,
      body:
        status === "approved"
          ? "Your organisation is live. Customers can now discover it and join its queue."
          : finalReason || "Contact platform support for more information.",
    });
  }

  await logAudit({
    actorId: auth.user.id,
    actorRole: "admin",
    orgId: org.id,
    action: `organization.${action}`,
    entity: "organization",
    entityId: org.id,
    details: { from: org.status, to: status, reason: finalReason },
    ip: clientIp(req),
  });

  return jsonOk({ status });
}
