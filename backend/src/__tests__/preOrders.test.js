/**
 * ============================================================
 *  PRE-ORDER API - TEST SUITE
 *  Covers: createOrUpdate, getByReservation, cancel
 * ============================================================
 */
const request = require('supertest');
const app = require('../app');

const uniqueEmail = (p) => `${p}_${Date.now()}@test.com`;

let customerToken = '';
let managerToken = '';
let reservationId = null;
let tableId = null;
let menuItemId = null;

beforeAll(async () => {
    const m = await request(app).post('/api/auth/login')
        .send({ email: process.env.TEST_MANAGER_EMAIL || 'manager@test.com', password: process.env.TEST_MANAGER_PASS || 'manager123' });
    if (m.status === 200) managerToken = m.body.accessToken;

    const c = await request(app).post('/api/auth/register')
        .send({ full_name: 'PreOrder Customer', email: uniqueEmail('preorder_cust'), password: 'password123' });
    customerToken = c.body.accessToken;

    // Lấy bàn available
    const tables = await request(app).get('/api/tables');
    const available = tables.body.find(t => t.table_number === 'TST01' && t.status === 'AVAILABLE')
        || tables.body.find(t => t.status === 'AVAILABLE');
    if (available) tableId = available.id;

    // Tạo reservation
    if (customerToken && tableId) {
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const r = await request(app)
            .post('/api/reservations')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ table_id: tableId, reservation_date: tomorrow, start_time: '18:30', guest_count: 2 });
        if (r.status === 201) reservationId = r.body.id;
    }

    // Lấy menu item available
    const items = await request(app).get('/api/menu/items');
    const avItem = items.body.find(i => i.is_available);
    if (avItem) menuItemId = avItem.id;
});

// ═══════════════════════════════════════════════════════════════
//  CREATE / UPDATE PRE-ORDER
// ═══════════════════════════════════════════════════════════════
describe('POST /api/pre-orders', () => {
    it('✅ TC-PRE-01: Customer tạo pre-order cho reservation CONFIRMED', async () => {
        if (!customerToken || !reservationId || !menuItemId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .post('/api/pre-orders')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({
                reservation_id: reservationId,
                items: [{ menu_item_id: menuItemId, quantity: 2, notes: 'Không cay' }]
            });

        expect(res.status).toBe(201);
        expect(res.body.items).toHaveLength(1);
        expect(Number(res.body.total_amount)).toBeGreaterThan(0);
    });

    it('✅ TC-PRE-02: Cập nhật lại pre-order (thêm món)', async () => {
        if (!customerToken || !reservationId || !menuItemId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .post('/api/pre-orders')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({
                reservation_id: reservationId,
                items: [{ menu_item_id: menuItemId, quantity: 5 }]
            });

        expect(res.status).toBe(201);
    });

    it('❌ TC-PRE-03: Không có token → 401', async () => {
        const res = await request(app)
            .post('/api/pre-orders')
            .send({ reservation_id: 1, items: [{ menu_item_id: 1, quantity: 1 }] });
        expect(res.status).toBe(401);
    });

    it('❌ TC-PRE-04: reservation_id không tồn tại → 404', async () => {
        if (!customerToken) return pending('No customer token - skip');

        const res = await request(app)
            .post('/api/pre-orders')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ reservation_id: 999999999, items: [{ menu_item_id: 1, quantity: 1 }] });
        expect(res.status).toBe(404);
    });

    it('❌ TC-PRE-05: menu_item_id không tồn tại → 404', async () => {
        if (!customerToken || !reservationId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .post('/api/pre-orders')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({
                reservation_id: reservationId,
                items: [{ menu_item_id: 999999999, quantity: 1 }]
            });
        expect(res.status).toBe(404);
    });

    it('❌ TC-PRE-06: items rỗng → 400', async () => {
        if (!customerToken || !reservationId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .post('/api/pre-orders')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ reservation_id: reservationId, items: [] });
        expect(res.status).toBe(400);
    });

    it('❌ TC-PRE-07: quantity = 0 → 400', async () => {
        if (!customerToken || !reservationId || !menuItemId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .post('/api/pre-orders')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({
                reservation_id: reservationId,
                items: [{ menu_item_id: menuItemId, quantity: 0 }]
            });
        expect(res.status).toBe(400);
    });

    it('❌ TC-PRE-08: Người khác tạo pre-order cho reservation của mình → 403', async () => {
        if (!reservationId || !menuItemId) return pending('Prerequisites missing - skip');

        const c2 = await request(app).post('/api/auth/register')
            .send({ full_name: 'Other User', email: uniqueEmail('other_pre'), password: 'password123' });
        const token2 = c2.body.accessToken;

        const res = await request(app)
            .post('/api/pre-orders')
            .set('Authorization', `Bearer ${token2}`)
            .send({ reservation_id: reservationId, items: [{ menu_item_id: menuItemId, quantity: 1 }] });
        expect(res.status).toBe(403);
    });
});

// ═══════════════════════════════════════════════════════════════
//  GET PRE-ORDER BY RESERVATION
// ═══════════════════════════════════════════════════════════════
describe('GET /api/pre-orders/reservation/:reservation_id', () => {
    it('✅ TC-PRE-09: Customer lấy pre-order của reservation mình', async () => {
        if (!customerToken || !reservationId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .get(`/api/pre-orders/reservation/${reservationId}`)
            .set('Authorization', `Bearer ${customerToken}`);
        expect(res.status).toBe(200);
    });

    it('✅ TC-PRE-10: Manager lấy pre-order của bất kỳ reservation', async () => {
        if (!managerToken || !reservationId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .get(`/api/pre-orders/reservation/${reservationId}`)
            .set('Authorization', `Bearer ${managerToken}`);
        expect(res.status).toBe(200);
    });

    it('❌ TC-PRE-11: reservation_id không tồn tại → 404', async () => {
        if (!customerToken) return pending('No customer token - skip');

        const res = await request(app)
            .get('/api/pre-orders/reservation/999999999')
            .set('Authorization', `Bearer ${customerToken}`);
        expect(res.status).toBe(404);
    });
});

// ═══════════════════════════════════════════════════════════════
//  CANCEL PRE-ORDER
// ═══════════════════════════════════════════════════════════════
describe('PATCH /api/pre-orders/reservation/:reservation_id/cancel', () => {
    it('✅ TC-PRE-12: Customer huỷ pre-order', async () => {
        if (!customerToken || !reservationId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .patch(`/api/pre-orders/reservation/${reservationId}/cancel`)
            .set('Authorization', `Bearer ${customerToken}`);
        expect(res.status).toBe(200);
    });

    it('❌ TC-PRE-13: Huỷ pre-order đã cancelled → 400', async () => {
        if (!customerToken || !reservationId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .patch(`/api/pre-orders/reservation/${reservationId}/cancel`)
            .set('Authorization', `Bearer ${customerToken}`);
        expect(res.status).toBe(400);
    });
});
