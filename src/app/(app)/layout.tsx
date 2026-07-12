import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { BottomNav, TopNav } from "@/components/BottomNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  if (!user.onboarded) redirect("/onboarding");

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Logo href="/dashboard" />
          <TopNav />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-6 sm:pb-12">{children}</main>
      <BottomNav />
    </div>
  );
}
