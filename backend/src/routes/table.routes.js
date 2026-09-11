const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove, updateStatus, getAvailable } = require('../controllers/tableController');
const { verifyToken, requireRole } = require('../middlewares/auth');
const { validateCreateTable, validateUpdateTable, validateCheckAvailability } = require('../middlewares/validate');

router.get('/', getAll);
router.get('/availability', validateCheckAvailability, getAvailable);
router.get('/:id', getById);
router.post('/', verifyToken, requireRole('MANAGER'), validateCreateTable, create);
router.put('/:id', verifyToken, requireRole('MANAGER'), validateUpdateTable, update);
router.patch('/:id/status', verifyToken, requireRole('STAFF', 'MANAGER'), updateStatus);
router.delete('/:id', verifyToken, requireRole('MANAGER'), remove);

module.exports = router;