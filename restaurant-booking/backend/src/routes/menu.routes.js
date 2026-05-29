const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middlewares/auth');
const { validateCreateCategory, validateCreateItem } = require('../middlewares/validate');
const {
    getAllCategories, createCategory, updateCategory, deleteCategory,
    getAllItems, getItemById, createItem, updateItem, deleteItem
} = require('../controllers/menuController');

// Categories
router.get('/categories', getAllCategories);
router.post('/categories', verifyToken, requireRole('MANAGER'), validateCreateCategory, createCategory);
router.put('/categories/:id', verifyToken, requireRole('MANAGER'), updateCategory);
router.delete('/categories/:id', verifyToken, requireRole('MANAGER'), deleteCategory);

// Menu items
router.get('/items', getAllItems);
router.get('/items/:id', getItemById);
router.post('/items', verifyToken, requireRole('MANAGER'), validateCreateItem, createItem);
router.put('/items/:id', verifyToken, requireRole('MANAGER'), updateItem);
router.delete('/items/:id', verifyToken, requireRole('MANAGER'), deleteItem);

module.exports = router;