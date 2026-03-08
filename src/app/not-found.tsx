import Link from "next/link";
import { Logomark } from "@/components/logomark";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <Logomark size={40} />
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-2xl text-foreground">Page not found</h1>
          <p className="text-sm text-muted-foreground">
            This page doesn&#39;t exist or the chat has expired.
          </p>
        </div>
        <Link
          href="/"
          className="text-sm font-medium text-foreground transition-opacity hover:opacity-80"
        >
          Ask a question
        </Link>
      </div>
    </div>
  );
}
