import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  canCancelOrderStatus,
  getOrderStatusStepIndex,
  getOrderStatusLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  orderStatusSteps,
} from "@/app/orders/order-labels";
import {
  cancelOrderAction,
  updateOrderStatusAction,
} from "@/server/actions/order.actions";
import { getCurrentUser } from "@/server/auth/current-user";
import { getOrderForUser } from "@/server/services/orders.service";

export const dynamic = "force-dynamic";

type OrderDetailPageProps = {
  params: Promise<{
    orderNumber: string;
  }>;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const { orderNumber } = await params;
  const order = await getOrderForUser(currentUser.id, orderNumber);

  if (!order) {
    notFound();
  }

  const payment = order.payments[0];
  const currentStepIndex = getOrderStatusStepIndex(order.status);
  const canCancel = canCancelOrderStatus(order.status);
  const isCancelled = order.status === "CANCELLED";

  return (
    <main className="app-screen px-4 py-6 sm:px-6">
      <section className="mx-auto flex max-w-5xl flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">주문 상세</p>
            <h1 className="mt-1 text-3xl font-black">{order.orderNumber}</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {formatDate(order.orderedAt)} · {order.restaurant.name}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <form action={`/orders/${order.orderNumber}`} method="get">
              <button className="button-secondary" type="submit">
                다시 불러오기
              </button>
            </form>
            {canCancel ? (
              <form action={cancelOrderAction}>
                <input
                  name="orderNumber"
                  type="hidden"
                  value={order.orderNumber}
                />
                <input
                  name="returnTo"
                  type="hidden"
                  value={`/orders/${order.orderNumber}`}
                />
                <button
                  className="button-danger"
                  type="submit"
                >
                  주문 취소
                </button>
              </form>
            ) : null}
            <Link className="button-secondary" href="/orders">
              목록으로
            </Link>
          </div>
        </div>

        <section className="panel p-5">
          <div className="flex flex-col gap-3 border-b border-[var(--line)] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black">주문 상태</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                최근 이력: {order.statusEvents[0]?.message ?? "주문 생성"}
              </p>
            </div>
            <span className="w-fit rounded-lg bg-[var(--mint)] px-3 py-2 text-sm font-black text-[#256347]">
              {getOrderStatusLabel(order.status)}
            </span>
          </div>

          {isCancelled ? (
            <p className="notice-danger mt-5">
              이 주문은 취소되었습니다.
            </p>
          ) : null}

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {orderStatusSteps.map((step, index) => {
              const isActive = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div
                  className={[
                    "rounded-lg border p-4",
                    isActive
                      ? "border-[var(--line-strong)] bg-[var(--mint)]"
                      : "border-[var(--line)] bg-[var(--surface-soft)]",
                  ].join(" ")}
                  key={step.value}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={[
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                        isActive
                          ? "bg-[var(--brand)] text-white"
                          : "bg-white text-[var(--muted)]",
                      ].join(" ")}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-black">{step.label}</p>
                      {isCurrent ? (
                        <p className="mt-1 text-xs font-black text-[var(--brand-dark)]">
                          현재 상태
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>

          {canCancel ? (
            <form
              action={updateOrderStatusAction}
              className="mt-5 flex flex-wrap gap-2"
            >
              <input
                name="orderNumber"
                type="hidden"
                value={order.orderNumber}
              />
              {orderStatusSteps.map((step) => {
                const isSelected = order.status === step.value;

                return (
                  <button
                    className={[
                      "button-primary",
                      isSelected
                        ? "button-soft"
                        : "",
                    ].join(" ")}
                    disabled={isSelected}
                    key={step.value}
                    name="status"
                    type="submit"
                    value={step.value}
                  >
                    {step.actionLabel}
                  </button>
                );
              })}
            </form>
          ) : null}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="summary-box">
              <p className="text-sm font-black text-[var(--brand-dark)]">배송지</p>
              <p className="mt-2 font-black">{order.deliveryRecipient}</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                {order.deliveryPhone}
                <br />
                {order.deliveryAddressLine1}
                {order.deliveryAddressLine2
                  ? ` ${order.deliveryAddressLine2}`
                  : ""}
                {order.deliveryPostalCode
                  ? ` (${order.deliveryPostalCode})`
                  : ""}
              </p>
              {order.deliveryMemo ? (
                <p className="mt-2 text-sm text-[var(--muted)]">
                  요청사항: {order.deliveryMemo}
                </p>
              ) : null}
            </div>

            <div className="summary-box">
              <p className="text-sm font-black text-[var(--brand-dark)]">결제</p>
              <p className="mt-2 font-black">
                {getPaymentStatusLabel(payment?.status ?? "PENDING")}
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                결제수단: {getPaymentMethodLabel(payment?.method ?? "MOCK")}
                <br />
                결제금액: {formatPrice(payment?.amount ?? order.totalAmount)}원
              </p>
            </div>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="text-xl font-black">주문 메뉴</h2>
          <div className="mt-4 flex flex-col gap-3">
            {order.items.map((item) => (
              <div
                className="grid grid-cols-[1fr_auto] gap-3 border-b border-[var(--line)] pb-3 text-sm last:border-b-0 last:pb-0"
                key={item.id}
              >
                <div>
                  <p className="font-black">{item.menuItemName}</p>
                  <p className="mt-1 text-[var(--muted)]">
                    {formatPrice(item.unitPrice)}원 × {item.quantity}
                  </p>
                </div>
                <p className="font-black">{formatPrice(item.lineTotal)}원</p>
              </div>
            ))}
          </div>

          <div className="summary-box mt-5 text-sm">
            <div className="flex justify-between">
              <span>메뉴 합계</span>
              <span>{formatPrice(order.subtotalAmount)}원</span>
            </div>
            <div className="mt-2 flex justify-between text-[var(--muted)]">
              <span>배달비</span>
              <span>{formatPrice(order.deliveryFee)}원</span>
            </div>
            <div className="mt-3 flex justify-between border-t border-[var(--line-strong)] pt-3 text-base font-black">
              <span>총액</span>
              <span>{formatPrice(order.totalAmount)}원</span>
            </div>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="text-xl font-black">상태 이력</h2>
          <div className="mt-4 flex flex-col gap-3">
            {order.statusEvents.map((event) => (
              <div
                className="grid gap-1 border-b border-[var(--line)] pb-3 text-sm last:border-b-0 last:pb-0 sm:grid-cols-[160px_1fr]"
                key={event.id}
              >
                <p className="font-black text-[var(--brand-dark)]">
                  {formatDate(event.createdAt)}
                </p>
                <p>
                  {getOrderStatusLabel(event.status)}
                  {event.message ? ` · ${event.message}` : ""}
                </p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
