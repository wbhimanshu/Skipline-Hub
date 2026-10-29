import { createElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "article" | "li";
}) {
  return createElement(
    Tag,
    {
      className: cn("reveal", className),
      style: delay ? { animationDelay: `${delay}ms` } : undefined,
    },
    children,
  );
}
