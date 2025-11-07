import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

// Helper to generate slug from name
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// GET /api/admin/brands/[brandId] - Get single brand
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { brandId } = params;

    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    return NextResponse.json({ brand });
  } catch (error) {
    console.error('Error fetching brand:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/brands/[brandId] - Update brand
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { brandId } = params;
    const body = await request.json();
    const { name, slug: customSlug, isActive, logo, description } = body;

    // Check if brand exists
    const existingBrand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!existingBrand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData = {};

    if (name !== undefined && name.trim().length > 0) {
      updateData.name = name.trim();
      
      // Generate new slug if name changed
      const newSlug = customSlug || generateSlug(name);
      
      // Check if new name or slug conflicts with another brand
      if (name !== existingBrand.name || newSlug !== existingBrand.slug) {
        const conflictingBrand = await prisma.brand.findFirst({
          where: {
            AND: [
              { id: { not: brandId } },
              {
                OR: [
                  { name: { equals: name, mode: 'insensitive' } },
                  { slug: newSlug },
                ],
              },
            ],
          },
        });

        if (conflictingBrand) {
          if (conflictingBrand.name.toLowerCase() === name.toLowerCase()) {
            return NextResponse.json({ error: 'Another brand with this name already exists' }, { status: 400 });
          }
          if (conflictingBrand.slug === newSlug) {
            return NextResponse.json({ error: 'Another brand with this slug already exists' }, { status: 400 });
          }
        }

        updateData.slug = newSlug;
      }
    }

    if (logo !== undefined && logo.trim().length > 0) {
      updateData.logo = logo.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    // Update brand
    const brand = await prisma.brand.update({
      where: { id: brandId },
      data: updateData,
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json({ brand, message: 'Brand updated successfully' });
  } catch (error) {
    console.error('Error updating brand:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/brands/[brandId] - Delete brand
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { brandId } = params;

    // Check if brand exists
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Check if brand has products
    if (brand._count.products > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete brand. ${brand._count.products} product(s) are using this brand. Please reassign or delete those products first.` 
        },
        { status: 400 }
      );
    }

    // Delete brand
    await prisma.brand.delete({
      where: { id: brandId },
    });

    return NextResponse.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    console.error('Error deleting brand:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

