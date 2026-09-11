const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middlewares/auth');
const { getOverview, getRevenue, getOccupancy, getTopItems } = require('../controllers/dashboardController');

// Tất cả dashboard routes chỉ dành cho MANAGER
router.use(verifyToken, requireRole('MANAGER'));

router.get('/overview', getOverview);   // ?from=&to=
router.get('/revenue', getRevenue);     // ?year=&month=
router.get('/occupancy', getOccupancy); // ?from=&to=
router.get('/top-items', getTopItems);  // ?limit=&from=&to=

module.exports = router;
