"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const NAV_ITEMS = [
  { href: "/app/products", label: "Products", matchPrefixes: ["/app/products"] },
  { href: "/app/feed", label: "Feed", matchPrefixes: ["/app/feed", "/app/items"] },
  { href: "/app/search", label: "Search", matchPrefixes: ["/app/search"] },
] as const;

export default function NavLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Item pages carry ?from=products when reached from the Products view —
  // highlight the tab the user actually came from.
  const fromProducts =
    pathname.startsWith("/app/items") && searchParams.get("from") === "products";

  return (
    <nav className="flex items-center gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive = fromProducts
          ? item.href === "/app/products"
          : item.matchPrefixes.some((p) => pathname.startsWith(p));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative px-2 sm:px-3 py-1.5 text-[13px] sm:text-sm font-medium transition-colors duration-100 ${
              isActive
                ? "text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {item.label}
            {isActive && (
              <span className="absolute bottom-0 left-2 right-2 sm:left-3 sm:right-3 h-0.5 bg-amber" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
