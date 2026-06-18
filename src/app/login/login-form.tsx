"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type AuthFormState } from "@/server/actions/auth.actions";

const initialState: AuthFormState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-semibold text-[#3f453c]" htmlFor="email">
          이메일
        </label>
        <input
          autoComplete="email"
          className="mt-2 h-11 w-full rounded-md border border-[#d8d6ca] bg-white px-3 text-sm outline-none focus:border-[#8d9b7f]"
          defaultValue={state.values?.email}
          id="email"
          name="email"
          required
          type="email"
        />
      </div>

      <div>
        <label
          className="text-sm font-semibold text-[#3f453c]"
          htmlFor="password"
        >
          비밀번호
        </label>
        <input
          autoComplete="current-password"
          className="mt-2 h-11 w-full rounded-md border border-[#d8d6ca] bg-white px-3 text-sm outline-none focus:border-[#8d9b7f]"
          id="password"
          name="password"
          required
          type="password"
        />
      </div>

      {state.error ? (
        <p className="rounded-md bg-[#fff1ef] px-3 py-2 text-sm text-[#a53622]">
          {state.error}
        </p>
      ) : null}

      <button
        className="h-11 rounded-md bg-[#20251f] text-sm font-semibold text-white transition hover:bg-[#3c4537] disabled:cursor-not-allowed disabled:bg-[#9aa196]"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "로그인 중" : "로그인"}
      </button>

      <p className="text-center text-sm text-[#62695f]">
        아직 계정이 없나요?{" "}
        <Link className="font-semibold text-[#20251f]" href="/signup">
          회원가입
        </Link>
      </p>
    </form>
  );
}

