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
    <main className="min-h-screen bg-[#f7f7f4] px-5 py-8 text-[#20231f]">
      <section className="mx-auto flex max-w-4xl flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#66715f]">
              동네한끼
            </p>
            <h1 className="mt-1 text-3xl font-semibold">주문 내역</h1>
            <p className="mt-2 text-sm text-[#62695f]">
              저장된 주문 {orders.length}건을 데이터베이스에서 불러왔습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <form action="/orders" method="get">
              <button
                className="h-10 rounded-md border border-[#c9c7ba] px-4 text-sm font-semibold transition hover:bg-[#f0eee4]"
                type="submit"
              >
                다시 불러오기
              </button>
            </form>
            <Link
              className="inline-flex h-10 items-center rounded-md border border-[#c9c7ba] px-4 text-sm font-semibold transition hover:bg-[#f0eee4]"
              href="/"
            >
              메뉴로 돌아가기
            </Link>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-lg border border-[#deddd4] bg-white p-6">
            <h2 className="text-xl font-semibold">아직 주문이 없습니다</h2>
            <p className="mt-2 text-sm text-[#62695f]">
              메뉴를 장바구니에 담고 주문하면 이곳에 저장됩니다.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order) => {
              const canCancel = canCancelOrderStatus(order.status);

              return (
                <article
                  className="rounded-lg border border-[#deddd4] bg-white p-5"
                  key={order.id}
                >
                <div className="flex flex-col gap-3 border-b border-[#e4e2d7] pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#66715f]">
                      {order.orderNumber}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">
                      {order.restaurant.name}
                    </h2>
                    <p className="mt-1 text-sm text-[#62695f]">
                      {formatDate(order.orderedAt)}
                    </p>
                  </div>
                  <span className="w-fit rounded-md bg-[#eef3e8] px-3 py-2 text-sm font-semibold text-[#3e493a]">
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
                        <p className="font-semibold">{item.menuItemName}</p>
                        <p className="mt-1 text-[#62695f]">
                          {formatPrice(item.unitPrice)}원 × {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">
                        {formatPrice(item.lineTotal)}원
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-md bg-[#f0eee4] p-4 text-sm">
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

                <div className="mt-4 text-sm leading-6 text-[#62695f]">
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
                        className="inline-flex h-10 items-center rounded-md border border-[#d3aaa0] px-4 text-sm font-semibold text-[#8a3a29] transition hover:bg-[#fff1ef]"
                        type="submit"
                      >
                        주문 취소
                      </button>
                    </form>
                  ) : null}
                  <Link
                    className="inline-flex h-10 items-center rounded-md bg-[#20251f] px-4 text-sm font-semibold text-white transition hover:bg-[#3c4537]"
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
