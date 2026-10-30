import QRCode from "qrcode";
import { getTicket, qrPayload } from "@/lib/queue";
import { jsonError, requireApi } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApi();
  if (auth.response) return auth.response;
  const { id } = await params;
  const ticket = await getTicket(id);
  if (!ticket) return jsonError("Ticket not found.", 404);
  const user = auth.user;
  const canView =
    user.role === "admin" ||
    ticket.user_id === user.id ||
    (user.role === "org" && user.org_id === ticket.org_id);
  if (!canView) return jsonError("Ticket not found.", 404);

  const buffer = await QRCode.toBuffer(qrPayload(ticket), {
    type: "png",
    width: 320,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#0b1024", light: "#ffffff" },
  });
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `inline; filename="skipline-${ticket.token_no}.png"`,
    },
  });
}
