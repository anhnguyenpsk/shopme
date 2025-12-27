import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { productId } = await params;

  try {
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            username: true,
            logo: true,
            isActive: true,
            status: true,
          }
        },
        rating: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        },
        brandRef: {
          select: {
            id: true,
            name: true,
            logo: true,
          }
        },
        variants: true
      },
    });

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}



export async function PATCH(request, { params }) {
  try {
    const { productId } = await params;
    const body = await request.json()
    const {
      name,
      description,
      mrp,
      price,
      images,
      category,
      categoryId,
      isActive,
      hasVariations,
      variationGroups,
      variants
    } = body || {}

    const existing = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true }
    })

    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Prepare update data
    const updateData = {
      name: name ?? existing.name,
      description: description ?? existing.description,
      // mrp field not in schema shown in view_file, but was in original code. Keeping it safe?
      // Wait, view_file of schema.prisma didn't show mrp column in Product model?
      // Checked step 4: Product model has: name, description, price, images, quantity, isActive, storeId, categoryId, brandId.
      // NO mrp column.
      // Original code had mrp? 
      // Line 76: `mrp: typeof mrp === 'number' ? mrp : existing.mrp,`
      // If schema doesn't have it, this might crash or be ignored.
      // I will remove mrp to be safe and correct according to schema.
      price: typeof price === 'number' ? price : existing.price,
      images: Array.isArray(images) && images.length > 0 ? images : existing.images,
      // category is relation, usually update categoryId
      categoryId: categoryId ?? existing.categoryId,
      isActive: typeof isActive === 'boolean' ? isActive : existing.isActive,
    }

    if (typeof hasVariations === 'boolean') {
      updateData.hasVariations = hasVariations;
    }
    if (variationGroups) {
      updateData.variationGroups = variationGroups;
    }

    // Transaction for atomic update
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Product
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: updateData
      });

      // 2. Handle Variants if provided
      if (hasVariations && Array.isArray(variants)) {
        // Note: If converting Simple -> Variable, existing.variants is empty.
        // If updating Variable, handle updates/creates.

        // Logic: 
        // - Iterate incoming variants.
        // - If id exists and matches existing -> Update.
        // - If no id -> Create.
        // - (Optional) We are NOT deleting missing variants here to avoid destroying order history.

        let totalVariantQty = 0;

        for (const v of variants) {
          const vQty = Number(v.quantity) || 0;
          totalVariantQty += vQty;

          const variantData = {
            attributes: v.attributes,
            price: Number(v.price),
            quantity: vQty,
            sku: v.sku,
            images: Array.isArray(v.images) ? v.images : []
          };

          if (v.id) {
            // Start of update
            // Security check: ensure variant belongs to this product?
            // Prisma where clause { id: v.id, productId } ensures safety
            await tx.productVariant.updateMany({
              where: { id: v.id, productId },
              data: variantData
            });
          } else {
            // Create new
            await tx.productVariant.create({
              data: {
                ...variantData,
                productId
              }
            });
          }
        }

        // Update total quantity on parent product
        await tx.product.update({
          where: { id: productId },
          data: { quantity: totalVariantQty, isActive: totalVariantQty > 0 }
        });
      }

      return updatedProduct;
    });

    return NextResponse.json(result)
  } catch (err) {
    console.error('PATCH /api/products/[productId] error', err)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}
