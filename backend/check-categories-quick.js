const { PrismaClient } = require('@prisma/client');

async function checkCategories() {
  const prisma = new PrismaClient();

  try {
    const categories = await prisma.menuCategory.findMany({
      select: {
        id: true,
        name: true,
        is_active: true,
      },
    });

    console.log('Available categories:');
    console.log(JSON.stringify(categories, null, 2));
  } catch (error) {
    console.error('Error checking categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCategories();
