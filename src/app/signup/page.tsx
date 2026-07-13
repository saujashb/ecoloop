import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";
import { getActiveProgram, getOrganizationBySlug } from "@/lib/organizations";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(user.onboarded ? "/dashboard" : "/onboarding");

  const { org: orgSlug } = await searchParams;
  const organization = orgSlug ? await getOrganizationBySlug(orgSlug) : null;
  const program =
    organization ? await getActiveProgram(organization.id) : null;

  return (
    <AuthForm
      mode="signup"
      orgSlug={organization?.slug}
      orgName={organization?.name}
      programName={program?.name}
    />
  );
}
