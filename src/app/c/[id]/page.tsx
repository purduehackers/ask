import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getChatMeta, getChatMessages } from "@/lib/chat-store";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/users";
import { Header } from "@/components/header";
import { ChatUI } from "@/components/chat";

export default async function ChatRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [meta, session, messages] = await Promise.all([
    getChatMeta(id),
    getSession(),
    getChatMessages(id),
  ]);
  if (!meta || !messages?.length) notFound();

  let ownerName: string | undefined;
  if (meta.ownerId) {
    const owner = await db.query.users.findFirst({
      where: eq(users.id, meta.ownerId),
      columns: { name: true },
    });
    ownerName = owner?.name;
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 py-8">
      <Header user={session?.user} chatId={id} />
      <ChatUI
        chatId={id}
        initialMessages={messages}
        ownerId={meta.ownerId}
        ownerName={ownerName}
        workflowRunId={meta.workflowRunId ?? undefined}
        initialTitle={meta.title ?? undefined}
        user={session?.user ?? null}
      />
    </div>
  );
}
