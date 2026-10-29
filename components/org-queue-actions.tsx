"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Loader2,
  PhoneCall,
  UserRoundCheck,
  X,
  XCircle,
} from "lucide-react";
import { useToast } from "@/components/providers";
import { cn } from "@/lib/utils";

type Counter = { id: string; name: string; is_active: number };

async function callApi(url: string, method: string, body: unknown) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return { ok: response.ok && data.ok, data };
}

export function CallNext({ counters }: { counters: Counter[] }) {
  const router = useRouter();
  const { push } = useToast();
  const active = counters.filter((counter) => counter.is_active);
  const [counterId, setCounterId] = useState(active[0]?.id ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call() {
    if (!counterId) {
      setError("Open a counter before calling the next customer.");
      return;
    }
    setPending(true);
    setError(null);
    const result = await callApi("/api/org/call", "POST", { counterId });
    setPending(false);
    if (!result.ok) {
      setError(result.data.error || "Could not call the next token.");
      return;
    }
    push("success", `Token ${result.data.ticket?.token_no ?? ""} is now being called.`, "Next customer called");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-brand-400/20 bg-brand-500/[0.06] p-4">
      <p className="flex items-center gap-2 text-xs font-semibold text-brand-100">
        <PhoneCall className="h-4 w-4" />
        Call next customer
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <select
          value={counterId}
          onChange={(event) => setCounterId(event.target.value)}
          className="input flex-1 text-sm"
          aria-label="Choose counter"
        >
          {active.length === 0 ? <option value="">No active counters</option> : null}
          {active.map((counter) => (
            <option key={counter.id} value={counter.id}>{counter.name}</option>
          ))}
        </select>
        <button type="button" onClick={call} disabled={pending || !counterId} className="btn-primary shrink-0">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PhoneCall className="h-4 w-4" />}
          Call next
        </button>
      </div>
      {error ? <p className="mt-2 text-[11px] text-rose-300">{error}</p> : null}
      <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
        The next eligible token is selected by verified priority, then arrival time. A counter can serve
        only one token at a time.
      </p>
    </div>
  );
}

type DialogMode = "priority" | "cancel" | "no_show" | null;

export function OrgTicketActions({
  ticketId,
  status,
  priority,
  compact = false,
}: {
  ticketId: string;
  status: string;
  priority: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [mode, setMode] = useState<DialogMode>(null);
  const [priorityValue, setPriorityValue] = useState(priority);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(next: "completed" | "no_show" | "cancelled", why?: string) {
    setPending(true);
    setError(null);
    const result = await callApi(`/api/org/tickets/${ticketId}`, "PATCH", {
      action: "status",
      status: next,
      reason: why,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.data.error || "Could not update this token.");
      return false;
    }
    push("success", `Token marked ${next.replace("_", " ")}.`);
    router.refresh();
    return true;
  }

  async function submit() {
    if (!mode) return;
    if (mode === "priority") {
      if (reason.trim().length < 3) {
        setError("Add a verification reason.");
        return;
      }
      setPending(true);
      const result = await callApi(`/api/org/tickets/${ticketId}`, "PATCH", {
        action: "priority",
        priority: priorityValue,
        reason,
      });
      setPending(false);
      if (!result.ok) {
        setError(result.data.error || "Could not update priority.");
        return;
      }
      push("success", `Priority updated to ${priorityValue}.`, "Priority changed");
      setMode(null);
      router.refresh();
      return;
    }
    if (reason.trim().length < 3) {
      setError("Add a short reason for this action.");
      return;
    }
    if (mode === "cancel") {
      const done = await updateStatus("cancelled", reason);
      if (done) setMode(null);
    } else if (mode === "no_show") {
      const done = await updateStatus("no_show", reason);
      if (done) setMode(null);
    }
  }

  if (["completed", "cancelled", "no_show"].includes(status)) {
    return <span className="text-[11px] text-slate-600">Closed</span>;
  }

  return (
    <div className={cn("flex flex-wrap gap-1.5", compact && "text-xs")}>
      {status === "serving" ? (
        <button
          type="button"
          onClick={() => updateStatus("completed")}
          disabled={pending}
          className="btn btn-sm border border-emerald-400/25 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          Complete
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => {
          setMode("priority");
          setPriorityValue(priority);
          setReason("");
          setError(null);
        }}
        className="btn btn-sm border border-white/10 bg-white/[0.04] text-slate-300 hover:text-white"
      >
        <ArrowRightLeft className="h-3.5 w-3.5" />
        Priority
      </button>
      {status === "waiting" || status === "booked" ? (
        <button
          type="button"
          onClick={() => {
            setMode("no_show");
            setReason("");
            setError(null);
          }}
          className="btn btn-sm border border-white/10 bg-white/[0.04] text-slate-300 hover:text-white"
        >
          <XCircle className="h-3.5 w-3.5" />
          No-show
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => {
          setMode("cancel");
          setReason("");
          setError(null);
        }}
        className="btn btn-sm border border-rose-400/20 bg-rose-500/[0.06] text-rose-200 hover:bg-rose-500/15"
      >
        <X className="h-3.5 w-3.5" />
        Cancel
      </button>

      {mode ? (
        <div className="fixed inset-0 z-[90] grid place-items-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-ink-950/75 backdrop-blur-sm"
            onClick={() => setMode(null)}
            aria-label="Close dialog"
          />
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-ink-900 p-6 shadow-panel">
            <h2 className="font-display text-lg font-semibold text-white">
              {mode === "priority" ? "Change priority" : mode === "cancel" ? "Cancel token" : "Mark no-show"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {mode === "priority"
                ? "Priority changes require a verification reason and are recorded in the audit trail."
                : "The customer will be notified. Centre-side cancellations do not count against the customer's fairness record."}
            </p>
            {mode === "priority" ? (
              <div className="mt-4">
                <label htmlFor="priority-value" className="label">Priority</label>
                <select
                  id="priority-value"
                  value={priorityValue}
                  onChange={(event) => setPriorityValue(event.target.value)}
                  className="input text-sm"
                >
                  <option value="normal">Normal</option>
                  <option value="senior">Senior citizen</option>
                  <option value="disability">Accessibility</option>
                  <option value="emergency">Emergency (verified)</option>
                </select>
              </div>
            ) : null}
            <div className="mt-4">
              <label htmlFor="org-action-reason" className="label">
                {mode === "priority" ? "Verification reason" : "Reason"}
              </label>
              <textarea
                id="org-action-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                maxLength={500}
                className="input resize-none text-sm"
                placeholder={
                  mode === "priority"
                    ? "e.g. Senior citizen status verified at reception"
                    : "e.g. Customer did not respond after three calls"
                }
              />
            </div>
            {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setMode(null)} className="btn-secondary flex-1">
                Go back
              </button>
              <button type="button" onClick={submit} disabled={pending} className={mode === "priority" ? "btn-primary flex-1" : "btn-danger flex-1"}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "priority" ? <UserRoundCheck className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
