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
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <div>
        <label
          className="text-sm font-bold text-[var(--foreground)]"
          htmlFor="nickname"
        >
          닉네임
        </label>
        <input
          autoComplete="nickname"
          className="form-input mt-2"
          defaultValue={state.values?.nickname}
          id="nickname"
          name="nickname"
          required
          type="text"
        />
      </div>

      <div>
        <label
          className="text-sm font-bold text-[var(--foreground)]"
          htmlFor="email"
        >
          이메일
        </label>
        <input
          autoComplete="email"
          className="form-input mt-2"
          defaultValue={state.values?.email}
          id="email"
          name="email"
          required
          type="email"
        />
      </div>

      <div>
        <label
          className="text-sm font-bold text-[var(--foreground)]"
          htmlFor="phone"
        >
          전화번호
        </label>
        <input
          autoComplete="tel"
          className="form-input mt-2"
          defaultValue={state.values?.phone}
          id="phone"
          name="phone"
          placeholder="선택"
          type="tel"
        />
      </div>

      <div>
        <label
          className="text-sm font-bold text-[var(--foreground)]"
          htmlFor="password"
        >
          비밀번호
        </label>
        <input
          autoComplete="new-password"
          className="form-input mt-2"
          id="password"
          minLength={8}
          name="password"
          required
          type="password"
        />
      </div>

      {state.error ? (
        <p className="notice-danger">{state.error}</p>
      ) : null}

      <button
        className="button-primary h-11 w-full"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "가입 중" : "회원가입"}
      </button>

      <p className="text-center text-sm text-[var(--muted)]">
        이미 계정이 있나요?{" "}
        <Link className="font-black text-[var(--brand-dark)]" href="/login">
          로그인
        </Link>
      </p>
    </form>
  );
}
