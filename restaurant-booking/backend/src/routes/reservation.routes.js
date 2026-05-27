const express = require('express');
const router = express.Router();
const {
    create,
    getMyReservations,
    getAll,
    getById,
    updateStatus,
    cancel,
} = require('../controllers/reservationController');
const { verifyToken, requireRole } = require('../middlewares/auth');

// Customer tạo đặt bàn
router.post('/', verifyToken, create);

// Customer xem đặt bàn của mình (đặt trước /:id để tránh conflict)
router.get('/my', verifyToken, getMyReservations);

// Staff/Manager xem tất cả (hỗ trợ ?date=&status=&table_id=)
router.get('/', verifyToken, requireRole('STAFF', 'MANAGER'), getAll);

// Xem chi tiết 1 reservation
router.get('/:id', verifyToken, getById);

// Staff/Manager chuyển trạng thái (state machine)
router.patch('/:id/status', verifyToken, requireRole('STAFF', 'MANAGER'), updateStatus);

// Customer tự huỷ (deadline 2h)
router.patch('/:id/cancel', verifyToken, cancel);

module.exports = router;
