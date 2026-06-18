import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  RestaurantMemberRole,
  RestaurantStatus,
  UserRole,
} from "../src/generated/prisma/enums";
import { createPasswordHash } from "../src/server/auth/password";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_URL is required to seed the database.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const customerPasswordHash = await createPasswordHash("password1234");
  const ownerPasswordHash = await createPasswordHash("password1234");

  const customer = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {
      name: "Demo Customer",
      phone: "010-1111-2222",
      role: UserRole.CUSTOMER,
    },
    create: {
      email: "customer@example.com",
      name: "Demo Customer",
      phone: "010-1111-2222",
      role: UserRole.CUSTOMER,
      passwordCredential: {
        create: {
          passwordHash: customerPasswordHash,
        },
      },
      addresses: {
        create: {
          label: "Home",
          recipientName: "Demo Customer",
          phone: "010-1111-2222",
          line1: "서울특별시 강남구 테헤란로 123",
          line2: "101동 1001호",
          city: "서울특별시",
          district: "강남구",
          postalCode: "06133",
          instructions: "문 앞에 놓아주세요.",
          isDefault: true,
        },
      },
    },
  });

  await prisma.passwordCredential.upsert({
    where: { userId: customer.id },
    update: { passwordHash: customerPasswordHash },
    create: {
      userId: customer.id,
      passwordHash: customerPasswordHash,
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@example.com" },
    update: {
      name: "Demo Owner",
      phone: "010-3333-4444",
      role: UserRole.RESTAURANT_OWNER,
    },
    create: {
      email: "owner@example.com",
      name: "Demo Owner",
      phone: "010-3333-4444",
      role: UserRole.RESTAURANT_OWNER,
      passwordCredential: {
        create: {
          passwordHash: ownerPasswordHash,
        },
      },
    },
  });

  await prisma.passwordCredential.upsert({
    where: { userId: owner.id },
    update: { passwordHash: ownerPasswordHash },
    create: {
      userId: owner.id,
      passwordHash: ownerPasswordHash,
    },
  });

  const restaurant = await prisma.restaurant.upsert({
    where: { slug: "seoul-chicken-house" },
    update: {
      name: "서울 치킨집",
      description: "바삭한 후라이드와 매콤한 양념치킨을 파는 샘플 가게",
      phone: "02-1234-5678",
      addressLine1: "서울특별시 강남구 배달로 10",
      minOrderAmount: 15000,
      deliveryFee: 3000,
      status: RestaurantStatus.OPEN,
      opensAt: "11:00",
      closesAt: "23:00",
    },
    create: {
      name: "서울 치킨집",
      slug: "seoul-chicken-house",
      description: "바삭한 후라이드와 매콤한 양념치킨을 파는 샘플 가게",
      phone: "02-1234-5678",
      addressLine1: "서울특별시 강남구 배달로 10",
      minOrderAmount: 15000,
      deliveryFee: 3000,
      status: RestaurantStatus.OPEN,
      opensAt: "11:00",
      closesAt: "23:00",
    },
  });

  await prisma.restaurantMember.upsert({
    where: {
      userId_restaurantId: {
        userId: owner.id,
        restaurantId: restaurant.id,
      },
    },
    update: {
      role: RestaurantMemberRole.OWNER,
    },
    create: {
      userId: owner.id,
      restaurantId: restaurant.id,
      role: RestaurantMemberRole.OWNER,
    },
  });

  const chickenCategory = await prisma.menuCategory.upsert({
    where: {
      restaurantId_name: {
        restaurantId: restaurant.id,
        name: "치킨",
      },
    },
    update: {
      sortOrder: 1,
      isActive: true,
    },
    create: {
      restaurantId: restaurant.id,
      name: "치킨",
      sortOrder: 1,
    },
  });

  const sideCategory = await prisma.menuCategory.upsert({
    where: {
      restaurantId_name: {
        restaurantId: restaurant.id,
        name: "사이드",
      },
    },
    update: {
      sortOrder: 2,
      isActive: true,
    },
    create: {
      restaurantId: restaurant.id,
      name: "사이드",
      sortOrder: 2,
    },
  });

  const drinksCategory = await prisma.menuCategory.upsert({
    where: {
      restaurantId_name: {
        restaurantId: restaurant.id,
        name: "음료",
      },
    },
    update: {
      sortOrder: 3,
      isActive: true,
    },
    create: {
      restaurantId: restaurant.id,
      name: "음료",
      sortOrder: 3,
    },
  });

  await prisma.menuItem.upsert({
    where: {
      restaurantId_name: {
        restaurantId: restaurant.id,
        name: "후라이드 치킨",
      },
    },
    update: {
      categoryId: chickenCategory.id,
      price: 18000,
      isAvailable: true,
      sortOrder: 1,
    },
    create: {
      restaurantId: restaurant.id,
      categoryId: chickenCategory.id,
      name: "후라이드 치킨",
      description: "바삭하게 튀긴 기본 치킨",
      price: 18000,
      sortOrder: 1,
    },
  });

  await prisma.menuItem.upsert({
    where: {
      restaurantId_name: {
        restaurantId: restaurant.id,
        name: "양념 치킨",
      },
    },
    update: {
      categoryId: chickenCategory.id,
      price: 19000,
      isAvailable: true,
      sortOrder: 2,
    },
    create: {
      restaurantId: restaurant.id,
      categoryId: chickenCategory.id,
      name: "양념 치킨",
      description: "매콤달콤한 양념 치킨",
      price: 19000,
      sortOrder: 2,
    },
  });

  await prisma.menuItem.upsert({
    where: {
      restaurantId_name: {
        restaurantId: restaurant.id,
        name: "감자튀김",
      },
    },
    update: {
      categoryId: sideCategory.id,
      price: 5000,
      isAvailable: true,
      sortOrder: 1,
    },
    create: {
      restaurantId: restaurant.id,
      categoryId: sideCategory.id,
      name: "감자튀김",
      description: "주문과 함께 먹기 좋은 바삭한 사이드",
      price: 5000,
      sortOrder: 1,
    },
  });

  await prisma.menuItem.upsert({
    where: {
      restaurantId_name: {
        restaurantId: restaurant.id,
        name: "콜라 500ml",
      },
    },
    update: {
      categoryId: drinksCategory.id,
      price: 2500,
      isAvailable: true,
      sortOrder: 1,
    },
    create: {
      restaurantId: restaurant.id,
      categoryId: drinksCategory.id,
      name: "콜라 500ml",
      price: 2500,
      sortOrder: 1,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
