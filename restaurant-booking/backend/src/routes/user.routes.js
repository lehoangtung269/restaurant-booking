const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middlewares/auth');
const { getAll, getById, updateRole, updateActive, getUserReservations } = require('../controllers/userController');

// Tất cả routes đều cần MANAGER
router.use(verifyToken, requireRole('MANAGER'));

// Danh sách users — hỗ trợ ?role=STAFF|CUSTOMER|MANAGER
router.get('/', getAll);

// Chi tiết 1 user
router.get('/:id', getById);

// Lịch sử đặt bàn của 1 user
router.get('/:id/reservations', getUserReservations);

// Đổi role (tạo/hạ cấp nhân viên)
router.patch('/:id/role', updateRole);

// Bật/tắt tài khoản
router.patch('/:id/active', updateActive);

module.exports = router;
