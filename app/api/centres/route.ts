import { NextRequest } from "next/server";
import { listCentres } from "@/lib/centres";
import { handleApiError, jsonOk } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const lat = Number(params.get("lat"));
    const lng = Number(params.get("lng"));
    const centres = await listCentres({
      query: params.get("q") || undefined,
      category: params.get("category") || undefined,
      sort: params.get("sort") || undefined,
      lat: Number.isFinite(lat) ? lat : undefined,
      lng: Number.isFinite(lng) ? lng : undefined,
    });
    return jsonOk({ centres });
  } catch (error) {
    return handleApiError(error);
  }
}
