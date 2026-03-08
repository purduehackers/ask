import Image from "next/image";
import Link from "next/link";
import { SignOutButton } from "./sign-out-button";

export function Header({
  user,
  chatId,
}: {
  user?: { name?: string; id?: string } | null;
  chatId?: string;
}) {
  return (
    <header className="flex items-center justify-between pb-6">
      <Link
        href="/"
        className="flex items-center gap-2 font-display text-xl"
        aria-label="Ask Purdue Hackers home"
      >
        <Image src="/icon.svg" alt="" width={24} height={24} aria-hidden="true" />
        <span className="mt-2px">Ask</span>
      </Link>
      <nav aria-label="Main navigation" className="flex items-center gap-3">
        {user ? (
          <>
            <Link
              href="/platform"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Platform
            </Link>
            <SignOutButton />
          </>
        ) : (
          <Link
            href={`/login${chatId ? `?redirect=/c/${chatId}` : ""}`}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
