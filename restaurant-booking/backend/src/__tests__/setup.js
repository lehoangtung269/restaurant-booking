/**
 * ============================================================
 *  TEST SETUP FILE
 *  Cấu hình biến môi trường cho test integration
 * ============================================================
 *
 *  HƯỚNG DẪN SỬ DỤNG:
 *  1. Đảm bảo backend đang chạy VÀ DB có thể kết nối
 *  2. Tạo 2 tài khoản test trong DB:
 *     - manager@test.com / manager123 (role: MANAGER)
 *     - staff@test.com   / staff123   (role: STAFF)
 *  3. Chạy: npm test hoặc npm run test:verbose
 *
 *  Hoặc ghi đè bằng env vars:
 *     TEST_MANAGER_EMAIL=... TEST_MANAGER_PASS=... npm test
 */

require('dotenv').config({ quiet: true });

const bcrypt = require('bcryptjs');
const db = require('../config/database');

// Cấu hình tài khoản test mặc định (có thể override qua env)
process.env.TEST_MANAGER_EMAIL = process.env.TEST_MANAGER_EMAIL || 'manager@test.com';
process.env.TEST_MANAGER_PASS  = process.env.TEST_MANAGER_PASS  || 'manager123';
process.env.TEST_STAFF_EMAIL   = process.env.TEST_STAFF_EMAIL   || 'staff@test.com';
process.env.TEST_STAFF_PASS    = process.env.TEST_STAFF_PASS    || 'staff123';

const ensureSchemaCompatibility = async () => {
    await db.schema.raw('ALTER TABLE restaurant_tables ALTER COLUMN table_number TYPE varchar(50)');
};

const cleanupTestData = async () => {
    const testReservationIds = db('reservations as r')
        .join('users as u', 'r.user_id', 'u.id')
        .whereLike('u.email', '%@test.com')
        .select('r.id');
    const testUserIds = db('users')
        .whereLike('email', '%@test.com')
        .whereNotIn('email', [process.env.TEST_MANAGER_EMAIL, process.env.TEST_STAFF_EMAIL])
        .select('id');

    await db('pre_order_items')
        .whereIn('pre_order_id', db('pre_orders').whereIn('reservation_id', testReservationIds).select('id'))
        .del();
    await db('pre_orders').whereIn('reservation_id', testReservationIds).del();
    await db('reviews').whereIn('reservation_id', testReservationIds).del();
    await db('notifications').whereIn('user_id', testUserIds).del();
    await db('reservations').whereIn('id', testReservationIds).del();
    await db('users')
        .whereLike('email', '%@test.com')
        .whereNotIn('email', [process.env.TEST_MANAGER_EMAIL, process.env.TEST_STAFF_EMAIL])
        .del();

    await db('menu_items')
        .whereIn('category_id', db('categories').whereLike('code', 'CAT_%').select('id'))
        .del();
    await db('categories').whereLike('code', 'CAT_%').del();

    await db('restaurant_tables')
        .where(function () {
            this.whereLike('table_number', 'T-%')
                .orWhereLike('table_number', 'T-X-%')
                .orWhereLike('table_number', 'T-Y-%')
                .orWhereLike('table_number', 'T-Z-%')
                .orWhereLike('table_number', 'T-CAP-%')
                .orWhereLike('table_number', 'DBG-%');
        })
        .del();
};

const upsertUser = async ({ full_name, email, password, role }) => {
    const password_hash = await bcrypt.hash(password, 10);
    const existing = await db('users').where({ email }).first();

    if (existing) {
        await db('users')
            .where({ id: existing.id })
            .update({
                full_name,
                password_hash,
                role,
                is_active: true,
                modified_date: db.fn.now(),
            });
        return existing.id;
    }

    const [created] = await db('users')
        .insert({ full_name, email, password_hash, role, is_active: true })
        .returning('id');
    return typeof created === 'object' ? created.id : created;
};

const ensureTable = async () => {
    const existing = await db('restaurant_tables')
        .where({ table_number: 'TST01' })
        .first();

    const data = {
        capacity: 4,
        area: 'INDOOR',
        status: 'AVAILABLE',
        modified_date: db.fn.now(),
    };

    if (existing) {
        await db('restaurant_tables').where({ id: existing.id }).update(data);
        return existing.id;
    }

    const [created] = await db('restaurant_tables')
        .insert({ table_number: 'TST01', ...data })
        .returning('id');
    return typeof created === 'object' ? created.id : created;
};

const ensureMenuItem = async () => {
    const categoryCode = 'TEST_FIXTURE';
    let category = await db('categories').where({ code: categoryCode }).first();

    if (!category) {
        const [createdCategory] = await db('categories')
            .insert({ code: categoryCode, name: 'Test Fixture' })
            .returning('*');
        category = createdCategory;
    }

    const existing = await db('menu_items')
        .where({ name: 'Integration Test Dish' })
        .first();

    const data = {
        category_id: category.id,
        description: 'Stable fixture dish for backend integration tests',
        price: 100000,
        image_url: 'https://example.com/integration-test-dish.jpg',
        is_available: true,
        modified_date: db.fn.now(),
    };

    if (existing) {
        await db('menu_items').where({ id: existing.id }).update(data);
        return existing.id;
    }

    const [created] = await db('menu_items')
        .insert({
            name: 'Integration Test Dish',
            ...data,
        })
        .returning('id');
    return typeof created === 'object' ? created.id : created;
};

beforeAll(async () => {
    await ensureSchemaCompatibility();
    await cleanupTestData();

    await upsertUser({
        full_name: 'Test Manager',
        email: process.env.TEST_MANAGER_EMAIL,
        password: process.env.TEST_MANAGER_PASS,
        role: 'MANAGER',
    });

    await upsertUser({
        full_name: 'Test Staff',
        email: process.env.TEST_STAFF_EMAIL,
        password: process.env.TEST_STAFF_PASS,
        role: 'STAFF',
    });

    await ensureTable();
    await ensureMenuItem();
});

afterAll(async () => {
    await db.destroy();
});

global.pending = (reason = 'Skipped by test precondition') => {
    console.warn(`Test skipped: ${reason}`);
};
