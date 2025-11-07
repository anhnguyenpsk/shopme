import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// GET: Retrieve user's cart from database
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }), 
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { cart: true }
    });

    if (!user) {
      return new Response(
        JSON.stringify({ error: "User not found" }), 
        { status: 404 }
      );
    }

    // Return cart data (default to empty object if null)
    return new Response(
      JSON.stringify({ cart: user.cart || {} }), 
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/user/cart error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to retrieve cart" }), 
      { status: 500 }
    );
  }
}

// PATCH: Update user's cart in database
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }), 
        { status: 401 }
      );
    }

    const body = await request.json();
    const { cartItems, total } = body;

    // Validate cart data
    if (cartItems === undefined || total === undefined) {
      return new Response(
        JSON.stringify({ error: "Invalid cart data" }), 
        { status: 400 }
      );
    }

    // Update user's cart in database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        cart: {
          cartItems,
          total
        }
      },
      select: { cart: true }
    });

    return new Response(
      JSON.stringify({ 
        message: "Cart saved successfully",
        cart: updatedUser.cart 
      }), 
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/user/cart error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to save cart" }), 
      { status: 500 }
    );
  }
}





