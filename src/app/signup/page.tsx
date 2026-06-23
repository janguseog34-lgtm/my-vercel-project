import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import { SignupForm } from "./signup-form";

export default async function SignupPage() {
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
                <span className="brand-mark">모</span>
                <span>
                  <span className="block text-xl font-black">모락한끼</span>
                  <span className="block text-sm font-semibold text-white/82">
                    가까운 식당 메뉴를 한 번에
                  </span>
                </span>
              </div>
              <span className="auth-chip">신규 주문 준비</span>
            </div>

            <div className="max-w-xl">
              <p className="auth-chip">지금 가입하고 주문하기</p>
              <h1 className="mt-4 text-4xl font-black leading-tight tracking-normal sm:text-5xl">
                좋아하는 메뉴를 장바구니에 담아보세요.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/82">
                닉네임과 이메일만으로 시작하고, 주문 내역은 계정에 저장됩니다.
              </p>
            </div>

            <div className="auth-stats">
              <div className="auth-stat">
                <p className="text-xs font-bold text-white/72">식당</p>
                <p className="mt-1 text-2xl font-black">3곳</p>
              </div>
              <div className="auth-stat">
                <p className="text-xs font-bold text-white/72">메뉴</p>
                <p className="mt-1 text-2xl font-black">37개</p>
              </div>
              <div className="auth-stat">
                <p className="text-xs font-bold text-white/72">로그인</p>
                <p className="mt-1 text-lg font-black">이메일</p>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-form-panel">
          <div>
            <p className="eyebrow">모락한끼</p>
            <h2 className="mt-2 text-3xl font-black">회원가입</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              닉네임, 이메일, 비밀번호만으로 간단하게 시작합니다.
            </p>
          </div>
          <SignupForm />
        </div>
      </section>
    </main>
  );
}
