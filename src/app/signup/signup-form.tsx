"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpAction, type AuthFormState } from "@/server/actions/auth.actions";

const initialState: AuthFormState = {};

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(
    signUpAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label
          className="text-sm font-semibold text-[#3f453c]"
          htmlFor="nickname"
        >
          닉네임
        </label>
        <input
          autoComplete="nickname"
          className="mt-2 h-11 w-full rounded-md border border-[#d8d6ca] bg-white px-3 text-sm outline-none focus:border-[#8d9b7f]"
          defaultValue={state.values?.nickname}
          id="nickname"
          name="nickname"
          required
          type="text"
        />
      </div>

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
        <label className="text-sm font-semibold text-[#3f453c]" htmlFor="phone">
          전화번호
        </label>
        <input
          autoComplete="tel"
          className="mt-2 h-11 w-full rounded-md border border-[#d8d6ca] bg-white px-3 text-sm outline-none focus:border-[#8d9b7f]"
          defaultValue={state.values?.phone}
          id="phone"
          name="phone"
          placeholder="선택"
          type="tel"
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
          autoComplete="new-password"
          className="mt-2 h-11 w-full rounded-md border border-[#d8d6ca] bg-white px-3 text-sm outline-none focus:border-[#8d9b7f]"
          id="password"
          minLength={8}
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
        {isPending ? "가입 중" : "회원가입"}
      </button>

      <p className="text-center text-sm text-[#62695f]">
        이미 계정이 있나요?{" "}
        <Link className="font-semibold text-[#20251f]" href="/login">
          로그인
        </Link>
      </p>
    </form>
  );
}
