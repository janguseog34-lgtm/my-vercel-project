import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  canCancelOrderStatus,
  getOrderStatusStepIndex,
  getOrderStatusLabel,
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
    <main className="min-h-screen bg-[#f7f7f4] px-5 py-8 text-[#20231f]">
      <section className="mx-auto flex max-w-4xl flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#66715f]">
              주문 상세
            </p>
            <h1 className="mt-1 text-3xl font-semibold">{order.orderNumber}</h1>
            <p className="mt-2 text-sm text-[#62695f]">
              {formatDate(order.orderedAt)} · {order.restaurant.name}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <form action={`/orders/${order.orderNumber}`} method="get">
              <button
                className="h-10 rounded-md border border-[#c9c7ba] px-4 text-sm font-semibold transition hover:bg-[#f0eee4]"
                type="submit"
              >
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
                  className="h-10 rounded-md border border-[#d3aaa0] px-4 text-sm font-semibold text-[#8a3a29] transition hover:bg-[#fff1ef]"
                  type="submit"
                >
                  주문 취소
                </button>
              </form>
            ) : null}
            <Link
              className="inline-flex h-10 items-center rounded-md border border-[#c9c7ba] px-4 text-sm font-semibold transition hover:bg-[#f0eee4]"
              href="/orders"
            >
              목록으로
            </Link>
          </div>
        </div>

        <section className="rounded-lg border border-[#deddd4] bg-white p-5">
          <div className="flex flex-col gap-3 border-b border-[#e4e2d7] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">주문 상태</h2>
              <p className="mt-1 text-sm text-[#62695f]">
                최근 이력: {order.statusEvents[0]?.message ?? "주문 생성"}
              </p>
            </div>
            <span className="w-fit rounded-md bg-[#eef3e8] px-3 py-2 text-sm font-semibold text-[#3e493a]">
              {getOrderStatusLabel(order.status)}
            </span>
          </div>

          {isCancelled ? (
            <p className="mt-5 rounded-md bg-[#fff1ef] px-3 py-2 text-sm font-semibold text-[#8a3a29]">
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
                    "rounded-md border p-4",
                    isActive
                      ? "border-[#8d9b7f] bg-[#eef3e8]"
                      : "border-[#e4e2d7] bg-[#fafaf7]",
                  ].join(" ")}
                  key={step.value}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={[
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                        isActive
                          ? "bg-[#20251f] text-white"
                          : "bg-[#e8e5d8] text-[#62695f]",
                      ].join(" ")}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold">{step.label}</p>
                      {isCurrent ? (
                        <p className="mt-1 text-xs font-semibold text-[#66715f]">
                          현재 상태
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#62695f]">
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
                      "h-10 rounded-md px-4 text-sm font-semibold transition",
                      isSelected
                        ? "border border-[#d8d3c5] bg-[#f0eee4] text-[#7d8378]"
                        : "bg-[#20251f] text-white hover:bg-[#3c4537]",
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
            <div className="rounded-md bg-[#f7f7f4] p-4">
              <p className="text-sm font-semibold text-[#66715f]">배송지</p>
              <p className="mt-2 font-semibold">{order.deliveryRecipient}</p>
              <p className="mt-1 text-sm leading-6 text-[#62695f]">
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
                <p className="mt-2 text-sm text-[#62695f]">
                  요청사항: {order.deliveryMemo}
                </p>
              ) : null}
            </div>

            <div className="rounded-md bg-[#f7f7f4] p-4">
              <p className="text-sm font-semibold text-[#66715f]">결제</p>
              <p className="mt-2 font-semibold">
                {getPaymentStatusLabel(payment?.status ?? "PENDING")}
              </p>
              <p className="mt-1 text-sm leading-6 text-[#62695f]">
                결제수단: {payment?.method ?? "MOCK"}
                <br />
                결제금액: {formatPrice(payment?.amount ?? order.totalAmount)}원
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#deddd4] bg-white p-5">
          <h2 className="text-xl font-semibold">주문 메뉴</h2>
          <div className="mt-4 flex flex-col gap-3">
            {order.items.map((item) => (
              <div
                className="grid grid-cols-[1fr_auto] gap-3 border-b border-[#eeeade] pb-3 text-sm last:border-b-0 last:pb-0"
                key={item.id}
              >
                <div>
                  <p className="font-semibold">{item.menuItemName}</p>
                  <p className="mt-1 text-[#62695f]">
                    {formatPrice(item.unitPrice)}원 × {item.quantity}
                  </p>
                </div>
                <p className="font-semibold">{formatPrice(item.lineTotal)}원</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-md bg-[#f0eee4] p-4 text-sm">
            <div className="flex justify-between">
              <span>메뉴 합계</span>
              <span>{formatPrice(order.subtotalAmount)}원</span>
            </div>
            <div className="mt-2 flex justify-between text-[#62695f]">
              <span>배달비</span>
              <span>{formatPrice(order.deliveryFee)}원</span>
            </div>
            <div className="mt-3 flex justify-between border-t border-[#d8d3c5] pt-3 text-base font-semibold">
              <span>총액</span>
              <span>{formatPrice(order.totalAmount)}원</span>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#deddd4] bg-white p-5">
          <h2 className="text-xl font-semibold">상태 이력</h2>
          <div className="mt-4 flex flex-col gap-3">
            {order.statusEvents.map((event) => (
              <div
                className="grid gap-1 border-b border-[#eeeade] pb-3 text-sm last:border-b-0 last:pb-0 sm:grid-cols-[160px_1fr]"
                key={event.id}
              >
                <p className="font-semibold text-[#66715f]">
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
