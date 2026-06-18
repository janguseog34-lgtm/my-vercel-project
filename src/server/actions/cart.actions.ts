"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import {
  addMenuItemToCart,
  clearCart,
  DifferentRestaurantCartError,
  removeCartItem,
} from "@/server/services/cart.service";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export async function addCartItemAction(formData: FormData) {
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
        redirect("/?cartError=different-restaurant");
      }

      throw error;
    }
  }

  revalidatePath("/");
}

export async function removeCartItemAction(formData: FormData) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const cartItemId = readString(formData, "cartItemId");

  if (cartItemId) {
    await removeCartItem(currentUser.id, cartItemId);
  }

  revalidatePath("/");
}

export async function clearCartAction(formData: FormData) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const cartId = readString(formData, "cartId");

  if (cartId) {
    await clearCart(currentUser.id, cartId);
  }

  revalidatePath("/");
}
