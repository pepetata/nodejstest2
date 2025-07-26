const { PrismaClient } = require('@prisma/client');

async function createTestCategories() {
  const prisma = new PrismaClient();

  try {
    const restaurantId = 'c7742866-f77b-4f68-8586-57d631af301a'; // Padre restaurant

    console.log('Creating test categories for restaurant:', restaurantId);

    // Check if categories already exist
    const existingCategories = await prisma.menuCategory.findMany({
      where: { restaurant_id: restaurantId },
    });

    if (existingCategories.length > 0) {
      console.log(`Found ${existingCategories.length} existing categories:`);
      existingCategories.forEach((cat) => {
        console.log(`- ${cat.name} (ID: ${cat.id})`);
      });
      return;
    }

    // Create test categories
    const categories = [
      { name: 'Entradas', display_order: 1 },
      { name: 'Pratos Principais', display_order: 2 },
      { name: 'Sobremesas', display_order: 3 },
      { name: 'Bebidas', display_order: 4 },
      { name: 'Especiais do Dia', display_order: 5 },
    ];

    for (const categoryData of categories) {
      const category = await prisma.menuCategory.create({
        data: {
          restaurant_id: restaurantId,
          name: categoryData.name,
          display_order: categoryData.display_order,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      console.log(`✅ Created category: ${category.name} (ID: ${category.id})`);
    }

    console.log('\n🎉 Test categories created successfully!');
  } catch (error) {
    console.error('Error creating test categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestCategories();
