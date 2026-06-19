/**
 * ============================================================
 *  TABLE API - TEST SUITE
 *  Covers: getAll, getById, create (MANAGER), update (MANAGER),
 *          delete (MANAGER), updateStatus (STAFF/MANAGER),
 *          getAvailable
 * ============================================================
 */
const request = require('supertest');
const app = require('../app');

const uniqueEmail = (prefix = 'test') =>
    `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`;

let managerToken = '';
let staffToken = '';
let customerToken = '';
let createdTableId = null;
const tableNumber = `T-${Date.now()}`;

// ── Setup: đăng nhập với manager account ─────────────────────
beforeAll(async () => {
    // Tạo manager account (cần set role trực tiếp vì register chỉ tạo CUSTOMER)
    // → Dùng tài khoản manager đã có sẵn trong DB, hoặc tạo qua /api/users
    // Đây là test integration, giả sử có sẵn manager trong DB:
    const managerLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: process.env.TEST_MANAGER_EMAIL || 'manager@test.com', password: process.env.TEST_MANAGER_PASS || 'manager123' });
    if (managerLogin.status === 200) {
        managerToken = managerLogin.body.accessToken;
    }

    const staffLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: process.env.TEST_STAFF_EMAIL || 'staff@test.com', password: process.env.TEST_STAFF_PASS || 'staff123' });
    if (staffLogin.status === 200) {
        staffToken = staffLogin.body.accessToken;
    }

    // Tạo customer mới
    const cust = await request(app)
        .post('/api/auth/register')
        .send({ full_name: 'Table Test Customer', email: uniqueEmail('cust_table'), password: 'password123' });
    customerToken = cust.body.accessToken;
});

// ═══════════════════════════════════════════════════════════════
//  GET ALL TABLES (Public)
// ═══════════════════════════════════════════════════════════════
describe('GET /api/tables', () => {
    it('✅ TC-TABLE-01: Lấy danh sách bàn không cần auth', async () => {
        const res = await request(app).get('/api/tables');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});

// ═══════════════════════════════════════════════════════════════
//  CREATE TABLE (MANAGER only)
// ═══════════════════════════════════════════════════════════════
describe('POST /api/tables', () => {
    it('✅ TC-TABLE-02: Manager tạo bàn mới thành công', async () => {
        if (!managerToken) return pending('No manager token - skip');

        const res = await request(app)
            .post('/api/tables')
            .set('Authorization', `Bearer ${managerToken}`)
            .send({ table_number: tableNumber, capacity: 4, area: 'INDOOR' });

        expect(res.status).toBe(201);
        expect(res.body.table_number).toBe(tableNumber);
        createdTableId = res.body.id;
    });

    it('❌ TC-TABLE-03: Customer tạo bàn → 403 Forbidden', async () => {
        const res = await request(app)
            .post('/api/tables')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ table_number: `T-X-${Date.now()}`, capacity: 4, area: 'INDOOR' });
        expect(res.status).toBe(403);
    });

    it('❌ TC-TABLE-04: Không có token → 401', async () => {
        const res = await request(app)
            .post('/api/tables')
            .send({ table_number: `T-Y-${Date.now()}`, capacity: 4, area: 'INDOOR' });
        expect(res.status).toBe(401);
    });

    it('❌ TC-TABLE-05: area không hợp lệ → 400', async () => {
        if (!managerToken) return pending('No manager token - skip');

        const res = await request(app)
            .post('/api/tables')
            .set('Authorization', `Bearer ${managerToken}`)
            .send({ table_number: `T-Z-${Date.now()}`, capacity: 4, area: 'ROOFTOP' });
        expect(res.status).toBe(400);
    });

    it('❌ TC-TABLE-06: capacity = 0 → 400', async () => {
        if (!managerToken) return pending('No manager token - skip');

        const res = await request(app)
            .post('/api/tables')
            .set('Authorization', `Bearer ${managerToken}`)
            .send({ table_number: `T-CAP-${Date.now()}`, capacity: 0, area: 'INDOOR' });
        expect(res.status).toBe(400);
    });
});

