"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  addCartItemAction,
  addCartItemInlineAction,
  clearCartAction,
  clearCartInlineAction,
  decrementCartItemAction,
  decrementCartItemInlineAction,
  removeCartItemAction,
  removeCartItemInlineAction,
} from "@/server/actions/cart.actions";

type CartActionKind = "add" | "clear" | "decrement" | "remove";

type CartActionFormProps = {
  ariaLabel?: string;
  buttonClassName: string;
  cartId?: string;
  cartItemId?: string;
  children: ReactNode;
  kind: CartActionKind;
  menuItemId?: string;
  scrollTarget?: string;
  testId?: string;
};

function getFallbackAction(kind: CartActionKind) {
  switch (kind) {
    case "add":
      return addCartItemAction;
    case "clear":
      return clearCartAction;
    case "decrement":
      return decrementCartItemAction;
    case "remove":
      return removeCartItemAction;
  }
}

async function runInlineAction(kind: CartActionKind, formData: FormData) {
  switch (kind) {
    case "add":
      return addCartItemInlineAction(formData);
    case "clear":
      return clearCartInlineAction(formData);
    case "decrement":
      return decrementCartItemInlineAction(formData);
    case "remove":
      return removeCartItemInlineAction(formData);
  }
}

function preserveCurrentViewport(scrollY: number) {
  const restore = () => window.scrollTo(0, scrollY);

  restore();
  window.requestAnimationFrame(restore);

  for (const delay of [60, 160, 320]) {
    window.setTimeout(restore, delay);
  }
}

function syncCartErrorToUrl(error?: "different-restaurant") {
  const url = new URL(window.location.href);

  if (error) {
    url.searchParams.set("cartError", error);
    url.searchParams.delete("orderError");
  } else {
    url.searchParams.delete("cartError");
    url.searchParams.delete("orderError");
  }

  url.hash = "";
  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}

export function CartActionForm({
  ariaLabel,
  buttonClassName,
  cartId,
  cartItemId,
  children,
  kind,
  menuItemId,
  scrollTarget = "",
  testId,
}: CartActionFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPending) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const scrollY = window.scrollY;

    setIsPending(true);
    preserveCurrentViewport(scrollY);

    try {
      const result = await runInlineAction(kind, formData);
      syncCartErrorToUrl(result.error);
      router.refresh();
      preserveCurrentViewport(scrollY);
    } finally {
      window.setTimeout(() => {
        setIsPending(false);
      }, 180);
    }
  }

  return (
    <form
      action={getFallbackAction(kind)}
      onSubmit={handleSubmit}
    >
      {menuItemId ? (
        <input name="menuItemId" type="hidden" value={menuItemId} />
      ) : null}
      {cartItemId ? (
        <input name="cartItemId" type="hidden" value={cartItemId} />
      ) : null}
      {cartId ? <input name="cartId" type="hidden" value={cartId} /> : null}
      <input name="scrollTarget" type="hidden" value={scrollTarget} />
      <button
        aria-label={ariaLabel}
        className={buttonClassName}
        data-testid={testId}
        disabled={isPending}
        type="submit"
      >
        {children}
      </button>
    </form>
  );
}
