const db = require('../config/database');

// ─── TỔNG QUAN (Overview) ────────────────────────────────────────────────────
// GET /api/dashboard/overview?from=YYYY-MM-DD&to=YYYY-MM-DD
const getOverview = async (req, res) => {
    try {
        const { from, to } = req.query;

        // Đếm reservations theo status trong khoảng thời gian
        const statusCounts = await db('reservations')
            .select('status')
            .count('id as count')
            .modify(q => {
                if (from) q.where('reservation_date', '>=', from);
                if (to) q.where('reservation_date', '<=', to);
            })
            .groupBy('status');

        const counts = { CONFIRMED: 0, SEATED: 0, COMPLETED: 0, CANCELLED: 0, NO_SHOW: 0 };
        statusCounts.forEach(r => { counts[r.status] = Number(r.count); });

        const totalReservations = Object.values(counts).reduce((a, b) => a + b, 0);
        const noShowRate = totalReservations > 0
            ? ((counts.NO_SHOW / totalReservations) * 100).toFixed(1)
            : '0.0';

        // Tổng khách hàng
        const [{ total_users }] = await db('users').where('role', 'CUSTOMER').count('id as total_users');

        // Tổng bàn active
        const [{ total_tables }] = await db('restaurant_tables').where('status', 'AVAILABLE').count('id as total_tables');

        res.json({
            reservations: counts,
            total_reservations: totalReservations,
            no_show_rate: `${noShowRate}%`,
            total_customers: Number(total_users),
            total_tables: Number(total_tables),
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// ─── DOANH THU (Revenue) ─────────────────────────────────────────────────────
// GET /api/dashboard/revenue?year=YYYY&month=MM (month tuỳ chọn)
const getRevenue = async (req, res) => {
    try {
        let { year, month } = req.query;

        // Validate year
        if (year) {
            year = parseInt(year, 10);
            if (isNaN(year) || year < 2000 || year > 2100) {
                return res.status(400).json({ message: 'Invalid year parameter' });
            }
        } else {
            return res.status(400).json({ message: 'year is required' });
        }

        // Validate month
        if (month) {
            month = parseInt(month, 10);
            if (isNaN(month) || month < 1 || month > 12) {
                return res.status(400).json({ message: 'Invalid month parameter' });
            }
        }

        // Nếu có month → thống kê theo ngày trong tháng
        // Nếu chỉ có year → thống kê theo tháng trong năm
        let revenueData;

        if (month) {
            revenueData = await db('reservations as r')
                .leftJoin('pre_orders as po', 'r.id', 'po.reservation_id')
                .whereRaw('EXTRACT(YEAR FROM r.reservation_date) = ?', [year])
                .whereRaw('EXTRACT(MONTH FROM r.reservation_date) = ?', [month])
                .where('r.status', 'COMPLETED')
                .select(
                    db.raw('EXTRACT(DAY FROM r.reservation_date)::int AS day'),
                    db.raw('COUNT(DISTINCT r.id) AS completed_reservations'),
                    db.raw('COALESCE(SUM(po.total_amount), 0) AS pre_order_revenue')
                )
                .groupByRaw('EXTRACT(DAY FROM r.reservation_date)')
                .orderByRaw('day ASC');
        } else {
            revenueData = await db('reservations as r')
                .leftJoin('pre_orders as po', 'r.id', 'po.reservation_id')
                .whereRaw('EXTRACT(YEAR FROM r.reservation_date) = ?', [year])
                .where('r.status', 'COMPLETED')
                .select(
                    db.raw('EXTRACT(MONTH FROM r.reservation_date)::int AS month'),
                    db.raw('COUNT(DISTINCT r.id) AS completed_reservations'),
                    db.raw('COALESCE(SUM(po.total_amount), 0) AS pre_order_revenue')
                )
                .groupByRaw('EXTRACT(MONTH FROM r.reservation_date)')
                .orderByRaw('month ASC');
        }

        const totalRevenue = revenueData.reduce((sum, r) => sum + Number(r.pre_order_revenue), 0);
        const totalCompleted = revenueData.reduce((sum, r) => sum + Number(r.completed_reservations), 0);

        res.json({
            year: Number(year),
            month: month ? Number(month) : null,
            breakdown: revenueData.map(r => ({
                period: month ? r.day : r.month,
                completed_reservations: Number(r.completed_reservations),
                pre_order_revenue: Number(r.pre_order_revenue),
            })),
            total_completed_reservations: totalCompleted,
            total_pre_order_revenue: totalRevenue,
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// ─── TỶ LỆ LẤP ĐẦY (Occupancy) ──────────────────────────────────────────────
// GET /api/dashboard/occupancy?from=YYYY-MM-DD&to=YYYY-MM-DD
const getOccupancy = async (req, res) => {
    try {
        const { from, to } = req.query;
        if (!from || !to) return res.status(400).json({ message: 'from and to are required' });

        // Tổng số bàn
        const [{ total_tables }] = await db('restaurant_tables')
            .where('status', 'AVAILABLE')
            .count('id as total_tables');

        const totalTables = Number(total_tables);
        if (totalTables === 0) return res.json({ occupancy_rate: '0.0%', breakdown: [] });

        // Số ngày trong range
        const fromDate = new Date(from);
        const toDate = new Date(to);
        const days = Math.round((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;
        const totalSlots = totalTables * days;

        // Số lượt đặt thành công (CONFIRMED, SEATED, COMPLETED) trong range
        const [{ booked }] = await db('reservations')
            .whereIn('status', ['CONFIRMED', 'SEATED', 'COMPLETED'])
            .where('reservation_date', '>=', from)
            .where('reservation_date', '<=', to)
            .count('id as booked');

        const bookedCount = Number(booked);
        const occupancyRate = ((bookedCount / totalSlots) * 100).toFixed(1);

        // Breakdown theo ngày
        const dailyOccupancy = await db('reservations')
            .select('reservation_date')
            .count('id as booked')
            .whereIn('status', ['CONFIRMED', 'SEATED', 'COMPLETED'])
            .where('reservation_date', '>=', from)
            .where('reservation_date', '<=', to)
            .groupBy('reservation_date')
            .orderBy('reservation_date');

        res.json({
            from,
            to,
            total_tables: totalTables,
            total_slots: totalSlots,
            total_booked: bookedCount,
            occupancy_rate: `${occupancyRate}%`,
            breakdown: dailyOccupancy.map(r => ({
                date: r.reservation_date,
                booked: Number(r.booked),
                rate: `${((Number(r.booked) / totalTables) * 100).toFixed(1)}%`,
            })),
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// ─── TOP MÓN ĂN ĐẶT TRƯỚC (Top Pre-ordered Items) ───────────────────────────
// GET /api/dashboard/top-items?limit=10&from=YYYY-MM-DD&to=YYYY-MM-DD
const getTopItems = async (req, res) => {
    try {
        let { limit = 10, from, to } = req.query;

        // Validate limit
        limit = parseInt(limit, 10);
        if (isNaN(limit) || limit < 1 || limit > 100) {
            return res.status(400).json({ message: 'Invalid limit parameter (must be 1-100)' });
        }

        const items = await db('pre_order_items as poi')
            .join('pre_orders as po', 'poi.pre_order_id', 'po.id')
            .join('reservations as r', 'po.reservation_id', 'r.id')
            .join('menu_items as mi', 'poi.menu_item_id', 'mi.id')
            .join('categories as c', 'mi.category_id', 'c.id')
            .modify(q => {
                if (from) q.where('r.reservation_date', '>=', from);
                if (to) q.where('r.reservation_date', '<=', to);
            })
            .where('po.status', 'ACTIVE')
            .select(
                'mi.id',
                'mi.name as item_name',
                'c.name as category_name',
                'mi.price',
                db.raw('SUM(poi.quantity) AS total_ordered'),
                db.raw('SUM(poi.quantity * poi.unit_price) AS total_revenue')
            )
            .groupBy('mi.id', 'mi.name', 'c.name', 'mi.price')
            .orderByRaw('total_ordered DESC')
            .limit(Number(limit));

        res.json(items.map(i => ({
            id: i.id,
            item_name: i.item_name,
            category_name: i.category_name,
            price: Number(i.price),
            total_ordered: Number(i.total_ordered),
            total_revenue: Number(i.total_revenue),
        })));
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { getOverview, getRevenue, getOccupancy, getTopItems };
