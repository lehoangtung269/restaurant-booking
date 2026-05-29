const Table = require('../models/Table');

const getAll = async (req, res) => {
    try {
        const tables = await Table.getAll();
        res.json(tables);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getById = async (req, res) => {
    try {
        const table = await Table.findById(req.params.id);
        if (!table) return res.status(404).json({ message: 'Table not found' });
        res.json(table);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const create = async (req, res) => {
    try {
        const { table_number, capacity, area } = req.body;
        if (!table_number || !capacity || !area) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const [table] = await Table.create({ table_number, capacity, area });
        res.status(201).json(table);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const update = async (req, res) => {
    try {
        const table = await Table.findById(req.params.id);
        if (!table) return res.status(404).json({ message: 'Table not found' });
        const [updated] = await Table.update(req.params.id, req.body);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const remove = async (req, res) => {
    try {
        const table = await Table.findById(req.params.id);
        if (!table) return res.status(404).json({ message: 'Table not found' });
        await Table.delete(req.params.id);
        res.json({ message: 'Table deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Staff cập nhật trạng thái bàn thủ công: AVAILABLE ↔ MAINTENANCE
const updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['AVAILABLE', 'MAINTENANCE'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ message: 'status must be AVAILABLE or MAINTENANCE' });
        }
        const table = await Table.findById(req.params.id);
        if (!table) return res.status(404).json({ message: 'Table not found' });
        const [updated] = await Table.update(req.params.id, { status });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { getAll, getById, create, update, remove, updateStatus };