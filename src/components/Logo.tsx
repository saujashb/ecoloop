import Link from "next/link";

export function LeafIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M6 15c0-5.5 4.5-10 12-11-.5 7.5-4 13-11 13-2 0-3.5-.5-4.5-1.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 21c2-4.5 5.5-8 11-10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold text-emerald-800">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-600 text-white">
        <LeafIcon className="h-5 w-5" />
      </span>
      <span className="text-lg tracking-tight">EcoLoop</span>
    </Link>
  );
}
