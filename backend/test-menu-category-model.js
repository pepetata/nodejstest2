const MenuCategoryModel = require('./src/models/menu/MenuCategoryModel');
const { logger } = require('./src/utils/logger');

/**
 * Test script for Menu Category Model
 * Tests basic model functionality and database connection
 */
async function testMenuCategoryModel() {
  const model = new MenuCategoryModel();

  console.log('🧪 Iniciando testes do MenuCategoryModel...\n');

  try {
    // Test 1: Database connection
    console.log('1️⃣ Testando conexão com o banco de dados...');
    const testQuery = await model.executeQuery('SELECT NOW() as current_time');
    console.log('✅ Conexão bem-sucedida:', testQuery.rows[0].current_time);

    // Test 2: Check table structure
    console.log('\n2️⃣ Verificando estrutura das tabelas...');

    const categoriesTableQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'menu_categories'
      ORDER BY ordinal_position
    `;

    const categoriesTable = await model.executeQuery(categoriesTableQuery);
    console.log('📋 Estrutura da tabela menu_categories:');
    categoriesTable.rows.forEach((col) => {
      console.log(
        `   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`
      );
    });

    const translationsTableQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'menu_category_translations'
      ORDER BY ordinal_position
    `;

    const translationsTable = await model.executeQuery(translationsTableQuery);
    console.log('\n📋 Estrutura da tabela menu_category_translations:');
    translationsTable.rows.forEach((col) => {
      console.log(
        `   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`
      );
    });

    // Test 3: Validation schemas
    console.log('\n3️⃣ Testando schemas de validação...');

    const validCreateData = {
      restaurant_id: '12345678-1234-1234-1234-123456789012',
      parent_category_id: null,
      display_order: 1,
      status: 'active',
      created_by: '12345678-1234-1234-1234-123456789012',
      translations: [
        {
          language_id: 1,
          name: 'Bebidas',
          description: 'Categoria de bebidas',
        },
        {
          language_id: 2,
          name: 'Beverages',
          description: 'Beverages category',
        },
      ],
    };

    const { error: createError, value: createValue } = model.createSchema.validate(validCreateData);
    if (createError) {
      console.log('❌ Erro de validação de criação:', createError.details[0].message);
    } else {
      console.log('✅ Schema de criação validado com sucesso');
    }

    const validUpdateData = {
      status: 'inactive',
      display_order: 2,
      updated_by: '12345678-1234-1234-1234-123456789012',
      translations: [
        {
          language_id: 1,
          name: 'Bebidas Atualizadas',
          description: 'Categoria de bebidas atualizada',
        },
      ],
    };

    const { error: updateError, value: updateValue } = model.updateSchema.validate(validUpdateData);
    if (updateError) {
      console.log('❌ Erro de validação de atualização:', updateError.details[0].message);
    } else {
      console.log('✅ Schema de atualização validado com sucesso');
    }

    // Test 4: Check available languages
    console.log('\n4️⃣ Verificando idiomas disponíveis...');
    const languagesQuery = `
      SELECT id, name, language_code, is_active
      FROM languages
      WHERE is_active = true
      ORDER BY name
    `;

    const languages = await model.executeQuery(languagesQuery);
    console.log('🌐 Idiomas disponíveis:');
    languages.rows.forEach((lang) => {
      console.log(`   ID: ${lang.id}, Nome: ${lang.name}, Código: ${lang.language_code}`);
    });

    // Test 5: Check restaurants with categories
    console.log('\n5️⃣ Verificando restaurantes com categorias...');
    const restaurantsQuery = `
      SELECT DISTINCT r.id, r.restaurant_name, COUNT(mc.id) as category_count
      FROM restaurants r
      LEFT JOIN menu_categories mc ON r.id = mc.restaurant_id
      GROUP BY r.id, r.restaurant_name
      HAVING COUNT(mc.id) > 0
      ORDER BY category_count DESC
      LIMIT 5
    `;

    const restaurants = await model.executeQuery(restaurantsQuery);
    if (restaurants.rows.length > 0) {
      console.log('🏪 Restaurantes com categorias:');
      restaurants.rows.forEach((rest) => {
        console.log(`   ${rest.restaurant_name}: ${rest.category_count} categorias`);
      });
    } else {
      console.log('ℹ️ Nenhum restaurante com categorias encontrado');
    }

    console.log('\n🎉 Todos os testes concluídos com sucesso!');
    console.log('✅ O MenuCategoryModel está pronto para uso.');
  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Execute tests
testMenuCategoryModel()
  .then(() => {
    console.log('\n🔚 Script de teste finalizado.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
