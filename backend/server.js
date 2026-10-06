const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const departmentRoutes = require('./routes/departments');
const categoryRoutes = require('./routes/categories');
const assetRoutes = require('./routes/assets');
const borrowRoutes = require('./routes/borrowRequests');
const returnRoutes = require('./routes/returns');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/borrow-requests', borrowRoutes);
app.use('/api/returns', returnRoutes);

const PORT = process.env.PORT || 4100;
app.listen(PORT, () => console.log(`Asset system API running on http://localhost:${PORT}`));
