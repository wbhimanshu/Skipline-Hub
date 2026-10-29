"use client";

import { useLanguage } from "./providers";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] p-0.5",
        className,
      )}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={cn(
          "rounded-full px-2.5 py-1 text-[11px] font-semibold transition",
          lang === "en"
            ? "bg-white/10 text-white"
            : "text-slate-400 hover:text-white",
        )}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("hi")}
        aria-pressed={lang === "hi"}
        className={cn(
          "rounded-full px-2.5 py-1 text-[11px] font-semibold transition",
          lang === "hi"
            ? "bg-white/10 text-white"
            : "text-slate-400 hover:text-white",
        )}
      >
        हिं
      </button>
    </div>
  );
}
