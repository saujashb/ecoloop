import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMessage } from "@/lib/actions";
import { messageSenderSelect, publicUserSelect } from "@/lib/user-select";
import { AutoRefresh } from "@/components/AutoRefresh";
import { formatTime } from "@/lib/days";

export const dynamic = "force-dynamic";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const user = await requireUser();

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      riderSchedule: { include: { user: { select: publicUserSelect } } },
      driverSchedule: { include: { user: { select: publicUserSelect } } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: messageSenderSelect } },
      },
    },
  });

  if (
    !match ||
    (match.riderSchedule.userId !== user.id &&
      match.driverSchedule.userId !== user.id)
  ) {
    notFound();
  }

  const iAmRider = match.riderSchedule.userId === user.id;
  const other = iAmRider ? match.driverSchedule.user : match.riderSchedule.user;

  return (
    <div className="flex min-h-[70dvh] flex-col">
      <AutoRefresh />
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div>
          <Link href="/matches" className="text-xs text-brand-700 hover:underline">
            ← Back to matches
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">{other.name}</h1>
          <p className="text-xs text-gray-500">
            Arrives {formatTime(match.riderSchedule.arriveStart)}–
            {formatTime(match.riderSchedule.arriveEnd)} ·{" "}
            {match.riderSchedule.originLabel} → {match.riderSchedule.destLabel}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto py-4">
        {match.messages.length === 0 && (
          <p className="pt-8 text-center text-sm text-gray-400">
            Say hi and coordinate your first pickup. Prefer WhatsApp or Signal?
            Share your number here and move the conversation over.
          </p>
        )}
        {match.messages.map((msg) => {
          const mine = msg.senderId === user.id;
          return (
            <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  mine
                    ? "rounded-br-sm bg-brand-600 text-white"
                    : "rounded-bl-sm bg-gray-100 text-gray-900"
                }`}
              >
                {!mine && (
                  <p className="mb-0.5 text-[11px] font-semibold text-gray-500">
                    {msg.sender.name.split(" ")[0]}
                  </p>
                )}
                <p>{msg.body}</p>
                <p
                  className={`mt-1 text-right text-[10px] ${
                    mine ? "text-brand-100" : "text-gray-400"
                  }`}
                >
                  {msg.createdAt.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form
        action={sendMessage}
        className="sticky bottom-20 flex gap-2 border-t border-gray-200 bg-background pt-3 sm:bottom-4"
      >
        <input type="hidden" name="matchId" value={match.id} />
        <input
          name="body"
          required
          autoComplete="off"
          placeholder={`Message ${other.name.split(" ")[0]}…`}
          className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700">
          Send
        </button>
      </form>
    </div>
  );
}
