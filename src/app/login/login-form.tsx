"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type AuthFormState } from "@/server/actions/auth.actions";

const initialState: AuthFormState = {};

type LoginFormProps = {
  resetFields?: boolean;
};

export function LoginForm({ resetFields = false }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );
  const inputAutocomplete = resetFields ? "off" : undefined;

  return (
    <form
      action={formAction}
      autoComplete={inputAutocomplete}
      className="mt-6 flex flex-col gap-4"
      key={resetFields ? "logged-out-login-form" : "login-form"}
    >
      <div>
        <label
          className="text-sm font-bold text-[var(--foreground)]"
          htmlFor="email"
        >
          이메일
        </label>
        <input
          autoComplete={resetFields ? "off" : "email"}
          className="form-input mt-2"
          defaultValue={resetFields ? "" : state.values?.email}
          id="email"
          name="email"
          required
          type="email"
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
          autoComplete={resetFields ? "off" : "current-password"}
          className="form-input mt-2"
          defaultValue=""
          id="password"
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
        {isPending ? "로그인 중" : "로그인"}
      </button>

      <p className="text-center text-sm text-[var(--muted)]">
        아직 계정이 없나요?{" "}
        <Link className="font-black text-[var(--brand-dark)]" href="/signup">
          회원가입
        </Link>
      </p>
    </form>
  );
}
