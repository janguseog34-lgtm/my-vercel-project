import "server-only";

import { hashSessionToken } from "@/server/auth/session";
import { getSessionCookie } from "@/server/auth/cookies";
import { prisma } from "@/server/db/prisma";

export async function getCurrentUser() {
  const token = await getSessionCookie();

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      tokenHash: hashSessionToken(token),
    },
    include: {
      user: true,
    },
  });

  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    return null;
  }

  return session.user;
}

