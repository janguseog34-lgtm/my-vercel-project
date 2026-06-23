"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import {
  addMenuItemToCart,
  clearCart,
  decrementCartItem,
  DifferentRestaurantCartError,
  removeCartItem,
} from "@/server/services/cart.service";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function readScrollTarget(formData: FormData) {
  const value = readString(formData, "scrollTarget");

  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}

function redirectHome(scrollTarget: string, search = "") {
  void scrollTarget;
  redirect(`/${search}`);
}

export type CartActionResult = {
  error?: "different-restaurant";
  ok: boolean;
};

export async function addCartItemInlineAction(
  formData: FormData,
): Promise<CartActionResult> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const menuItemId = readString(formData, "menuItemId");

  if (menuItemId) {
    try {
      await addMenuItemToCart(currentUser.id, menuItemId);
    } catch (error) {
      if (error instanceof DifferentRestaurantCartError) {
        revalidatePath("/");
        return { error: "different-restaurant", ok: false };
      }

      throw error;
    }
  }

  revalidatePath("/");
  return { ok: true };
}

export async function removeCartItemInlineAction(
  formData: FormData,
): Promise<CartActionResult> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const cartItemId = readString(formData, "cartItemId");

  if (cartItemId) {
    await removeCartItem(currentUser.id, cartItemId);
  }

  revalidatePath("/");
  return { ok: true };
}

export async function decrementCartItemInlineAction(
  formData: FormData,
): Promise<CartActionResult> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const cartItemId = readString(formData, "cartItemId");

  if (cartItemId) {
    await decrementCartItem(currentUser.id, cartItemId);
  }

  revalidatePath("/");
  return { ok: true };
}

export async function clearCartInlineAction(
  formData: FormData,
): Promise<CartActionResult> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const cartId = readString(formData, "cartId");

  if (cartId) {
    await clearCart(currentUser.id, cartId);
  }

  revalidatePath("/");
  return { ok: true };
}

export async function addCartItemAction(formData: FormData) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const menuItemId = readString(formData, "menuItemId");
  const scrollTarget = readScrollTarget(formData);

  if (menuItemId) {
    try {
      await addMenuItemToCart(currentUser.id, menuItemId);
    } catch (error) {
      if (error instanceof DifferentRestaurantCartError) {
        revalidatePath("/");
        redirectHome(scrollTarget, "?cartError=different-restaurant");
      }

      throw error;
    }
  }

  revalidatePath("/");
  redirectHome(scrollTarget);
}

export async function removeCartItemAction(formData: FormData) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const cartItemId = readString(formData, "cartItemId");
  const scrollTarget = readScrollTarget(formData);

  if (cartItemId) {
    await removeCartItem(currentUser.id, cartItemId);
  }

  revalidatePath("/");
  redirectHome(scrollTarget);
}

export async function decrementCartItemAction(formData: FormData) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const cartItemId = readString(formData, "cartItemId");
  const scrollTarget = readScrollTarget(formData);

  if (cartItemId) {
    await decrementCartItem(currentUser.id, cartItemId);
  }

  revalidatePath("/");
  redirectHome(scrollTarget);
}

export async function clearCartAction(formData: FormData) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const cartId = readString(formData, "cartId");
  const scrollTarget = readScrollTarget(formData);

  if (cartId) {
    await clearCart(currentUser.id, cartId);
  }

  revalidatePath("/");
  redirectHome(scrollTarget);
}
