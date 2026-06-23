export const orderStatusSteps = [
  {
    value: "PENDING",
    label: "접수",
    actionLabel: "접수로 변경",
    description: "주문이 접수되었습니다.",
  },
  {
    value: "OUT_FOR_DELIVERY",
    label: "배달중",
    actionLabel: "배달중으로 변경",
    description: "주문이 배달 중입니다.",
  },
  {
    value: "DELIVERED",
    label: "완료",
    actionLabel: "완료로 변경",
    description: "배달이 완료되었습니다.",
  },
] as const;

export function getOrderStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "접수",
    PAID: "접수",
    ACCEPTED: "접수",
    PREPARING: "접수",
    READY_FOR_PICKUP: "접수",
    OUT_FOR_DELIVERY: "배달중",
    DELIVERED: "완료",
    CANCELLED: "취소",
    REFUNDED: "환불",
  };

  return labels[status] ?? status;
}

export function getOrderStatusStepIndex(status: string) {
  if (status === "CANCELLED" || status === "REFUNDED") {
    return -1;
  }

  if (status === "OUT_FOR_DELIVERY") {
    return 1;
  }

  if (status === "DELIVERED") {
    return 2;
  }

  return 0;
}

export function canCancelOrderStatus(status: string) {
  return !["CANCELLED", "DELIVERED", "REFUNDED"].includes(status);
}

export function getPaymentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "결제 대기",
    PAID: "결제 완료",
    FAILED: "결제 실패",
    CANCELLED: "결제 취소",
    REFUNDED: "환불",
  };

  return labels[status] ?? status;
}

export function getPaymentMethodLabel(method: string) {
  const labels: Record<string, string> = {
    CARD: "카드 결제",
    CASH: "현금 결제",
    MOCK: "앱 테스트 결제",
  };

  return labels[method] ?? method;
}
