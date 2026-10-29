"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  MonitorSmartphone,
  Plus,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react";
import { useToast } from "@/components/providers";
import { cn } from "@/lib/utils";

type Counter = { id: string; name: string; is_active: number };

async function send(url: string, method: string, body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  return { ok: response.ok && data.ok, data };
}

export function CounterManager({ initial }: { initial: Counter[] }) {
  const router = useRouter();
  const { push } = useToast();
  const [items, setItems] = useState(initial);
  const [name, setName] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function add(event: React.FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) {
      setError("Enter a counter name.");
      return;
    }
    setPending("add");
    setError(null);
    const result = await send("/api/org/counters", "POST", { name });
    setPending(null);
    if (!result.ok) {
      setError(result.data.error || "Could not add counter.");
      return;
    }
    setItems((prev) => [...prev, { id: result.data.id, name, is_active: 1 }]);
    setName("");
    push("success", `${name} has been opened.`, "Counter added");
    router.refresh();
  }

  async function toggle(counter: Counter) {
    setPending(counter.id);
    const result = await send(`/api/org/counters/${counter.id}`, "PATCH", {
      isActive: !counter.is_active,
    });
    setPending(null);
    if (!result.ok) {
      push("error", result.data.error || "Could not update counter.");
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === counter.id ? { ...item, is_active: item.is_active ? 0 : 1 } : item)),
    );
    push("success", `${counter.name} ${counter.is_active ? "closed" : "opened"}.`);
    router.refresh();
  }

  async function remove(counter: Counter) {
    if (!window.confirm(`Delete ${counter.name}? Counters with visit history cannot be deleted.`)) return;
    setPending(counter.id);
    const result = await send(`/api/org/counters/${counter.id}`, "DELETE");
    setPending(null);
    if (!result.ok) {
      push("error", result.data.error || "Could not delete counter.");
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== counter.id));
    push("success", `${counter.name} deleted.`);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <form onSubmit={add} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
        <label htmlFor="counter-name" className="label">Add a service counter</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="counter-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={60}
            placeholder="e.g. Counter 4 · Pharmacy"
            className="input flex-1 text-sm"
          />
          <button type="submit" disabled={pending === "add"} className="btn-primary shrink-0">
            {pending === "add" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add counter
          </button>
        </div>
        {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
        <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
          Counters are required for call-next and directly affect waiting-time estimates. Open only the
          counters you can actively staff.
        </p>
      </form>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
          <MonitorSmartphone className="mx-auto h-5 w-5 text-slate-600" />
          <p className="mt-2 text-xs text-slate-500">Add your first counter to start serving customers.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((counter) => (
            <div key={counter.id} className="card flex items-center gap-3 p-4">
              <span
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-xl border",
                  counter.is_active
                    ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                    : "border-white/[0.08] bg-white/[0.03] text-slate-500",
                )}
              >
                <MonitorSmartphone className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-200">{counter.name}</p>
                <p className={counter.is_active ? "text-[10px] text-emerald-300" : "text-[10px] text-slate-500"}>
                  {counter.is_active ? "Open and accepting calls" : "Closed"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggle(counter)}
                disabled={pending === counter.id}
                className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-slate-400 transition hover:text-white"
                aria-label={counter.is_active ? `Close ${counter.name}` : `Open ${counter.name}`}
              >
                {pending === counter.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : counter.is_active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => remove(counter)}
                disabled={pending === counter.id}
                className="rounded-lg border border-rose-400/15 bg-rose-500/[0.05] p-2 text-rose-300 transition hover:bg-rose-500/15"
                aria-label={`Delete ${counter.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
