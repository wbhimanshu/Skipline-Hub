import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { currentUserSafe } from "@/lib/session";
import { getDb } from "@/lib/db";
import { guardMutation, jsonError, parseBody } from "@/lib/http";
import { LANG_COOKIE, LARGE_TEXT_COOKIE } from "@/lib/i18n";
import { prefsSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  const blocked = guardMutation(req);
  if (blocked) return blocked;

  const parsed = await parseBody(req, prefsSchema);
  if (parsed.error) return parsed.error;

  const { language, largeText } = parsed.data;
  const jar = await cookies();
  const options = {
    httpOnly: false,
    sameSite: "lax" as const,
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  };
  jar.set(LANG_COOKIE, language, options);
  jar.set(LARGE_TEXT_COOKIE, largeText ? "1" : "0", options);

  const user = await currentUserSafe();
  if (user) {
    try {
      getDb()
        .prepare("UPDATE users SET language = ?, large_text = ? WHERE id = ?")
        .run(language, largeText ? 1 : 0, user.id);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[prefs] preference update failed", error);
      }
      return jsonError("Could not save preferences right now.", 500);
    }
  }

  return NextResponse.json({ ok: true, language, largeText });
}
