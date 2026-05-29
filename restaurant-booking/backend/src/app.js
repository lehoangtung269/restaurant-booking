require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();

// Rate limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' },
});
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // nghiêm hơn cho auth endpoints
    message: { message: 'Too many auth attempts, please try again later.' },
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(globalLimiter);

// Routes sau
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authLimiter, authRoutes);
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

module.exports = app;
