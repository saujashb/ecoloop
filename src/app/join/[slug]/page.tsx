import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { getActiveProgram, getOrganizationBySlug } from "@/lib/organizations";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const org = await getOrganizationBySlug(slug);
  if (!org) notFound();

  const program = await getActiveProgram(org.id);
  const isTransit = org.type === "transit_agency";

  return (
    <main className="min-h-dvh bg-white">
      <SiteHeader
        ctaHref={`/signup?org=${org.slug}`}
        ctaLabel="Enroll now"
      />

      <section className="bg-gradient-to-b from-emerald-50 to-white px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
            {isTransit ? "Transit partner program" : "Employer program"}
          </p>
          <h1 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
            Join {org.name}&apos;s commute program
          </h1>
          {program && (
            <p className="mt-4 text-lg text-gray-600">{program.name}</p>
          )}
          {org.description && (
            <p className="mx-auto mt-4 max-w-lg text-gray-600">{org.description}</p>
          )}
          <Link
            href={`/signup?org=${org.slug}`}
            className="mt-8 inline-block rounded-xl bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Create your account
          </Link>
          <p className="mt-4 text-sm text-gray-500">
            Already enrolled?{" "}
            <Link href="/login" className="font-medium text-emerald-700 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Set schedule once", "Origin, destination, and arrival window for the whole season."],
            ["Get matched", "Paired with a driver already on your corridor — zero detours."],
            ["Ride daily", "Recurring commute buddy, flat fare, program-tracked impact."],
          ].map(([title, desc]) => (
            <div
              key={title}
              className="rounded-xl border border-gray-200 bg-white p-5 text-center"
            >
              <p className="font-semibold text-gray-900">{title}</p>
              <p className="mt-2 text-sm text-gray-600">{desc}</p>
            </div>
          ))}
        </div>
        {isTransit && (
          <p className="mt-8 text-center text-sm text-gray-500">
            Program impact is reported to {org.name} — rides completed, miles shared,
            and solo-vehicle trips avoided.
          </p>
        )}
      </section>
    </main>
  );
}
