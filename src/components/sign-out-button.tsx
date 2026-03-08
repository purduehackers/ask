"use client";

import { signOut } from "@/lib/auth/client";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ fetchOptions: { onSuccess: () => window.location.reload() } })}
      className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      Sign out
    </button>
  );
}
