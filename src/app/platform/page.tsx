"use client";

import { authClient, useSession, signOut } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { PlusIcon, CopyIcon, CheckIcon } from "lucide-react";
import { env } from "@/env";

interface ApiKey {
  id: string;
  name: string | null;
  start: string | null;
  createdAt: Date;
  lastRequest: Date | null;
}

export default function PlatformPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    const { data } = await authClient.apiKey.list();
    if (data?.apiKeys) {
      setKeys(data.apiKeys);
    }
  }, []);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchKeys();
    }
  }, [session, fetchKeys]);

  if (isPending || !session?.user) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  async function createKey() {
    if (!newKeyName.trim()) return;
    setLoading(true);
    try {
      const { data } = await authClient.apiKey.create({ name: newKeyName });
      if (data?.key) {
        setNewKey(data.key);
        setNewKeyName("");
        setPopoverOpen(false);
        fetchKeys();
      }
    } finally {
      setLoading(false);
    }
  }

  async function deleteKey(id: string) {
    if (deletingId === id) {
      await authClient.apiKey.delete({ keyId: id });
      setDeletingId(null);
      fetchKeys();
    } else {
      setDeletingId(id);
      setTimeout(() => setDeletingId((prev) => (prev === id ? null : prev)), 3000);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 py-8">
      <header className="flex items-center justify-between pb-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg hover:text-muted-foreground"
          aria-label="Ask Purdue Hackers home"
        >
          <Image src="/icon.svg" alt="" width={24} height={24} aria-hidden="true" />
          Ask
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ fetchOptions: { onSuccess: () => router.push("/") } })}
        >
          Sign out
        </Button>
      </header>

      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-base font-medium">API Keys</h2>
          <p className="text-sm text-muted-foreground">
            Use API keys to programmatically query the Ask&nbsp;API.
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Your Keys</CardTitle>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger
                aria-label="Create new API key"
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <PlusIcon className="size-4" aria-hidden="true" />
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72">
                <form
                  className="flex flex-col gap-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    createKey();
                  }}
                >
                  <p className="text-sm font-medium">Create a New Key</p>
                  <label htmlFor="new-key-name" className="sr-only">
                    Key name
                  </label>
                  <input
                    id="new-key-name"
                    className="rounded-md border border-border bg-background px-3 py-2 text-[16px] outline-none placeholder:text-muted-foreground focus:border-foreground sm:text-sm"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g. Discord bot"
                    disabled={loading}
                    autoFocus // oxlint-disable-line eslint-plugin-jsx-a11y/no-autofocus -- popover input
                    autoComplete="off"
                  />
                  <Button type="submit" size="sm" disabled={loading}>
                    {loading ? "Creating…" : "Create"}
                  </Button>
                </form>
              </PopoverContent>
            </Popover>
          </CardHeader>
          <CardContent className="flex flex-col gap-0">
            {newKey && (
              <>
                <div className="rounded-md border border-border bg-muted p-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Copy this key now. You won&apos;t see it again.
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="break-all text-xs font-mono tabular-nums">{newKey}</code>
                    <button
                      type="button"
                      aria-label={copied ? "Copied" : "Copy API key"}
                      className="shrink-0 cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      onClick={() => {
                        navigator.clipboard.writeText(newKey);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                    >
                      {copied ? (
                        <CheckIcon className="size-3.5" aria-hidden="true" />
                      ) : (
                        <CopyIcon className="size-3.5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
                <Separator className="my-3" />
              </>
            )}

            {keys.length === 0 ? (
              <p className="py-3 text-center text-sm text-muted-foreground">
                No keys yet. Click + to create one.
              </p>
            ) : (
              keys.map((key, i) => (
                <div key={key.id}>
                  {i > 0 && <Separator />}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{key.name ?? "Unnamed"}</span>
                      {key.start && (
                        <span className="font-mono text-xs tabular-nums text-muted-foreground">
                          {key.start}…
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {key.lastRequest && (
                        <span className="text-xs text-muted-foreground">
                          Last used{" "}
                          {new Intl.DateTimeFormat(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }).format(new Date(key.lastRequest))}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className={
                          deletingId === key.id
                            ? "text-destructive hover:text-destructive"
                            : "text-muted-foreground hover:text-destructive"
                        }
                        onClick={() => deleteKey(key.id)}
                      >
                        {deletingId === key.id ? "Confirm?" : "Delete"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">REST API</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs tabular-nums">
              {`curl -X POST ${env.NEXT_PUBLIC_APP_URL}/api/query \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "What is Purdue Hackers?"}'`}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">MCP Server</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Connect from Claude Desktop, Cursor, or any MCP client. Add this to your MCP config:
            </p>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs tabular-nums">
              {`{
  "mcpServers": {
    "purduehackers_docs": {
      "url": "${env.NEXT_PUBLIC_APP_URL}/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}`}
            </pre>
            <p className="text-sm text-muted-foreground">
              Exposes an{" "}
              <code className="rounded bg-muted-foreground/10 px-1 py-0.5 font-mono text-xs">
                ask
              </code>{" "}
              tool that searches the Purdue Hackers Notion workspace.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
