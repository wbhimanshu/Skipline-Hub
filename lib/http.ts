import { NextRequest, NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { currentUserSafe } from "./session";
import type { Role, SessionUser } from "./auth";
import { AppError } from "./queue";

export function jsonError(message: string, status = 400, extra?: object) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

export function jsonOk(data: object = {}) {
  return NextResponse.json({ ok: true, ...data });
}

export function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    const originUrl = new URL(origin);
    const host = req.headers.get("host");
    if (!host) return false;
    return originUrl.host === host;
  } catch {
    return false;
  }
}

export function guardMutation(req: NextRequest): NextResponse | null {
  if (!sameOrigin(req)) {
    return jsonError("Request blocked: invalid origin.", 403);
  }
  const contentType = req.headers.get("content-type") || "";
  if (
    req.method !== "GET" &&
    !contentType.includes("application/json") &&
    !contentType.includes("form")
  ) {
    return jsonError("Unsupported content type.", 415);
  }
  return null;
}

export async function parseBody<T>(
  req: NextRequest,
  schema: ZodType<T>,
): Promise<{ data: T; error?: never } | { data?: never; error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { error: jsonError("Invalid request body.") };
  }
  try {
    return { data: schema.parse(raw) };
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of error.issues) {
        const key = issue.path.join(".") || "form";
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      return {
        error: jsonError("Please check the highlighted fields.", 422, {
          fields: fieldErrors,
        }),
      };
    }
    return { error: jsonError("Invalid request body.") };
  }
}

export async function requireApi(
  roles?: Role[],
): Promise<
  { user: SessionUser; response?: never } | { user?: never; response: NextResponse }
> {
  const user = await currentUserSafe();
  if (!user) {
    return {
      response: jsonError("Please sign in to continue.", 401),
    };
  }
  if (!user.email_verified_at) {
    return {
      response: jsonError("Please verify your email before continuing.", 403),
    };
  }
  if (roles && !roles.includes(user.role)) {
    return {
      response: jsonError("You do not have permission to perform this action.", 403),
    };
  }
  return { user };
}

export async function requireOrgApi(): Promise<
  { user: SessionUser; response?: never } | { user?: never; response: NextResponse }
> {
  const auth = await requireApi(["org"]);
  if (auth.response) return { response: auth.response };
  if (!auth.user.org_id) {
    return {
      response: jsonError("Your account is not linked to an organisation.", 403),
    };
  }
  if (auth.user.org_status !== "approved") {
    return {
      response: jsonError("Your organisation is awaiting approval or is suspended.", 403),
    };
  }
  return auth;
}

export function clientIp(req: NextRequest): string {
  return (
    (req.headers.get("x-forwarded-for") || "").split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return jsonError(error.message, error.status, error.code ? { code: error.code } : undefined);
  }
  console.error("[api]", error);
  return jsonError("Something went wrong. Please try again.", 500);
}
