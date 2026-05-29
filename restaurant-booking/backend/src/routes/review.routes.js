const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middlewares/auth');
const { create, getAll, getMyReviews, reply } = require('../controllers/reviewController');
const { validateCreateReview } = require('../middlewares/validate');

router.post('/', verifyToken, validateCreateReview, create);
router.get('/', getAll);
router.get('/my', verifyToken, getMyReviews);
router.patch('/:id/reply', verifyToken, requireRole('MANAGER'), reply);

module.exports = router;