require('dotenv').config();
const db = require('./config/database');

const FINE_DINING_CATEGORIES = [
  { code: 'APPETIZER', name: 'Khai vị' },
  { code: 'MAIN_COURSE', name: 'Món chính' },
  { code: 'DESSERT', name: 'Tráng miệng' },
  { code: 'BEVERAGE', name: 'Đồ uống' }
];

const TABLES_DATA = [
  // INDOOR
  { table_number: 'T01', capacity: 4, area: 'INDOOR', status: 'AVAILABLE' },
  { table_number: 'T03', capacity: 2, area: 'INDOOR', status: 'AVAILABLE' },
  { table_number: 'T04', capacity: 2, area: 'INDOOR', status: 'AVAILABLE' },
  { table_number: 'T05', capacity: 6, area: 'INDOOR', status: 'AVAILABLE' },
  { table_number: 'T06', capacity: 4, area: 'INDOOR', status: 'AVAILABLE' },
  // OUTDOOR
  { table_number: 'T02', capacity: 4, area: 'OUTDOOR', status: 'AVAILABLE' },
  { table_number: 'T07', capacity: 2, area: 'OUTDOOR', status: 'AVAILABLE' },
  { table_number: 'T08', capacity: 2, area: 'OUTDOOR', status: 'AVAILABLE' },
  { table_number: 'T09', capacity: 4, area: 'OUTDOOR', status: 'AVAILABLE' },
  { table_number: 'T10', capacity: 6, area: 'OUTDOOR', status: 'AVAILABLE' },
  // VIP
  { table_number: 'V01', capacity: 8, area: 'VIP', status: 'AVAILABLE' },
  { table_number: 'V02', capacity: 10, area: 'VIP', status: 'AVAILABLE' }
];

const DISHES_DATA = {
  APPETIZER: [
    {
      name: 'Súp Nấm Rừng Tây Bắc & Dầu Thông',
      description: 'Nước dùng nấm rừng cô đặc thơm mùi thảo mộc bản địa, dầu thông tươi tự nhiên và nấm đùi gà nướng than.',
      price: 350000,
      image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=600',
      is_available: true
    },
    {
      name: 'Bạch Tuộc Nướng Than Hoa & Xốt Lá Lốt',
      description: 'Bạch tuộc nướng than binchotan ăn kèm xốt sữa lá lốt lên men, chanh ngón tay bùng nổ hương vị.',
      price: 420000,
      image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=600',
      is_available: true
    },
    {
      name: 'Gỏi Tôm Sông Côn & Hoa Kim Ngân',
      description: 'Tôm sông tươi ngâm muối nhẹ, xốt bưởi chua thanh dịu, dầu ớt lên men và hoa kim ngân tươi trang trí.',
      price: 390000,
      image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=600',
      is_available: true
    }
  ],
  MAIN_COURSE: [
    {
      name: 'Cá Chẽm Hấp Tương Men & Lá Chanh Thái',
      description: 'Cá chẽm câu tự nhiên hấp tương Koji lên men thủ công tại nhà hàng, dầu hành nướng, lá chanh Thái thơm dịu.',
      price: 850000,
      image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=600',
      is_available: true
    },
    {
      name: 'Bò Wagyu Nướng Tương Đen Tây Nguyên',
      description: 'Thịt bò Wagyu vân mỡ cẩm thạch áp chảo, xốt tương đen hạt điều Tây Nguyên, bột lá tiêu rừng và mousse khoai tây hun khói.',
      price: 1850000,
      image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600',
      is_available: true
    },
    {
      name: 'Ức Vịt Quay Mật Rừng & Xốt Trái Sim',
      description: 'Ức vịt nuôi thảo mộc quay giòn da, sốt trái sim chín rừng ngâm rượu, mật ong rừng Tây Bắc và thảo quả.',
      price: 950000,
      image_url: 'https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&q=80&w=600',
      is_available: true
    }
  ],
  DESSERT: [
    {
      name: 'Kem Khói Lá Dứa & Mật Ong Rừng',
      description: 'Kem tươi lá dứa truyền khói lạnh thơm nhẹ, tổ ong mật rừng nguyên chất và bánh quy dừa giòn rụm.',
      price: 280000,
      image_url: 'https://images.unsplash.com/photo-1507750549-9893309a9677?auto=format&fit=crop&q=80&w=600',
      is_available: true
    },
    {
      name: 'Bánh Chocolate Lạnh & Hương Thảo Lên Men',
      description: 'Bánh tart chocolate đắng 70% Single Origin Việt Nam, kem tươi ủ hương thảo lên men và muối biển hồng.',
      price: 320000,
      image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=600',
      is_available: true
    }
  ],
  BEVERAGE: [
    {
      name: 'Trà Thảo Mộc Maison Edem',
      description: 'Trà thảo mộc nóng chưng từ hoa cúc rừng, sả chanh tươi, nụ hồng Tây Tạng và mật ong rừng.',
      price: 150000,
      image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=600',
      is_available: true
    },
    {
      name: 'Nước Ép Sim Rừng Sủi Bọt',
      description: 'Nước ép sim tươi ngâm đường phèn rừng, bạc hà rừng nghiền nhuyễn và nước khoáng sủi bọt.',
      price: 180000,
      image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=600',
      is_available: true
    }
  ]
};

