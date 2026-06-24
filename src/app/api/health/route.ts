import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const startedAt = Date.now();

  try {
    const { prisma } = await import("@/server/db/prisma");

    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      ok: true,
      database: "ok",
      latencyMs: Date.now() - startedAt,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        database: "error",
        message:
          error instanceof Error ? error.message : "Unknown database error",
      },
      { status: 503 },
    );
  }
}
