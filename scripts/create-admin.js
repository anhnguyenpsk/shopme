import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'password123';

async function main() {
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      name: 'Admin User',
      hashedPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
      isActive: true,
    },
    create: {
      name: 'Admin User',
      email: ADMIN_EMAIL,
      hashedPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
      isActive: true,
    },
  });

  console.log(`Admin account ready for ${user.email}`);
}

main()
  .catch((error) => {
    console.error('Failed to create admin user:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




