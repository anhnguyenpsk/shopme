import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q');
        const category = searchParams.get('category'); // Expecting category slug
        const brand = searchParams.get('brand');       // Expecting brand slug
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const sortBy = searchParams.get('sortBy') || 'createdAt'; // Default sort
        const order = searchParams.get('order') || 'desc';      // Default order

        const where = {};
        const orderBy = { [sortBy]: order };

        // Build the search query for product name or description
        if (q) {
            where.OR = [
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
            ];
        }

        // Build the filter for category
        if (category) {
            where.categoryRef = {
                slug: category,
            };
        }

        // Build the filter for brand
        if (brand) {
            where.brandRef = {
                slug: brand,
            };
        }

        // Build the filter for price range
        const priceFilter = {};
        if (minPrice) {
            priceFilter.gte = parseFloat(minPrice);
        }
        if (maxPrice) {
            priceFilter.lte = parseFloat(maxPrice);
        }
        if (minPrice || maxPrice) {
            where.price = priceFilter;
        }

        const products = await prisma.product.findMany({
            where,
            include: {
                categoryRef: true,
                brandRef: true,
                store: true,
                rating: {
                    select: {
                        rating: true
                    }
                },
            },
            orderBy,
        });

        return NextResponse.json(products);
    } catch (error) {
        console.error('[PRODUCT_SEARCH_ERROR]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
