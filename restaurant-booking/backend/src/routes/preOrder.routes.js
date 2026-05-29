const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const { createOrUpdate, getByReservation, cancel } = require('../controllers/preOrderController');
const { validateCreatePreOrder } = require('../middlewares/validate');

router.post('/', verifyToken, validateCreatePreOrder, createOrUpdate);
router.get('/:reservation_id', verifyToken, getByReservation);
router.patch('/:reservation_id/cancel', verifyToken, cancel);

module.exports = router;