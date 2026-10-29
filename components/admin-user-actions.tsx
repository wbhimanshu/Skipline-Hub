"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Loader2, ShieldOff, ShieldPlus, X } from "lucide-react";
import { useToast } from "@/components/providers";

type Action = "verify" | "restrict" | "unrestrict";

export function AdminUserActions({
  id,
  name,
  verified,
  restricted,
}: {
  id: string;
  name: string;
  verified: boolean;
  restricted: boolean;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [pending, setPending] = useState<Action | null>(null);
  const [dialog, setDialog] = useState(false);
  const [reason, setReason] = useState("Repeated late cancellations without valid reason.");
  const [days, setDays] = useState(7);
  const [error, setError] = useState<string | null>(null);

  async function submit(action: Action, note = "", duration = 7) {
    setPending(action);
    setError(null);
    const response = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason: note || undefined, days: duration }),
    });
    const data = await response.json();
    setPending(null);
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not update account.");
      return;
    }
    setDialog(false);
    push("success", `${name} was updated.`, "Account updated");
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {!verified ? (
          <button
            type="button"
            onClick={() => submit("verify")}
            disabled={pending !== null}
            className="btn btn-sm border border-cyan-400/25 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20"
          >
            {pending === "verify" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BadgeCheck className="h-3.5 w-3.5" />}
            Verify
          </button>
        ) : null}
        {restricted ? (
          <button
            type="button"
            onClick={() => submit("unrestrict")}
            disabled={pending !== null}
            className="btn btn-sm border border-emerald-400/25 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
          >
            {pending === "unrestrict" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldOff className="h-3.5 w-3.5" />}
            Lift limit
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setDialog(true);
              setError(null);
            }}
            className="btn btn-sm border border-white/10 bg-white/[0.04] text-slate-300 hover:text-white"
          >
            <ShieldPlus className="h-3.5 w-3.5" />
            Restrict
          </button>
        )}
      </div>

      {dialog ? (
        <div className="fixed inset-0 z-[90] grid place-items-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-brand-900/50 backdrop-blur-sm"
            onClick={() => setDialog(false)}
            aria-label="Close dialog"
          />
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-ink-900 p-6 shadow-panel">
            <button
              type="button"
              onClick={() => setDialog(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-amber-400/25 bg-amber-500/10 text-amber-200">
              <ShieldPlus className="h-5 w-5" />
            </span>
            <h2 className="mt-4 font-display text-lg font-semibold text-white">Limit new bookings</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {name} can still view existing tokens but cannot join new queues or book appointments.
              Medical and platform exceptions remain excluded by policy.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="user-reason" className="label">Reason</label>
                <textarea
                  id="user-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={2}
                  maxLength={500}
                  className="input resize-none text-sm"
                />
              </div>
              <div>
                <label htmlFor="user-days" className="label">Duration</label>
                <select
                  id="user-days"
                  value={days}
                  onChange={(event) => setDays(Number(event.target.value))}
                  className="input text-sm"
                >
                  {[3, 7, 14, 30].map((value) => (
                    <option key={value} value={value}>{value} days</option>
                  ))}
                </select>
              </div>
            </div>
            {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setDialog(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => submit("restrict", reason, days)}
                disabled={pending !== null}
                className="btn-primary flex-1"
              >
                {pending === "restrict" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldPlus className="h-4 w-4" />}
                Apply limit
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
