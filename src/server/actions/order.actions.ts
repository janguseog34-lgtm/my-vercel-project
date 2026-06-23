"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { OrderStatus, PaymentMethod } from "@/generated/prisma/enums";
import { getCurrentUser } from "@/server/auth/current-user";
import {
  cancelOrderForUser,
  customerOrderStatuses,
  type DeliveryAddressInput,
  MinimumOrderAmountError,
  MultipleRestaurantOrderError,
  placeOrdersFromActiveCarts,
  updateOrderStatusForUser,
  type CustomerOrderStatus,
} from "@/server/services/orders.service";

export type PlaceOrderFormState = {
  error?: string;
  values?: {
    addressLine1?: string;
    addressLine2?: string;
    customMemo?: string;
    memo?: string;
    paymentMethod?: string;
    phone?: string;
    postalCode?: string;
    requestOption?: string;
    recipientName?: string;
  };
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function createDeliveryMemo(requestOption: string, customMemo: string) {
  const values = [requestOption, customMemo].filter(Boolean);

  return values.length > 0 ? values.join(" / ") : "";
}

function readDeliveryAddress(formData: FormData) {
  const requestOption = readString(formData, "requestOption");
  const customMemo = readString(formData, "customMemo");

  return {
    addressLine1: readString(formData, "addressLine1"),
    addressLine2: readString(formData, "addressLine2"),
    customMemo,
    memo: createDeliveryMemo(requestOption, customMemo),
    paymentMethod: readString(formData, "paymentMethod"),
    phone: readString(formData, "phone"),
    postalCode: readString(formData, "postalCode"),
    requestOption,
    recipientName: readString(formData, "recipientName"),
  };
}

function readPaymentMethod(value?: string) {
  if (
    value === PaymentMethod.CARD ||
    value === PaymentMethod.CASH ||
    value === PaymentMethod.MOCK
  ) {
    return value;
  }

  return PaymentMethod.CARD;
}

function toDeliveryAddressInput(
  values: NonNullable<PlaceOrderFormState["values"]>,
): DeliveryAddressInput | null {
  if (!values.recipientName || !values.phone || !values.addressLine1) {
    return null;
  }

  return {
    addressLine1: values.addressLine1,
    addressLine2: values.addressLine2,
    memo: values.memo,
    phone: values.phone,
    postalCode: values.postalCode,
    recipientName: values.recipientName,
  };
}

function readCustomerOrderStatus(value: string) {
  if (
    customerOrderStatuses.includes(value as CustomerOrderStatus)
  ) {
    return value as CustomerOrderStatus;
  }

  return null;
}

export async function placeOrderAction(
  _state: PlaceOrderFormState,
  formData: FormData,
): Promise<PlaceOrderFormState> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const values = readDeliveryAddress(formData);
  const deliveryAddress = toDeliveryAddressInput(values);

  if (!deliveryAddress) {
    return {
      error: "수령인, 전화번호, 주소를 입력해주세요.",
      values,
    };
  }

  let orders;

  try {
    orders = await placeOrdersFromActiveCarts(
      currentUser.id,
      deliveryAddress,
      readPaymentMethod(values.paymentMethod),
    );
  } catch (error) {
    if (error instanceof MinimumOrderAmountError) {
      revalidatePath("/");
      revalidatePath("/checkout");

      return {
        error: `${error.restaurantName} 최소주문금액까지 ${error.minOrderAmount - error.subtotalAmount}원이 더 필요합니다.`,
        values,
      };
    }

    if (error instanceof MultipleRestaurantOrderError) {
      revalidatePath("/");
      revalidatePath("/checkout");

      return {
        error: "한 번에 한 식당의 메뉴만 주문할 수 있습니다.",
        values,
      };
    }

    throw error;
  }

  revalidatePath("/");
  revalidatePath("/checkout");
  revalidatePath("/orders");

  if (orders.length === 0) {
    redirect("/");
  }

  redirect("/orders");
}

export async function cancelOrderAction(formData: FormData) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const orderNumber = readString(formData, "orderNumber");
  const returnTo = readString(formData, "returnTo");

  if (orderNumber) {
    await cancelOrderForUser(currentUser.id, orderNumber);
  }

  revalidatePath("/orders");
  revalidatePath(orderNumber ? `/orders/${orderNumber}` : "/orders");

  redirect(returnTo.startsWith("/") ? returnTo : "/orders");
}

export async function updateOrderStatusAction(formData: FormData) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const orderNumber = readString(formData, "orderNumber");
  const status = readCustomerOrderStatus(readString(formData, "status"));
  const returnTo = orderNumber ? `/orders/${orderNumber}` : "/orders";

  if (orderNumber && status) {
    await updateOrderStatusForUser(currentUser.id, orderNumber, status);
  }

  revalidatePath("/orders");
  revalidatePath(returnTo);

  if (status === OrderStatus.DELIVERED) {
    revalidatePath("/");
  }

  redirect(returnTo);
}
