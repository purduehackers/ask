"use client";

import { useState, useEffect } from "react";

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
const TOTAL_DURATION = 600;
const MAX_STAGGER = 40;
const SETTLE_OFFSET = 120;
const TICK_INTERVAL = 30;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  // oxlint-disable-next-line @factory/no-use-effect-in-hooks -- listens for OS-level motion preference changes
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return reduced;
}

function useScrambleText(text: string) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [displayed, setDisplayed] = useState(() =>
    prefersReducedMotion || !text ? text : "\u00A0".repeat(text.length),
  );

  // oxlint-disable-next-line @factory/no-use-effect-in-hooks -- effect is core to this hook's purpose
  useEffect(() => {
    if (!text || prefersReducedMotion) {
      setDisplayed(text);
      return;
    }

    const chars = text.split("");
    const staggerPerChar = Math.min(TOTAL_DURATION / chars.length, MAX_STAGGER);
    const settledAt = chars.map((_, i) => Date.now() + staggerPerChar * i + SETTLE_OFFSET);
    const endTime = Date.now() + TOTAL_DURATION + SETTLE_OFFSET;

    const frame = setInterval(() => {
      const now = Date.now();
      setDisplayed(
        chars
          .map((char, i) => {
            if (char === " ") return " ";
            if (now >= settledAt[i]) return char;
            return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          })
          .join(""),
      );

      if (now >= endTime) {
        clearInterval(frame);
        setDisplayed(text);
      }
    }, TICK_INTERVAL);

    return () => clearInterval(frame);
  }, [text, prefersReducedMotion]);

  return displayed;
}

export function ScrambleText({ text }: { text: string }) {
  return <>{useScrambleText(text)}</>;
}
