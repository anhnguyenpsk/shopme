import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

// Helper to generate slug from name
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// GET /api/admin/brands - List all brands with pagination and search
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

    // Fetch brands with product count
    const [brands, total] = await Promise.all([
      prisma.brand.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { products: true },
          },
        },
      }),
      prisma.brand.count({ where }),
    ]);

    // Get statistics
    const [totalBrands, activeBrands, inactiveBrands] = await Promise.all([
      prisma.brand.count(),
      prisma.brand.count({ where: { isActive: true } }),
      prisma.brand.count({ where: { isActive: false } }),
    ]);

    const stats = {
      total: totalBrands,
      active: activeBrands,
      inactive: inactiveBrands,
    };

    const pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    return NextResponse.json({
      brands,
      pagination,
      stats,
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/brands - Create new brand
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug: customSlug, isActive, logo, description } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
    }

    if (!logo || logo.trim().length === 0) {
      return NextResponse.json({ error: 'Brand logo is required' }, { status: 400 });
    }

    // Generate slug or use custom slug
    const slug = customSlug || generateSlug(name);

    // Check if brand with same name or slug already exists
    const existingBrand = await prisma.brand.findFirst({
      where: {
        OR: [
          { name: { equals: name, mode: 'insensitive' } },
          { slug },
        ],
      },
    });

    if (existingBrand) {
      if (existingBrand.name.toLowerCase() === name.toLowerCase()) {
        return NextResponse.json({ error: 'Brand with this name already exists' }, { status: 400 });
      }
      if (existingBrand.slug === slug) {
        return NextResponse.json({ error: 'Brand with this slug already exists' }, { status: 400 });
      }
    }

    // Create brand
    const brand = await prisma.brand.create({
      data: {
        name: name.trim(),
        slug,
        logo: logo.trim(),
        description: description?.trim() || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ brand, message: 'Brand created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating brand:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

