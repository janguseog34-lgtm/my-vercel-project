import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-[#f7f7f4] px-5 py-10 text-[#20231f]">
      <section className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-lg border border-[#deddd4] bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#66715f]">
            동네한끼
          </p>
          <h1 className="mt-2 text-3xl font-semibold">로그인</h1>
          <p className="mt-2 text-sm leading-6 text-[#62695f]">
            이메일과 비밀번호로 주문을 이어가세요.
          </p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}

