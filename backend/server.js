const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const departmentRoutes = require('./routes/departments');
const categoryRoutes = require('./routes/categories');
const assetRoutes = require('./routes/assets');
const borrowRoutes = require('./routes/borrowRequests');
const returnRoutes = require('./routes/returns');
const fineRoutes = require('./routes/fines');
const notificationRoutes = require('./routes/notifications');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
app.use(cors());
app.use(express.json());

// serve uploaded asset images, e.g. http://localhost:4100/uploads/xxxx.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/borrow-requests', borrowRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/fines', fineRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

const PORT = process.env.PORT || 4100;
app.listen(PORT, () => console.log(`Asset system API running on http://localhost:${PORT}`));
