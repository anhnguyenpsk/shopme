import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export const dynamic = 'force-dynamic';

// Helper to generate slug from name
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// GET /api/admin/categories - List all categories with pagination and search
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';
    const statusFilter = searchParams.get('status'); // 'active', 'inactive', or null

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (statusFilter === 'active') {
      where.isActive = true;
    } else if (statusFilter === 'inactive') {
      where.isActive = false;
    }

    // Fetch categories with product count
    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { products: true },
          },
          parent: {
            select: { name: true },
          },
        },
      }),
      prisma.category.count({ where }),
    ]);

    // Get statistics
    const [totalCategories, activeCategories, inactiveCategories] = await Promise.all([
      prisma.category.count(),
      prisma.category.count({ where: { isActive: true } }),
      prisma.category.count({ where: { isActive: false } }),
    ]);

    const stats = {
      total: totalCategories,
      active: activeCategories,
      inactive: inactiveCategories,
    };

    const pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    return NextResponse.json({
      categories,
      pagination,
      stats,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/categories - Create new category
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug: customSlug, isActive } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    // Generate slug or use custom slug
    const slug = customSlug || generateSlug(name);

    // Check if category with same name or slug already exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { name: { equals: name, mode: 'insensitive' } },
          { slug },
        ],
      },
    });

    if (existingCategory) {
      if (existingCategory.name.toLowerCase() === name.toLowerCase()) {
        return NextResponse.json({ error: 'Category with this name already exists' }, { status: 400 });
      }
      if (existingCategory.slug === slug) {
        return NextResponse.json({ error: 'Category with this slug already exists' }, { status: 400 });
      }
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug,
        isActive: isActive !== undefined ? isActive : true,
        parentId: body.parentId || null,
      },
    });

    return NextResponse.json({ category, message: 'Category created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

