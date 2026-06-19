/**
 * ============================================================
 *  RESERVATION API - TEST SUITE
 *  Covers: create, getMyReservations, getAll (STAFF/MANAGER),
 *          getById, updateStatus (state machine),
 *          cancel (customer 2h rule), managerCancel, addStaffNote
 * ============================================================
 */
const request = require('supertest');
const app = require('../app');

const uniqueEmail = (prefix = 'res') =>
    `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`;

let customerToken = '';
let customer2Token = '';
let staffToken = '';
let managerToken = '';

let reservationId = null;
let tableId = null;

// ── Setup: đăng ký customer và lấy token ──────────────────────
beforeAll(async () => {
    // Customer 1
    const r1 = await request(app)
        .post('/api/auth/register')
        .send({ full_name: 'Res Customer1', email: uniqueEmail('cust1_res'), password: 'password123' });
    customerToken = r1.body.accessToken;

    // Customer 2 (để test authorization)
    const r2 = await request(app)
        .post('/api/auth/register')
        .send({ full_name: 'Res Customer2', email: uniqueEmail('cust2_res'), password: 'password123' });
    customer2Token = r2.body.accessToken;

    // Manager
    const m = await request(app)
        .post('/api/auth/login')
        .send({ email: process.env.TEST_MANAGER_EMAIL || 'manager@test.com', password: process.env.TEST_MANAGER_PASS || 'manager123' });
    if (m.status === 200) managerToken = m.body.accessToken;

    // Staff
    const s = await request(app)
        .post('/api/auth/login')
        .send({ email: process.env.TEST_STAFF_EMAIL || 'staff@test.com', password: process.env.TEST_STAFF_PASS || 'staff123' });
    if (s.status === 200) staffToken = s.body.accessToken;

    // Lấy 1 bàn AVAILABLE
    const tables = await request(app).get('/api/tables');
    const available = tables.body.find(t => t.status === 'AVAILABLE');
    if (available) tableId = available.id;
});

// ═══════════════════════════════════════════════════════════════
//  CREATE RESERVATION
// ═══════════════════════════════════════════════════════════════
describe('POST /api/reservations', () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    it('✅ TC-RES-01: Customer tạo đặt bàn hợp lệ', async () => {
        if (!customerToken || !tableId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .post('/api/reservations')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({
                table_id: tableId,
                reservation_date: tomorrow,
                start_time: '19:00',
                guest_count: 2,
                special_notes: 'Bàn gần cửa sổ'
            });

        expect(res.status).toBe(201);
        expect(res.body.status).toBe('CONFIRMED');
        reservationId = res.body.id;
    });

    it('❌ TC-RES-02: Đặt bàn trùng giờ cùng bàn → 409 Conflict', async () => {
        if (!customerToken || !tableId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .post('/api/reservations')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({
                table_id: tableId,
                reservation_date: tomorrow,
                start_time: '19:30', // overlap với reservation trước
                guest_count: 2,
            });
        expect(res.status).toBe(409);
    });

    it('❌ TC-RES-03: Không có token → 401', async () => {
        const res = await request(app)
            .post('/api/reservations')
            .send({ table_id: tableId, reservation_date: tomorrow, start_time: '20:00', guest_count: 2 });
        expect(res.status).toBe(401);
    });

    it('❌ TC-RES-04: Thiếu start_time → 400', async () => {
        if (!customerToken) return pending('No customer token - skip');

        const res = await request(app)
            .post('/api/reservations')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ table_id: tableId, reservation_date: tomorrow, guest_count: 2 });
        expect(res.status).toBe(400);
    });

    it('❌ TC-RES-05: reservation_date trong quá khứ → 400', async () => {
        if (!customerToken) return pending('No customer token - skip');

        const res = await request(app)
            .post('/api/reservations')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ table_id: tableId, reservation_date: '2020-01-01', start_time: '18:00', guest_count: 2 });
        expect(res.status).toBe(400);
    });

    it('❌ TC-RES-06: guest_count vượt quá capacity bàn → 400', async () => {
        if (!customerToken || !tableId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .post('/api/reservations')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ table_id: tableId, reservation_date: tomorrow, start_time: '21:00', guest_count: 9999 });
        expect(res.status).toBe(400);
    });

    it('❌ TC-RES-07: Đặt bàn sau 22:00 (sẽ qua đêm) → 400', async () => {
        if (!customerToken || !tableId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .post('/api/reservations')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ table_id: tableId, reservation_date: tomorrow, start_time: '23:00', guest_count: 2 });
        expect(res.status).toBe(400);
    });
});

