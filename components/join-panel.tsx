"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  MapPin,
  Ticket,
} from "lucide-react";
import { useToast } from "@/components/providers";
import { InlineNotice } from "@/components/ui";
import { cn, formatTime } from "@/lib/utils";

type SlotGroup = { date: string; label: string; times: string[] };
type ApiResult = {
  ok: boolean;
  error?: string;
  code?: string;
  fields?: Record<string, string>;
  redirect?: string;
};

export function JoinPanel({
  orgId,
  slug,
  orgName,
  city,
  emergencyEnabled,
  slots,
  isLoggedIn,
  isRestricted,
  activeTicketId,
  estimateMinutes,
}: {
  orgId: string;
  slug: string;
  orgName: string;
  city: string;
  emergencyEnabled: boolean;
  slots: SlotGroup[];
  isLoggedIn: boolean;
  isRestricted: boolean;
  activeTicketId: string | null;
  estimateMinutes: number;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [tab, setTab] = useState<"queue" | "appointment">("queue");
  const [slot, setSlot] = useState<string | null>(slots[0]?.times[0] ?? null);
  const [emergency, setEmergency] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    setError(null);
    if (!isLoggedIn) {
      router.push(`/login/user?next=${encodeURIComponent(`/centres/${slug}`)}`);
      return;
    }
    if (tab === "appointment" && !slot) {
      setError("Choose an appointment time.");
      return;
    }
    if (emergency && reason.trim().length < 10) {
      setError("Please describe the emergency in at least 10 characters.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          kind: tab,
          slot: tab === "appointment" ? slot : null,
          emergency,
          emergencyReason: emergency ? reason : null,
        }),
      });
      const data = (await response.json()) as ApiResult;
      if (!response.ok || !data.ok) {
        setError(data.error || "Could not complete your request. Please try again.");
        return;
      }
      push(
        "success",
        tab === "appointment"
          ? "Appointment booked. Check in when you arrive."
          : "You joined the queue. Track your turn live.",
        tab === "appointment" ? "Booking confirmed" : "Token created",
      );
      router.push(data.redirect || `/dashboard/tickets/${activeTicketId ?? ""}`);
      router.refresh();
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  if (activeTicketId) {
    return (
      <div className="space-y-4">
        <InlineNotice tone="success" title="You already have an active token here">
          You can track your position, check in and manage the token from your dashboard.
        </InlineNotice>
        <Link href={`/dashboard/tickets/${activeTicketId}`} className="btn-primary w-full">
          <Ticket className="h-4 w-4" />
          Open live token
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-ink-950/50 p-1">
        <button
          type="button"
          onClick={() => setTab("queue")}
          className={cn(
            "rounded-lg px-3 py-2 text-xs font-semibold transition",
            tab === "queue" ? "bg-brand-500/20 text-white shadow-sm" : "text-slate-400 hover:text-white",
          )}
        >
          Join live queue
        </button>
        <button
          type="button"
          onClick={() => setTab("appointment")}
          className={cn(
            "rounded-lg px-3 py-2 text-xs font-semibold transition",
            tab === "appointment" ? "bg-brand-500/20 text-white shadow-sm" : "text-slate-400 hover:text-white",
          )}
        >
          Book a slot
        </button>
      </div>

      {isRestricted ? (
        <InlineNotice tone="warning" title="New bookings are temporarily limited">
          You can still request emergency triage where available. Review the reason and appeal from your dashboard.
        </InlineNotice>
      ) : null}

      {tab === "queue" ? (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Estimated wait
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-white">
                ~{estimateMinutes} min
              </p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-xl border border-brand-400/20 bg-brand-500/10 text-brand-200">
              <Ticket className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            You will receive a token immediately. Estimates update as the queue changes and are not a guaranteed turn time.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {slots.length === 0 ? (
            <InlineNotice tone="warning">
              No appointment slots are available in the next few days. Join the live queue or check back later.
            </InlineNotice>
          ) : (
            slots.map((group) => (
              <div key={group.date}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.times.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSlot(time)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-xs font-semibold transition",
                        slot === time
                          ? "border-brand-400/50 bg-brand-500/20 text-white"
                          : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:text-white",
                      )}
                    >
                      {formatTime(time)}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
          <div className="flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-[11px] leading-relaxed text-slate-500">
            <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300" />
            Check-in opens 90 minutes before your slot and closes 3 hours after. Cancellations made within
            30 minutes of the slot count as late.
          </div>
        </div>
      )}

      {emergencyEnabled ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/[0.04] p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={emergency}
              onChange={(event) => setEmergency(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-white/20 bg-ink-900 text-rose-500 focus:ring-rose-500"
            />
            <span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-100">
                <AlertTriangle className="h-3.5 w-3.5" />
                Request emergency triage
              </span>
              <span className="mt-1 block text-[11px] leading-relaxed text-rose-200/60">
                Staff must review and approve. This is not a substitute for emergency services. For
                life-threatening symptoms, call 108 or go to the nearest emergency department.
              </span>
            </span>
          </label>
          {emergency ? (
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              maxLength={800}
              placeholder="Briefly describe the urgent symptoms or situation for the care team…"
              className="input mt-3 resize-none text-xs"
            />
          ) : null}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-400/25 bg-rose-500/[0.08] px-3.5 py-2.5 text-xs text-rose-200">
          {error}
        </div>
      ) : null}

      {isLoggedIn ? (
        <button
          type="button"
          onClick={submit}
          disabled={pending || (isRestricted && !emergency)}
          className="btn-primary w-full"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {tab === "appointment" ? "Confirm appointment" : emergency ? "Request emergency triage" : "Join queue now"}
        </button>
      ) : (
        <Link href={`/login/user?next=${encodeURIComponent(`/centres/${slug}`)}`} className="btn-primary w-full">
          <LockKeyhole className="h-4 w-4" />
          Sign in to {tab === "appointment" ? "book" : "join"}
        </Link>
      )}

      <p className="flex items-center justify-center gap-1.5 text-center text-[10px] text-slate-600">
        <MapPin className="h-3 w-3" />
        {orgName} · {city}
      </p>
    </div>
  );
}
