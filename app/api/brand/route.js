import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/brand - list all active brands
export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        logo: true,
      }
    });
    return NextResponse.json({ brands });
  } catch (error) {
    console.error("BRAND_LIST_ERROR", error);
    return NextResponse.json({ error: "Failed to fetch brands" }, { status: 500 });
  }
}

