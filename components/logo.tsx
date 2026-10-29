import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
  compact = false,
}: {
  className?: string;
  href?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="Skipline Hub home"
    >
      <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-[13px] bg-gradient-to-br from-brand-600 via-brand-500 to-brand-300 shadow-glow">
        <svg
          viewBox="0 0 32 32"
          className="h-6 w-6 text-cream"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M23 8.75H14.4a4.15 4.15 0 0 0 0 8.3h3.2a4.15 4.15 0 0 1 0 8.3H9"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="m23.75 22.5 3.5 2.8-3.5 2.8"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />
        </svg>
        <span className="absolute inset-0 bg-gradient-to-tr from-brand-900/20 via-transparent to-cream/25" />
      </span>
      {!compact ? (
        <span className="flex flex-col leading-none">
          <span className="flex items-center gap-1.5">
            <span className="font-display text-[18px] font-extrabold tracking-[-0.03em] text-brand-900">
              Skipline
            </span>
            <span className="rounded-md border border-brand-300/60 bg-brand-100/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-brand-700">
              Hub
            </span>
          </span>
          <span className="mt-1.5 text-[9px] font-medium uppercase tracking-[0.18em] text-slate-500">
            Less waiting. More living.
          </span>
        </span>
      ) : null}
    </Link>
  );
}
