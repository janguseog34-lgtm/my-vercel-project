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

type SeedRestaurantInput = {
  ownerId: string;
  name: string;
  slug: string;
  description: string;
  phone: string;
  addressLine1: string;
  minOrderAmount: number;
  deliveryFee: number;
  opensAt: string;
  closesAt: string;
  categories: Array<{
    name: string;
    sortOrder: number;
    items: Array<{
      name: string;
      description?: string;
      price: number;
      sortOrder: number;
    }>;
  }>;
};

async function seedRestaurant(input: SeedRestaurantInput) {
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: input.slug },
    update: {
      name: input.name,
      description: input.description,
      phone: input.phone,
      addressLine1: input.addressLine1,
      minOrderAmount: input.minOrderAmount,
      deliveryFee: input.deliveryFee,
      status: RestaurantStatus.OPEN,
      opensAt: input.opensAt,
      closesAt: input.closesAt,
    },
    create: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      phone: input.phone,
      addressLine1: input.addressLine1,
      minOrderAmount: input.minOrderAmount,
      deliveryFee: input.deliveryFee,
      status: RestaurantStatus.OPEN,
      opensAt: input.opensAt,
      closesAt: input.closesAt,
    },
  });

  await prisma.restaurantMember.upsert({
    where: {
      userId_restaurantId: {
        userId: input.ownerId,
        restaurantId: restaurant.id,
      },
    },
    update: {
      role: RestaurantMemberRole.OWNER,
    },
    create: {
      userId: input.ownerId,
      restaurantId: restaurant.id,
      role: RestaurantMemberRole.OWNER,
    },
  });

  for (const categoryInput of input.categories) {
    const category = await prisma.menuCategory.upsert({
      where: {
        restaurantId_name: {
          restaurantId: restaurant.id,
          name: categoryInput.name,
        },
      },
      update: {
        sortOrder: categoryInput.sortOrder,
        isActive: true,
      },
      create: {
        restaurantId: restaurant.id,
        name: categoryInput.name,
        sortOrder: categoryInput.sortOrder,
      },
    });

    for (const item of categoryInput.items) {
      await prisma.menuItem.upsert({
        where: {
          restaurantId_name: {
            restaurantId: restaurant.id,
            name: item.name,
          },
        },
        update: {
          categoryId: category.id,
          description: item.description ?? null,
          price: item.price,
          isAvailable: true,
          sortOrder: item.sortOrder,
        },
        create: {
          restaurantId: restaurant.id,
          categoryId: category.id,
          name: item.name,
          description: item.description,
          price: item.price,
          sortOrder: item.sortOrder,
        },
      });
    }
  }
}

