import { RestaurantStatus } from "@/generated/prisma/enums";
import { prisma } from "@/server/db/prisma";

type ListOpenRestaurantsInput = {
  restaurantSlug?: string;
};

export function listOpenRestaurantFilters() {
  return prisma.restaurant.findMany({
    where: {
      status: RestaurantStatus.OPEN,
    },
    orderBy: [
      {
        createdAt: "desc",
      },
      {
        name: "asc",
      },
    ],
    select: {
      id: true,
      name: true,
      slug: true,
      minOrderAmount: true,
      deliveryFee: true,
      _count: {
        select: {
          menuItems: true,
        },
      },
    },
  });
}

export function listOpenRestaurants(input: ListOpenRestaurantsInput = {}) {
  return prisma.restaurant.findMany({
    where: {
      status: RestaurantStatus.OPEN,
      ...(input.restaurantSlug ? { slug: input.restaurantSlug } : {}),
    },
    orderBy: [
      {
        createdAt: "desc",
      },
      {
        name: "asc",
      },
    ],
    include: {
      categories: {
        where: {
          isActive: true,
        },
        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            name: "asc",
          },
        ],
        include: {
          items: {
            where: {
              isAvailable: true,
            },
            orderBy: [
              {
                sortOrder: "asc",
              },
              {
                name: "asc",
              },
            ],
          },
        },
      },
    },
  });
}
