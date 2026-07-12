"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { completeOnboarding, type OnboardingPayload } from "@/lib/actions";
import type { PickedLocation } from "./LocationPicker";
import { DAY_LABELS, WEEKDAYS_MASK, dayBit } from "@/lib/days";

const LocationPicker = dynamic(() => import("./LocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="grid h-60 place-items-center rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-400">
      Loading map…
    </div>
  ),
});

const STEPS = ["Role", "Home", "Work", "Schedule", "About you"];

type Role = "rider" | "driver" | "both";

export function OnboardingForm({ userName }: { userName: string }) {
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [role, setRole] = useState<Role>("rider");
  const [seats, setSeats] = useState(2);
  const [origin, setOrigin] = useState<PickedLocation | null>(null);
  const [dest, setDest] = useState<PickedLocation | null>(null);
  const [arriveStart, setArriveStart] = useState("08:15");
  const [arriveEnd, setArriveEnd] = useState("08:45");
  const [days, setDays] = useState(WEEKDAYS_MASK);
  const [bio, setBio] = useState("");
  const [prefQuietRide, setPrefQuietRide] = useState(false);
  const [prefMusicOk, setPrefMusicOk] = useState(true);
  const [venmoHandle, setVenmoHandle] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  const isDriver = role === "driver" || role === "both";

  function canAdvance(): boolean {
    if (step === 1) return origin !== null;
    if (step === 2) return dest !== null;
    if (step === 3) return days !== 0 && arriveStart < arriveEnd;
    return true;
  }

  function submit() {
    if (!origin || !dest) return;
    setError(null);
    const payload: OnboardingPayload = {
      role,
      seats,
      origin,
      dest,
      arriveStart,
      arriveEnd,
      days,
      bio,
      prefQuietRide,
      prefMusicOk,
      venmoHandle,
      emergencyName,
      emergencyPhone,
    };
    startTransition(async () => {
      try {
        await completeOnboarding(payload);
      } catch (e) {
        // Next redirect throws — anything else is a real error.
        if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) throw e;
        setError("Something went wrong. Please try again.");
      }
    });
  }

  const inputCls =
    "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-16 pt-8">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-xs font-medium text-gray-500">
          {STEPS.map((s, i) => (
            <span key={s} className={i <= step ? "text-emerald-700" : ""}>
              {s}
            </span>
          ))}
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-gray-200">
          <div
            className="h-1.5 rounded-full bg-emerald-600 transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {step === 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900">
            Hi {userName.split(" ")[0]}! How will you use EcoLoop?
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            You can always change this later.
          </p>
          <div className="mt-6 space-y-3">
            {(
              [
                ["rider", "I need rides", "Match with drivers already going your way."],
                ["driver", "I can offer rides", "Earn on your existing commute — zero detours."],
                ["both", "Both", "Sometimes drive, sometimes ride."],
              ] as [Role, string, string][]
            ).map(([value, title, desc]) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={`w-full rounded-xl border p-4 text-left transition ${
                  role === value
                    ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600"
                    : "border-gray-200 bg-white hover:border-emerald-300"
                }`}
              >
                <span className="block font-medium text-gray-900">{title}</span>
                <span className="mt-0.5 block text-sm text-gray-500">{desc}</span>
              </button>
            ))}
          </div>
          {isDriver && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Seats available for riders
              </label>
              <select
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
                className={inputCls}
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          )}
        </section>
      )}

      {step === 1 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900">Where do you leave from?</h2>
          <p className="mt-1 text-sm text-gray-500">
            Your home or pickup area. Only shown approximately to others.
          </p>
          <div className="mt-4">
            <LocationPicker
              value={origin}
              onChange={setOrigin}
              placeholder="Search your home address or neighborhood"
            />
          </div>
        </section>
      )}

      {step === 2 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900">Where are you headed?</h2>
          <p className="mt-1 text-sm text-gray-500">
            Your office, campus, or workplace area.
          </p>
          <div className="mt-4">
            <LocationPicker
              value={dest}
              onChange={setDest}
              placeholder="Search your workplace (e.g., Cisco RTP)"
            />
          </div>
        </section>
      )}

      {step === 3 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900">Your weekly schedule</h2>
          <p className="mt-1 text-sm text-gray-500">
            Set it once — we match you with people on the same rhythm.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Arrive no earlier than
              </label>
              <input
                type="time"
                value={arriveStart}
                onChange={(e) => setArriveStart(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Arrive no later than
              </label>
              <input
                type="time"
                value={arriveEnd}
                onChange={(e) => setArriveEnd(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <div className="mt-5">
            <span className="block text-sm font-medium text-gray-700">Days</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {DAY_LABELS.map((label, i) => {
                const active = Boolean(days & dayBit(i));
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setDays((d) => d ^ dayBit(i))}
                    className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                      active
                        ? "bg-emerald-600 text-white"
                        : "bg-white text-gray-600 ring-1 ring-gray-300 hover:ring-emerald-400"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {step === 4 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900">A little about you</h2>
          <p className="mt-1 text-sm text-gray-500">
            Icebreaker bios build trust — and better matches.
          </p>
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Short bio</label>
              <input
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder='e.g., "UT Austin intern at Cisco"'
                className={inputCls}
              />
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={prefQuietRide}
                  onChange={(e) => setPrefQuietRide(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                Prefer a quiet ride
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={prefMusicOk}
                  onChange={(e) => setPrefMusicOk(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                Music is okay
              </label>
            </div>
            {isDriver && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Venmo handle <span className="text-gray-400">(riders pay you directly)</span>
                </label>
                <input
                  value={venmoHandle}
                  onChange={(e) => setVenmoHandle(e.target.value.replace(/^@/, ""))}
                  placeholder="your-venmo"
                  className={inputCls}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Emergency contact
                </label>
                <input
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="Name"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Their phone</label>
                <input
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="(555) 555-5555"
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || pending}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:invisible"
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance()}
            className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {pending ? "Finding matches…" : "Finish & find matches"}
          </button>
        )}
      </div>
    </div>
  );
}
