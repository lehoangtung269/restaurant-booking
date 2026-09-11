/**
 * ============================================================
 *  DASHBOARD API - TEST SUITE
 *  Covers: overview, revenue, occupancy, top-items
 *  All endpoints: MANAGER only
 * ============================================================
 */
const request = require('supertest');
const app = require('../app');

const uniqueEmail = (p) => `${p}_${Date.now()}@test.com`;

let managerToken = '';
let customerToken = '';
const today = new Date().toISOString().split('T')[0];
const lastMonth = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

beforeAll(async () => {
    const m = await request(app).post('/api/auth/login')
        .send({ email: process.env.TEST_MANAGER_EMAIL || 'manager@test.com', password: process.env.TEST_MANAGER_PASS || 'manager123' });
    if (m.status === 200) managerToken = m.body.accessToken;

    const c = await request(app).post('/api/auth/register')
        .send({ full_name: 'Dashboard Customer', email: uniqueEmail('dash_cust'), password: 'password123' });
    customerToken = c.body.accessToken;
});

// ═══════════════════════════════════════════════════════════════
//  OVERVIEW
// ═══════════════════════════════════════════════════════════════
describe('GET /api/dashboard/overview', () => {
    it('✅ TC-DASH-01: Manager lấy tổng quan', async () => {
        if (!managerToken) return pending('No manager token - skip');

        const res = await request(app)
            .get('/api/dashboard/overview')
            .set('Authorization', `Bearer ${managerToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('reservations');
        expect(res.body).toHaveProperty('total_reservations');
        expect(res.body).toHaveProperty('no_show_rate');
        expect(res.body).toHaveProperty('total_customers');
        expect(res.body).toHaveProperty('total_tables');
    });

    it('✅ TC-DASH-02: Lọc theo from-to', async () => {
        if (!managerToken) return pending('No manager token - skip');

        const res = await request(app)
            .get('/api/dashboard/overview')
            .set('Authorization', `Bearer ${managerToken}`)
            .query({ from: lastMonth, to: today });
        expect(res.status).toBe(200);
    });

    it('❌ TC-DASH-03: Customer xem dashboard → 403', async () => {
        if (!customerToken) return pending('No customer token - skip');

        const res = await request(app)
            .get('/api/dashboard/overview')
            .set('Authorization', `Bearer ${customerToken}`);
        expect(res.status).toBe(403);
    });

    it('❌ TC-DASH-04: Không có token → 401', async () => {
        const res = await request(app).get('/api/dashboard/overview');
        expect(res.status).toBe(401);
    });
});

// ═══════════════════════════════════════════════════════════════
//  REVENUE
// ═══════════════════════════════════════════════════════════════
describe('GET /api/dashboard/revenue', () => {
    it('✅ TC-DASH-05: Doanh thu theo năm', async () => {
        if (!managerToken) return pending('No manager token - skip');

        const res = await request(app)
            .get('/api/dashboard/revenue')
            .set('Authorization', `Bearer ${managerToken}`)
            .query({ year: currentYear });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('breakdown');
        expect(Array.isArray(res.body.breakdown)).toBe(true);
    });

    it('✅ TC-DASH-06: Doanh thu theo tháng cụ thể', async () => {
        if (!managerToken) return pending('No manager token - skip');

        const res = await request(app)
            .get('/api/dashboard/revenue')
            .set('Authorization', `Bearer ${managerToken}`)
            .query({ year: currentYear, month: currentMonth });
        expect(res.status).toBe(200);
        expect(res.body.month).toBe(currentMonth);
    });

    it('❌ TC-DASH-07: Thiếu year → 400', async () => {
        if (!managerToken) return pending('No manager token - skip');

        const res = await request(app)
            .get('/api/dashboard/revenue')
            .set('Authorization', `Bearer ${managerToken}`);
        expect(res.status).toBe(400);
    });

    it('❌ TC-DASH-08: year không hợp lệ (chữ) → 400', async () => {
        if (!managerToken) return pending('No manager token - skip');

        const res = await request(app)
            .get('/api/dashboard/revenue')
            .set('Authorization', `Bearer ${managerToken}`)
            .query({ year: 'abc' });
        expect(res.status).toBe(400);
    });

    it('❌ TC-DASH-09: month ngoài [1-12] → 400', async () => {
        if (!managerToken) return pending('No manager token - skip');

        const res = await request(app)
            .get('/api/dashboard/revenue')
            .set('Authorization', `Bearer ${managerToken}`)
            .query({ year: currentYear, month: 13 });
        expect(res.status).toBe(400);
    });
});

// ═══════════════════════════════════════════════════════════════
//  OCCUPANCY
// ═══════════════════════════════════════════════════════════════
describe('GET /api/dashboard/occupancy', () => {
    it('✅ TC-DASH-10: Tỷ lệ lấp đầy trong khoảng ngày', async () => {
        if (!managerToken) return pending('No manager token - skip');

        const res = await request(app)
            .get('/api/dashboard/occupancy')
            .set('Authorization', `Bearer ${managerToken}`)
            .query({ from: lastMonth, to: today });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('occupancy_rate');
        expect(res.body).toHaveProperty('breakdown');
    });

    it('❌ TC-DASH-11: Thiếu from hoặc to → 400', async () => {
        if (!managerToken) return pending('No manager token - skip');

        const res = await request(app)
            .get('/api/dashboard/occupancy')
            .set('Authorization', `Bearer ${managerToken}`)
            .query({ from: lastMonth });
        expect(res.status).toBe(400);
    });
});

// ═══════════════════════════════════════════════════════════════
//  TOP PRE-ORDERED ITEMS
// ═══════════════════════════════════════════════════════════════
describe('GET /api/dashboard/top-items', () => {
    it('✅ TC-DASH-12: Top 10 món đặt trước nhiều nhất', async () => {
        if (!managerToken) return pending('No manager token - skip');

        const res = await request(app)
            .get('/api/dashboard/top-items')
            .set('Authorization', `Bearer ${managerToken}`)
            .query({ limit: 10 });
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('✅ TC-DASH-13: Filter theo from-to', async () => {
        if (!managerToken) return pending('No manager token - skip');

        const res = await request(app)
            .get('/api/dashboard/top-items')
            .set('Authorization', `Bearer ${managerToken}`)
            .query({ limit: 5, from: lastMonth, to: today });
        expect(res.status).toBe(200);
        expect(res.body.length).toBeLessThanOrEqual(5);
    });

    it('❌ TC-DASH-14: limit > 100 → 400', async () => {
        if (!managerToken) return pending('No manager token - skip');

        const res = await request(app)
            .get('/api/dashboard/top-items')
            .set('Authorization', `Bearer ${managerToken}`)
            .query({ limit: 101 });
        expect(res.status).toBe(400);
    });
});
