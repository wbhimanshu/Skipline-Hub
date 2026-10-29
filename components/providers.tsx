"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import {
  LANG_COOKIE,
  LARGE_TEXT_COOKIE,
  normalizeLang,
  t as translate,
  type Lang,
  type TranslationKey,
} from "@/lib/i18n";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; title?: string; message: string };

type LanguageContextValue = {
  lang: Lang;
  largeText: boolean;
  setLang: (lang: Lang) => void;
  setLargeText: (value: boolean) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const ToastContext = createContext<{
  push: (kind: ToastKind, message: string, title?: string) => void;
} | null>(null);

function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 86_400_000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`;
}

export function AppProviders({
  children,
  initialLang,
  initialLargeText,
}: {
  children: ReactNode;
  initialLang: Lang;
  initialLargeText: boolean;
}) {
  const router = useRouter();
  const [lang, setLangState] = useState<Lang>(normalizeLang(initialLang));
  const [largeText, setLargeTextState] = useState(initialLargeText);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const push = useCallback((kind: ToastKind, message: string, title?: string) => {
    counter.current += 1;
    const id = counter.current;
    setToasts((prev) => [...prev.slice(-3), { id, kind, message, title }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5200);
  }, []);

  const setLang = useCallback(
    (next: Lang) => {
      setLangState(next);
      setCookie(LANG_COOKIE, next);
      document.documentElement.lang = next === "hi" ? "hi" : "en";
      void fetch("/api/prefs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: next, largeText }),
      }).catch(() => undefined);
      router.refresh();
    },
    [largeText, router],
  );

  const setLargeText = useCallback(
    (value: boolean) => {
      setLargeTextState(value);
      setCookie(LARGE_TEXT_COOKIE, value ? "1" : "0");
      document.documentElement.classList.toggle("large-text", value);
      void fetch("/api/prefs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: lang, largeText: value }),
      }).catch(() => undefined);
      router.refresh();
    },
    [lang, router],
  );

  useEffect(() => {
    document.documentElement.classList.toggle("large-text", initialLargeText);
  }, [initialLargeText]);

  const languageValue = useMemo<LanguageContextValue>(
    () => ({
      lang,
      largeText,
      setLang,
      setLargeText,
      t: (key, vars) => translate(lang, key, vars),
    }),
    [lang, largeText, setLang, setLargeText],
  );

  return (
    <LanguageContext.Provider value={languageValue}>
      <ToastContext.Provider value={{ push }}>
        {children}
        <div
          className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-end gap-3 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[380px]"
          aria-live="polite"
          aria-atomic="false"
        >
          {toasts.map((toast) => (
            <ToastCard
              key={toast.id}
              toast={toast}
              onClose={() =>
                setToasts((prev) => prev.filter((item) => item.id !== toast.id))
              }
            />
          ))}
        </div>
      </ToastContext.Provider>
    </LanguageContext.Provider>
  );
}

function ToastCard({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const Icon =
    toast.kind === "success" ? CheckCircle2 : toast.kind === "error" ? XCircle : Info;
  const tone =
    toast.kind === "success"
      ? "text-emerald-300 border-emerald-400/25 bg-emerald-500/[0.08]"
      : toast.kind === "error"
        ? "text-rose-300 border-rose-400/25 bg-rose-500/[0.08]"
        : "text-cyan-300 border-cyan-400/25 bg-cyan-500/[0.08]";
  return (
    <div
      role="status"
      className="pointer-events-auto w-full animate-fade-up rounded-2xl border border-white/10 bg-ink-900/95 p-4 shadow-panel backdrop-blur-xl"
    >
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl border ${tone}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          {toast.title ? (
            <p className="text-sm font-semibold text-white">{toast.title}</p>
          ) : null}
          <p className="text-sm leading-relaxed text-slate-300">{toast.message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside AppProviders");
  return context;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside AppProviders");
  return context;
}
