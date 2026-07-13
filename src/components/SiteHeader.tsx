import Link from "next/link";
import { Logo } from "./Logo";

export function SiteHeader({
  ctaHref = "/signup",
  ctaLabel = "Get started",
}: {
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
      <Logo />
      <nav className="hidden items-center gap-6 text-sm font-medium text-gray-600 sm:flex">
        <Link href="/for-transit" className="hover:text-brand-700">
          For transit
        </Link>
        <Link href="/for-employers" className="hover:text-brand-700">
          For employers
        </Link>
        <Link href="/join/gotriangle" className="hover:text-brand-700">
          Join pilot
        </Link>
      </nav>
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Sign in
        </Link>
        <Link
          href={ctaHref}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          {ctaLabel}
        </Link>
      </div>
    </header>
  );
}
