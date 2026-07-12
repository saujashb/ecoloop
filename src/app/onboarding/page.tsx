import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { OnboardingForm } from "@/components/OnboardingForm";
import { Logo } from "@/components/Logo";

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.onboarded) redirect("/dashboard");

  return (
    <main className="min-h-dvh bg-white">
      <header className="border-b border-gray-100 px-4 py-3">
        <Logo />
      </header>
      <OnboardingForm userName={user.name} />
    </main>
  );
}
