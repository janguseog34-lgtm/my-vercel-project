import { cookies } from "next/headers";

export const sessionCookieName = "delivery_session";

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();

  cookieStore.set(sessionCookieName, token, {
    expires: expiresAt,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.delete(sessionCookieName);
}

export async function getSessionCookie() {
  const cookieStore = await cookies();

  return cookieStore.get(sessionCookieName)?.value ?? null;
}

