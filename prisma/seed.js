import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { productDummyData, categories as dummyCategories } from './dummy-data.js';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@example.com';
  const adminPassword = 'password123';

  // Delete existing admin user to ensure a clean seed
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    await prisma.user.delete({ where: { id: existingAdmin.id } });
    console.log('Existing admin user deleted.');
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Create the new admin user
  await prisma.user.create({
    data: {
      name: 'Admin User',
      email: adminEmail,
      hashedPassword: hashedPassword,
      role: 'ADMIN',
      emailVerified: new Date(), // Mark as verified for simplicity
    },
  });

  console.log('Admin user created successfully.');

  // --- Start of Product Seeding ---

  // Create a sample store owner (with credentials)
  const storeOwnerPasswordHash = await bcrypt.hash('password123', 10);
  const storeOwner = await prisma.user.upsert({
    where: { email: 'storeowner@example.com' },
    update: {
      // Ensure credentials exist on re-seed
      hashedPassword: storeOwnerPasswordHash,
      role: 'STORE_OWNER',
      emailVerified: new Date(),
    },
    create: {
      email: 'storeowner@example.com',
      name: 'Demo Store Owner',
      role: 'STORE_OWNER',
      emailVerified: new Date(),
      hashedPassword: storeOwnerPasswordHash,
    },
  });
  console.log('Store owner created (password: password123).');

  // Create a sample store
  const store = await prisma.store.upsert({
    where: { userId: storeOwner.id },
    update: {},
    create: {
      userId: storeOwner.id,
      name: 'Demo Store',
      username: 'demostore',
      email: 'store@example.com',
      contact: '+1234567890',
      logo: 'https://images.unsplash.com/photo-1579298245158-3dce87f25d97?w=150&h=150&fit=crop',
      description: 'A demo store with amazing products.',
      address: '123 Demo Street, Demo City, DC 12345',
      status: 'approved',
      isActive: true,
    },
  });
  console.log('Demo store created.');

  // Create categories from dummy data
  const categoryData = dummyCategories.map(name => ({
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-')
  }));

  for (const cat of categoryData) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log('Dummy categories created.');

  // Get created categories for product assignment
  const categories = await prisma.category.findMany();
  const categoryMap = categories.reduce((map, cat) => {
    map[cat.name] = cat.id;
    return map;
  }, {});

  // Clear existing products before seeding new ones
  await prisma.product.deleteMany({});
  console.log('Existing products deleted.');

  // Seed products from dummy data, checking for image existence
  const productsDir = path.join(process.cwd(), 'public', 'uploads', 'products');
  const availableImages = fs.readdirSync(productsDir);

  // Create a map of normalized image names for easy lookup
  const imageMap = availableImages.reduce((map, filename) => {
    const normalized = filename.toLowerCase().replace(/[-_]/g, ' ').replace(/\.\w+$/, '');
    map[normalized] = filename; // Map normalized name to original filename
    return map;
  }, {});

  for (const product of productDummyData) {
    const normalizedProductName = product.name.toLowerCase().replace(/\s+/g, ' ');
    const matchedImageFile = imageMap[normalizedProductName];

    if (matchedImageFile) {
      const productToCreate = {
        name: product.name,
        description: product.description,
        mrp: product.mrp,
        price: product.price,
        images: [`/uploads/products/${matchedImageFile}`], // Use the actual filename
        quantity: 100, // Default quantity
        inStock: true,
        storeId: store.id,
        categoryId: categoryMap[product.category],
      };

      await prisma.product.create({
        data: productToCreate,
      });
      console.log(`✅ Seeded product: ${product.name}`);
    } else {
      console.log(`❌ Skipping product (image not found): ${product.name}`);
    }
  }
  console.log('Product seeding complete.');

  console.log('✅ Database seeded successfully!');

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
