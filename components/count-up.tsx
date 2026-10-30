"use client";

import { useEffect, useRef, type CSSProperties } from "react";

const formatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export function CountUp({
  value,
  duration = 1300,
  suffix = "",
  className,
  style,
}: {
  value: number;
  duration?: number;
  suffix?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const finalText = `${formatter.format(value)}${suffix}`;
    node.textContent = finalText;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches || value === 0 || typeof IntersectionObserver === "undefined") {
      return;
    }

    let frame = 0;
    let started = false;

    const observer = new IntersectionObserver(
      (entries) => {
        if (started || !entries.some((entry) => entry.isIntersecting)) return;
        started = true;
        observer.disconnect();

        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - progress, 3);
          node.textContent = `${formatter.format(Math.round(value * eased))}${suffix}`;
          if (progress < 1) frame = requestAnimationFrame(tick);
        };

        node.textContent = `${formatter.format(0)}${suffix}`;
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.35 },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [value, duration, suffix]);

  return (
    <span ref={ref} className={className} style={style} aria-label={`${formatter.format(value)}${suffix}`}>
      {`${formatter.format(value)}${suffix}`}
    </span>
  );
}
