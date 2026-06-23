import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import { LoginForm } from "./login-form";

type LoginPageProps = {
  searchParams?: Promise<{
    loggedOut?: string | string[];
  }>;
};

function readSingleParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const isLoggedOut = readSingleParam(params?.loggedOut) === "1";
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect("/");
  }

  return (
    <main className="auth-screen flex min-h-screen items-center px-4 py-8 sm:px-6">
      <section className="auth-shell mx-auto grid md:grid-cols-[minmax(0,1.25fr)_430px]">
        <div className="auth-photo-panel">
          <div className="auth-photo-content">
            <div className="flex items-center justify-between gap-3">
              <div className="brand-lockup">
                <span className="brand-mascot-mark" aria-label="모락한끼 이모티콘">
                  <span className="brand-mascot-lid" />
                  <span className="brand-mascot-face">
                    <span className="brand-mascot-eye" />
                    <span className="brand-mascot-mouth">⌣</span>
                    <span className="brand-mascot-eye" />
                  </span>
                </span>
                <span>
                  <span className="block text-xl font-black">모락한끼</span>
                  <span className="block text-sm font-semibold text-white/82">
                    가까운 동네 맛집을 귀엽고 빠르게
                  </span>
                </span>
              </div>
              <span className="auth-chip">배달 25-35분</span>
            </div>

            <div className="max-w-xl">
              <p className="auth-chip">우리 동네 한 끼 친구</p>
              <h1 className="mt-4 text-4xl font-black leading-tight tracking-normal sm:text-5xl">
                모락모락 따뜻한 한 끼가 문 앞까지 와요.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/82">
                귀여운 배달 친구와 함께 오늘 먹고 싶은 메뉴를 고르고,
                주문 내역까지 편하게 확인하세요.
              </p>
            </div>

            <div className="auth-stats">
              <div className="auth-stat">
                <p className="text-xs font-bold text-white/72">영업 식당</p>
                <p className="mt-1 text-2xl font-black">3곳</p>
              </div>
              <div className="auth-stat">
                <p className="text-xs font-bold text-white/72">인기 메뉴</p>
                <p className="mt-1 text-2xl font-black">37개</p>
              </div>
              <div className="auth-stat">
                <p className="text-xs font-bold text-white/72">주문 방식</p>
                <p className="mt-1 text-lg font-black">간편</p>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-form-panel">
          <div>
            <p className="eyebrow">모락한끼</p>
            <h2 className="mt-2 text-3xl font-black">로그인</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              배고픈 순간을 놓치지 않도록, 내 장바구니와 주문 내역을 이어가세요.
            </p>
          </div>
          <LoginForm resetFields={isLoggedOut} />
        </div>
      </section>
    </main>
  );
}
