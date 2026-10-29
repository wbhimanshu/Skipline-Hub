"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Loader2,
  LogIn,
  ShieldAlert,
  X,
} from "lucide-react";
import { useToast } from "@/components/providers";
import { cn } from "@/lib/utils";

type Mode = "cancel" | "emergency" | null;

export function TicketActions({
  ticketId,
  status,
  kind,
  emergencyEnabled,
  checkedIn,
  compact = false,
}: {
  ticketId: string;
  status: string;
  kind: string;
  emergencyEnabled: boolean;
  checkedIn: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [mode, setMode] = useState<Mode>(null);
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState<"personal" | "medical_emergency" | "other">("personal");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const closed = ["completed", "cancelled", "no_show"].includes(status);
  const canCheckIn = kind === "appointment" && status === "booked";
  const canCancel = !closed;
  const canEmergency = emergencyEnabled && !closed && status !== "emergency";

  async function checkIn() {
    setPending("checkin");
    setError(null);
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkin" }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Check-in failed.");
        return;
      }
      push("success", "You are checked in. Your token is now in the live queue.", "Check-in confirmed");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(null);
    }
  }

  function openMode(next: Mode) {
    setMode(next);
    setReason("");
    setError(null);
  }

  async function submit() {
    if (!mode) return;
    if (reason.trim().length < (mode === "emergency" ? 10 : 3)) {
      setError(
        mode === "emergency"
          ? "Please describe the emergency in at least 10 characters."
          : "Please provide a short reason.",
      );
      return;
    }
    setPending(mode);
    setError(null);
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "emergency"
            ? { action: "emergency", reason }
            : { action: "cancel", reason, reasonCategory: category },
        ),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "Request failed. Please try again.");
        return;
      }
      if (mode === "emergency") {
        push(
          "info",
          "Centre staff have been alerted. For life-threatening symptoms, call 108 immediately.",
          "Emergency triage requested",
        );
      } else {
        push(
          "success",
          data.restrictionCreated
            ? "Token cancelled. Repeated late cancellations have applied a temporary booking limit. You can appeal from your dashboard."
            : "Your token has been cancelled.",
          "Token cancelled",
        );
      }
      setMode(null);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className={cn("flex flex-wrap gap-2", compact && "gap-1.5")}>
      {canCheckIn && !checkedIn ? (
        <button
          type="button"
          onClick={checkIn}
          disabled={pending === "checkin"}
          className={cn("btn-primary", compact && "btn-sm")}
        >
          {pending === "checkin" ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          Check in
        </button>
      ) : null}

      {canEmergency ? (
        <button
          type="button"
          onClick={() => openMode("emergency")}
          className={cn(
            "btn border border-rose-400/25 bg-rose-500/[0.08] text-rose-200 hover:bg-rose-500/15",
            compact && "btn-sm",
          )}
        >
          <ShieldAlert className="h-4 w-4" />
          Request emergency triage
        </button>
      ) : null}

      {canCancel ? (
        <button
          type="button"
          onClick={() => openMode("cancel")}
          className={cn(
            "btn border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white",
            compact && "btn-sm",
          )}
        >
          <Ban className="h-4 w-4" />
          Cancel token
        </button>
      ) : null}

      {mode ? (
        <div className="fixed inset-0 z-[90] grid place-items-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-brand-900/50 backdrop-blur-sm"
            onClick={() => setMode(null)}
            aria-label="Close dialog"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-action-title"
            className="relative w-full max-w-md rounded-3xl border border-white/10 bg-ink-900 p-6 shadow-panel"
          >
            <button
              type="button"
              onClick={() => setMode(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <span
              className={cn(
                "grid h-10 w-10 place-items-center rounded-xl border",
                mode === "emergency"
                  ? "border-rose-400/25 bg-rose-500/10 text-rose-200"
                  : "border-amber-400/25 bg-amber-500/10 text-amber-200",
              )}
            >
              {mode === "emergency" ? <AlertTriangle className="h-5 w-5" /> : <Ban className="h-5 w-5" />}
            </span>
            <h2 id="ticket-action-title" className="mt-4 font-display text-lg font-semibold text-white">
              {mode === "emergency" ? "Request emergency triage" : "Cancel this token?"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {mode === "emergency"
                ? "Centre staff will review your request. For life-threatening symptoms, call 108 or go to the nearest emergency department now."
                : "Late cancellations can temporarily limit new bookings. Medical emergencies and centre-side cancellations do not count against you."}
            </p>
            {mode === "cancel" ? (
              <div className="mt-4">
                <label htmlFor="cancel-category" className="label">
                  Reason category
                </label>
                <select
                  id="cancel-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value as typeof category)}
                  className="input text-sm"
                >
                  <option value="personal">Personal or schedule change</option>
                  <option value="medical_emergency">Medical emergency</option>
                  <option value="other">Other</option>
                </select>
              </div>
            ) : null}
            <div className="mt-4">
              <label htmlFor="action-reason" className="label">
                {mode === "emergency" ? "What is happening?" : "Brief reason"}
              </label>
              <textarea
                id="action-reason"
                rows={3}
                maxLength={800}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="input resize-none text-sm"
                placeholder={
                  mode === "emergency"
                    ? "Describe the urgent symptoms or situation for the care team…"
                    : "Let the centre know why you are cancelling…"
                }
              />
            </div>
            {error ? (
              <p className="mt-3 rounded-xl border border-rose-400/25 bg-rose-500/[0.08] px-3 py-2 text-xs text-rose-200">
                {error}
              </p>
            ) : null}
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setMode(null)} className="btn-secondary flex-1">
                Keep token
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={Boolean(pending)}
                className={cn("flex-1", mode === "emergency" ? "btn-danger" : "btn-primary")}
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {mode === "emergency" ? "Send request" : "Cancel token"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
