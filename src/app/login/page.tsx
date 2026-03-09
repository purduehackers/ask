"use client";

import { Suspense } from "react";
import { authClient, useSession } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

function LoginContent() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";

  useEffect(() => {
    if (session?.user) {
      router.replace(redirectTo);
    }
  }, [session, router, redirectTo]);

  if (isPending) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-xl font-medium">Sign In to Ask</h1>
          <p className="text-sm text-muted-foreground">
            Use your Purdue Hackers passport to sign in.
            <br />
            No passport? Create one{" "}
            <a
              href="https://passports.purduehackers.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-1 hover:text-foreground"
            >
              here
            </a>
            .
          </p>
        </div>
        <Button
          className="w-full"
          onClick={() => {
            authClient.signIn.oauth2({
              providerId: "purduehackers-id",
              callbackURL: redirectTo,
            });
          }}
        >
          Sign In with Passport
        </Button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
