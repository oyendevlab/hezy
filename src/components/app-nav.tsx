"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActive } from "@/lib/nav";
import { NavIcon } from "./icons";
import { Logo } from "./logo";

/** Bar atas untuk tablet dan desktop (≥ 768 px). */
export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="border-line hidden border-b md:block">
      <div className="mx-auto flex max-w-[1200px] items-center gap-3 px-10 py-5">
        <Link
          href="/"
          className="font-display flex items-center gap-2.5 text-[28px] font-extrabold tracking-tight"
        >
          <Logo size={36} />
          Hezy
        </Link>
        <nav
          aria-label="Navigasi utama"
          className="bg-surface ml-auto flex gap-1 rounded-full p-1"
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-10 items-center rounded-full px-4 text-sm font-semibold ${
                  active ? "bg-ink text-page" : "text-ink hover:bg-line"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

/** Bar bawah untuk telefon (< 768 px). */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama"
      className="border-line bg-page fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t px-3 pt-1.5 pb-[max(env(safe-area-inset-bottom),12px)] md:hidden"
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-[52px] flex-col items-center justify-center gap-1 text-xs ${
              active ? "text-ink font-bold" : "text-muted font-medium"
            }`}
          >
            <NavIcon name={item.icon} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
