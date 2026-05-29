require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// Middleware trước
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes sau
const authRoutes = require('./routes/auth.routes');
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


app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

module.exports = app;
