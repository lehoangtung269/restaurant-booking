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

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

module.exports = app;
