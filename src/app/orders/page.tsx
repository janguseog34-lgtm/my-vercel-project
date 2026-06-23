import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import { listOrdersForUser } from "@/server/services/orders.service";
import {
  canCancelOrderStatus,
  getOrderStatusLabel,
  getPaymentStatusLabel,
} from "@/app/orders/order-labels";
import { cancelOrderAction } from "@/server/actions/order.actions";

export const dynamic = "force-dynamic";

function formatPrice(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function OrdersPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const orders = await listOrdersForUser(currentUser.id);

  return (
    <main className="app-screen px-4 py-6 sm:px-6">
      <section className="mx-auto flex max-w-5xl flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">모락한끼</p>
            <h1 className="mt-1 text-3xl font-black">주문 내역</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              저장된 주문 {orders.length}건을 데이터베이스에서 불러왔습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <form action="/orders" method="get">
              <button className="button-secondary" type="submit">
                다시 불러오기
              </button>
            </form>
            <Link className="button-secondary" href="/">
              메뉴로 돌아가기
            </Link>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="panel p-6">
            <h2 className="text-xl font-black">아직 주문이 없습니다</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              메뉴를 장바구니에 담고 주문하면 이곳에 저장됩니다.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order) => {
              const canCancel = canCancelOrderStatus(order.status);

              return (
                <article
                  className="panel p-5"
                  key={order.id}
                >
                <div className="flex flex-col gap-3 border-b border-[var(--line)] pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-[var(--brand-dark)]">
                      {order.orderNumber}
                    </p>
                    <h2 className="mt-1 text-xl font-black">
                      {order.restaurant.name}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {formatDate(order.orderedAt)}
                    </p>
                  </div>
                  <span className="w-fit rounded-lg bg-[var(--mint)] px-3 py-2 text-sm font-black text-[#256347]">
                    {getOrderStatusLabel(order.status)}
                  </span>
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  {order.items.map((item) => (
                    <div
                      className="grid grid-cols-[1fr_auto] gap-3 text-sm"
                      key={item.id}
                    >
                      <div>
                        <p className="font-black">{item.menuItemName}</p>
                        <p className="mt-1 text-[var(--muted)]">
                          {formatPrice(item.unitPrice)}원 × {item.quantity}
                        </p>
                      </div>
                      <p className="font-black">
                        {formatPrice(item.lineTotal)}원
                      </p>
                    </div>
                  ))}
                </div>

                <div className="summary-box mt-4 text-sm">
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

                <div className="mt-4 text-sm leading-6 text-[var(--muted)]">
                  <p>
                    배송지: {order.deliveryAddressLine1}
                    {order.deliveryAddressLine2
                      ? ` ${order.deliveryAddressLine2}`
                      : ""}
                  </p>
                  <p>
                    결제상태:{" "}
                    {getPaymentStatusLabel(order.payments[0]?.status ?? "PENDING")}{" "}
                    · 최근 이력:{" "}
                    {order.statusEvents[0]?.message ?? "주문 생성"}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  {canCancel ? (
                    <form action={cancelOrderAction}>
                      <input
                        name="orderNumber"
                        type="hidden"
                        value={order.orderNumber}
                      />
                      <input name="returnTo" type="hidden" value="/orders" />
                      <button
                        className="button-danger"
                        type="submit"
                      >
                        주문 취소
                      </button>
                    </form>
                  ) : null}
                  <Link
                    className="button-primary"
                    href={`/orders/${order.orderNumber}`}
                  >
                    상세 보기
                  </Link>
                </div>
              </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
