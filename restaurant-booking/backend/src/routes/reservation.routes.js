const express = require('express');
const router = express.Router();
const {
    create,
    getMyReservations,
    getAll,
    getById,
    updateStatus,
    cancel,
    managerCancel,
    addStaffNote,
} = require('../controllers/reservationController');
const { verifyToken, requireRole } = require('../middlewares/auth');
const { validateCreateReservation, validateUpdateStatus } = require('../middlewares/validate');

// Customer tạo đặt bàn
router.post('/', verifyToken, validateCreateReservation, create);

// Customer xem đặt bàn của mình (đặt trước /:id để tránh conflict)
router.get('/my', verifyToken, getMyReservations);

// Staff/Manager xem tất cả (hỗ trợ ?date=&status=&table_id=)
router.get('/', verifyToken, requireRole('STAFF', 'MANAGER'), getAll);

// Xem chi tiết 1 reservation
router.get('/:id', verifyToken, getById);

// Staff/Manager chuyển trạng thái (state machine)
router.patch('/:id/status', verifyToken, requireRole('STAFF', 'MANAGER'), validateUpdateStatus, updateStatus);

// Customer tự huỷ (deadline 2h)
router.patch('/:id/cancel', verifyToken, cancel);

// Manager huỷ với lý do (không giới hạn deadline) — body: { reason }
router.patch('/:id/manager-cancel', verifyToken, requireRole('MANAGER'), managerCancel);

// Staff/Manager thêm ghi chú nhanh (ghế trẻ em, bánh sinh nhật...) — body: { note }
router.patch('/:id/note', verifyToken, requireRole('STAFF', 'MANAGER'), addStaffNote);

module.exports = router;
