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

// GET /api/admin/categories/[categoryId] - Get single category
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { categoryId } = params;

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/categories/[categoryId] - Update category
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { categoryId } = params;
    const body = await request.json();
    const { name, slug: customSlug, isActive } = body;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData = {};

    if (name !== undefined && name.trim().length > 0) {
      updateData.name = name.trim();
      
      // Generate new slug if name changed
      const newSlug = customSlug || generateSlug(name);
      
      // Check if new name or slug conflicts with another category
      if (name !== existingCategory.name || newSlug !== existingCategory.slug) {
        const conflictingCategory = await prisma.category.findFirst({
          where: {
            AND: [
              { id: { not: categoryId } },
              {
                OR: [
                  { name: { equals: name, mode: 'insensitive' } },
                  { slug: newSlug },
                ],
              },
            ],
          },
        });

        if (conflictingCategory) {
          if (conflictingCategory.name.toLowerCase() === name.toLowerCase()) {
            return NextResponse.json({ error: 'Another category with this name already exists' }, { status: 400 });
          }
          if (conflictingCategory.slug === newSlug) {
            return NextResponse.json({ error: 'Another category with this slug already exists' }, { status: 400 });
          }
        }

        updateData.slug = newSlug;
      }
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    // Update category
    const category = await prisma.category.update({
      where: { id: categoryId },
      data: updateData,
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json({ category, message: 'Category updated successfully' });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/categories/[categoryId] - Delete category
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { categoryId } = params;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Check if category has products
    if (category._count.products > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete category. ${category._count.products} product(s) are using this category. Please reassign or delete those products first.` 
        },
        { status: 400 }
      );
    }

    // Delete category
    await prisma.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

