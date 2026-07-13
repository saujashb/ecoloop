import { requireUser } from "@/lib/auth";
import { logout, updateProfile, updateSchedule } from "@/lib/actions";
import { DeleteAccountForm } from "@/components/DeleteAccountForm";
import { DAY_LABELS } from "@/lib/days";

export const dynamic = "force-dynamic";

const inputCls =
  "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{user.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {user.email}
            {user.verified && (
              <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-medium text-brand-800">
                Verified {user.emailDomain.endsWith(".edu") ? "student" : "professional"}
              </span>
            )}
          </p>
        </div>
        <form action={logout}>
          <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100">
            Sign out
          </button>
        </form>
      </div>

      {/* Profile */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Profile
        </h2>
        <form action={updateProfile} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input name="name" defaultValue={user.name} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <input
              name="bio"
              defaultValue={user.bio ?? ""}
              placeholder='e.g., "UT Austin intern at Cisco"'
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Venmo handle
            </label>
            <input
              name="venmoHandle"
              defaultValue={user.venmoHandle ?? ""}
              placeholder="your-venmo"
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Emergency contact
              </label>
              <input
                name="emergencyName"
                defaultValue={user.emergencyName ?? ""}
                placeholder="Name"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Their phone</label>
              <input
                name="emergencyPhone"
                defaultValue={user.emergencyPhone ?? ""}
                placeholder="(555) 555-5555"
                className={inputCls}
              />
            </div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="prefQuietRide"
                defaultChecked={user.prefQuietRide}
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              Prefer a quiet ride
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="prefMusicOk"
                defaultChecked={user.prefMusicOk}
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              Music is okay
            </label>
          </div>
          <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700">
            Save profile
          </button>
        </form>
      </section>

      {/* Schedules */}
      {user.schedules.map((s) => (
        <section key={s.id} className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            {s.type === "driver" ? "Driving schedule" : "Riding schedule"}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {s.originLabel} → {s.destLabel}
          </p>
          <form action={updateSchedule} className="mt-4 space-y-4">
            <input type="hidden" name="scheduleId" value={s.id} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Arrive no earlier than
                </label>
                <input
                  type="time"
                  name="arriveStart"
                  defaultValue={s.arriveStart}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Arrive no later than
                </label>
                <input
                  type="time"
                  name="arriveEnd"
                  defaultValue={s.arriveEnd}
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-700">Days</span>
              <div className="mt-2 flex flex-wrap gap-3">
                {DAY_LABELS.map((label, i) => (
                  <label key={label} className="flex items-center gap-1.5 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      name={`day${i}`}
                      defaultChecked={Boolean(s.days & (1 << i))}
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            {s.type === "driver" && (
              <div className="max-w-[10rem]">
                <label className="block text-sm font-medium text-gray-700">Seats</label>
                <select name="seats" defaultValue={s.seats} className={inputCls}>
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700">
              Save schedule
            </button>
          </form>
        </section>
      ))}
      <section className="rounded-xl border border-red-200 bg-red-50/50 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-red-700">
          Delete account
        </h2>
        <p className="mt-2 text-sm text-red-800">
          Permanently remove your profile, schedules, matches, messages, and ride
          history. This cannot be undone.
        </p>
        <DeleteAccountForm />
      </section>
    </div>
  );
}
