import prisma from "@/lib/prisma";

export default async function authSeller(userId) {
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const store = await prisma.store.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!store) {
    throw new Error("Unauthorized");
  }

  return store.id;
}

