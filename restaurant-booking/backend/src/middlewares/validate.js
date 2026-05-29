const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware xử lý kết quả validation — dùng sau mọi validate chain
 */
const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
        });
    }
    next();
};

// ─── AUTH ─────────────────────────────────────────────────────────────────────
const validateRegister = [
    body('full_name').trim().notEmpty().withMessage('full_name is required'),
    body('email').isEmail().withMessage('Invalid email format').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
    handleValidation,
];

const validateLogin = [
    body('email').isEmail().withMessage('Invalid email format').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidation,
];

const validateRefreshToken = [
    body('refreshToken').notEmpty().withMessage('refreshToken is required'),
    handleValidation,
];

// ─── TABLE ────────────────────────────────────────────────────────────────────
const validateCreateTable = [
    body('table_number').trim().notEmpty().withMessage('table_number is required'),
    body('capacity').isInt({ min: 1 }).withMessage('capacity must be a positive integer'),
    body('area').isIn(['INDOOR', 'OUTDOOR', 'VIP']).withMessage('area must be INDOOR, OUTDOOR or VIP'),
    handleValidation,
];

const validateUpdateTable = [
    param('id').isInt({ min: 1 }).withMessage('Invalid table id'),
    body('capacity').optional().isInt({ min: 1 }).withMessage('capacity must be a positive integer'),
    body('area').optional().isIn(['INDOOR', 'OUTDOOR', 'VIP']).withMessage('area must be INDOOR, OUTDOOR or VIP'),
    body('status').optional().isIn(['AVAILABLE', 'MAINTENANCE']).withMessage('status must be AVAILABLE or MAINTENANCE'),
    handleValidation,
];

// ─── MENU ─────────────────────────────────────────────────────────────────────
const validateCreateCategory = [
    body('code').trim().notEmpty().withMessage('code is required'),
    body('name').trim().notEmpty().withMessage('name is required'),
    body('image_url').optional().isURL().withMessage('image_url must be a valid URL'),
    handleValidation,
];

const validateCreateItem = [
    body('category_id').isInt({ min: 1 }).withMessage('category_id must be a positive integer'),
    body('name').trim().notEmpty().withMessage('name is required'),
    body('price').isDecimal({ decimal_digits: '0,2', force_decimal: false }).withMessage('price must be a valid number'),
    body('image_url').optional().isURL().withMessage('image_url must be a valid URL'),
    body('is_available').optional().isBoolean().withMessage('is_available must be boolean'),
    handleValidation,
];

// ─── RESERVATION ──────────────────────────────────────────────────────────────
const validateCreateReservation = [
    body('table_id').isInt({ min: 1 }).withMessage('table_id must be a positive integer'),
    body('reservation_date').isDate({ format: 'YYYY-MM-DD' }).withMessage('reservation_date must be YYYY-MM-DD')
        .custom(val => {
            if (new Date(val) < new Date().setHours(0, 0, 0, 0)) {
                throw new Error('reservation_date cannot be in the past');
            }
            return true;
        }),
    body('start_time').matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage('start_time must be HH:MM or HH:MM:SS'),
    body('end_time').optional().matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage('end_time must be HH:MM or HH:MM:SS'),
    body('guest_count').isInt({ min: 1 }).withMessage('guest_count must be at least 1'),
    body('special_notes').optional().isString().trim().isLength({ max: 500 }).withMessage('special_notes max 500 chars'),
    handleValidation,
];

const validateUpdateStatus = [
    param('id').isInt({ min: 1 }).withMessage('Invalid reservation id'),
    body('status').isIn(['SEATED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).withMessage('Invalid status value'),
    handleValidation,
];

// ─── REVIEW ───────────────────────────────────────────────────────────────────
const validateCreateReview = [
    body('reservation_id').isInt({ min: 1 }).withMessage('reservation_id must be a positive integer'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('rating must be between 1 and 5'),
    body('comment').optional().isString().trim().isLength({ max: 1000 }).withMessage('comment max 1000 chars'),
    handleValidation,
];

// ─── PRE-ORDER ────────────────────────────────────────────────────────────────
const validateCreatePreOrder = [
    body('reservation_id').isInt({ min: 1 }).withMessage('reservation_id must be a positive integer'),
    body('items').isArray({ min: 1 }).withMessage('items must be a non-empty array'),
    body('items.*.menu_item_id').isInt({ min: 1 }).withMessage('menu_item_id must be a positive integer'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('quantity must be at least 1'),
    body('items.*.notes').optional().isString().trim().isLength({ max: 255 }),
    handleValidation,
];

module.exports = {
    handleValidation,
    // Auth
    validateRegister,
    validateLogin,
    validateRefreshToken,
    // Table
    validateCreateTable,
    validateUpdateTable,
    // Menu
    validateCreateCategory,
    validateCreateItem,
    // Reservation
    validateCreateReservation,
    validateUpdateStatus,
    // Review
    validateCreateReview,
    // Pre-order
    validateCreatePreOrder,
};
