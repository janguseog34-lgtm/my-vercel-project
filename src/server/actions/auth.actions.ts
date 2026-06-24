"use server";

import { redirect } from "next/navigation";
import { clearSessionCookie, getSessionCookie, setSessionCookie } from "@/server/auth/cookies";

export type AuthFormState = {
  error?: string;
  values?: {
    email?: string;
    nickname?: string;
    phone?: string;
  };
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function isDuplicateEmailError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function signUpAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readString(formData, "email").toLowerCase();
  const nickname = readString(formData, "nickname");
  const phone = readString(formData, "phone");
  const password = readString(formData, "password");

  if (!email || !nickname || !password) {
    return {
      error: "닉네임, 이메일, 비밀번호를 입력해주세요.",
      values: { email, nickname, phone },
    };
  }

  if (!email.includes("@")) {
    return {
      error: "올바른 이메일 주소를 입력해주세요.",
      values: { email, nickname, phone },
    };
  }

  if (password.length < 8) {
    return {
      error: "비밀번호는 8자 이상이어야 합니다.",
      values: { email, nickname, phone },
    };
  }

  try {
    const { createUserSession, registerUser } = await import(
      "@/server/services/auth.service"
    );
    const user = await registerUser({
      email,
      nickname,
      password,
      phone,
    });
    const { token, session } = await createUserSession(user.id);

    await setSessionCookie(token, session.expiresAt);
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      return {
        error: "이미 가입된 이메일입니다.",
        values: { email, nickname, phone },
      };
    }

    return {
      error: "회원가입 중 문제가 생겼습니다. 잠시 후 다시 시도해주세요.",
      values: { email, nickname, phone },
    };
  }

  redirect("/");
}

export async function loginAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readString(formData, "email").toLowerCase();
  const password = readString(formData, "password");

  if (!email || !password) {
    return {
      error: "이메일과 비밀번호를 입력해주세요.",
      values: { email },
    };
  }

  let user;

  try {
    const { authenticateUser } = await import("@/server/services/auth.service");

    user = await authenticateUser(email, password);
  } catch {
    return {
      error: "로그인 서버 연결에 문제가 생겼습니다. 잠시 후 다시 시도해주세요.",
      values: { email },
    };
  }

  if (!user) {
    return {
      error: "이메일 또는 비밀번호가 올바르지 않습니다.",
      values: { email },
    };
  }

  try {
    const { createUserSession } = await import("@/server/services/auth.service");
    const { token, session } = await createUserSession(user.id);

    await setSessionCookie(token, session.expiresAt);
  } catch {
    return {
      error: "로그인 세션을 만드는 중 문제가 생겼습니다. 잠시 후 다시 시도해주세요.",
      values: { email },
    };
  }

  redirect("/");
}

export async function logoutAction() {
  const token = await getSessionCookie();

  if (token) {
    try {
      const { revokeUserSession } = await import("@/server/services/auth.service");

      await revokeUserSession(token);
    } catch {
      // Logging out should still clear the browser cookie even if the DB is unavailable.
    }
  }

  await clearSessionCookie();
  redirect("/login?loggedOut=1");
}
