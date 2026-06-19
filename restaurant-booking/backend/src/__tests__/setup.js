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

require('dotenv').config();

// Cấu hình tài khoản test mặc định (có thể override qua env)
process.env.TEST_MANAGER_EMAIL = process.env.TEST_MANAGER_EMAIL || 'manager@test.com';
process.env.TEST_MANAGER_PASS  = process.env.TEST_MANAGER_PASS  || 'manager123';
process.env.TEST_STAFF_EMAIL   = process.env.TEST_STAFF_EMAIL   || 'staff@test.com';
process.env.TEST_STAFF_PASS    = process.env.TEST_STAFF_PASS    || 'staff123';
