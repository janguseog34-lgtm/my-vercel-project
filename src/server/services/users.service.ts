import { prisma } from "@/server/db/prisma";

export function listUsers() {
  return prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: {
      email,
    },
  });
}

export function getDefaultAddressForUser(userId: string) {
  return prisma.address.findFirst({
    where: {
      userId,
    },
    orderBy: [
      {
        isDefault: "desc",
      },
      {
        createdAt: "asc",
      },
    ],
  });
}
