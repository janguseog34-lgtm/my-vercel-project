import { prisma } from "@/server/db/prisma";
import { createPasswordHash, verifyPassword } from "@/server/auth/password";
import {
  createSessionToken,
  getSessionExpiresAt,
  hashSessionToken,
} from "@/server/auth/session";
import { UserRole } from "@/generated/prisma/enums";

type RegisterUserInput = {
  email: string;
  password: string;
  name: string;
  phone?: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function registerUser(input: RegisterUserInput) {
  const email = normalizeEmail(input.email);
  const passwordHash = await createPasswordHash(input.password);

  return prisma.user.create({
    data: {
      email,
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      role: UserRole.CUSTOMER,
      passwordCredential: {
        create: {
          passwordHash,
        },
      },
    },
  });
}

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: {
      email: normalizeEmail(email),
    },
    include: {
      passwordCredential: true,
    },
  });

  if (!user?.passwordCredential) {
    return null;
  }

  const isValid = await verifyPassword(
    password,
    user.passwordCredential.passwordHash,
  );

  if (!isValid) {
    return null;
  }

  return user;
}

export async function createUserSession(userId: string) {
  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = getSessionExpiresAt();

  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return {
    token,
    session,
  };
}

export async function revokeUserSession(token: string) {
  await prisma.session.updateMany({
    where: {
      tokenHash: hashSessionToken(token),
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

