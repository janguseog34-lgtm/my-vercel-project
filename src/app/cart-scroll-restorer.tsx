"use client";

import { useEffect } from "react";

const storageKey = "delivery-cart-scroll";
const snapshotTtlMs = 7000;

type ScrollSnapshot = {
  expiresAt: number;
  y: number;
};

function readSnapshot() {
  try {
    const value = window.sessionStorage.getItem(storageKey);

    return value ? (JSON.parse(value) as ScrollSnapshot) : null;
  } catch {
    return null;
  }
}

function clearSnapshot() {
  try {
    window.sessionStorage.removeItem(storageKey);
  } catch {
    // Ignore storage failures; preserving scroll is an enhancement.
  }
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

  window.scrollTo(0, snapshot.y);
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

    function saveSnapshot() {
      try {
        window.sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            expiresAt: Date.now() + snapshotTtlMs,
            y: window.scrollY,
          } satisfies ScrollSnapshot),
        );
      } catch {
        return false;
      }

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

      for (const delay of [1200, 2200, 3500, 5000, 6500]) {
        window.setTimeout(restoreSnapshot, delay);
      }

      window.setTimeout(() => {
        window.clearInterval(intervalId);
        clearSnapshot();
      }, snapshotTtlMs);
    }

    function handleBeforeSubmit(event: Event) {
      if (!findPreservedForm(event.target)) {
        return;
      }

      if (saveSnapshot()) {
        keepRestoringForPendingUpdate();
      }
    }

    function handleSubmit(event: SubmitEvent) {
      if (!findPreservedForm(event.target)) {
        return;
      }

      if (saveSnapshot()) {
        keepRestoringForPendingUpdate();
      }
    }

    keepRestoringForPendingUpdate();

    document.addEventListener("pointerdown", handleBeforeSubmit, true);
    document.addEventListener("click", handleBeforeSubmit, true);
    document.addEventListener("submit", handleSubmit, true);
    window.addEventListener("pageshow", keepRestoringForPendingUpdate);

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
      document.removeEventListener("pointerdown", handleBeforeSubmit, true);
      document.removeEventListener("click", handleBeforeSubmit, true);
      document.removeEventListener("submit", handleSubmit, true);
      window.removeEventListener("pageshow", keepRestoringForPendingUpdate);
    };
  }, []);

  return null;
}
