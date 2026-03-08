"use client";

import { useState } from "react";
import type { UIMessage } from "ai";
import { isToolUIPart } from "ai";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Reasoning, ReasoningTrigger, ReasoningContent } from "@/components/ai-elements/reasoning";
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import {
  SearchIcon,
  FolderOpenIcon,
  FileTextIcon,
  TerminalIcon,
  LoaderIcon,
  CopyIcon,
  CheckIcon,
} from "lucide-react";

export function MessageParts({
  message,
  isLastMessage,
  isStreaming,
}: {
  message: UIMessage;
  isLastMessage: boolean;
  isStreaming: boolean;
}) {
  const reasoningParts = message.parts.filter((p) => p.type === "reasoning");
  const reasoningText = reasoningParts.map((p) => p.text).join("\n\n");

  const lastPart = message.parts.at(-1);
  const isReasoningStreaming = isLastMessage && isStreaming && lastPart?.type === "reasoning";

  const toolParts = message.parts.filter(isToolUIPart);
  const hasTextOutput = message.parts.some((p) => p.type === "text");
  const isActiveMessage = isLastMessage && isStreaming;

  return (
    <>
      {reasoningParts.length > 0 && (
        <Reasoning className="w-full" isStreaming={isReasoningStreaming}>
          <ReasoningTrigger />
          <ReasoningContent>{reasoningText}</ReasoningContent>
        </Reasoning>
      )}
      {toolParts.length > 0 && (
        <ToolSteps
          toolParts={toolParts}
          isActiveMessage={isActiveMessage}
          hasTextOutput={hasTextOutput}
          messageId={message.id}
        />
      )}
      {message.parts.map((part, i) => {
        if (part.type === "text") {
          return <MessageResponse key={`${message.id}-${i}`}>{part.text}</MessageResponse>;
        }
        return null;
      })}
    </>
  );
}

function getStepInfo(part: { type: string; input?: unknown; state?: string }) {
  const input = (part as { input?: Record<string, unknown> }).input;

  if (input?.command && typeof input.command === "string") {
    const cmd = input.command;
    if (cmd.startsWith("find ") || cmd.startsWith("ls "))
      return { label: "Browsing files", description: cmd, icon: FolderOpenIcon };
    if (cmd.startsWith("grep ") || cmd.startsWith("rg "))
      return { label: "Searching", description: cmd, icon: SearchIcon };
    if (cmd.startsWith("cat ") || cmd.startsWith("head ") || cmd.startsWith("tail "))
      return { label: "Reading file", description: cmd, icon: FileTextIcon };
    return { label: "Running command", description: cmd, icon: TerminalIcon };
  }

  if (input?.path && typeof input.path === "string")
    return { label: "Reading file", description: input.path, icon: FileTextIcon };

  if (part.state === "input-streaming" || part.state === "input-available")
    return { label: "Working…", description: undefined, icon: LoaderIcon };

  return { label: "Processing", description: undefined, icon: TerminalIcon };
}

function ToolSteps({
  toolParts,
  isActiveMessage,
  hasTextOutput,
  messageId,
}: {
  toolParts: { type: string; input?: unknown; state: string }[];
  isActiveMessage: boolean;
  hasTextOutput: boolean;
  messageId: string;
}) {
  const shouldBeOpen = isActiveMessage && !hasTextOutput;
  const [userOpen, setUserOpen] = useState<boolean | null>(null);
  const isOpen = userOpen ?? shouldBeOpen;

  return (
    <ChainOfThought open={isOpen} onOpenChange={setUserOpen}>
      <ChainOfThoughtHeader>
        {isActiveMessage ? "Searching knowledge base…" : `Searched ${toolParts.length} sources`}
      </ChainOfThoughtHeader>
      <ChainOfThoughtContent>
        {toolParts.map((part, i) => {
          const { label, description, icon } = getStepInfo(part);
          let status: "complete" | "active" | "pending" = "pending";
          if (part.state === "output-available" || part.state === "output-error") {
            status = "complete";
          } else if (part.state === "input-available") {
            status = "active";
          }
          return (
            <ChainOfThoughtStep
              key={`${messageId}-tool-${i}`}
              icon={icon}
              label={label}
              description={description}
              status={status}
            />
          );
        })}
      </ChainOfThoughtContent>
    </ChainOfThought>
  );
}

export function ChatMessageList({
  messages,
  isStreaming,
  error,
}: {
  messages: UIMessage[];
  isStreaming: boolean;
  error: Error | undefined;
}) {
  return (
    <div className="flex flex-col gap-6 pb-24">
      {messages.map((message, index) => (
        <Message
          from={message.role}
          key={message.id}
          className={message.role === "assistant" ? "max-w-full" : ""}
        >
          <MessageContent className={message.role === "assistant" ? "w-full" : ""}>
            <MessageParts
              message={message}
              isLastMessage={index === messages.length - 1}
              isStreaming={isStreaming}
            />
          </MessageContent>
        </Message>
      ))}

      {error && !error.message?.includes("Rate limit") && (
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}

export function CopyMarkdownButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="cursor-pointer flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      {copied ? <CheckIcon className="size-3" /> : <CopyIcon className="size-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
