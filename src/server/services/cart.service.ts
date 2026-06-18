import { CartStatus } from "@/generated/prisma/enums";
import { prisma } from "@/server/db/prisma";

export class DifferentRestaurantCartError extends Error {
  constructor(
    public readonly activeRestaurantName: string,
    public readonly requestedRestaurantName: string,
  ) {
    super("Cart already has items from another restaurant.");
  }
}

export function listActiveCarts(userId: string) {
  return prisma.cart.findMany({
    where: {
      userId,
      status: CartStatus.ACTIVE,
      items: {
        some: {},
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      restaurant: true,
      items: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          menuItem: true,
        },
      },
    },
  });
}

export async function addMenuItemToCart(userId: string, menuItemId: string) {
  const menuItem = await prisma.menuItem.findFirst({
    where: {
      id: menuItemId,
      isAvailable: true,
    },
    select: {
      id: true,
      price: true,
      restaurantId: true,
      restaurant: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!menuItem) {
    throw new Error("Menu item is not available.");
  }

  await prisma.$transaction(async (tx) => {
    const otherActiveCart = await tx.cart.findFirst({
      where: {
        userId,
        restaurantId: {
          not: menuItem.restaurantId,
        },
        status: CartStatus.ACTIVE,
        items: {
          some: {},
        },
      },
      include: {
        restaurant: {
          select: {
            name: true,
          },
        },
      },
    });

    if (otherActiveCart) {
      throw new DifferentRestaurantCartError(
        otherActiveCart.restaurant.name,
        menuItem.restaurant.name,
      );
    }

    const cart =
      (await tx.cart.findFirst({
        where: {
          userId,
          restaurantId: menuItem.restaurantId,
          status: CartStatus.ACTIVE,
        },
      })) ??
      (await tx.cart.create({
        data: {
          userId,
          restaurantId: menuItem.restaurantId,
        },
      }));

    await tx.cartItem.upsert({
      where: {
        cartId_menuItemId: {
          cartId: cart.id,
          menuItemId: menuItem.id,
        },
      },
      update: {
        quantity: {
          increment: 1,
        },
        unitPrice: menuItem.price,
      },
      create: {
        cartId: cart.id,
        menuItemId: menuItem.id,
        quantity: 1,
        unitPrice: menuItem.price,
      },
    });
  });
}

export async function removeCartItem(userId: string, cartItemId: string) {
  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id: cartItemId,
      cart: {
        userId,
        status: CartStatus.ACTIVE,
      },
    },
    select: {
      id: true,
      cartId: true,
    },
  });

  if (!cartItem) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.cartItem.delete({
      where: {
        id: cartItem.id,
      },
    });

    const remainingItems = await tx.cartItem.count({
      where: {
        cartId: cartItem.cartId,
      },
    });

    if (remainingItems === 0) {
      await tx.cart.update({
        where: {
          id: cartItem.cartId,
        },
        data: {
          status: CartStatus.ABANDONED,
        },
      });
    }
  });
}

export async function clearCart(userId: string, cartId: string) {
  const cart = await prisma.cart.findFirst({
    where: {
      id: cartId,
      userId,
      status: CartStatus.ACTIVE,
    },
    select: {
      id: true,
    },
  });

  if (!cart) {
    return;
  }

  await prisma.$transaction([
    prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    }),
    prisma.cart.update({
      where: {
        id: cart.id,
      },
      data: {
        status: CartStatus.ABANDONED,
      },
    }),
  ]);
}
