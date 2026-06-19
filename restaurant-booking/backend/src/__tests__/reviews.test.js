/**
 * ============================================================
 *  REVIEW API - TEST SUITE
 *  Covers: create review, getAll, getMyReviews, manager reply
 * ============================================================
 */
const request = require('supertest');
const app = require('../app');

const uniqueEmail = (p) => `${p}_${Date.now()}@test.com`;

let customerToken = '';
let managerToken = '';
let reviewId = null;

// Giả sử cần có 1 reservation với status COMPLETED
// (tạo và complete trong beforeAll)
let completedReservationId = null;
let tableId = null;

beforeAll(async () => {
    const m = await request(app).post('/api/auth/login')
        .send({ email: process.env.TEST_MANAGER_EMAIL || 'manager@test.com', password: process.env.TEST_MANAGER_PASS || 'manager123' });
    if (m.status === 200) managerToken = m.body.accessToken;

    const c = await request(app).post('/api/auth/register')
        .send({ full_name: 'Review Customer', email: uniqueEmail('review_cust'), password: 'password123' });
    customerToken = c.body.accessToken;

    // Lấy bàn available
    const tables = await request(app).get('/api/tables');
    const available = tables.body.find(t => t.status === 'AVAILABLE');
    if (available) tableId = available.id;

    // Tạo reservation
    if (customerToken && tableId) {
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const r = await request(app)
            .post('/api/reservations')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ table_id: tableId, reservation_date: tomorrow, start_time: '12:00', guest_count: 2 });

        if (r.status === 201 && managerToken) {
            const resId = r.body.id;
            // Chuyển → SEATED
            await request(app)
                .patch(`/api/reservations/${resId}/status`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ status: 'SEATED' });
            // Chuyển → COMPLETED
            const completed = await request(app)
                .patch(`/api/reservations/${resId}/status`)
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ status: 'COMPLETED' });
            if (completed.status === 200) completedReservationId = resId;
        }
    }
});

// ═══════════════════════════════════════════════════════════════
//  CREATE REVIEW
// ═══════════════════════════════════════════════════════════════
describe('POST /api/reviews', () => {
    it('✅ TC-REVIEW-01: Customer đánh giá reservation COMPLETED', async () => {
        if (!customerToken || !completedReservationId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .post('/api/reviews')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ reservation_id: completedReservationId, rating: 5, comment: 'Excellent service!' });

        expect(res.status).toBe(201);
        reviewId = res.body.id;
    });

    it('❌ TC-REVIEW-02: Đánh giá lần 2 cùng reservation → 409', async () => {
        if (!customerToken || !completedReservationId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .post('/api/reviews')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ reservation_id: completedReservationId, rating: 3 });
        expect(res.status).toBe(409);
    });

    it('❌ TC-REVIEW-03: Đánh giá reservation chưa COMPLETED → 400', async () => {
        if (!customerToken || !tableId) return pending('Prerequisites missing - skip');

        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const r = await request(app)
            .post('/api/reservations')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ table_id: tableId, reservation_date: tomorrow, start_time: '17:00', guest_count: 1 });

        if (r.status !== 201) return pending('Could not create reservation - skip');

        const res = await request(app)
            .post('/api/reviews')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ reservation_id: r.body.id, rating: 4 });
        expect(res.status).toBe(400);
    });

    it('❌ TC-REVIEW-04: rating ngoài [1-5] → 400', async () => {
        if (!customerToken) return pending('No customer token - skip');

        const res = await request(app)
            .post('/api/reviews')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ reservation_id: 1, rating: 6 });
        expect(res.status).toBe(400);
    });

    it('❌ TC-REVIEW-05: Không có token → 401', async () => {
        const res = await request(app)
            .post('/api/reviews')
            .send({ reservation_id: 1, rating: 5 });
        expect(res.status).toBe(401);
    });

    it('❌ TC-REVIEW-06: Đánh giá reservation của người khác → 403', async () => {
        if (!completedReservationId) return pending('No completed reservation - skip');

        // Tạo customer 2
        const c2 = await request(app).post('/api/auth/register')
            .send({ full_name: 'Review Customer2', email: uniqueEmail('review_c2'), password: 'password123' });
        const token2 = c2.body.accessToken;

        const res = await request(app)
            .post('/api/reviews')
            .set('Authorization', `Bearer ${token2}`)
            .send({ reservation_id: completedReservationId, rating: 1 });
        expect(res.status).toBe(403);
    });
});

// ═══════════════════════════════════════════════════════════════
//  GET ALL REVIEWS (Public)
// ═══════════════════════════════════════════════════════════════
describe('GET /api/reviews', () => {
    it('✅ TC-REVIEW-07: Lấy danh sách đánh giá không cần auth', async () => {
        const res = await request(app).get('/api/reviews');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('✅ TC-REVIEW-08: Lấy đánh giá với limit=5', async () => {
        const res = await request(app).get('/api/reviews').query({ limit: 5 });
        expect(res.status).toBe(200);
        expect(res.body.length).toBeLessThanOrEqual(5);
    });

    it('❌ TC-REVIEW-09: limit vượt quá 100 → 400', async () => {
        const res = await request(app).get('/api/reviews').query({ limit: 200 });
        expect(res.status).toBe(400);
    });
});

// ═══════════════════════════════════════════════════════════════
//  GET MY REVIEWS
// ═══════════════════════════════════════════════════════════════
describe('GET /api/reviews/my', () => {
    it('✅ TC-REVIEW-10: Customer xem đánh giá của mình', async () => {
        if (!customerToken) return pending('No customer token - skip');

        const res = await request(app)
            .get('/api/reviews/my')
            .set('Authorization', `Bearer ${customerToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});

// ═══════════════════════════════════════════════════════════════
//  MANAGER REPLY
// ═══════════════════════════════════════════════════════════════
describe('PATCH /api/reviews/:id/reply', () => {
    it('✅ TC-REVIEW-11: Manager phản hồi đánh giá', async () => {
        if (!managerToken || !reviewId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .patch(`/api/reviews/${reviewId}/reply`)
            .set('Authorization', `Bearer ${managerToken}`)
            .send({ manager_reply: 'Cảm ơn bạn đã đánh giá!' });
        expect(res.status).toBe(200);
    });

    it('❌ TC-REVIEW-12: Customer phản hồi đánh giá → 403', async () => {
        if (!customerToken || !reviewId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .patch(`/api/reviews/${reviewId}/reply`)
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ manager_reply: 'Hack reply' });
        expect(res.status).toBe(403);
    });

    it('❌ TC-REVIEW-13: ID review không tồn tại → 404', async () => {
        if (!managerToken) return pending('No manager token - skip');

        const res = await request(app)
            .patch('/api/reviews/999999999/reply')
            .set('Authorization', `Bearer ${managerToken}`)
            .send({ manager_reply: 'Reply for ghost review' });
        expect(res.status).toBe(404);
    });

    it('❌ TC-REVIEW-14: Thiếu reply body → 400', async () => {
        if (!managerToken || !reviewId) return pending('Prerequisites missing - skip');

        const res = await request(app)
            .patch(`/api/reviews/${reviewId}/reply`)
            .set('Authorization', `Bearer ${managerToken}`)
            .send({});
        expect(res.status).toBe(400);
    });
});
