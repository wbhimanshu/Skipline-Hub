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
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-400 via-brand-500 to-cyan-500 shadow-glow">
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 text-white"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 7h9M4 12h13M4 17h7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M16 4l4 3-4 3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 transition group-hover:opacity-100" />
      </span>
      {!compact ? (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[17px] font-bold tracking-tight text-white">
            Skipline<span className="text-brand-300"> Hub</span>
          </span>
          <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.18em] text-slate-500">
            Less waiting. More living.
          </span>
        </span>
      ) : null}
    </Link>
  );
}
