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
import { userActionSchema } from "@/lib/validation";
import { nowIso, randomId } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const blocked = guardMutation(req);
  if (blocked) return blocked;
  const auth = await requireApi(["admin"]);
  if (auth.response) return auth.response;
  const parsed = await parseBody(req, userActionSchema);
  if (parsed.error) return parsed.error;
  const { id } = await params;
  const user = one<{
    id: string;
    name: string;
    role: string;
    email_verified_at: string | null;
    restricted_until: string | null;
  }>(
    "SELECT id, name, role, email_verified_at, restricted_until FROM users WHERE id = ?",
    id,
  );
  if (!user) return jsonError("User not found.", 404);
  if (user.role === "admin") return jsonError("Admin accounts cannot be modified here.", 403);

  const { action } = parsed.data;
  const reason = parsed.data.reason?.trim() || "";

  if (action === "verify") {
    if (user.email_verified_at) return jsonError("This account is already verified.");
    run("UPDATE users SET email_verified_at = ? WHERE id = ?", nowIso(), user.id);
    notify({
      userId: user.id,
      type: "account",
      title: "Email verified by support",
      body: "Your email address has been verified. You can now use all available features.",
    });
  } else if (action === "restrict") {
    if (reason.length < 5) {
      return jsonError("A restriction reason of at least 5 characters is required.", 422, {
        fields: { reason: "Explain why access is being limited." },
      });
    }
    const days = parsed.data.days ?? 7;
    const endsAt = new Date(Date.now() + days * 86_400_000).toISOString();
    run(
      `INSERT INTO restrictions (id, user_id, reason, detail, status, starts_at, ends_at, created_by, created_at)
       VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?)`,
      randomId("res_"),
      user.id,
      "Cancellation fairness review",
      reason,
      nowIso(),
      endsAt,
      auth.user.id,
      nowIso(),
    );
    run(
      "UPDATE users SET restricted_until = ?, restriction_reason = ? WHERE id = ?",
      endsAt,
      reason,
      user.id,
    );
    notify({
      userId: user.id,
      type: "restriction",
      title: "Booking access temporarily limited",
      body: `New bookings are paused until ${new Date(endsAt).toLocaleDateString("en-IN")}. Reason: ${reason}. You can submit an appeal from Settings.`,
    });
  } else {
    run(
      "UPDATE users SET restricted_until = NULL, restriction_reason = NULL WHERE id = ?",
      user.id,
    );
    run(
      `UPDATE restrictions SET status = 'reversed', reversed_by = ?, reversed_at = ?
       WHERE user_id = ? AND status = 'active'`,
      auth.user.id,
      nowIso(),
      user.id,
    );
    notify({
      userId: user.id,
      type: "restriction",
      title: "Booking access restored",
      body: "The temporary limitation on new bookings has been lifted.",
    });
  }

  logAudit({
    actorId: auth.user.id,
    actorRole: "admin",
    action: `user.${action}`,
    entity: "user",
    entityId: user.id,
    details: { reason, days: parsed.data.days ?? null },
    ip: clientIp(req),
  });

  return jsonOk({});
}
