/**
 * ============================================================
 *  AUTH API - TEST SUITE
 *  Covers: register, login, getMe, refreshToken,
 *          updateProfile, changePassword
 * ============================================================
 */
const request = require('supertest');
const app = require('../app');

// ── Helper: tạo email ngẫu nhiên tránh conflict ──────────────
const uniqueEmail = () => `test_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`;

let accessToken = '';
let refreshToken = '';
const testUser = {
    full_name: 'Test User Auth',
    email: uniqueEmail(),
    password: 'password123',
    phone: '0901234567',
};

// ═══════════════════════════════════════════════════════════════
//  REGISTER
// ═══════════════════════════════════════════════════════════════
describe('POST /api/auth/register', () => {
    it('✅ TC-AUTH-01: Đăng ký thành công với thông tin hợp lệ', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
        expect(res.body.user.email).toBe(testUser.email);
        expect(res.body.user.role).toBe('CUSTOMER');
        // Lưu token cho các test sau
        accessToken = res.body.accessToken;
        refreshToken = res.body.refreshToken;
    });

    it('❌ TC-AUTH-02: Đăng ký thất bại - email đã tồn tại', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);
        expect(res.status).toBe(409);
        expect(res.body.message).toMatch(/email already exists/i);
    });

    it('❌ TC-AUTH-03: Đăng ký thất bại - thiếu full_name', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: uniqueEmail(), password: 'password123' });
        expect(res.status).toBe(400);
    });

    it('❌ TC-AUTH-04: Đăng ký thất bại - email không hợp lệ', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ full_name: 'Test', email: 'not-an-email', password: 'password123' });
        expect(res.status).toBe(400);
    });

    it('❌ TC-AUTH-05: Đăng ký thất bại - password quá ngắn (< 6 ký tự)', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ full_name: 'Test', email: uniqueEmail(), password: '123' });
        expect(res.status).toBe(400);
    });

    it('❌ TC-AUTH-06: Đăng ký thất bại - số điện thoại không hợp lệ', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ full_name: 'Test', email: uniqueEmail(), password: 'password123', phone: 'abc123' });
        expect(res.status).toBe(400);
    });
});

// ═══════════════════════════════════════════════════════════════
//  LOGIN
// ═══════════════════════════════════════════════════════════════
describe('POST /api/auth/login', () => {
    it('✅ TC-AUTH-07: Đăng nhập thành công', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: testUser.email, password: testUser.password });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
        accessToken = res.body.accessToken;
        refreshToken = res.body.refreshToken;
    });

    it('❌ TC-AUTH-08: Đăng nhập thất bại - sai mật khẩu', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: testUser.email, password: 'wrongpassword' });
        expect(res.status).toBe(401);
    });

    it('❌ TC-AUTH-09: Đăng nhập thất bại - email không tồn tại', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'notexist@test.com', password: 'password123' });
        expect(res.status).toBe(401);
    });

    it('❌ TC-AUTH-10: Đăng nhập thất bại - thiếu trường email', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ password: 'password123' });
        expect(res.status).toBe(400);
    });
});

// ═══════════════════════════════════════════════════════════════
//  GET ME
// ═══════════════════════════════════════════════════════════════
describe('GET /api/auth/me', () => {
    it('✅ TC-AUTH-11: Lấy thông tin user hiện tại thành công', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.email).toBe(testUser.email);
    });

    it('❌ TC-AUTH-12: Không có token → 401', async () => {
        const res = await request(app).get('/api/auth/me');
        expect(res.status).toBe(401);
    });

    it('❌ TC-AUTH-13: Token không hợp lệ → 401', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', 'Bearer invalidtoken123');
        expect(res.status).toBe(401);
    });
});

// ═══════════════════════════════════════════════════════════════
//  REFRESH TOKEN
// ═══════════════════════════════════════════════════════════════
describe('POST /api/auth/refresh', () => {
    it('✅ TC-AUTH-14: Refresh token thành công', async () => {
        const res = await request(app)
            .post('/api/auth/refresh')
            .send({ refreshToken });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
        accessToken = res.body.accessToken;
        refreshToken = res.body.refreshToken;
    });

    it('❌ TC-AUTH-15: Thiếu refreshToken → 400', async () => {
        const res = await request(app)
            .post('/api/auth/refresh')
            .send({});
        expect(res.status).toBe(400);
    });

    it('❌ TC-AUTH-16: refreshToken không hợp lệ → 403', async () => {
        const res = await request(app)
            .post('/api/auth/refresh')
            .send({ refreshToken: 'bogus_refresh_token' });
        expect(res.status).toBe(403);
    });
});

// ═══════════════════════════════════════════════════════════════
//  UPDATE PROFILE
// ═══════════════════════════════════════════════════════════════
describe('PUT /api/auth/profile', () => {
    it('✅ TC-AUTH-17: Cập nhật full_name thành công', async () => {
        const res = await request(app)
            .put('/api/auth/profile')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ full_name: 'Updated Name' });

        expect(res.status).toBe(200);
        expect(res.body.full_name).toBe('Updated Name');
    });

    it('✅ TC-AUTH-18: Cập nhật phone thành công', async () => {
        const res = await request(app)
            .put('/api/auth/profile')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ phone: '0987654321' });

        expect(res.status).toBe(200);
    });

    it('❌ TC-AUTH-19: Không gửi gì → 400', async () => {
        const res = await request(app)
            .put('/api/auth/profile')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({});
        expect(res.status).toBe(400);
    });
});

// ═══════════════════════════════════════════════════════════════
//  CHANGE PASSWORD
// ═══════════════════════════════════════════════════════════════
describe('PATCH /api/auth/change-password', () => {
    it('❌ TC-AUTH-20: Mật khẩu cũ sai → 401', async () => {
        const res = await request(app)
            .patch('/api/auth/change-password')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ current_password: 'wrongpassword', new_password: 'newpass123' });
        expect(res.status).toBe(401);
    });

    it('❌ TC-AUTH-21: new_password quá ngắn → 400', async () => {
        const res = await request(app)
            .patch('/api/auth/change-password')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ current_password: testUser.password, new_password: '123' });
        expect(res.status).toBe(400);
    });

    it('✅ TC-AUTH-22: Đổi mật khẩu thành công', async () => {
        const res = await request(app)
            .patch('/api/auth/change-password')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ current_password: testUser.password, new_password: 'newpass123' });
        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/changed successfully/i);
    });
});
