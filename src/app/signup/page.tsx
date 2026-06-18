import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import { SignupForm } from "./signup-form";

export default async function SignupPage() {
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
          <h1 className="mt-2 text-3xl font-semibold">회원가입</h1>
          <p className="mt-2 text-sm leading-6 text-[#62695f]">
            닉네임, 이메일, 비밀번호만으로 간단하게 시작합니다.
          </p>
        </div>
        <SignupForm />
      </section>
    </main>
  );
}
