"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const reference = error.digest ?? "unknown";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-semibold text-gray-900">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-gray-600">
        We could not complete that request. Please try again.
      </p>
      <p className="mt-4 font-mono text-xs text-gray-400">Reference: {reference}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        Try again
      </button>
    </main>
  );
}
