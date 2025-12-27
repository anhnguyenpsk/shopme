import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// GET /api/category - list all categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("CATEGORY_LIST_ERROR", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

