import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { CartActionForm } from "@/app/cart-action-form";
import {
  listOpenRestaurantFilters,
  listOpenRestaurants,
} from "@/server/services/restaurants.service";
import { getCurrentUser } from "@/server/auth/current-user";
import { logoutAction } from "@/server/actions/auth.actions";
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
    "filter-card",
    isActive ? "filter-card-active" : "",
    isCartRestaurant ? "filter-card-cart" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function getCartLineTotal(unitPrice: number, quantity: number) {
  return unitPrice * quantity;
}

function restaurantArticleClass(isCartRestaurant: boolean) {
  return [
    "restaurant-panel",
    isCartRestaurant ? "restaurant-panel-cart" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function getRestaurantCoverImage(slug: string) {
  const coverImages: Record<string, string> = {
    "dondeun-lunchbox": "/images/restaurant-dosirak.png",
    "gangnam-bunsik": "/images/restaurant-bunsik.png",
    "seoul-chicken-house": "/images/restaurant-chicken.png",
  };

  return coverImages[slug] ?? "/images/auth-food-spread.png";
}

function getMenuImage(name: string) {
  const menuImages: Record<string, string> = {
    "후라이드 치킨": "/images/menu-items/fried-chicken.webp",
    "양념 치킨": "/images/menu-items/yangnyeom-chicken.webp",
    "간장마늘 치킨": "/images/menu-items/soy-garlic-chicken.webp",
    "매콤 청양 치킨": "/images/menu-items/spicy-cheongyang-chicken.webp",
    "순살 반반 치킨": "/images/menu-items/half-half-boneless-chicken.webp",
    "허니버터 순살": "/images/menu-items/honey-butter-boneless.webp",
    "감자튀김": "/images/menu-items/french-fries.webp",
    "치즈볼 6개": "/images/menu-items/cheese-balls.webp",
    "닭껍질 튀김": "/images/menu-items/fried-chicken-skin.webp",
    "콘샐러드": "/images/menu-items/corn-salad.webp",
    "콜라 500ml": "/images/menu-items/cola-500ml.webp",
    "사이다 500ml": "/images/menu-items/cider-500ml.webp",
    "제로콜라 500ml": "/images/menu-items/zero-cola-500ml.webp",
    "국물 떡볶이": "/images/menu-items/soupy-tteokbokki.webp",
    "로제 떡볶이": "/images/menu-items/rose-tteokbokki.webp",
    "치즈 라볶이": "/images/menu-items/cheese-rabokki.webp",
    "참치 김밥": "/images/menu-items/tuna-kimbap.webp",
    "소고기 김밥": "/images/menu-items/beef-kimbap.webp",
    "찰순대": "/images/menu-items/sundae.webp",
    "모듬 튀김": "/images/menu-items/assorted-tempura.webp",
    "김말이 튀김": "/images/menu-items/gimmari-tempura.webp",
    "오징어 튀김": "/images/menu-items/squid-tempura.webp",
    "고구마 튀김": "/images/menu-items/sweet-potato-tempura.webp",
    "쿨피스 복숭아": "/images/menu-items/peach-coolpis.webp",
    "캔 식혜": "/images/menu-items/canned-sikhye.webp",
    "제육 도시락": "/images/menu-items/jeyuk-dosirak.webp",
    "불고기 도시락": "/images/menu-items/bulgogi-dosirak.webp",
    "수제 돈까스 도시락": "/images/menu-items/pork-cutlet-dosirak.webp",
    "치킨마요 도시락": "/images/menu-items/chicken-mayo-dosirak.webp",
    "연어구이 도시락": "/images/menu-items/grilled-salmon-dosirak.webp",
    "소고기 비빔밥 도시락": "/images/menu-items/beef-bibimbap-dosirak.webp",
    "된장국": "/images/menu-items/doenjang-soup.webp",
    "김치찌개": "/images/menu-items/kimchi-jjigae.webp",
    "소고기 미역국": "/images/menu-items/beef-seaweed-soup.webp",
    "육개장": "/images/menu-items/yukgaejang.webp",
    "계란말이 추가": "/images/menu-items/rolled-omelet.webp",
    "메추리알 장조림": "/images/menu-items/quail-egg-jangjorim.webp",
  };

  return menuImages[name] ?? "/images/auth-food-spread.png";
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
      total +
      cart.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0),
    0,
  );
  const cartSubtotal = activeCarts.reduce(
    (total, cart) =>
      total +
      cart.items.reduce(
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
    <main className="app-screen">
      <header className="site-header">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Link className="brand-lockup" href="/">
            <span className="brand-mark">모</span>
            <span className="min-w-0">
              <span className="block text-lg font-black">모락한끼</span>
              <span className="block text-xs font-semibold text-[var(--muted)]">
                강남구 테헤란로
              </span>
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-lg bg-[var(--mint)] px-3 py-2 font-bold text-[#256347]">
              지금 주문 가능
            </span>
            <span className="rounded-lg bg-white px-3 py-2 font-bold text-[var(--foreground)] ring-1 ring-[var(--line)]">
              {currentUser.name}
            </span>
            <Link className="button-secondary" href="/orders">
              내 주문
            </Link>
            <form action={logoutAction}>
              <button className="button-secondary" type="submit">
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 pt-5 sm:px-6">
        <div className="home-hero grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_360px] md:p-6">
          <div>
            <p className="eyebrow">오늘의 동네 배달</p>
            <h1 className="mt-2 text-3xl font-black tracking-normal text-[var(--foreground)] sm:text-4xl">
              먹고 싶은 메뉴를 고르고 바로 주문하세요.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              한 식당 메뉴만 장바구니에 담을 수 있고, 최소주문금액을 채우면
              주소 입력 후 주문이 저장됩니다.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 self-end">
            <div className="metric-pill">
              <p className="text-xs font-bold text-[var(--muted)]">영업 식당</p>
              <p className="mt-1 text-2xl font-black">
                {restaurantFilters.length}
              </p>
            </div>
            <div className="metric-pill">
              <p className="text-xs font-bold text-[var(--muted)]">담은 메뉴</p>
              <p className="mt-1 text-2xl font-black">{cartItemCount}</p>
            </div>
            <div className="metric-pill">
              <p className="text-xs font-bold text-[var(--muted)]">메뉴 합계</p>
              <p className="mt-1 text-lg font-black">
                {formatPrice(cartSubtotal)}원
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[270px_minmax(0,1fr)_340px]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="panel p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Restaurant</p>
                <h2 className="mt-1 text-lg font-black">식당 선택</h2>
              </div>
              <span className="rounded-lg bg-[var(--brand-soft)] px-2 py-1 text-xs font-black text-[var(--brand-dark)]">
                {restaurantFilters.length}곳
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <Link className={filterLinkClass(!selectedRestaurantSlug)} href="/">
                <span className="block font-black">전체 식당</span>
                <span className="mt-1 block text-sm text-[var(--muted)]">
                  모든 메뉴를 한눈에 보기
                </span>
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
                    <span className="flex items-start justify-between gap-2">
                      <span className="font-black">{restaurant.name}</span>
                      {isCartRestaurant ? (
                        <span className="rounded-md bg-[#bae6fd] px-2 py-0.5 text-[11px] font-black text-[#075985]">
                          담김
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1 block text-sm text-[var(--muted)]">
                      최소주문 {formatPrice(restaurant.minOrderAmount)}원
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-[#7b887d]">
                      메뉴 {restaurant._count.menuItems}개 · 배달비{" "}
                      {formatPrice(restaurant.deliveryFee)}원
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="flex flex-col gap-5">
          {restaurants.length === 0 ? (
            <div className="panel p-6">
              <h2 className="text-xl font-black">
                {selectedRestaurantSlug
                  ? "선택한 식당을 찾을 수 없습니다"
                  : "영업 중인 가게가 없습니다"}
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                왼쪽 필터에서 다른 식당을 선택해주세요.
              </p>
            </div>
          ) : (
            restaurants.map((restaurant) => {
              const isCartRestaurant = activeRestaurantIds.has(restaurant.id);
              const coverImage = getRestaurantCoverImage(restaurant.slug);

              return (
                <article
                  className={restaurantArticleClass(isCartRestaurant)}
                  id={restaurant.slug}
                  key={restaurant.id}
                >
                  <div className="restaurant-head p-5">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                      <div>
                        <p className="text-sm font-bold text-[var(--brand-dark)]">
                          {restaurant.opensAt} - {restaurant.closesAt}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <h2 className="text-2xl font-black">
                            {restaurant.name}
                          </h2>
                          {isCartRestaurant ? (
                            <span className="rounded-md bg-[#bae6fd] px-2 py-1 text-xs font-black text-[#075985]">
                              장바구니 식당
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                          {restaurant.description}
                        </p>

                        <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:max-w-md">
                          <div className="rounded-lg bg-white/80 p-3 ring-1 ring-[var(--line)]">
                            <p className="text-xs font-bold text-[var(--muted)]">
                              최소주문
                            </p>
                            <p className="mt-1 font-black">
                              {formatPrice(restaurant.minOrderAmount)}원
                            </p>
                          </div>
                          <div className="rounded-lg bg-white/80 p-3 ring-1 ring-[var(--line)]">
                            <p className="text-xs font-bold text-[var(--muted)]">
                              배달비
                            </p>
                            <p className="mt-1 font-black">
                              {formatPrice(restaurant.deliveryFee)}원
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="restaurant-cover">
                        <Image
                          alt={`${restaurant.name} 대표 음식 사진`}
                          className="restaurant-cover-image"
                          height={315}
                          src={coverImage}
                          width={560}
                        />
                        <div className="restaurant-cover-badge">
                          메뉴 {restaurant.categories.reduce(
                            (total, category) => total + category.items.length,
                            0,
                          )}
                          개
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-6 p-5">
                    {restaurant.categories.map((category) => (
                      <section key={category.id}>
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-lg font-black">{category.name}</h3>
                          <span className="text-xs font-bold text-[var(--muted)]">
                            {category.items.length}개
                          </span>
                        </div>
                        <div className="menu-grid mt-3">
                          {category.items.map((item) => (
                            <div
                              className="menu-card"
                              id={`menu-item-${item.id}`}
                              key={item.id}
                            >
                              <div className="menu-photo-frame">
                                <Image
                                  alt={`${item.name} 사진`}
                                  className="menu-photo-image"
                                  height={420}
                                  sizes="(max-width: 640px) 112px, 132px"
                                  src={item.imageUrl ?? getMenuImage(item.name)}
                                  width={420}
                                />
                              </div>

                              <div className="min-w-0">
                                <p className="font-black">{item.name}</p>
                                {item.description ? (
                                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                                    {item.description}
                                  </p>
                                ) : null}
                              </div>

                              <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center">
                                <p className="whitespace-nowrap font-black">
                                  {formatPrice(item.price)}원
                                </p>
                                <CartActionForm
                                  buttonClassName="button-primary min-w-20"
                                  kind="add"
                                  menuItemId={item.id}
                                  scrollTarget={`menu-item-${item.id}`}
                                  testId={`add-cart-${item.id}`}
                                >
                                  담기
                                </CartActionForm>
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

        <aside className="lg:sticky lg:top-24 lg:self-start" id="order-panel">
          <div className="panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Cart</p>
                <h2 className="mt-1 text-xl font-black">주문</h2>
              </div>
              <span className="rounded-lg bg-[var(--gold)] px-3 py-2 text-xs font-black text-[#6d5812]">
                {cartItemCount}개
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {selectedRestaurant
                ? `${selectedRestaurant.name} 메뉴만 보고 있습니다.`
                : "전체 식당 메뉴를 보고 있습니다."}
            </p>

            {cartItemCount === 0 ? (
              <div className="mt-5 rounded-lg border border-dashed border-[var(--line-strong)] bg-[var(--surface-soft)] p-4 text-sm leading-6 text-[var(--muted)]">
                <p className="font-bold text-[var(--foreground)]">
                  아직 담은 메뉴가 없습니다.
                </p>
                <p className="mt-1">먹고 싶은 메뉴를 선택해 담아보세요.</p>
              </div>
            ) : (
              <div className="mt-5 flex flex-col gap-4">
                {orderError === "min-order" ? (
                  <p className="notice-danger">
                    최소주문금액을 채워야 주문할 수 있습니다.
                  </p>
                ) : null}
                {cartError === "different-restaurant" ? (
                  <p className="notice-danger">
                    한 번에 한 식당 메뉴만 담을 수 있습니다. 기존 식당
                    장바구니를 비운 뒤 다른 식당 메뉴를 담아주세요.
                  </p>
                ) : null}
                {hasMultipleRestaurantCarts ? (
                  <p className="notice-danger">
                    여러 식당 장바구니가 있습니다. 한 식당만 남기고 모두
                    취소해야 주문할 수 있습니다.
                  </p>
                ) : null}

                {cartSummaries.map(
                  ({ cart, minOrderAmount, remainingAmount, subtotalAmount }) => (
                    <section
                      className="border-t border-[var(--line)] pt-4 first:border-t-0 first:pt-0"
                      id={`cart-${cart.id}`}
                      key={cart.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black">{cart.restaurant.name}</p>
                          <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
                            배달비 {formatPrice(cart.restaurant.deliveryFee)}원
                          </p>
                        </div>
                        <CartActionForm
                          buttonClassName="button-danger min-h-8 px-3"
                          cartId={cart.id}
                          kind="clear"
                          scrollTarget="order-panel"
                        >
                          모두 취소
                        </CartActionForm>
                      </div>

                      <div className="mt-3 flex flex-col gap-3">
                        {cart.items.map((item) => (
                          <div
                            className="grid grid-cols-[1fr_auto] gap-3 rounded-lg bg-[var(--surface-soft)] p-3"
                            id={`cart-item-${item.id}`}
                            key={item.id}
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-black">
                                {item.menuItem.name}
                              </p>
                              <p className="mt-1 text-xs text-[var(--muted)]">
                                {formatPrice(item.unitPrice)}원 × {item.quantity}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <p className="text-sm font-black">
                                {formatPrice(
                                  getCartLineTotal(
                                    item.unitPrice,
                                    item.quantity,
                                  ),
                                )}
                                원
                              </p>
                              <div className="quantity-control">
                                <CartActionForm
                                  ariaLabel={`${item.menuItem.name} 수량 줄이기`}
                                  buttonClassName="quantity-button"
                                  cartItemId={item.id}
                                  kind="decrement"
                                  scrollTarget="order-panel"
                                  testId={`decrement-cart-${item.id}`}
                                >
                                  -
                                </CartActionForm>
                                <span className="quantity-value">
                                  {item.quantity}
                                </span>
                                <CartActionForm
                                  ariaLabel={`${item.menuItem.name} 수량 늘리기`}
                                  buttonClassName="quantity-button"
                                  kind="add"
                                  menuItemId={item.menuItemId}
                                  scrollTarget={`cart-item-${item.id}`}
                                  testId={`increment-cart-${item.id}`}
                                >
                                  +
                                </CartActionForm>
                              </div>
                              <CartActionForm
                                buttonClassName="text-xs font-black text-[var(--danger)] underline-offset-2 hover:underline"
                                cartItemId={item.id}
                                kind="remove"
                                scrollTarget="order-panel"
                                testId={`remove-cart-${item.id}`}
                              >
                                취소
                              </CartActionForm>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="summary-box mt-4 text-xs leading-5 text-[var(--muted)]">
                        <div className="flex justify-between">
                          <span>이 식당 메뉴 합계</span>
                          <span className="font-black text-[var(--foreground)]">
                            {formatPrice(subtotalAmount)}원
                          </span>
                        </div>
                        <div className="mt-1 flex justify-between">
                          <span>최소주문금액</span>
                          <span>{formatPrice(minOrderAmount)}원</span>
                        </div>
                        {remainingAmount > 0 ? (
                          <p className="mt-2 font-black text-[var(--danger)]">
                            {formatPrice(remainingAmount)}원 더 담아야 주문할 수
                            있습니다.
                          </p>
                        ) : (
                          <p className="notice-good mt-2">
                            최소주문금액을 채웠습니다.
                          </p>
                        )}
                      </div>
                    </section>
                  ),
                )}

                <div className="summary-box text-sm">
                  <div className="flex justify-between">
                    <span>메뉴 합계</span>
                    <span className="font-black">
                      {formatPrice(cartSubtotal)}원
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between text-[var(--muted)]">
                    <span>배달비</span>
                    <span>{formatPrice(cartDeliveryFee)}원</span>
                  </div>
                  <div className="mt-3 flex justify-between border-t border-[var(--line-strong)] pt-3 text-base font-black">
                    <span>예상 결제금액</span>
                    <span>{formatPrice(cartSubtotal + cartDeliveryFee)}원</span>
                  </div>
                </div>

                <form action="/checkout" method="get">
                  <button
                    className="button-primary h-12 w-full"
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
