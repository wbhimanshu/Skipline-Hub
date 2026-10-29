"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Loader2,
  ShieldX,
  X,
} from "lucide-react";
import { useToast } from "@/components/providers";
import { cn, relativeTime } from "@/lib/utils";

export type EmergencyRequestRow = {
  id: string;
  ticket_id: string;
  reason: string;
  status: string;
  review_note: string;
  created_at: string;
  resolved_at: string | null;
  token_no: string;
  priority: string;
  ticket_status: string;
  user_name: string;
  user_email: string;
  user_phone: string;
};

export function EmergencyReview({ requests }: { requests: EmergencyRequestRow[] }) {
  const router = useRouter();
  const { push } = useToast();
  const [target, setTarget] = useState<{ request: EmergencyRequestRow; decision: "approved" | "declined" } | null>(null);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingRequests = requests.filter((request) => request.status === "pending");
  const resolved = requests.filter((request) => request.status !== "pending");

  async function submit() {
    if (!target) return;
    if (note.trim().length < 3) {
      setError("Add a short clinical or operational note.");
      return;
    }
    setPending(true);
    setError(null);
    const response = await fetch(`/api/org/emergency/${target.request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: target.decision, note }),
    });
    const data = await response.json();
    setPending(false);
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not review this request.");
      return;
    }
    push(
      "success",
      target.decision === "approved"
        ? "Emergency priority approved. The customer has been notified."
        : "Request declined. The customer's queue position is unchanged.",
    );
    setTarget(null);
    setNote("");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
            <AlertTriangle className="h-4 w-4 text-rose-300" />
            Awaiting review
          </h2>
          <span className="text-xs text-slate-600">{pendingRequests.length} pending</span>
        </div>
        {pendingRequests.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-white/10 p-8 text-center">
            <Clock3 className="mx-auto h-5 w-5 text-slate-600" />
            <p className="mt-2 text-xs text-slate-500">No emergency requests are waiting.</p>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {pendingRequests.map((request) => (
              <div key={request.id} className="rounded-2xl border border-rose-400/20 bg-rose-500/[0.05] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-xl font-bold text-white">{request.token_no}</p>
                      <span className="badge border-rose-400/25 bg-rose-500/10 text-rose-200">Pending triage</span>
                      <span className="badge-slate capitalize">{request.ticket_status}</span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-200">
                      {request.user_name} · {request.user_phone || request.user_email}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">Requested {relativeTime(request.created_at)}</p>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-white/[0.06] bg-ink-950/40 p-3.5">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Reported situation</p>
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-200">{request.reason}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTarget({ request, decision: "approved" });
                      setNote("");
                      setError(null);
                    }}
                    className="btn btn-sm border border-emerald-400/25 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approve priority
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTarget({ request, decision: "declined" });
                      setNote("");
                      setError(null);
                    }}
                    className="btn btn-sm border border-white/10 bg-white/[0.04] text-slate-300 hover:text-white"
                  >
                    <ShieldX className="h-3.5 w-3.5" />
                    Decline request
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {resolved.length > 0 ? (
        <section>
          <h2 className="font-display text-lg font-semibold text-white">Recently reviewed</h2>
          <div className="mt-3 table-shell overflow-x-auto">
            <table className="table min-w-[720px]">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Customer</th>
                  <th>Decision</th>
                  <th>Note</th>
                  <th>Reviewed</th>
                </tr>
              </thead>
              <tbody>
                {resolved.map((request) => (
                  <tr key={request.id}>
                    <td className="font-display font-semibold text-white">{request.token_no}</td>
                    <td className="text-xs">{request.user_name}</td>
                    <td>
                      <span className={request.status === "approved" ? "badge-green" : request.status === "declined" ? "badge-rose" : "badge-slate"}>
                        {request.status}
                      </span>
                    </td>
                    <td className="max-w-[280px] text-xs text-slate-400">{request.review_note || "—"}</td>
                    <td className="text-xs text-slate-500">{relativeTime(request.resolved_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {target ? (
        <div className="fixed inset-0 z-[90] grid place-items-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-brand-900/50 backdrop-blur-sm"
            onClick={() => setTarget(null)}
            aria-label="Close dialog"
          />
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-ink-900 p-6 shadow-panel">
            <button
              type="button"
              onClick={() => setTarget(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <span
              className={cn(
                "grid h-10 w-10 place-items-center rounded-xl border",
                target.decision === "approved"
                  ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                  : "border-rose-400/25 bg-rose-500/10 text-rose-200",
              )}
            >
              {target.decision === "approved" ? <CheckCircle2 className="h-5 w-5" /> : <ShieldX className="h-5 w-5" />}
            </span>
            <h2 className="mt-4 font-display text-lg font-semibold text-white">
              {target.decision === "approved" ? "Approve emergency priority" : "Decline emergency request"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {target.decision === "approved"
                ? "This moves the token to the front of the live queue and records the decision. Only approve after clinical or operational verification."
                : "The customer will be told their queue position is unchanged and to seek urgent help if symptoms worsen."}
            </p>
            <div className="mt-4">
              <label htmlFor="emergency-note" className="label">
                Review note
              </label>
              <textarea
                id="emergency-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                maxLength={500}
                className="input resize-none text-sm"
                placeholder={
                  target.decision === "approved"
                    ? "e.g. Patient assessed by triage nurse; urgent review required"
                    : "e.g. Symptoms do not require queue prioritisation; advised to contact clinician"
                }
              />
            </div>
            {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setTarget(null)} className="btn-secondary flex-1">
                Go back
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={pending}
                className={cn("flex-1", target.decision === "approved" ? "btn-primary" : "btn-danger")}
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : target.decision === "approved" ? <CheckCircle2 className="h-4 w-4" /> : <ShieldX className="h-4 w-4" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