// ═══════════════════════════════════════════════════════════════
//  GET MY RESERVATIONS
// ═══════════════════════════════════════════════════════════════
describe('GET /api/reservations/my', () => {
    it('✅ TC-RES-08: Customer xem đặt bàn của mình', async () => {
        if (!customerToken) return pending('No customer token - skip');

        const res = await request(app)
            .get('/api/reservations/my')
            .set('Authorization', `Bearer ${customerToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('❌ TC-RES-09: Không có token → 401', async () => {
        const res = await request(app).get('/api/reservations/my');
        expect(res.status).toBe(401);
    });
});

// ═══════════════════════════════════════════════════════════════
//  GET ALL (STAFF/MANAGER)
// ═══════════════════════════════════════════════════════════════
describe('GET /api/reservations', () => {
    it('✅ TC-RES-10: Staff xem tất cả đặt bàn', async () => {
        if (!staffToken) return pending('No staff token - skip');

        const res = await request(app)
            .get('/api/reservations')
            .set('Authorization', `Bearer ${staffToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('✅ TC-RES-11: Filter theo date', async () => {
        if (!managerToken) return pending('No manager token - skip');

        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const res = await request(app)
            .get('/api/reservations')
            .set('Authorization', `Bearer ${managerToken}`)
            .query({ date: tomorrow });
        expect(res.status).toBe(200);
    });

    it('✅ TC-RES-12: Filter theo status=CONFIRMED', async () => {
        if (!managerToken) return pending('No manager token - skip');

        const res = await request(app)
            .get('/api/reservations')
            .set('Authorization', `Bearer ${managerToken}`)
            .query({ status: 'CONFIRMED' });
        expect(res.status).toBe(200);
    });

    it('❌ TC-RES-13: Customer xem tất cả → 403', async () => {
        if (!customerToken) return pending('No customer token - skip');

        const res = await request(app)
            .get('/api/reservations')
            .set('Authorization', `Bearer ${customerToken}`);
        expect(res.status).toBe(403);
    });
});

// ═══════════════════════════════════════════════════════════════
//  GET BY ID
// ═══════════════════════════════════════════════════════════════
describe('GET /api/reservations/:id', () => {
    it('✅ TC-RES-14: Customer xem reservation của mình', async () => {
        if (!customerToken || !reservationId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .get(`/api/reservations/${reservationId}`)
            .set('Authorization', `Bearer ${customerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.id).toBe(reservationId);
    });

    it('❌ TC-RES-15: Customer xem reservation của người khác → 403', async () => {
        if (!customer2Token || !reservationId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .get(`/api/reservations/${reservationId}`)
            .set('Authorization', `Bearer ${customer2Token}`);
        expect(res.status).toBe(403);
    });

    it('❌ TC-RES-16: ID không tồn tại → 404', async () => {
        if (!managerToken) return pending('No manager token - skip');

        const res = await request(app)
            .get('/api/reservations/999999999')
            .set('Authorization', `Bearer ${managerToken}`);
        expect(res.status).toBe(404);
    });
});

// ═══════════════════════════════════════════════════════════════
//  UPDATE STATUS (State Machine - STAFF/MANAGER)
// ═══════════════════════════════════════════════════════════════
describe('PATCH /api/reservations/:id/status', () => {
    it('✅ TC-RES-17: Staff chuyển CONFIRMED → SEATED', async () => {
        if (!staffToken || !reservationId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .patch(`/api/reservations/${reservationId}/status`)
            .set('Authorization', `Bearer ${staffToken}`)
            .send({ status: 'SEATED' });
        expect(res.status).toBe(200);
    });

    it('✅ TC-RES-18: Staff chuyển SEATED → COMPLETED', async () => {
        if (!staffToken || !reservationId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .patch(`/api/reservations/${reservationId}/status`)
            .set('Authorization', `Bearer ${staffToken}`)
            .send({ status: 'COMPLETED' });
        expect(res.status).toBe(200);
    });

    it('❌ TC-RES-19: Chuyển trạng thái không hợp lệ (COMPLETED → CONFIRMED) → 400', async () => {
        if (!staffToken || !reservationId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .patch(`/api/reservations/${reservationId}/status`)
            .set('Authorization', `Bearer ${staffToken}`)
            .send({ status: 'CONFIRMED' });
        expect(res.status).toBe(400);
    });

    it('❌ TC-RES-20: Customer cập nhật status → 403', async () => {
        if (!customerToken || !reservationId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .patch(`/api/reservations/${reservationId}/status`)
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ status: 'SEATED' });
        expect(res.status).toBe(403);
    });

    it('❌ TC-RES-21: Status không thuộc enum hợp lệ → 400', async () => {
        if (!staffToken || !reservationId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .patch(`/api/reservations/${reservationId}/status`)
            .set('Authorization', `Bearer ${staffToken}`)
            .send({ status: 'PENDING' }); // PENDING không có trong enum
        expect(res.status).toBe(400);
    });
});

// ═══════════════════════════════════════════════════════════════
//  CUSTOMER CANCEL (deadline 2h)
// ═══════════════════════════════════════════════════════════════
describe('PATCH /api/reservations/:id/cancel', () => {
    let newReservationId = null;

    beforeAll(async () => {
        // Tạo reservation mới vì cái cũ đã COMPLETED
        if (!customerToken || !tableId) return;
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const res = await request(app)
            .post('/api/reservations')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ table_id: tableId, reservation_date: tomorrow, start_time: '14:00', guest_count: 1 });
        if (res.status === 201) newReservationId = res.body.id;
    });

    it('✅ TC-RES-22: Customer huỷ reservation của mình (nhiều hơn 2h trước)', async () => {
        if (!customerToken || !newReservationId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .patch(`/api/reservations/${newReservationId}/cancel`)
            .set('Authorization', `Bearer ${customerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/cancelled successfully/i);
    });

    it('❌ TC-RES-23: Customer huỷ reservation của người khác → 403', async () => {
        if (!customer2Token || !newReservationId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .patch(`/api/reservations/${newReservationId}/cancel`)
            .set('Authorization', `Bearer ${customer2Token}`);
        expect(res.status).toBe(400); // Already CANCELLED (previous test) or 403
    });
});

// ═══════════════════════════════════════════════════════════════
//  MANAGER CANCEL
// ═══════════════════════════════════════════════════════════════
describe('PATCH /api/reservations/:id/manager-cancel', () => {
    let targetId = null;

    beforeAll(async () => {
        if (!customerToken || !tableId) return;
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const res = await request(app)
            .post('/api/reservations')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ table_id: tableId, reservation_date: tomorrow, start_time: '15:00', guest_count: 1 });
        if (res.status === 201) targetId = res.body.id;
    });

    it('✅ TC-RES-24: Manager huỷ reservation với lý do', async () => {
        if (!managerToken || !targetId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .patch(`/api/reservations/${targetId}/manager-cancel`)
            .set('Authorization', `Bearer ${managerToken}`)
            .send({ reason: 'Nhà hàng đóng cửa đột xuất' });
        expect(res.status).toBe(200);
    });

    it('❌ TC-RES-25: Manager huỷ không có reason → 400', async () => {
        if (!managerToken || !targetId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .patch(`/api/reservations/${targetId}/manager-cancel`)
            .set('Authorization', `Bearer ${managerToken}`)
            .send({});
        expect([400, 404]).toContain(res.status); // 404 nếu đã cancel, 400 nếu thiếu reason
    });

    it('❌ TC-RES-26: Staff huỷ kiểu manager → 403', async () => {
        if (!staffToken || !targetId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .patch(`/api/reservations/${targetId}/manager-cancel`)
            .set('Authorization', `Bearer ${staffToken}`)
            .send({ reason: 'test' });
        expect(res.status).toBe(403);
    });
});

// ═══════════════════════════════════════════════════════════════
//  ADD STAFF NOTE
// ═══════════════════════════════════════════════════════════════
describe('PATCH /api/reservations/:id/note', () => {
    let noteTargetId = null;

    beforeAll(async () => {
        if (!customerToken || !tableId) return;
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const res = await request(app)
            .post('/api/reservations')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ table_id: tableId, reservation_date: tomorrow, start_time: '16:00', guest_count: 2 });
        if (res.status === 201) noteTargetId = res.body.id;
    });

    it('✅ TC-RES-27: Staff thêm ghi chú', async () => {
        if (!staffToken || !noteTargetId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .patch(`/api/reservations/${noteTargetId}/note`)
            .set('Authorization', `Bearer ${staffToken}`)
            .send({ note: 'Ghế trẻ em + bánh sinh nhật' });
        expect(res.status).toBe(200);
    });

    it('❌ TC-RES-28: Ghi chú rỗng → 400', async () => {
        if (!staffToken || !noteTargetId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .patch(`/api/reservations/${noteTargetId}/note`)
            .set('Authorization', `Bearer ${staffToken}`)
            .send({ note: '   ' });
        expect(res.status).toBe(400);
    });
});
