import "server-only";

import { hashSessionToken } from "@/server/auth/session";
import { getSessionCookie } from "@/server/auth/cookies";

export async function getCurrentUser() {
  const token = await getSessionCookie();

  if (!token) {
    return null;
  }

  let session;

  try {
    const { prisma } = await import("@/server/db/prisma");

    session = await prisma.session.findUnique({
      where: {
        tokenHash: hashSessionToken(token),
      },
      include: {
        user: true,
      },
    });
  } catch {
    return null;
  }

  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    return null;
  }

  return session.user;
}
