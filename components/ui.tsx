import type { ComponentType, ReactNode } from "react";
import {
  Accessibility,
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Clock3,
  Hourglass,
  ShieldAlert,
  Sparkles,
  UserRoundCheck,
  XCircle,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: ComponentType<{ className?: string }> }> = {
    booked: { label: "Booked", cls: "badge-brand", icon: CircleDot },
    waiting: { label: "Waiting", cls: "badge-amber", icon: Hourglass },
    serving: { label: "Serving now", cls: "badge-cyan", icon: Clock3 },
    completed: { label: "Completed", cls: "badge-green", icon: CheckCircle2 },
    cancelled: { label: "Cancelled", cls: "badge-rose", icon: XCircle },
    no_show: { label: "No-show", cls: "badge-rose", icon: ShieldAlert },
  };
  const meta = map[status] ?? { label: status, cls: "badge-slate", icon: CircleDot };
  const Icon = meta.icon;
  return (
    <span className={meta.cls}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  if (priority === "normal") return null;
  const map: Record<string, { label: string; cls: string; icon: ComponentType<{ className?: string }> }> = {
    senior: { label: "Senior priority", cls: "badge-amber", icon: UserRoundCheck },
    disability: { label: "Accessibility priority", cls: "badge-cyan", icon: Accessibility },
    emergency: { label: "Emergency triage", cls: "badge-rose", icon: AlertTriangle },
  };
  const meta = map[priority];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <span className={meta.cls}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: "high" | "medium" | "low" }) {
  const cls =
    confidence === "high"
      ? "badge-green"
      : confidence === "medium"
        ? "badge-cyan"
        : "badge-slate";
  return (
    <span className={cls}>
      <Sparkles className="h-3 w-3" aria-hidden="true" />
      {confidence === "high" ? "High confidence" : confidence === "medium" ? "Medium confidence" : "Low confidence"}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon = CircleDot,
  action,
}: {
  title: string;
  description: string;
  icon?: ComponentType<{ className?: string }>;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ComponentType<{ className?: string }>;
  tone?: "brand" | "cyan" | "emerald" | "amber" | "rose";
}) {
  const tones = {
    brand: "border-brand-400/20 bg-brand-500/10 text-brand-200",
    cyan: "border-cyan-400/20 bg-cyan-500/10 text-cyan-200",
    emerald: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
    amber: "border-amber-400/20 bg-amber-500/10 text-amber-200",
    rose: "border-rose-400/20 bg-rose-500/10 text-rose-200",
  };
  return (
    <div className="stat-card">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand-500/10 blur-2xl" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value mt-2">{value}</p>
        </div>
        {Icon ? (
          <span className={cn("stat-icon", tones[tone])}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      {hint ? <p className="mt-3 text-xs leading-relaxed text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Avatar({
  name,
  className,
  tone = "brand",
}: {
  name: string;
  className?: string;
  tone?: "brand" | "cyan" | "emerald" | "rose";
}) {
  const tones = {
    brand: "from-brand-500/30 to-brand-700/30 text-brand-100 border-brand-400/25",
    cyan: "from-cyan-500/30 to-cyan-700/30 text-cyan-100 border-cyan-400/25",
    emerald: "from-emerald-500/30 to-emerald-700/30 text-emerald-100 border-emerald-400/25",
    rose: "from-rose-500/30 to-rose-700/30 text-rose-100 border-rose-400/25",
  };
  return (
    <span
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-full border bg-gradient-to-br text-xs font-bold",
        tones[tone],
        className,
      )}
      aria-hidden="true"
    >
      {initials(name) || "S"}
    </span>
  );
}

export function QueueRing({
  value,
  size = 132,
  label = "position",
  caption,
}: {
  value: number;
  size?: number;
  label?: string;
  caption?: string;
}) {
  const radius = (size - 18) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, value));
  const offset = circumference - (pct / 100) * circumference;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="9"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ring-gradient)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="ring-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8b6cfb" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="font-display text-2xl font-bold text-white">{pct}%</p>
          <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{label}</p>
          {caption ? <p className="mt-0.5 text-[10px] text-slate-500">{caption}</p> : null}
        </div>
      </div>
    </div>
  );
}

export function InlineNotice({
  tone = "info",
  title,
  children,
  icon: Icon,
}: {
  tone?: "info" | "warning" | "danger" | "success";
  title?: string;
  children: ReactNode;
  icon?: ComponentType<{ className?: string }>;
}) {
  const tones = {
    info: "border-cyan-400/20 bg-cyan-500/[0.06] text-cyan-100",
    warning: "border-amber-400/20 bg-amber-500/[0.06] text-amber-100",
    danger: "border-rose-400/25 bg-rose-500/[0.07] text-rose-100",
    success: "border-emerald-400/20 bg-emerald-500/[0.06] text-emerald-100",
  };
  const DefaultIcon = tone === "danger" ? AlertTriangle : tone === "warning" ? ShieldAlert : CheckCircle2;
  const FinalIcon = Icon ?? DefaultIcon;
  return (
    <div className={cn("rounded-2xl border p-4", tones[tone])}>
      <div className="flex gap-3">
        <FinalIcon className="mt-0.5 h-4 w-4 shrink-0 opacity-80" aria-hidden="true" />
        <div className="min-w-0 text-sm leading-relaxed">
          {title ? <p className="font-semibold">{title}</p> : null}
          <div className={cn(title && "mt-1", "opacity-90")}>{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  center = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow ? <p className="eyebrow mb-4">{eyebrow}</p> : null}
      <h2 className="section-heading">{title}</h2>
      {description ? <p className={cn("section-copy", center && "mx-auto")}>{description}</p> : null}
    </div>
  );
}
