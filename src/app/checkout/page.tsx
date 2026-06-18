import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/app/checkout/checkout-form";
import { getCurrentUser } from "@/server/auth/current-user";
import { listActiveCarts } from "@/server/services/cart.service";
import { getDefaultAddressForUser } from "@/server/services/users.service";

export const dynamic = "force-dynamic";

function formatPrice(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function getCartLineTotal(unitPrice: number, quantity: number) {
  return unitPrice * quantity;
}

export default async function CheckoutPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const [activeCarts, defaultAddress] = await Promise.all([
    listActiveCarts(currentUser.id),
    getDefaultAddressForUser(currentUser.id),
  ]);

  if (activeCarts.length === 0) {
    redirect("/");
  }

  if (activeCarts.length > 1) {
    redirect("/?cartError=different-restaurant");
  }

  const cartSummaries = activeCarts.map((cart) => {
    const subtotalAmount = cart.items.reduce(
      (itemTotal, item) =>
        itemTotal + getCartLineTotal(item.unitPrice, item.quantity),
      0,
    );
    const remainingAmount = Math.max(
      cart.restaurant.minOrderAmount - subtotalAmount,
      0,
    );

    return {
      cart,
      remainingAmount,
      subtotalAmount,
    };
  });
  const hasMinimumOrderIssue = cartSummaries.some(
    (summary) => summary.remainingAmount > 0,
  );

  if (hasMinimumOrderIssue) {
    redirect("/?orderError=min-order");
  }

  const subtotalAmount = cartSummaries.reduce(
    (total, summary) => total + summary.subtotalAmount,
    0,
  );
  const deliveryFee = activeCarts.reduce(
    (total, cart) => total + cart.restaurant.deliveryFee,
    0,
  );
  const totalAmount = subtotalAmount + deliveryFee;

  return (
    <main className="min-h-screen bg-[#f7f7f4] px-5 py-8 text-[#20231f]">
      <section className="mx-auto flex max-w-5xl flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#66715f]">
              동네한끼
            </p>
            <h1 className="mt-1 text-3xl font-semibold">주문서</h1>
            <p className="mt-2 text-sm text-[#62695f]">
              배송받을 주소를 입력하면 주문 내용과 함께 저장됩니다.
            </p>
          </div>
          <Link
            className="inline-flex h-10 items-center rounded-md border border-[#c9c7ba] px-4 text-sm font-semibold transition hover:bg-[#f0eee4]"
            href="/"
          >
            메뉴로 돌아가기
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="rounded-lg border border-[#deddd4] bg-white p-5">
            <h2 className="text-xl font-semibold">배송지 입력</h2>
            <p className="mt-2 text-sm text-[#62695f]">
              입력한 주소는 이번 주문의 배송지로 저장됩니다.
            </p>
            <div className="mt-5">
              <CheckoutForm
                defaultValues={{
                  addressLine1: defaultAddress?.line1 ?? "",
                  addressLine2: defaultAddress?.line2 ?? "",
                  memo: defaultAddress?.instructions ?? "",
                  phone: defaultAddress?.phone ?? currentUser.phone ?? "",
                  postalCode: defaultAddress?.postalCode ?? "",
                  recipientName:
                    defaultAddress?.recipientName ?? currentUser.name,
                }}
              />
            </div>
          </section>

          <aside className="rounded-lg border border-[#deddd4] bg-white p-5 lg:self-start">
            <h2 className="text-xl font-semibold">주문 요약</h2>
            <div className="mt-4 flex flex-col gap-4">
              {cartSummaries.map(({ cart, subtotalAmount: cartSubtotal }) => (
                <section
                  className="rounded-md border border-[#e4e2d7] p-4"
                  key={cart.id}
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-semibold">{cart.restaurant.name}</p>
                      <p className="mt-1 text-xs text-[#62695f]">
                        배달비 {formatPrice(cart.restaurant.deliveryFee)}원
                      </p>
                    </div>
                    <p className="text-sm font-semibold">
                      {formatPrice(cartSubtotal)}원
                    </p>
                  </div>

                  <div className="mt-3 flex flex-col gap-2 border-t border-[#eeeade] pt-3">
                    {cart.items.map((item) => (
                      <div
                        className="grid grid-cols-[1fr_auto] gap-3 text-sm"
                        key={item.id}
                      >
                        <p>
                          {item.menuItem.name} × {item.quantity}
                        </p>
                        <p className="font-semibold">
                          {formatPrice(
                            getCartLineTotal(item.unitPrice, item.quantity),
                          )}
                          원
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-4 rounded-md bg-[#f0eee4] p-4 text-sm">
              <div className="flex justify-between">
                <span>메뉴 합계</span>
                <span>{formatPrice(subtotalAmount)}원</span>
              </div>
              <div className="mt-2 flex justify-between text-[#62695f]">
                <span>배달비</span>
                <span>{formatPrice(deliveryFee)}원</span>
              </div>
              <div className="mt-3 flex justify-between border-t border-[#d8d3c5] pt-3 text-base font-semibold">
                <span>총액</span>
                <span>{formatPrice(totalAmount)}원</span>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
