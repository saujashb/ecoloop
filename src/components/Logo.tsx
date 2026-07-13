import Link from "next/link";

/** Merge-lanes mark: driver corridor with rider joining at zero detour. */
export function CadenceMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M3 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M13 12l4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="17" cy="16" r="1.5" fill="currentColor" />
      <path
        d="M3 8h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold text-brand-900">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-white">
        <CadenceMark className="h-5 w-5" />
      </span>
      <span className="text-lg tracking-tight">Cadence</span>
    </Link>
  );
}
