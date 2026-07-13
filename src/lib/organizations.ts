import { prisma } from "./db";

export type OrganizationPublic = {
  id: string;
  slug: string;
  name: string;
  type: string;
  description: string | null;
  region: string | null;
  website: string | null;
};

export async function getOrganizationBySlug(
  slug: string
): Promise<OrganizationPublic | null> {
  const org = await prisma.organization.findFirst({
    where: { slug, active: true },
    select: {
      id: true,
      slug: true,
      name: true,
      type: true,
      description: true,
      region: true,
      website: true,
    },
  });
  return org;
}

export async function getActiveProgram(organizationId: string) {
  return prisma.program.findFirst({
    where: { organizationId, status: { in: ["active", "pilot"] } },
    orderBy: { createdAt: "desc" },
  });
}

export async function enrollUserInOrganization(
  userId: string,
  organizationId: string,
  programId?: string | null
) {
  const existing = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });
  if (existing) return existing;

  return prisma.organizationMember.create({
    data: {
      userId,
      organizationId,
      programId: programId ?? null,
      role: "commuter",
    },
  });
}

export async function enrollUserByOrgSlug(userId: string, orgSlug: string) {
  const org = await getOrganizationBySlug(orgSlug);
  if (!org) return null;
  const program = await getActiveProgram(org.id);
  return enrollUserInOrganization(userId, org.id, program?.id);
}

export async function getUserOrganizations(userId: string) {
  return prisma.organizationMember.findMany({
    where: { userId },
    include: {
      organization: {
        select: { slug: true, name: true, type: true },
      },
      program: {
        select: { slug: true, name: true },
      },
    },
  });
}
