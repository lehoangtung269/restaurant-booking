const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');

// CATEGORIES
const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.getAll();
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const createCategory = async (req, res) => {
    try {
        const { code, name, image_url } = req.body;
        if (!code || !name) return res.status(400).json({ message: 'Missing required fields' });

        const existing = await Category.findByCode(code);
        if (existing) return res.status(409).json({ message: 'Category code already exists' });

        const [category] = await Category.create({ code, name, image_url });
        res.status(201).json(category);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const updateCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        const [updated] = await Category.update(req.params.id, req.body);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        await Category.delete(req.params.id);
        res.json({ message: 'Category deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// MENU ITEMS
const getAllItems = async (req, res) => {
    try {
        const items = await MenuItem.getAll();
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getItemById = async (req, res) => {
    try {
        const item = await MenuItem.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json(item);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const createItem = async (req, res) => {
    try {
        const { category_id, name, price } = req.body;
        if (!category_id || !name || !price) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const category = await Category.findById(category_id);
        if (!category) return res.status(404).json({ message: 'Category not found' });

        const [item] = await MenuItem.create(req.body);
        res.status(201).json(item);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const updateItem = async (req, res) => {
    try {
        const item = await MenuItem.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        const [updated] = await MenuItem.update(req.params.id, req.body);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const deleteItem = async (req, res) => {
    try {
        const item = await MenuItem.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        await MenuItem.delete(req.params.id);
        res.json({ message: 'Item deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { getAllCategories, createCategory, updateCategory, deleteCategory, getAllItems, getItemById, createItem, updateItem, deleteItem };