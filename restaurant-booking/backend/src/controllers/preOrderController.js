const PreOrder = require('../models/PreOrder');
const Reservation = require('../models/Reservation');
const MenuItem = require('../models/MenuItem');
const db = require('../config/database');

const createOrUpdate = async (req, res) => {
    try {
        const { reservation_id, items } = req.body;

        if (!reservation_id || !items || !items.length) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const reservation = await Reservation.findById(reservation_id);
        if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

        if (reservation.user_id != req.user.id) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        if (reservation.status !== 'CONFIRMED') {
            return res.status(400).json({ message: 'Cannot pre-order for this reservation' });
        }

        // Validate từng món
        for (const item of items) {
            const menuItem = await MenuItem.findById(item.menu_item_id);
            if (!menuItem) return res.status(404).json({ message: `Menu item ${item.menu_item_id} not found` });
            if (!menuItem.is_available) return res.status(400).json({ message: `${menuItem.name} is not available` });
        }

        // Nếu đã có pre_order thì check status trước khi update
        let preOrder = await PreOrder.findByReservation(reservation_id);
        if (preOrder && preOrder.status === 'CANCELLED') {
            return res.status(400).json({ message: 'Cannot update a cancelled pre-order' });
        }

        const result = await db.transaction(async (trx) => {
            // Tính total
            let total_amount = 0;
            const itemsToInsert = [];

            for (const item of items) {
                const menuItem = await MenuItem.findById(item.menu_item_id);
                const unit_price = parseFloat(menuItem.price);
                total_amount += unit_price * item.quantity;
                itemsToInsert.push({
                    menu_item_id: item.menu_item_id,
                    quantity: item.quantity,
                    unit_price,
                    notes: item.notes || null
                });
            }

            if (preOrder) {
                await PreOrder.deleteItems(trx, preOrder.id);
                await PreOrder.updateTotal(trx, preOrder.id, total_amount);
            } else {
                const [created] = await PreOrder.create(trx, { reservation_id, total_amount });
                preOrder = created;
            }

            const insertedItems = await PreOrder.createItems(
                trx,
                itemsToInsert.map(i => ({ ...i, pre_order_id: preOrder.id }))
            );

            return { ...preOrder, total_amount, items: insertedItems };
        });

        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getByReservation = async (req, res) => {
    try {
        const { reservation_id } = req.params;

        const reservation = await Reservation.findById(reservation_id);
        if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

        if (reservation.user_id != req.user.id && !['STAFF', 'MANAGER'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const preOrder = await PreOrder.findByIdWithItems(
            (await PreOrder.findByReservation(reservation_id))?.id
        );

        if (!preOrder) return res.status(404).json({ message: 'No pre-order found' });

        res.json(preOrder);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const cancel = async (req, res) => {
    try {
        const { reservation_id } = req.params;

        const reservation = await Reservation.findById(reservation_id);
        if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

        if (reservation.user_id != req.user.id) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const preOrder = await PreOrder.findByReservation(reservation_id);
        if (!preOrder) return res.status(404).json({ message: 'No pre-order found' });

        if (preOrder.status === 'CANCELLED') {
            return res.status(400).json({ message: 'Pre-order already cancelled' });
        }

        const result = await db.transaction(async (trx) => {
            const [updated] = await PreOrder.cancel(trx, preOrder.id);
            return updated;
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { createOrUpdate, getByReservation, cancel };