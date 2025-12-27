import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import authSeller from "@/lib/authSeller";

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function getSessionOrThrow() {
  const session = await getServerSession(authOptions);
  if (!session) {
    console.log("getSessionOrThrow: No session found via getServerSession");
  } else if (!session.user) {
    console.log("getSessionOrThrow: Session found but no user");
  } else if (!session.user.id) {
    console.log("getSessionOrThrow: Session user has no ID", session.user);
  }

  if (!session?.user?.id) {
    throw new HttpError(401, "Unauthorized");
  }
  return session;
}

function ensureRole(session, allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (!roles.includes(session.user.role)) {
    throw new HttpError(403, "Forbidden");
  }
}

export async function requireAuthSession() {
  return getSessionOrThrow();
}

export async function requireAdminSession() {
  const session = await getSessionOrThrow();
  ensureRole(session, "ADMIN");
  return session;
}

export async function requireCustomerSession() {
  const session = await getSessionOrThrow();
  ensureRole(session, ["CUSTOMER", "ADMIN"]);
  return session;
}

export async function requireSellerContext() {
  const session = await getSessionOrThrow();
  ensureRole(session, "STORE_OWNER");
  const storeId = await authSeller(session.user.id);
  return { session, storeId };
}

export function buildAuthErrorResponse(error, defaultMessage = "Unauthorized") {
  if (error instanceof HttpError) {
    return {
      status: error.status,
      body: { error: error.message },
    };
  }

  console.error("Auth guard unexpected error:", error);
  return {
    status: 500,
    body: { error: defaultMessage },
  };
}

export function isHttpError(error, status) {
  return error instanceof HttpError && (status ? error.status === status : true);
}




