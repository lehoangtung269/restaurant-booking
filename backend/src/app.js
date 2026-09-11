require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();

// Rate limiting
const isTest = process.env.NODE_ENV === 'test';
const isProduction = process.env.NODE_ENV === 'production';

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: Number(process.env.RATE_LIMIT_MAX) || (isProduction ? 100 : 1000),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' },
});
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.AUTH_RATE_LIMIT_MAX) || (isProduction ? 20 : 100),
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many auth attempts, please try again later.' },
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
if (!isTest) {
    app.use(globalLimiter);
}

// Routes sau
const authRoutes = require('./routes/auth.routes');
if (!isTest) {
    app.use(['/api/auth/login', '/api/auth/register'], authLimiter);
}
app.use('/api/auth', authRoutes);
const tableRoutes = require('./routes/table.routes');
app.use('/api/tables', tableRoutes);
const menuRoutes = require('./routes/menu.routes');
app.use('/api/menu', menuRoutes);
const reservationRoutes = require('./routes/reservation.routes');
app.use('/api/reservations', reservationRoutes);
const preOrderRoutes = require('./routes/preOrder.routes');
app.use('/api/pre-orders', preOrderRoutes);
const reviewRoutes = require('./routes/review.routes');
app.use('/api/reviews', reviewRoutes);
const notificationRoutes = require('./routes/notification.routes');
app.use('/api/notifications', notificationRoutes);
const dashboardRoutes = require('./routes/dashboard.routes');
app.use('/api/dashboard', dashboardRoutes);
const userRoutes = require('./routes/user.routes');
app.use('/api/users', userRoutes);


app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// 404 handler - must be after all routes
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Centralized error handler - must be last
app.use((err, req, res, next) => {
    // Log error for debugging (in production, use proper logging service)
    console.error('Error:', err.message);
    if (process.env.NODE_ENV !== 'production') {
        console.error(err.stack);
    }

    // Determine status code
    const statusCode = err.statusCode || 500;

    // Prepare error response
    const errorResponse = {
        message: err.message || 'Internal server error',
    };

    // In development, include stack trace
    if (process.env.NODE_ENV !== 'production') {
        errorResponse.stack = err.stack;
    }

    // Don't leak sensitive database errors in production
    if (statusCode === 500 && process.env.NODE_ENV === 'production') {
        errorResponse.message = 'Internal server error';
    }

    res.status(statusCode).json(errorResponse);
});

module.exports = app;