// ═══════════════════════════════════════════════════════════════
//  GET BY ID
// ═══════════════════════════════════════════════════════════════
describe('GET /api/tables/:id', () => {
    it('✅ TC-TABLE-07: Lấy chi tiết bàn theo ID', async () => {
        if (!createdTableId) return pending('No table created - skip');

        const res = await request(app).get(`/api/tables/${createdTableId}`);
        expect(res.status).toBe(200);
        expect(res.body.id).toBe(createdTableId);
    });

    it('❌ TC-TABLE-08: ID không tồn tại → 404', async () => {
        const res = await request(app).get('/api/tables/999999999');
        expect(res.status).toBe(404);
    });
});

// ═══════════════════════════════════════════════════════════════
//  UPDATE TABLE (MANAGER)
// ═══════════════════════════════════════════════════════════════
describe('PUT /api/tables/:id', () => {
    it('✅ TC-TABLE-09: Manager update capacity bàn', async () => {
        if (!managerToken || !createdTableId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .put(`/api/tables/${createdTableId}`)
            .set('Authorization', `Bearer ${managerToken}`)
            .send({ capacity: 6 });
        expect(res.status).toBe(200);
    });
});

// ═══════════════════════════════════════════════════════════════
//  UPDATE STATUS (STAFF/MANAGER)
// ═══════════════════════════════════════════════════════════════
describe('PATCH /api/tables/:id/status', () => {
    it('✅ TC-TABLE-10: Manager set status MAINTENANCE', async () => {
        if (!managerToken || !createdTableId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .patch(`/api/tables/${createdTableId}/status`)
            .set('Authorization', `Bearer ${managerToken}`)
            .send({ status: 'MAINTENANCE' });
        expect(res.status).toBe(200);
    });

    it('❌ TC-TABLE-11: Customer set status → 403', async () => {
        if (!createdTableId) return pending('No table created - skip');

        const res = await request(app)
            .patch(`/api/tables/${createdTableId}/status`)
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ status: 'MAINTENANCE' });
        expect(res.status).toBe(403);
    });
});

// ═══════════════════════════════════════════════════════════════
//  CHECK AVAILABILITY
// ═══════════════════════════════════════════════════════════════
describe('GET /api/tables/availability', () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    it('✅ TC-TABLE-12: Kiểm tra availability bàn ngày hợp lệ', async () => {
        const res = await request(app)
            .get('/api/tables/availability')
            .query({ date: tomorrow, start_time: '18:00' });
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('❌ TC-TABLE-13: date trong quá khứ → 400', async () => {
        const res = await request(app)
            .get('/api/tables/availability')
            .query({ date: '2020-01-01', start_time: '18:00' });
        expect(res.status).toBe(400);
    });

    it('❌ TC-TABLE-14: Thiếu date → 400', async () => {
        const res = await request(app)
            .get('/api/tables/availability')
            .query({ start_time: '18:00' });
        expect(res.status).toBe(400);
    });
});

// ═══════════════════════════════════════════════════════════════
//  DELETE TABLE (MANAGER)
// ═══════════════════════════════════════════════════════════════
describe('DELETE /api/tables/:id', () => {
    it('✅ TC-TABLE-15: Manager xóa bàn', async () => {
        if (!managerToken || !createdTableId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .delete(`/api/tables/${createdTableId}`)
            .set('Authorization', `Bearer ${managerToken}`);
        expect(res.status).toBe(200);
    });

    it('❌ TC-TABLE-16: Staff xóa bàn → 403', async () => {
        if (!staffToken) return pending('No staff token - skip');

        const res = await request(app)
            .delete('/api/tables/1')
            .set('Authorization', `Bearer ${staffToken}`);
        expect(res.status).toBe(403);
    });
});
