const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove } = require('../controllers/tableController');
const { verifyToken, requireRole } = require('../middlewares/auth');

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', verifyToken, requireRole('MANAGER'), create);
router.put('/:id', verifyToken, requireRole('MANAGER'), update);
router.delete('/:id', verifyToken, requireRole('MANAGER'), remove);

module.exports = router;