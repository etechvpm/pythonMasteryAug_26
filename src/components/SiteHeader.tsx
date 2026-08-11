"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenCheck } from "lucide-react";

export function SiteHeader() {
  const pathname = usePathname();
  const hide = pathname.startsWith("/assess/");

  if (hide) return null;

  return (
    <header className="relative z-20 border-b border-white/10 bg-[#07131A]/70 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-400/15 text-teal-300 ring-1 ring-teal-300/30 transition group-hover:bg-teal-400/25">
            <BookOpenCheck className="h-5 w-5" />
          </span>
          <span className="font-[family-name:var(--font-display)] text-lg tracking-tight text-white sm:text-xl">
            Python <span className="text-teal-300">Mastery</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          <Link
            href="/join"
            className="rounded-lg px-3 py-2 text-slate-200 transition hover:bg-white/5 hover:text-white"
          >
            Take test
          </Link>
          <Link
            href="/instructor"
            className="rounded-lg px-3 py-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            Instructor
          </Link>
        </nav>
      </div>
    </header>
  );
}
