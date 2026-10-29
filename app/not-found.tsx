import Link from "next/link";
import { Compass, Home } from "lucide-react";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="container-shell flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <Logo />
      <p className="eyebrow mt-8">404</p>
      <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-white">
        This page took a different queue.
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">
        The page you were looking for doesn&apos;t exist or has moved. Let&apos;s get
        you back to something useful.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">
          <Home className="h-4 w-4" />
          Back home
        </Link>
        <Link href="/centres" className="btn-secondary">
          <Compass className="h-4 w-4" />
          Find a centre
        </Link>
      </div>
    </div>
  );
}
