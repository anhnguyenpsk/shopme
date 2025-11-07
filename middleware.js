import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Admin routes protection
    if (pathname.startsWith("/admin")) {
      if (!token || token.role !== "ADMIN") {
        return Response.redirect(new URL("/login", req.url));
      }
    }

    // Store routes protection - only STORE_OWNER and ADMIN can access
    if (pathname.startsWith("/store")) {
      if (!token || (token.role !== "ADMIN" && token.role !== "STORE_OWNER")) {
        return Response.redirect(new URL("/login", req.url));
      }
    }

    // User profile/account routes protection
    if (pathname.startsWith("/profile") || pathname.startsWith("/orders") || pathname.startsWith("/account")) {
      if (!token) {
        return Response.redirect(new URL("/login", req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Public routes that don't require authentication
        const publicRoutes = ["/", "/login", "/register", "/products"];
        const isPublicRoute = publicRoutes.some(route => 
          pathname === route || pathname.startsWith("/products/")
        );
        
        if (isPublicRoute) return true;
        
        // All other routes require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/store/:path*", 
    "/profile/:path*",
    "/orders/:path*",
    "/account/:path*"
  ]
};
