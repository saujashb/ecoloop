"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/dashboard",
    label: "Home",
    icon: (
      <path d="M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    href: "/matches",
    label: "Matches",
    icon: (
      <path d="M16 3h5v5M21 3l-7 7M8 21H3v-5M3 21l7-7M8 3H3v5M3 3l7 7M16 21h5v-5M21 21l-7-7" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    href: "/community",
    label: "Community",
    icon: (
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    href: "/impact",
    label: "Impact",
    icon: (
      <path d="M6 15c0-5.5 4.5-10 12-11-.5 7.5-4 13-11 13-2 0-3.5-.5-4.5-1.5M3 21c2-4.5 5.5-8 11-10" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur sm:hidden">
      <div className="mx-auto flex max-w-lg justify-around">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 text-[11px] font-medium ${
                active ? "text-emerald-700" : "text-gray-500"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
                {tab.icon}
              </svg>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function TopNav() {
  const pathname = usePathname();
  return (
    <div className="hidden items-center gap-1 sm:flex">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-emerald-100 text-emerald-800"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
