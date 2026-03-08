"use client";

import { useChat } from "@ai-sdk/react";
import { WorkflowChatTransport } from "@workflow/ai";
import { useState, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import Link from "next/link";
import type { UIMessage } from "ai";
import { SearchBar } from "@/components/search-bar";
import { ScrambleText } from "@/components/scramble-text";
import { ChatMessageList, CopyMarkdownButton } from "@/components/chat-messages";

export function ChatUI({
  chatId: initialChatId,
  initialMessages,
  ownerId,
  ownerName,
  workflowRunId: serverWorkflowRunId,
  initialTitle,
  user,
}: {
  chatId?: string;
  initialMessages?: UIMessage[];
  ownerId?: string | null;
  ownerName?: string;
  workflowRunId?: string;
  initialTitle?: string;
  user?: { name?: string; id?: string } | null;
}) {
  const [input, setInput] = useState("");
  const [chatId] = useState(() => initialChatId ?? nanoid(12));
  const [title, setTitle] = useState(initialTitle);
  const hasRedirected = useRef(!!initialChatId);
  const hasFetchedTitle = useRef(!!initialTitle);

  const activeRunId = useMemo(() => {
    if (typeof window === "undefined") return serverWorkflowRunId;
    const stored = localStorage.getItem(`workflow-run:${chatId}`);
    if (stored) return stored;
    if (serverWorkflowRunId) {
      localStorage.setItem(`workflow-run:${chatId}`, serverWorkflowRunId);
      return serverWorkflowRunId;
    }
    return undefined;
  }, [chatId, serverWorkflowRunId]);

  const transport = useMemo(
    () =>
      new WorkflowChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest({ messages, headers, credentials, api }) {
          return { api, headers, credentials, body: { id: chatId, messages } };
        },
        onChatSendMessage(response) {
          const runId = response.headers.get("x-workflow-run-id");
          if (runId) localStorage.setItem(`workflow-run:${chatId}`, runId);
        },
        onChatEnd() {
          localStorage.removeItem(`workflow-run:${chatId}`);
        },
        prepareReconnectToStreamRequest({ api: _api, ...rest }) {
          const runId = localStorage.getItem(`workflow-run:${chatId}`);
          if (!runId) throw new Error("No active workflow run ID found");
          return { ...rest, api: `/api/chat/${encodeURIComponent(runId)}/stream` };
        },
      }),
    [chatId],
  );

  const { messages, sendMessage, status, error } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
    resume: Boolean(activeRunId),
    onError(error) {
      if (error.message?.includes("Rate limit")) {
        toast.error("You've hit the rate limit. Sign in for more questions.");
      }
      if (error.message?.includes("Sign in to continue")) {
        toast.error("Sign in to continue this conversation.");
      }
    },
    onFinish({ messages: allMessages }) {
      fetch("/api/chat/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: chatId, messages: allMessages }),
      });

      if (!hasFetchedTitle.current) {
        hasFetchedTitle.current = true;
        const firstUserMessage = allMessages.find((m) => m.role === "user");
        if (firstUserMessage) {
          const text = firstUserMessage.parts
            .filter((p) => p.type === "text")
            .map((p) => p.text)
            .join(" ");
          fetch("/api/chat/title", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: chatId, message: text }),
          })
            .then((r) => r.json())
            .then((data) => {
              if (data.title) {
                setTitle(data.title);
                document.title = `${data.title} | Ask Purdue Hackers`;
              }
            });
        }
      }
    },
  });

  const isStreaming = status === "streaming";
  const hasResult = messages.length > 0;

  // Timer: counts up while streaming
  const streamStartTime = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);

  useEffect(() => {
    if (!isStreaming) {
      streamStartTime.current = null;
      return;
    }
    if (!streamStartTime.current) streamStartTime.current = Date.now();
    const start = streamStartTime.current;
    const tick = () => setElapsed((Date.now() - start) / 1000);
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [isStreaming]);

  // Update URL to /c/<id> when streaming starts
  useEffect(() => {
    if (isStreaming && !hasRedirected.current) {
      hasRedirected.current = true;
      window.history.replaceState(null, "", `/c/${chatId}`);
    }
  }, [isStreaming, chatId]);

  // Set document title
  useEffect(() => {
    if (title) {
      document.title = `${title} | Ask Purdue Hackers`;
    }
  }, [title]);

  const firstAssistantMarkdown = useMemo(() => {
    const msg = messages.find((m) => m.role === "assistant");
    if (!msg) return null;
    return msg.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("\n\n");
  }, [messages]);

  const showCopyButton = !isStreaming && hasResult && firstAssistantMarkdown;
  const isAnonLocked = !user && hasResult && messages.length > 1 && !isStreaming;
  const isReadOnly = ownerId !== undefined && ownerId !== null && user?.id !== ownerId;

  function handleSubmit() {
    if (!input.trim() || isStreaming) return;
    sendMessage({ text: input });
    setInput("");
  }

  if (!hasResult) {
    return (
      <div className="flex flex-1 flex-col items-center justify-start gap-6 pt-[30vh]">
        <h2 className="font-display text-center text-2xl text-foreground">
          {user
            ? `Hello, ${user.name?.split(" ")[0]}! What do you want to know?`
            : "What do you want to know?"}
        </h2>
        <SearchBar
          input={input}
          setInput={setInput}
          isStreaming={isStreaming}
          onSubmit={handleSubmit}
        />
      </div>
    );
  }

  return (
    <>
      {title && (
        <div className="mb-6">
          <h1 className="font-display text-2xl text-foreground">
            <ScrambleText text={title} />
          </h1>
          {isReadOnly && ownerName && (
            <p className="mt-1 text-sm text-muted-foreground">Asked by {ownerName}</p>
          )}
        </div>
      )}
      <ChatMessageList messages={messages} isStreaming={isStreaming} error={error} />

      <div className="fixed inset-x-0 bottom-0 bg-linear-to-t from-background from-60% to-transparent pb-4 pt-8">
        <div className="mx-auto max-w-2xl px-4">
          {(elapsed !== null || showCopyButton) && (
            <div className="mb-2 flex items-center justify-end gap-3">
              {showCopyButton && <CopyMarkdownButton text={firstAssistantMarkdown} />}
              {elapsed !== null && (
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {elapsed.toFixed(1)}s
                </span>
              )}
            </div>
          )}
          <BottomBar
            isAnonLocked={isAnonLocked}
            isReadOnly={isReadOnly}
            chatId={chatId}
            input={input}
            setInput={setInput}
            isStreaming={isStreaming}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </>
  );
}

function BottomBar({
  isAnonLocked,
  isReadOnly,
  chatId,
  input,
  setInput,
  isStreaming,
  onSubmit,
}: {
  isAnonLocked: boolean;
  isReadOnly: boolean;
  chatId: string;
  input: string;
  setInput: (v: string) => void;
  isStreaming: boolean;
  onSubmit: () => void;
}) {
  if (isAnonLocked) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <p className="text-sm text-muted-foreground">Sign in to continue this conversation.</p>
        <Link
          href={`/login?redirect=/c/${chatId}`}
          className="text-sm font-medium text-foreground transition-opacity hover:opacity-80"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (isReadOnly) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border bg-card px-4 py-3">
        <p className="text-sm text-muted-foreground">This is a read-only chat</p>
      </div>
    );
  }

  return (
    <SearchBar input={input} setInput={setInput} isStreaming={isStreaming} onSubmit={onSubmit} />
  );
}
