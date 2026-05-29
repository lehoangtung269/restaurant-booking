const Notification = require('../models/Notification');

const getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.findByUser(req.user.id);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getUnreadCount = async (req, res) => {
    try {
        const result = await Notification.getUnreadCount(req.user.id);
        res.json({ count: parseInt(result.count) });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const markAsRead = async (req, res) => {
    try {
        const [notification] = await Notification.markAsRead(req.params.id, req.user.id);
        if (!notification) return res.status(404).json({ message: 'Notification not found' });
        res.json(notification);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        await Notification.markAllAsRead(req.user.id);
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { getMyNotifications, getUnreadCount, markAsRead, markAllAsRead };