async function seed() {
  console.log('🌱 Starting database seed for Maison Edem Fine Dining...');
  try {
    // 1. Seed Categories
    console.log('1. Seeding categories...');
    const existingCats = await db('categories').select('*');
    const catCodeToId = {};

    for (const item of FINE_DINING_CATEGORIES) {
      const match = existingCats.find(c => c.code === item.code);
      if (match) {
        catCodeToId[item.code] = match.id;
        console.log(`- Category ${item.code} already exists (ID: ${match.id})`);
      } else {
        const [inserted] = await db('categories').insert(item).returning('*');
        catCodeToId[item.code] = inserted.id;
        console.log(`- Category ${item.code} created (ID: ${inserted.id})`);
      }
    }

    // 2. Seed Tables
    console.log('2. Seeding restaurant tables...');
    const existingTables = await db('restaurant_tables').select('*');
    for (const table of TABLES_DATA) {
      const match = existingTables.find(t => t.table_number === table.table_number);
      if (match) {
        // Update capacity and area to align with fine dining config
        await db('restaurant_tables')
          .where({ id: match.id })
          .update({ capacity: table.capacity, area: table.area, status: table.status });
        console.log(`- Table ${table.table_number} updated`);
      } else {
        await db('restaurant_tables').insert(table);
        console.log(`- Table ${table.table_number} created`);
      }
    }

    // 3. Seed Menu Items
    console.log('3. Seeding menu items...');
    const existingDishes = await db('menu_items').select('*');

    for (const [catCode, dishes] of Object.entries(DISHES_DATA)) {
      const categoryId = catCodeToId[catCode];
      if (!categoryId) {
        console.warn(`- Category ID not found for code ${catCode}, skipping dishes.`);
        continue;
      }

      for (const dish of dishes) {
        const match = existingDishes.find(d => d.name === dish.name);
        const dishData = {
          name: dish.name,
          description: dish.description,
          price: dish.price,
          image_url: dish.image_url,
          is_available: dish.is_available,
          category_id: categoryId,
          modified_date: db.fn.now()
        };

        if (match) {
          await db('menu_items').where({ id: match.id }).update(dishData);
          console.log(`- Dish "${dish.name}" updated under Category ID ${categoryId}`);
        } else {
          await db('menu_items').insert({
            ...dishData,
            created_date: db.fn.now()
          });
          console.log(`- Dish "${dish.name}" created under Category ID ${categoryId}`);
        }
      }
    }

    console.log('✅ Database seeded successfully with Maison Edem Fine Dining data!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

seed();
