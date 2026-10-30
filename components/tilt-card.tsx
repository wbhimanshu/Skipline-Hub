"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function TiltCard({
  children,
  className,
  max = 5,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer.matches || reduceMotion.matches) return;

    let frame = 0;
    let rect: DOMRect | null = null;
    let resetTimer: number | undefined;
    let rotateX = 0;
    let rotateY = 0;

    const paint = () => {
      frame = 0;
      node.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const onEnter = () => {
      rect = node.getBoundingClientRect();
      node.style.willChange = "transform";
      node.style.transition = "transform 140ms ease-out";
    };

    const onMove = (event: PointerEvent) => {
      if (!rect) rect = node.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      rotateY = x * max * 2;
      rotateX = -y * max * 2;
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const onLeave = () => {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      rect = null;
      rotateX = 0;
      rotateY = 0;
      node.style.transition = "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)";
      node.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg)";
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        node.style.willChange = "auto";
      }, 720);
    };

    node.addEventListener("pointerenter", onEnter);
    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerleave", onLeave);
    node.addEventListener("pointercancel", onLeave);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(resetTimer);
      node.removeEventListener("pointerenter", onEnter);
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
      node.removeEventListener("pointercancel", onLeave);
    };
  }, [max]);

  return (
    <div ref={ref} className={cn("tilt", className)}>
      {children}
    </div>
  );
}
