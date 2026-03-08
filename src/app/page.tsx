import { getSession } from "@/lib/auth/session";
import { Header } from "@/components/header";
import { ChatUI } from "@/components/chat";

export default async function Home() {
  const session = await getSession();

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 py-8">
      <Header user={session?.user} />
      <ChatUI user={session?.user ?? null} />
    </div>
  );
}
