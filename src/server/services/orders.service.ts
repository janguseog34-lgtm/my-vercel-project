import {
  CartStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/generated/prisma/enums";
import { prisma } from "@/server/db/prisma";

export const customerOrderStatuses = [
  OrderStatus.PENDING,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
] as const;

export type CustomerOrderStatus = (typeof customerOrderStatuses)[number];

export type DeliveryAddressInput = {
  addressLine1: string;
  addressLine2?: string;
  memo?: string;
  phone: string;
  postalCode?: string;
  recipientName: string;
};

export class MinimumOrderAmountError extends Error {
  constructor(
    public readonly restaurantName: string,
    public readonly minOrderAmount: number,
    public readonly subtotalAmount: number,
  ) {
    super("Minimum order amount was not met.");
  }
}

export class MultipleRestaurantOrderError extends Error {
  constructor() {
    super("Only one restaurant can be ordered at a time.");
  }
}

function getOrderStatusEventMessage(status: CustomerOrderStatus) {
  if (status === OrderStatus.OUT_FOR_DELIVERY) {
    return "주문이 배달 중으로 변경되었습니다.";
  }

  if (status === OrderStatus.DELIVERED) {
    return "주문이 완료되었습니다.";
  }

  return "주문이 접수 상태로 변경되었습니다.";
}

function createOrderNumber() {
  const date = new Date();
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
  const timePart = [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0"),
  ].join("");
  const randomPart = Math.random().toString(36).slice(2, 7).toUpperCase();

  return `ORD-${datePart}-${timePart}-${randomPart}`;
}

export async function placeOrdersFromActiveCarts(
  userId: string,
  deliveryAddress: DeliveryAddressInput,
  paymentMethod: PaymentMethod = PaymentMethod.CARD,
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new Error("User not found.");
    }

    const carts = await tx.cart.findMany({
      where: {
        userId,
        status: CartStatus.ACTIVE,
        items: {
          some: {},
        },
      },
      include: {
        restaurant: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    const orders = [];

    if (carts.length > 1) {
      throw new MultipleRestaurantOrderError();
    }

    for (const cart of carts) {
      const subtotalAmount = cart.items.reduce(
        (total, item) => total + item.unitPrice * item.quantity,
        0,
      );

      if (subtotalAmount < cart.restaurant.minOrderAmount) {
        throw new MinimumOrderAmountError(
          cart.restaurant.name,
          cart.restaurant.minOrderAmount,
          subtotalAmount,
        );
      }

      const deliveryFee = cart.restaurant.deliveryFee;
      const totalAmount = subtotalAmount + deliveryFee;

      const order = await tx.order.create({
        data: {
          orderNumber: createOrderNumber(),
          userId,
          restaurantId: cart.restaurantId,
          addressId: null,
          status: OrderStatus.PENDING,
          subtotalAmount,
          deliveryFee,
          totalAmount,
          deliveryRecipient: deliveryAddress.recipientName,
          deliveryPhone: deliveryAddress.phone,
          deliveryAddressLine1: deliveryAddress.addressLine1,
          deliveryAddressLine2: deliveryAddress.addressLine2 || null,
          deliveryPostalCode: deliveryAddress.postalCode || null,
          deliveryMemo: deliveryAddress.memo || null,
          items: {
            create: cart.items.map((item) => ({
              menuItemId: item.menuItemId,
              menuItemName: item.menuItem.name,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              lineTotal: item.unitPrice * item.quantity,
              note: item.note,
            })),
          },
          payments: {
            create: {
              method: paymentMethod,
              status: PaymentStatus.PENDING,
              amount: totalAmount,
              provider: `internal-${paymentMethod.toLowerCase()}`,
            },
          },
          statusEvents: {
            create: {
              status: OrderStatus.PENDING,
              message: "주문이 생성되었습니다.",
              actorUserId: userId,
            },
          },
        },
      });

      await tx.cart.update({
        where: {
          id: cart.id,
        },
        data: {
          status: CartStatus.ORDERED,
        },
      });

      orders.push(order);
    }

    return orders;
  });
}

export async function cancelOrderForUser(userId: string, orderNumber: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        userId,
        orderNumber,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    if (
      order.status === OrderStatus.CANCELLED ||
      order.status === OrderStatus.DELIVERED ||
      order.status === OrderStatus.REFUNDED
    ) {
      return order;
    }

    const cancelledAt = new Date();

    await tx.payment.updateMany({
      where: {
        orderId: order.id,
        status: PaymentStatus.PENDING,
      },
      data: {
        status: PaymentStatus.CANCELLED,
      },
    });

    return tx.order.update({
      where: {
        id: order.id,
      },
      data: {
        cancelledAt,
        status: OrderStatus.CANCELLED,
        statusEvents: {
          create: {
            status: OrderStatus.CANCELLED,
            message: "주문이 취소되었습니다.",
            actorUserId: userId,
          },
        },
      },
    });
  });
}

export function listOrdersForUser(userId: string) {
  return prisma.order.findMany({
    where: {
      userId,
    },
    orderBy: {
      orderedAt: "desc",
    },
    include: {
      restaurant: true,
      items: {
        orderBy: {
          createdAt: "asc",
        },
      },
      payments: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
      statusEvents: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });
}

export function getOrderForUser(userId: string, orderNumber: string) {
  return prisma.order.findFirst({
    where: {
      userId,
      orderNumber,
    },
    include: {
      restaurant: true,
      items: {
        orderBy: {
          createdAt: "asc",
        },
      },
      payments: {
        orderBy: {
          createdAt: "desc",
        },
      },
      statusEvents: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}

export async function updateOrderStatusForUser(
  userId: string,
  orderNumber: string,
  status: CustomerOrderStatus,
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        userId,
        orderNumber,
      },
      select: {
        id: true,
        acceptedAt: true,
      },
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    const changedAt = new Date();

    return tx.order.update({
      where: {
        id: order.id,
      },
      data: {
        status,
        acceptedAt:
          status === OrderStatus.PENDING
            ? null
            : (order.acceptedAt ?? changedAt),
        deliveredAt: status === OrderStatus.DELIVERED ? changedAt : null,
        cancelledAt: null,
        statusEvents: {
          create: {
            status,
            message: getOrderStatusEventMessage(status),
            actorUserId: userId,
          },
        },
      },
    });
  });
}