async function main() {
  const customerPasswordHash = await createPasswordHash("password1234");
  const ownerPasswordHash = await createPasswordHash("password1234");

  const customer = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {
      name: "맛잘알",
      phone: "010-1111-2222",
      role: UserRole.CUSTOMER,
    },
    create: {
      email: "customer@example.com",
      name: "맛잘알",
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
          recipientName: "맛잘알",
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
      name: "든든사장",
      phone: "010-3333-4444",
      role: UserRole.RESTAURANT_OWNER,
    },
    create: {
      email: "owner@example.com",
      name: "든든사장",
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

  for (const item of [
    {
      categoryId: chickenCategory.id,
      name: "후라이드 치킨",
      description: "바삭하게 튀긴 기본 치킨",
      price: 18000,
      sortOrder: 1,
    },
    {
      categoryId: chickenCategory.id,
      name: "양념 치킨",
      description: "매콤달콤한 양념 치킨",
      price: 19000,
      sortOrder: 2,
    },
    {
      categoryId: chickenCategory.id,
      name: "간장마늘 치킨",
      description: "짭짤한 간장 소스와 마늘 향을 입힌 치킨",
      price: 19500,
      sortOrder: 3,
    },
    {
      categoryId: chickenCategory.id,
      name: "매콤 청양 치킨",
      description: "청양고추 소스로 깔끔하게 매운 치킨",
      price: 19800,
      sortOrder: 4,
    },
    {
      categoryId: chickenCategory.id,
      name: "순살 반반 치킨",
      description: "후라이드와 양념을 한 번에 먹는 순살 구성",
      price: 20500,
      sortOrder: 5,
    },
    {
      categoryId: chickenCategory.id,
      name: "허니버터 순살",
      description: "달콤한 허니버터 시즈닝을 입힌 순살 치킨",
      price: 19900,
      sortOrder: 6,
    },
    {
      categoryId: sideCategory.id,
      name: "감자튀김",
      description: "주문과 함께 먹기 좋은 바삭한 사이드",
      price: 5000,
      sortOrder: 1,
    },
    {
      categoryId: sideCategory.id,
      name: "치즈볼 6개",
      description: "쫄깃한 반죽 속 고소한 치즈볼",
      price: 5500,
      sortOrder: 2,
    },
    {
      categoryId: sideCategory.id,
      name: "닭껍질 튀김",
      description: "짭짤하고 바삭한 닭껍질 스낵",
      price: 6500,
      sortOrder: 3,
    },
    {
      categoryId: sideCategory.id,
      name: "콘샐러드",
      description: "치킨과 잘 어울리는 달콤한 콘샐러드",
      price: 3500,
      sortOrder: 4,
    },
    {
      categoryId: drinksCategory.id,
      name: "콜라 500ml",
      description: "치킨과 함께 마시는 기본 탄산음료",
      price: 2500,
      sortOrder: 1,
    },
    {
      categoryId: drinksCategory.id,
      name: "사이다 500ml",
      description: "깔끔한 레몬라임 탄산음료",
      price: 2500,
      sortOrder: 2,
    },
    {
      categoryId: drinksCategory.id,
      name: "제로콜라 500ml",
      description: "가볍게 즐기는 제로 슈거 탄산음료",
      price: 2600,
      sortOrder: 3,
    },
  ]) {
    await prisma.menuItem.upsert({
      where: {
        restaurantId_name: {
          restaurantId: restaurant.id,
          name: item.name,
        },
      },
      update: {
        categoryId: item.categoryId,
        description: item.description,
        price: item.price,
        isAvailable: true,
        sortOrder: item.sortOrder,
      },
      create: {
        restaurantId: restaurant.id,
        categoryId: item.categoryId,
        name: item.name,
        description: item.description,
        price: item.price,
        sortOrder: item.sortOrder,
      },
    });
  }

  await seedRestaurant({
    ownerId: owner.id,
    name: "강남 분식",
    slug: "gangnam-bunsik",
    description: "떡볶이, 김밥, 튀김을 빠르게 배달하는 동네 분식집",
    phone: "02-2222-3333",
    addressLine1: "서울특별시 강남구 분식로 20",
    minOrderAmount: 9000,
    deliveryFee: 2500,
    opensAt: "10:00",
    closesAt: "22:00",
    categories: [
      {
        name: "분식",
        sortOrder: 1,
        items: [
          {
            name: "국물 떡볶이",
            description: "매콤달콤한 국물 떡볶이",
            price: 6500,
            sortOrder: 1,
          },
          {
            name: "로제 떡볶이",
            description: "부드러운 로제 소스에 밀떡을 넣은 인기 메뉴",
            price: 8500,
            sortOrder: 2,
          },
          {
            name: "치즈 라볶이",
            description: "라면사리와 치즈가 듬뿍 올라간 라볶이",
            price: 8000,
            sortOrder: 3,
          },
          {
            name: "참치 김밥",
            description: "참치마요와 아삭한 야채가 들어간 김밥",
            price: 4500,
            sortOrder: 4,
          },
          {
            name: "소고기 김밥",
            description: "달큰하게 볶은 소고기와 야채가 들어간 김밥",
            price: 5200,
            sortOrder: 5,
          },
          {
            name: "찰순대",
            description: "쫀득한 순대와 소금, 막장 구성",
            price: 6000,
            sortOrder: 6,
          },
        ],
      },
      {
        name: "튀김",
        sortOrder: 2,
        items: [
          {
            name: "모듬 튀김",
            description: "김말이, 오징어, 야채튀김 구성",
            price: 5500,
            sortOrder: 1,
          },
          {
            name: "김말이 튀김",
            description: "떡볶이 국물에 찍어 먹기 좋은 김말이 5개",
            price: 4000,
            sortOrder: 2,
          },
          {
            name: "오징어 튀김",
            description: "큼직한 오징어를 바삭하게 튀긴 메뉴",
            price: 5000,
            sortOrder: 3,
          },
          {
            name: "고구마 튀김",
            description: "달콤한 고구마를 두툼하게 튀긴 사이드",
            price: 4200,
            sortOrder: 4,
          },
        ],
      },
      {
        name: "음료",
        sortOrder: 3,
        items: [
          {
            name: "쿨피스 복숭아",
            description: "매운 분식과 잘 어울리는 복숭아맛 음료",
            price: 2000,
            sortOrder: 1,
          },
          {
            name: "캔 식혜",
            description: "달콤하고 시원한 전통 음료",
            price: 2500,
            sortOrder: 2,
          },
        ],
      },
    ],
  });

  await seedRestaurant({
    ownerId: owner.id,
    name: "든든 도시락",
    slug: "dondeun-lunchbox",
    description: "점심과 저녁에 먹기 좋은 한식 도시락 전문점",
    phone: "02-4444-5555",
    addressLine1: "서울특별시 강남구 도시락길 7",
    minOrderAmount: 12000,
    deliveryFee: 2000,
    opensAt: "09:30",
    closesAt: "21:00",
    categories: [
      {
        name: "도시락",
        sortOrder: 1,
        items: [
          {
            name: "제육 도시락",
            description: "매콤한 제육볶음과 반찬 4종",
            price: 9800,
            sortOrder: 1,
          },
          {
            name: "불고기 도시락",
            description: "간장 불고기와 계란말이 구성",
            price: 10800,
            sortOrder: 2,
          },
          {
            name: "수제 돈까스 도시락",
            description: "두툼한 등심 돈까스와 양배추 샐러드 구성",
            price: 11500,
            sortOrder: 3,
          },
          {
            name: "치킨마요 도시락",
            description: "바삭한 치킨과 달콤한 마요 소스 조합",
            price: 9200,
            sortOrder: 4,
          },
          {
            name: "연어구이 도시락",
            description: "담백한 연어구이와 나물 반찬 구성",
            price: 12800,
            sortOrder: 5,
          },
          {
            name: "소고기 비빔밥 도시락",
            description: "나물, 고추장, 소고기를 비벼 먹는 든든한 한 끼",
            price: 10500,
            sortOrder: 6,
          },
        ],
      },
      {
        name: "국",
        sortOrder: 2,
        items: [
          {
            name: "된장국",
            description: "도시락과 함께 먹기 좋은 따뜻한 국",
            price: 2500,
            sortOrder: 1,
          },
          {
            name: "김치찌개",
            description: "돼지고기와 잘 익은 김치로 끓인 찌개",
            price: 4500,
            sortOrder: 2,
          },
          {
            name: "소고기 미역국",
            description: "부드러운 미역과 소고기를 넣은 담백한 국",
            price: 4200,
            sortOrder: 3,
          },
          {
            name: "육개장",
            description: "얼큰한 국물과 고사리가 들어간 든든한 국",
            price: 5200,
            sortOrder: 4,
          },
        ],
      },
      {
        name: "추가 반찬",
        sortOrder: 3,
        items: [
          {
            name: "계란말이 추가",
            description: "도시락에 곁들이기 좋은 부드러운 계란말이",
            price: 3500,
            sortOrder: 1,
          },
          {
            name: "메추리알 장조림",
            description: "짭짤달콤하게 조린 메추리알 반찬",
            price: 3000,
            sortOrder: 2,
          },
        ],
      },
    ],
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
