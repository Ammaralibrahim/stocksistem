require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const drugsRoutes = require('./routes/drugs');
const ordersRoutes = require('./routes/orders');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// connect to DB
connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/drugs', drugsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/', (req, res) => res.send('API is running'));

module.exports = app;
