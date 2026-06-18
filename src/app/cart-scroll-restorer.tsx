"use client";

import { useEffect } from "react";

const storageKey = "delivery-cart-scroll";
const snapshotTtlMs = 15000;

type ScrollSnapshot = {
  anchorSelector?: string;
  anchorTop?: number;
  expiresAt: number;
  y: number;
};

let memorySnapshot: ScrollSnapshot | null = null;

function parseSnapshot(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as ScrollSnapshot;
  } catch {
    return null;
  }
}

function readCookieSnapshot() {
  try {
    const prefix = `${storageKey}=`;
    const cookie = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith(prefix));

    return cookie
      ? parseSnapshot(decodeURIComponent(cookie.slice(prefix.length)))
      : null;
  } catch {
    return null;
  }
}

function writeSnapshot(snapshot: ScrollSnapshot) {
  memorySnapshot = snapshot;

  try {
    window.sessionStorage?.setItem(storageKey, JSON.stringify(snapshot));
  } catch {
    // Cookie fallback below keeps this working when storage is unavailable.
  }

  try {
    document.cookie = [
      `${storageKey}=${encodeURIComponent(JSON.stringify(snapshot))}`,
      `max-age=${Math.ceil(snapshotTtlMs / 1000)}`,
      "path=/",
      "SameSite=Lax",
    ].join("; ");
  } catch {
    // Memory fallback is still enough for client-side updates.
  }
}

function readSnapshot() {
  if (memorySnapshot) {
    return memorySnapshot;
  }

  try {
    const snapshot = parseSnapshot(window.sessionStorage?.getItem(storageKey));

    if (snapshot) {
      memorySnapshot = snapshot;
      return snapshot;
    }
  } catch {
    // Fall back to the short-lived cookie snapshot.
  }

  const cookieSnapshot = readCookieSnapshot();
  memorySnapshot = cookieSnapshot;

  return cookieSnapshot;
}

function clearSnapshot() {
  memorySnapshot = null;

  try {
    window.sessionStorage?.removeItem(storageKey);
  } catch {
    // Ignore storage failures; preserving scroll is an enhancement.
  }

  try {
    document.cookie = `${storageKey}=; max-age=0; path=/; SameSite=Lax`;
  } catch {
    // Ignore cookie failures; preserving scroll is an enhancement.
  }
}

function clampScrollY(value: number) {
  const maxScrollY = Math.max(
    document.documentElement.scrollHeight - window.innerHeight,
    0,
  );

  return Math.max(0, Math.min(value, maxScrollY));
}

function restoreSnapshot() {
  const snapshot = readSnapshot();

  if (!snapshot) {
    return false;
  }

  if (Date.now() > snapshot.expiresAt) {
    clearSnapshot();
    return false;
  }

  let targetY = snapshot.y;

  if (snapshot.anchorSelector && typeof snapshot.anchorTop === "number") {
    const anchor = document.querySelector(snapshot.anchorSelector);

    if (anchor) {
      const currentTop = anchor.getBoundingClientRect().top;
      targetY = window.scrollY + currentTop - snapshot.anchorTop;
    }
  }

  window.scrollTo(0, clampScrollY(targetY));
  return true;
}

export function CartScrollRestorer() {
  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    function findPreservedForm(target: EventTarget | null) {
      if (!(target instanceof Element)) {
        return null;
      }

      return target.closest<HTMLFormElement>('form[data-preserve-scroll="true"]');
    }

    function saveSnapshot(form: HTMLFormElement) {
      const anchorSelector = form.dataset.scrollAnchor;
      const anchor = anchorSelector
        ? document.querySelector(anchorSelector)
        : form;
      const anchorTop = anchor?.getBoundingClientRect().top;

      writeSnapshot({
        anchorSelector,
        anchorTop,
        expiresAt: Date.now() + snapshotTtlMs,
        y: window.scrollY,
      });

      return true;
    }

    function keepRestoringForPendingUpdate() {
      restoreSnapshot();
      window.requestAnimationFrame(() => {
        restoreSnapshot();
        window.requestAnimationFrame(restoreSnapshot);
      });

      const intervalId = window.setInterval(() => {
        if (!restoreSnapshot()) {
          window.clearInterval(intervalId);
        }
      }, 50);

      for (const delay of [
        120,
        300,
        600,
        1200,
        2200,
        3500,
        5000,
        7000,
        10000,
        13000,
      ]) {
        window.setTimeout(restoreSnapshot, delay);
      }

      window.setTimeout(() => {
        window.clearInterval(intervalId);
        clearSnapshot();
      }, snapshotTtlMs);
    }

    function handleBeforeSubmit(event: Event) {
      const form = findPreservedForm(event.target);

      if (!form) {
        return;
      }

      if (saveSnapshot(form)) {
        keepRestoringForPendingUpdate();
      }
    }

    function handleSubmit(event: SubmitEvent) {
      const form = findPreservedForm(event.target);

      if (!form) {
        return;
      }

      if (saveSnapshot(form)) {
        keepRestoringForPendingUpdate();
      }
    }

    keepRestoringForPendingUpdate();

    document.addEventListener("mousedown", handleBeforeSubmit, true);
    document.addEventListener("pointerdown", handleBeforeSubmit, true);
    document.addEventListener("click", handleBeforeSubmit, true);
    document.addEventListener("submit", handleSubmit, true);
    window.addEventListener("pageshow", keepRestoringForPendingUpdate);

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
      document.removeEventListener("mousedown", handleBeforeSubmit, true);
      document.removeEventListener("pointerdown", handleBeforeSubmit, true);
      document.removeEventListener("click", handleBeforeSubmit, true);
      document.removeEventListener("submit", handleSubmit, true);
      window.removeEventListener("pageshow", keepRestoringForPendingUpdate);
    };
  }, []);

  return null;
}
