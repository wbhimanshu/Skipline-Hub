import fs from "node:fs";
import path from "node:path";
import { randomId, nowIso } from "./utils";
import { run } from "./db";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";

export function absoluteUrl(pathname: string) {
  return `${APP_URL}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
}

export function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
}

export function devLinksEnabled() {
  if (smtpConfigured()) return false;
  return (process.env.SHOW_DEV_EMAIL_LINKS ?? "true") !== "false";
}

function logToFile(to: string, subject: string, body: string, actionUrl?: string) {
  try {
    const dir = path.join(process.cwd(), "data");
    fs.mkdirSync(dir, { recursive: true });
    const entry = [
      "=".repeat(78),
      `Time: ${nowIso()}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      actionUrl ? `Action: ${actionUrl}` : "",
      "",
      body,
      "",
    ].join("\n");
    fs.appendFileSync(path.join(dir, "outbox.log"), entry);
  } catch (error) {
    console.error("[skipline] could not write outbox log", error);
  }
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  actionUrl?: string;
}) {
  await run(
    "INSERT INTO email_log (id, to_email, subject, body, action_url, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    randomId("mail_"),
    opts.to,
    opts.subject,
    opts.text,
    opts.actionUrl ?? null,
    nowIso(),
  );

  if (!smtpConfigured()) {
    logToFile(opts.to, opts.subject, opts.text, opts.actionUrl);
    return { delivered: false as const };
  }

  try {
    const nodemailer = await import("nodemailer");
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    await transport.sendMail({
      from: process.env.MAIL_FROM || "Skipline Hub <no-reply@skiplinehub.app>",
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    return { delivered: true as const };
  } catch (error) {
    console.error("[skipline] email delivery failed", error);
    logToFile(opts.to, opts.subject, opts.text, opts.actionUrl);
    return { delivered: false as const };
  }
}

export function verificationEmail(name: string, token: string) {
  const url = absoluteUrl(`/verify-email?token=${token}`);
  const text = `Hi ${name},\n\nWelcome to Skipline Hub. Verify your email address to activate your account:\n${url}\n\nThis link expires in 24 hours. If you did not create this account, you can ignore this email.`;
  const html = `<div style="font-family:Inter,Arial,sans-serif;background:#070b1a;padding:32px;color:#e2e8f0;border-radius:16px">
    <h2 style="color:#fff;margin:0 0 12px">Verify your Skipline Hub email</h2>
    <p>Hi ${escapeHtml(name)}, welcome aboard. Confirm your email to activate your account.</p>
    <p><a href="${url}" style="display:inline-block;background:#7c4dff;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:600">Verify email</a></p>
    <p style="color:#94a3b8;font-size:13px">This link expires in 24 hours. If the button does not work, open: ${url}</p>
  </div>`;
  return { url, text, html, subject: "Verify your Skipline Hub email" };
}

export function resetEmail(name: string, token: string) {
  const url = absoluteUrl(`/reset-password?token=${token}`);
  const text = `Hi ${name},\n\nWe received a request to reset your Skipline Hub password. Use this link within 60 minutes:\n${url}\n\nIf you did not request this, no action is needed.`;
  const html = `<div style="font-family:Inter,Arial,sans-serif;background:#070b1a;padding:32px;color:#e2e8f0;border-radius:16px">
    <h2 style="color:#fff;margin:0 0 12px">Reset your password</h2>
    <p>Hi ${escapeHtml(name)}, use the button below to choose a new password. The link expires in 60 minutes.</p>
    <p><a href="${url}" style="display:inline-block;background:#7c4dff;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:600">Reset password</a></p>
    <p style="color:#94a3b8;font-size:13px">If you did not request this, you can safely ignore this email.</p>
  </div>`;
  return { url, text, html, subject: "Reset your Skipline Hub password" };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
