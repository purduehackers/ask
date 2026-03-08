"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

export function SearchBar({
  input,
  setInput,
  isStreaming,
  onSubmit,
}: {
  input: string;
  setInput: (v: string) => void;
  isStreaming: boolean;
  onSubmit: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const canSubmit = input.trim().length > 0 && !isStreaming;

  return (
    <form
      className={cn(
        "group flex w-full items-center rounded-xl border bg-card px-4 py-3 transition-colors",
        isStreaming
          ? "cursor-not-allowed border-border/50 opacity-60"
          : "cursor-text border-border focus-within:border-muted-foreground",
      )}
      onClick={() => !isStreaming && inputRef.current?.focus()} // oxlint-disable-line eslint-plugin-jsx-a11y/click-events-have-key-events -- form already handles keyboard via onSubmit
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <label htmlFor="search-input" className="sr-only">
        Ask a question
      </label>
      <input
        ref={inputRef}
        id="search-input"
        className="flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed sm:text-sm"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={isStreaming ? "Generating response…" : "What is Purdue Hackers…"}
        disabled={isStreaming}
        autoFocus // oxlint-disable-line eslint-plugin-jsx-a11y/no-autofocus -- primary input
        autoComplete="off"
        spellCheck={false}
      />
      <button
        type="submit"
        disabled={!canSubmit}
        aria-label="Submit question"
        className="ml-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-foreground text-background transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-20"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M3 8h10m-4-4 4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </form>
  );
}
