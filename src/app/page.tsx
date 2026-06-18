import Link from "next/link";
import { redirect } from "next/navigation";
import { CartScrollRestorer } from "@/app/cart-scroll-restorer";
import {
  listOpenRestaurantFilters,
  listOpenRestaurants,
} from "@/server/services/restaurants.service";
import { getCurrentUser } from "@/server/auth/current-user";
import { logoutAction } from "@/server/actions/auth.actions";
import {
  addCartItemAction,
  clearCartAction,
  decrementCartItemAction,
  removeCartItemAction,
} from "@/server/actions/cart.actions";
import { listActiveCarts } from "@/server/services/cart.service";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams?: Promise<{
    cartError?: string | string[];
    orderError?: string | string[];
    restaurant?: string | string[];
  }>;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function getRestaurantSlug(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function filterLinkClass(isActive: boolean, isCartRestaurant = false) {
  return [
    "rounded-md border p-3 transition",
    isCartRestaurant
      ? "border-[#38bdf8] bg-[#e0f7ff]"
      : isActive
      ? "border-[#20251f] bg-[#eef3e8]"
      : "border-[#e4e2d7] hover:border-[#a7b599] hover:bg-[#f9faf4]",
  ].join(" ");
}

function getCartLineTotal(unitPrice: number, quantity: number) {
  return unitPrice * quantity;
}

function restaurantArticleClass(isCartRestaurant: boolean) {
  return [
    "rounded-lg border bg-white transition",
    isCartRestaurant
      ? "border-[#38bdf8] shadow-[0_0_0_2px_rgba(56,189,248,0.18)]"
      : "border-[#deddd4]",
  ].join(" ");
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const cartError = getRestaurantSlug(params?.cartError);
  const orderError = getRestaurantSlug(params?.orderError);
  const selectedRestaurantSlug = getRestaurantSlug(params?.restaurant);
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const [restaurantFilters, restaurants, activeCarts] = await Promise.all([
    listOpenRestaurantFilters(),
    listOpenRestaurants({
      restaurantSlug: selectedRestaurantSlug,
    }),
    listActiveCarts(currentUser.id),
  ]);
  const selectedRestaurant = restaurantFilters.find(
    (restaurant) => restaurant.slug === selectedRestaurantSlug,
  );
  const activeRestaurantIds = new Set(
    activeCarts.map((cart) => cart.restaurantId),
  );
  const cartSummaries = activeCarts.map((cart) => {
    const subtotalAmount = cart.items.reduce(
      (itemTotal, item) =>
        itemTotal + getCartLineTotal(item.unitPrice, item.quantity),
      0,
    );
    const minOrderAmount = cart.restaurant.minOrderAmount;
    const remainingAmount = Math.max(minOrderAmount - subtotalAmount, 0);

    return {
      cart,
      minOrderAmount,
      remainingAmount,
      subtotalAmount,
    };
  });
  const cartItemCount = activeCarts.reduce(
    (total, cart) =>
      total + cart.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0),
    0,
  );
  const cartSubtotal = activeCarts.reduce(
    (total, cart) => total + cart.items.reduce(
      (itemTotal, item) =>
        itemTotal + getCartLineTotal(item.unitPrice, item.quantity),
      0,
    ),
    0,
  );
  const cartDeliveryFee = activeCarts.reduce(
    (total, cart) => total + cart.restaurant.deliveryFee,
    0,
  );
  const hasMultipleRestaurantCarts = cartSummaries.length > 1;
  const canPlaceOrder =
    cartItemCount > 0 &&
    !hasMultipleRestaurantCarts &&
    cartSummaries.every((summary) => summary.remainingAmount === 0);

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#20231f]">
      <CartScrollRestorer />
      <section className="border-b border-[#deddd4] bg-[#ffffff] px-5 py-4">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#66715f]">
              Delivery
            </p>
            <h1 className="text-2xl font-semibold tracking-normal">동네한끼</h1>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <div className="text-sm text-[#60675d] sm:text-right">
              <p className="font-medium text-[#20231f]">강남구 테헤란로</p>
              <p>지금 주문 가능</p>
            </div>
            {currentUser ? (
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="font-medium text-[#20231f]">
                  {currentUser.name}
                </span>
                <Link
                  className="flex h-9 items-center rounded-md border border-[#c9c7ba] px-3 font-semibold text-[#3f453c] transition hover:bg-[#f0eee4]"
                  href="/orders"
                >
                  내 주문
                </Link>
                <form action={logoutAction}>
                  <button
                    className="h-9 rounded-md border border-[#c9c7ba] px-3 font-semibold text-[#3f453c] transition hover:bg-[#f0eee4]"
                    type="submit"
                  >
                    로그아웃
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex gap-2 text-sm">
                <Link
                  className="flex h-9 items-center rounded-md border border-[#c9c7ba] px-3 font-semibold text-[#3f453c] transition hover:bg-[#f0eee4]"
                  href="/login"
                >
                  로그인
                </Link>
                <Link
                  className="flex h-9 items-center rounded-md bg-[#20251f] px-3 font-semibold text-white transition hover:bg-[#3c4537]"
                  href="/signup"
                >
                  회원가입
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-6 lg:grid-cols-[280px_minmax(0,1fr)_300px]">
        <aside className="flex flex-col gap-3">
          <div className="rounded-lg border border-[#deddd4] bg-white p-4">
            <p className="text-sm font-semibold text-[#66715f]">가게</p>
            <div className="mt-4 flex flex-col gap-2">
              <Link className={filterLinkClass(!selectedRestaurantSlug)} href="/">
                <p className="font-semibold">전체 식당</p>
                <p className="mt-1 text-sm text-[#62695f]">
                  {restaurantFilters.length}곳 보기
                </p>
              </Link>
              {restaurantFilters.map((restaurant) => {
                const isCartRestaurant = activeRestaurantIds.has(restaurant.id);

                return (
                  <Link
                    className={filterLinkClass(
                      selectedRestaurantSlug === restaurant.slug,
                      isCartRestaurant,
                    )}
                    href={`/?restaurant=${restaurant.slug}`}
                    key={restaurant.id}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold">{restaurant.name}</p>
                      {isCartRestaurant ? (
                        <span className="rounded-md bg-[#bae6fd] px-2 py-0.5 text-[11px] font-semibold text-[#075985]">
                          담김
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-[#62695f]">
                      최소주문 {formatPrice(restaurant.minOrderAmount)}원
                    </p>
                    <p className="mt-1 text-xs text-[#7d8378]">
                      메뉴 {restaurant._count.menuItems}개 · 배달비{" "}
                      {formatPrice(restaurant.deliveryFee)}원
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="flex flex-col gap-5">
          {restaurants.length === 0 ? (
            <div className="rounded-lg border border-[#deddd4] bg-white p-6">
              <h2 className="text-xl font-semibold">
                {selectedRestaurantSlug
                  ? "선택한 식당을 찾을 수 없습니다"
                  : "영업 중인 가게가 없습니다"}
              </h2>
              <p className="mt-2 text-sm text-[#62695f]">
                왼쪽 필터에서 다른 식당을 선택해주세요.
              </p>
            </div>
          ) : (
            restaurants.map((restaurant) => {
              const isCartRestaurant = activeRestaurantIds.has(restaurant.id);

              return (
              <article
                className={restaurantArticleClass(isCartRestaurant)}
                id={restaurant.slug}
                key={restaurant.id}
              >
                <div className="border-b border-[#e4e2d7] p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#66715f]">
                        {restaurant.opensAt} - {restaurant.closesAt}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <h2 className="text-2xl font-semibold">
                          {restaurant.name}
                        </h2>
                        {isCartRestaurant ? (
                          <span className="rounded-md bg-[#bae6fd] px-2 py-1 text-xs font-semibold text-[#075985]">
                            장바구니 식당
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#62695f]">
                        {restaurant.description}
                      </p>
                    </div>
                    <div className="rounded-md bg-[#eef3e8] px-3 py-2 text-sm text-[#3e493a]">
                      배달비 {formatPrice(restaurant.deliveryFee)}원
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-6 p-5">
                  {restaurant.categories.map((category) => (
                    <section key={category.id}>
                      <h3 className="text-lg font-semibold">{category.name}</h3>
                      <div className="mt-3 grid gap-3">
                        {category.items.map((item) => (
                          <div
                            className="grid gap-3 rounded-lg border border-[#e4e2d7] p-4 sm:grid-cols-[1fr_auto]"
                            id={`menu-item-${item.id}`}
                            key={item.id}
                          >
                            <div>
                              <p className="font-semibold">{item.name}</p>
                              {item.description ? (
                                <p className="mt-1 text-sm leading-6 text-[#62695f]">
                                  {item.description}
                                </p>
                              ) : null}
                            </div>
                            <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                              <p className="font-semibold">
                                {formatPrice(item.price)}원
                              </p>
                              <form
                                action={addCartItemAction}
                                data-scroll-anchor={`#menu-item-${item.id}`}
                                data-preserve-scroll="true"
                              >
                                <input
                                  name="menuItemId"
                                  type="hidden"
                                  value={item.id}
                                />
                                <input
                                  name="scrollTarget"
                                  type="hidden"
                                  value={`menu-item-${item.id}`}
                                />
                                <button
                                  className="h-9 rounded-md bg-[#20251f] px-4 text-sm font-semibold text-white transition hover:bg-[#3c4537]"
                                  data-testid={`add-cart-${item.id}`}
                                  type="submit"
                                >
                                  담기
                                </button>
                              </form>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </article>
              );
            })
          )}
        </section>

        <aside className="lg:sticky lg:top-5 lg:self-start" id="order-panel">
          <div className="rounded-lg border border-[#deddd4] bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">주문</h2>
              <span className="rounded-md bg-[#f0eee4] px-2 py-1 text-xs font-semibold text-[#5f665c]">
                MVP
              </span>
            </div>
            <p className="mt-2 text-sm text-[#62695f]">
              {selectedRestaurant
                ? `${selectedRestaurant.name} 메뉴만 보고 있습니다.`
                : "전체 식당 메뉴를 보고 있습니다."}
            </p>
            {cartItemCount === 0 ? (
              <div className="mt-5 rounded-md border border-dashed border-[#cbc9bd] p-4 text-sm leading-6 text-[#62695f]">
                <p>아직 담은 메뉴가 없습니다.</p>
                <p className="mt-1">먹고 싶은 메뉴를 선택해 담아보세요.</p>
              </div>
            ) : (
              <div className="mt-5 flex flex-col gap-4">
                {orderError === "min-order" ? (
                  <p className="rounded-md bg-[#fff1ef] px-3 py-2 text-sm text-[#a53622]">
                    최소주문금액을 채워야 주문할 수 있습니다.
                  </p>
                ) : null}
                {cartError === "different-restaurant" ? (
                  <p className="rounded-md bg-[#fff1ef] px-3 py-2 text-sm text-[#a53622]">
                    한 번에 한 식당 메뉴만 담을 수 있습니다. 기존 식당
                    장바구니를 비운 뒤 다른 식당 메뉴를 담아주세요.
                  </p>
                ) : null}
                {hasMultipleRestaurantCarts ? (
                  <p className="rounded-md bg-[#fff1ef] px-3 py-2 text-sm text-[#a53622]">
                    여러 식당 장바구니가 있습니다. 한 식당만 남기고 모두
                    취소해야 주문할 수 있습니다.
                  </p>
                ) : null}

                {cartSummaries.map(
                  ({ cart, minOrderAmount, remainingAmount, subtotalAmount }) => (
                  <section
                    className="rounded-md border border-[#e4e2d7] p-4"
                    id={`cart-${cart.id}`}
                    key={cart.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{cart.restaurant.name}</p>
                        <p className="mt-1 text-xs text-[#62695f]">
                          배달비 {formatPrice(cart.restaurant.deliveryFee)}원
                        </p>
                      </div>
                      <form
                        action={clearCartAction}
                        data-scroll-anchor="#order-panel"
                        data-preserve-scroll="true"
                      >
                        <input name="cartId" type="hidden" value={cart.id} />
                        <input
                          name="scrollTarget"
                          type="hidden"
                          value="order-panel"
                        />
                        <button
                          className="text-xs font-semibold text-[#8a3a29] underline-offset-2 hover:underline"
                          type="submit"
                        >
                          모두 취소
                        </button>
                      </form>
                    </div>

                    <div className="mt-3 flex flex-col gap-3">
                      {cart.items.map((item) => (
                        <div
                          className="grid grid-cols-[1fr_auto] gap-3 border-t border-[#eeeade] pt-3"
                          id={`cart-item-${item.id}`}
                          key={item.id}
                        >
                          <div>
                            <p className="text-sm font-semibold">
                              {item.menuItem.name}
                            </p>
                            <p className="mt-1 text-xs text-[#62695f]">
                              {formatPrice(item.unitPrice)}원 × {item.quantity}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <p className="text-sm font-semibold">
                              {formatPrice(
                                getCartLineTotal(item.unitPrice, item.quantity),
                              )}
                              원
                            </p>
                            <div className="flex h-8 items-center overflow-hidden rounded-md border border-[#c9c7ba] bg-white">
                              <form
                                action={decrementCartItemAction}
                                data-scroll-anchor="#order-panel"
                                data-preserve-scroll="true"
                              >
                                <input
                                  name="cartItemId"
                                  type="hidden"
                                  value={item.id}
                                />
                                <input
                                  name="scrollTarget"
                                  type="hidden"
                                  value="order-panel"
                                />
                                <button
                                  aria-label={`${item.menuItem.name} 수량 줄이기`}
                                  className="flex h-8 w-8 items-center justify-center text-base font-semibold text-[#4d5549] transition hover:bg-[#effaff]"
                                  data-testid={`decrement-cart-${item.id}`}
                                  type="submit"
                                >
                                  -
                                </button>
                              </form>
                              <span className="flex h-8 min-w-8 items-center justify-center border-x border-[#d8d3c5] px-2 text-sm font-semibold">
                                {item.quantity}
                              </span>
                              <form
                                action={addCartItemAction}
                                data-scroll-anchor={`#cart-item-${item.id}`}
                                data-preserve-scroll="true"
                              >
                                <input
                                  name="menuItemId"
                                  type="hidden"
                                  value={item.menuItemId}
                                />
                                <input
                                  name="scrollTarget"
                                  type="hidden"
                                  value={`cart-item-${item.id}`}
                                />
                                <button
                                  aria-label={`${item.menuItem.name} 수량 늘리기`}
                                  className="flex h-8 w-8 items-center justify-center text-base font-semibold text-[#4d5549] transition hover:bg-[#effaff]"
                                  data-testid={`increment-cart-${item.id}`}
                                  type="submit"
                                >
                                  +
                                </button>
                              </form>
                            </div>
                            <form
                              action={removeCartItemAction}
                              data-scroll-anchor="#order-panel"
                              data-preserve-scroll="true"
                            >
                              <input
                                name="cartItemId"
                                type="hidden"
                                value={item.id}
                              />
                              <input
                                name="scrollTarget"
                                type="hidden"
                                value="order-panel"
                              />
                              <button
                                className="text-xs font-semibold text-[#8a3a29] underline-offset-2 hover:underline"
                                data-testid={`remove-cart-${item.id}`}
                                type="submit"
                              >
                                취소
                              </button>
                            </form>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-md bg-[#f7f7f4] p-3 text-xs leading-5 text-[#62695f]">
                      <div className="flex justify-between">
                        <span>이 식당 메뉴 합계</span>
                        <span className="font-semibold text-[#20231f]">
                          {formatPrice(subtotalAmount)}원
                        </span>
                      </div>
                      <div className="mt-1 flex justify-between">
                        <span>최소주문금액</span>
                        <span>{formatPrice(minOrderAmount)}원</span>
                      </div>
                      {remainingAmount > 0 ? (
                        <p className="mt-2 font-semibold text-[#8a3a29]">
                          {formatPrice(remainingAmount)}원 더 담아야 주문할 수
                          있습니다.
                        </p>
                      ) : (
                        <p className="mt-2 font-semibold text-[#3e493a]">
                          최소주문금액을 채웠습니다.
                        </p>
                      )}
                    </div>
                  </section>
                  ),
                )}

                <div className="rounded-md bg-[#f0eee4] p-4 text-sm">
                  <div className="flex justify-between">
                    <span>메뉴 합계</span>
                    <span className="font-semibold">
                      {formatPrice(cartSubtotal)}원
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between text-[#62695f]">
                    <span>배달비</span>
                    <span>{formatPrice(cartDeliveryFee)}원</span>
                  </div>
                  <div className="mt-3 flex justify-between border-t border-[#d8d3c5] pt-3 text-base font-semibold">
                    <span>예상 결제금액</span>
                    <span>{formatPrice(cartSubtotal + cartDeliveryFee)}원</span>
                  </div>
                </div>

                <form action="/checkout" method="get">
                  <button
                    className="h-11 w-full rounded-md bg-[#20251f] text-sm font-semibold text-white transition hover:bg-[#3c4537] disabled:cursor-not-allowed disabled:bg-[#9aa196]"
                    disabled={!canPlaceOrder}
                    type="submit"
                  >
                    {canPlaceOrder
                      ? "주문하기"
                      : hasMultipleRestaurantCarts
                        ? "한 식당만 선택해주세요"
                        : "최소주문금액을 채워주세요"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
