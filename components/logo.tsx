import Image from "next/image";
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
      <span className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-[14px] bg-[#150e09] ring-1 ring-brand-500/25 shadow-glow transition-transform duration-500 ease-out group-hover:scale-[1.04]">
        <Image
          src="/logo-mark.png"
          alt=""
          width={478}
          height={387}
          priority
          className="h-[26px] w-auto object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]"
        />
        <span className="pointer-events-none absolute inset-0 rounded-[14px] bg-gradient-to-tr from-brand-900/30 via-transparent to-white/[0.07]" />
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
