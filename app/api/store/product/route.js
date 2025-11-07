import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import authSeller from "@/lib/authSeller";
import prisma from "@/lib/prisma";

// GET - Fetch all products for the logged-in store owner
export async function GET() {
    const session = await getServerSession(authOptions);

    if (session?.user?.role !== 'STORE_OWNER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const store = await prisma.store.findUnique({
            where: { userId: session.user.id },
        });

        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        const products = await prisma.product.findMany({
            where: { storeId: store.id },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/store/product - add a new product (multipart/form-data expected)
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const storeId = await authSeller(userId);

    const formData = await request.formData();

    // Extract expected fields
    const name = formData.get("name");
    const description = formData.get("description");
    const mrp = formData.get("mrp");
    const price = formData.get("price");
    const images = formData.getAll("images"); // File objects
    const categoryId = formData.get("categoryId") || null;
    const brandId = formData.get("brandId") || null;

    // Basic validation
    if (!name || !description || !mrp || !price) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // TODO: Handle file uploads here.
    // Example placeholder:
    // const imageUrls = await uploadImagesToYourService(images);
    const imageUrls = [];

    // Optional: validate categoryId/brandId exist
    if (categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!cat) return NextResponse.json({ error: "Invalid categoryId" }, { status: 400 });
    }
    if (brandId) {
      const br = await prisma.brand.findUnique({ where: { id: brandId } });
      if (!br) return NextResponse.json({ error: "Invalid brandId" }, { status: 400 });
    }

    await prisma.product.create({
      data: {
        name,
        description,
        mrp: Number(mrp),
        price: Number(price),
        images: imageUrls,
        storeId,
        categoryId: categoryId || undefined,
        brandId: brandId || undefined,
      },
    });

    return NextResponse.json({ message: "Product created" }, { status: 201 });
  } catch (error) {
    const message = error?.message || "Failed to create product";
    const status = message === "Unauthorized" ? 401 : 500;
    console.error("PRODUCT_CREATE_ERROR", error);
    return NextResponse.json({ error: message }, { status });
  }
}

// PATCH - Update a product's details (e.g., isActive status or quantity)
export async function PATCH(request) {
    const session = await getServerSession(authOptions);

    if (session?.user?.role !== 'STORE_OWNER' && session?.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { productId, isActive, quantity } = await request.json();

        if (!productId) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
        }

        // Validate inputs
        if (isActive !== undefined && typeof isActive !== 'boolean') {
            return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 });
        }

        if (quantity !== undefined && (typeof quantity !== 'number' || quantity < 0 || !Number.isInteger(quantity))) {
            return NextResponse.json({ error: 'quantity must be a non-negative integer' }, { status: 400 });
        }

        const store = await prisma.store.findUnique({
            where: { userId: session.user.id },
        });

        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        // Verify the product belongs to the store before updating
        const product = await prisma.product.findFirst({
            where: {
                id: productId,
                storeId: store.id,
            },
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found or you do not have permission to edit it' }, { status: 404 });
        }

        // Build update data
        const updateData = {};
        if (isActive !== undefined) updateData.isActive = isActive;
        if (quantity !== undefined) updateData.quantity = quantity;

        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: updateData,
        });

        return NextResponse.json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

