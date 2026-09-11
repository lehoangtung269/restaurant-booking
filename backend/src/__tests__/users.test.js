/**
 * ============================================================
 *  USER MANAGEMENT API - TEST SUITE
 *  Covers: getAll, create, getById, updateRole,
 *          updateActive, getUserReservations
 *  All endpoints: MANAGER only
 * ============================================================
 */
const request = require('supertest');
const app = require('../app');

const uniqueEmail = (p) => `${p}_${Date.now()}@test.com`;

let managerToken = '';
let customerToken = '';
let createdUserId = null;
const newUserEmail = uniqueEmail('mgmt_user');

beforeAll(async () => {
    const m = await request(app).post('/api/auth/login')
        .send({ email: process.env.TEST_MANAGER_EMAIL || 'manager@test.com', password: process.env.TEST_MANAGER_PASS || 'manager123' });
    if (m.status === 200) managerToken = m.body.accessToken;

    const c = await request(app).post('/api/auth/register')
        .send({ full_name: 'Mgmt Customer', email: uniqueEmail('mgmt_cust'), password: 'password123' });
    customerToken = c.body.accessToken;
});

// ═══════════════════════════════════════════════════════════════
//  GET ALL USERS (MANAGER)
// ═══════════════════════════════════════════════════════════════
describe('GET /api/users', () => {
    it('✅ TC-USER-01: Manager lấy danh sách users', async () => {
        if (!managerToken) return pending('No manager token - skip');

        const res = await request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${managerToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('✅ TC-USER-02: Filter theo role=STAFF', async () => {
        if (!managerToken) return pending('No manager token - skip');

        const res = await request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${managerToken}`)
            .query({ role: 'STAFF' });
        expect(res.status).toBe(200);
        res.body.forEach(u => expect(u.role).toBe('STAFF'));
    });

    it('✅ TC-USER-03: Filter theo role=CUSTOMER', async () => {
        if (!managerToken) return pending('No manager token - skip');

        const res = await request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${managerToken}`)
            .query({ role: 'CUSTOMER' });
        expect(res.status).toBe(200);
    });

    it('❌ TC-USER-04: Customer xem user list → 403', async () => {
        if (!customerToken) return pending('No customer token - skip');

        const res = await request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${customerToken}`);
        expect(res.status).toBe(403);
    });
});

// ═══════════════════════════════════════════════════════════════
//  CREATE USER (MANAGER)
// ═══════════════════════════════════════════════════════════════
describe('POST /api/users', () => {
    it('✅ TC-USER-05: Manager tạo tài khoản staff', async () => {
        if (!managerToken) return pending('No manager token - skip');

        const res = await request(app)
            .post('/api/users')
            .set('Authorization', `Bearer ${managerToken}`)
            .send({
                full_name: 'New Staff Member',
                email: newUserEmail,
                password: 'staff123',
                role: 'STAFF'
            });
        expect(res.status).toBe(201);
        expect(res.body.role).toBe('STAFF');
        createdUserId = res.body.id;
    });

    it('❌ TC-USER-06: Tạo user với email đã tồn tại → 409', async () => {
        if (!managerToken) return pending('No manager token - skip');

        const res = await request(app)
            .post('/api/users')
            .set('Authorization', `Bearer ${managerToken}`)
            .send({ full_name: 'Duplicate', email: newUserEmail, password: 'pass123', role: 'STAFF' });
        expect(res.status).toBe(409);
    });

    it('❌ TC-USER-07: Customer tạo user → 403', async () => {
        if (!customerToken) return pending('No customer token - skip');

        const res = await request(app)
            .post('/api/users')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ full_name: 'Hack', email: uniqueEmail('hack'), password: 'pass123', role: 'MANAGER' });
        expect(res.status).toBe(403);
    });
});

// ═══════════════════════════════════════════════════════════════
//  GET BY ID (MANAGER)
// ═══════════════════════════════════════════════════════════════
describe('GET /api/users/:id', () => {
    it('✅ TC-USER-08: Manager xem chi tiết user', async () => {
        if (!managerToken || !createdUserId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .get(`/api/users/${createdUserId}`)
            .set('Authorization', `Bearer ${managerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.id).toBe(createdUserId);
    });

    it('❌ TC-USER-09: ID không tồn tại → 404', async () => {
        if (!managerToken) return pending('No manager token - skip');

        const res = await request(app)
            .get('/api/users/999999999')
            .set('Authorization', `Bearer ${managerToken}`);
        expect(res.status).toBe(404);
    });
});

// ═══════════════════════════════════════════════════════════════
//  GET USER RESERVATIONS (MANAGER)
// ═══════════════════════════════════════════════════════════════
describe('GET /api/users/:id/reservations', () => {
    it('✅ TC-USER-10: Manager xem lịch sử đặt bàn của user', async () => {
        if (!managerToken || !createdUserId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .get(`/api/users/${createdUserId}/reservations`)
            .set('Authorization', `Bearer ${managerToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});

// ═══════════════════════════════════════════════════════════════
//  UPDATE ROLE (MANAGER)
// ═══════════════════════════════════════════════════════════════
describe('PATCH /api/users/:id/role', () => {
    it('✅ TC-USER-11: Manager nâng cấp STAFF → MANAGER', async () => {
        if (!managerToken || !createdUserId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .patch(`/api/users/${createdUserId}/role`)
            .set('Authorization', `Bearer ${managerToken}`)
            .send({ role: 'MANAGER' });
        expect(res.status).toBe(200);
    });

    it('✅ TC-USER-12: Manager hạ cấp MANAGER → STAFF', async () => {
        if (!managerToken || !createdUserId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .patch(`/api/users/${createdUserId}/role`)
            .set('Authorization', `Bearer ${managerToken}`)
            .send({ role: 'STAFF' });
        expect(res.status).toBe(200);
        expect(res.body.role).toBe('STAFF');
    });

    it('❌ TC-USER-13: role không hợp lệ → 400', async () => {
        if (!managerToken || !createdUserId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .patch(`/api/users/${createdUserId}/role`)
            .set('Authorization', `Bearer ${managerToken}`)
            .send({ role: 'SUPERADMIN' });
        expect(res.status).toBe(400);
    });
});

// ═══════════════════════════════════════════════════════════════
//  UPDATE ACTIVE (MANAGER)
// ═══════════════════════════════════════════════════════════════
describe('PATCH /api/users/:id/active', () => {
    it('✅ TC-USER-14: Manager vô hiệu hoá tài khoản', async () => {
        if (!managerToken || !createdUserId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .patch(`/api/users/${createdUserId}/active`)
            .set('Authorization', `Bearer ${managerToken}`)
            .send({ is_active: false });
        expect(res.status).toBe(200);
        expect(res.body.is_active).toBe(false);
    });

    it('✅ TC-USER-15: Manager kích hoạt lại tài khoản', async () => {
        if (!managerToken || !createdUserId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .patch(`/api/users/${createdUserId}/active`)
            .set('Authorization', `Bearer ${managerToken}`)
            .send({ is_active: true });
        expect(res.status).toBe(200);
        expect(res.body.is_active).toBe(true);
    });

    it('❌ TC-USER-16: is_active không phải boolean → 400', async () => {
        if (!managerToken || !createdUserId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .patch(`/api/users/${createdUserId}/active`)
            .set('Authorization', `Bearer ${managerToken}`)
            .send({ is_active: 'yes' });
        expect(res.status).toBe(400);
    });
});

// ═══════════════════════════════════════════════════════════════
//  LOGIN DISABLED ACCOUNT
// ═══════════════════════════════════════════════════════════════
describe('Đăng nhập tài khoản bị vô hiệu hoá', () => {
    it('❌ TC-USER-17: Tài khoản bị disable không thể login → 403', async () => {
        if (!managerToken || !createdUserId) return pending('Prerequisites missing - skip');

        // Disable account
        await request(app)
            .patch(`/api/users/${createdUserId}/active`)
            .set('Authorization', `Bearer ${managerToken}`)
            .send({ is_active: false });

        // Thử login
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: newUserEmail, password: 'staff123' });
        expect(res.status).toBe(403);
    });
});
