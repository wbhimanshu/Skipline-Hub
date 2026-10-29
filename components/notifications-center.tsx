"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarClock,
  CheckCheck,
  Clock3,
  HeartPulse,
  ShieldAlert,
  Ticket,
  TriangleAlert,
  UserRoundCheck,
} from "lucide-react";
import { useToast } from "@/components/providers";
import { EmptyState } from "@/components/ui";
import { cn, relativeTime } from "@/lib/utils";

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  ticket_id: string | null;
  read_at: string | null;
  created_at: string;
};

const icons: Record<string, typeof Bell> = {
  turn: Clock3,
  queue: Ticket,
  booking: CalendarClock,
  checkin: Ticket,
  completed: CheckCheck,
  cancellation: TriangleAlert,
  restriction: ShieldAlert,
  emergency: HeartPulse,
  priority: UserRoundCheck,
};

export function NotificationsCenter({ initial }: { initial: NotificationRow[] }) {
  const router = useRouter();
  const { push } = useToast();
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [pending, setPending] = useState(false);

  const unread = items.filter((item) => !item.read_at).length;
  const visible = useMemo(
    () => (filter === "unread" ? items.filter((item) => !item.read_at) : items),
    [filter, items],
  );

  async function mark(body: { all?: boolean; id?: string }) {
    setPending(true);
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error();
      const now = new Date().toISOString();
      setItems((prev) =>
        prev.map((item) =>
          body.all || item.id === body.id ? { ...item, read_at: item.read_at ?? now } : item,
        ),
      );
      if (body.all) push("success", "All notifications marked as read.");
      router.refresh();
    } catch {
      push("error", "Could not update notifications. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-xl border border-white/10 bg-ink-950/50 p-1">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              filter === "all" ? "bg-brand-500/20 text-white" : "text-slate-400 hover:text-white",
            )}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              filter === "unread" ? "bg-brand-500/20 text-white" : "text-slate-400 hover:text-white",
            )}
          >
            Unread {unread > 0 ? `(${unread})` : ""}
          </button>
        </div>
        <button
          type="button"
          onClick={() => mark({ all: true })}
          disabled={pending || unread === 0}
          className="btn-secondary btn-sm ml-auto"
        >
          <CheckCheck className="h-3.5 w-3.5" />
          Mark all read
        </button>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={filter === "unread" ? "You are all caught up" : "No notifications yet"}
          description="Turn alerts, booking updates, cancellations and priority decisions will appear here."
        />
      ) : (
        <div className="space-y-2">
          {visible.map((item) => {
            const Icon = icons[item.type] ?? Bell;
            const content = (
              <>
                <span
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-xl border",
                    item.read_at
                      ? "border-white/[0.07] bg-white/[0.025] text-slate-500"
                      : "border-brand-400/20 bg-brand-500/10 text-brand-200",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <p className={cn("text-xs font-semibold", item.read_at ? "text-slate-300" : "text-white")}>
                      {item.title}
                    </p>
                    {!item.read_at ? <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" /> : null}
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{item.body}</p>
                  <p className="mt-1.5 text-[10px] text-slate-600">{relativeTime(item.created_at)}</p>
                </div>
              </>
            );
            if (item.ticket_id) {
              return (
                <Link
                  key={item.id}
                  href={`/dashboard/tickets/${item.ticket_id}`}
                  onClick={() => {
                    if (!item.read_at) void mark({ id: item.id });
                  }}
                  className={cn("card flex items-start gap-3 p-4 transition hover:border-white/20", !item.read_at && "border-brand-400/15")}
                >
                  {content}
                </Link>
              );
            }
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (!item.read_at) void mark({ id: item.id });
                }}
                className={cn("card flex w-full items-start gap-3 p-4 text-left transition hover:border-white/20", !item.read_at && "border-brand-400/15")}
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
