const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const maintenanceRoutes = require('./routes/maintenance');
const systemRoutes = require('./routes/system');

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/system', systemRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), supabase: !!process.env.SUPABASE_URL, version: '1.0.0' });
});

app.get('*', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')); });

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error', message: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

app.listen(PORT, () => {
    console.log(`3CX Manager Server running on port ${PORT}`);
    console.log(`Supabase: ${process.env.SUPABASE_URL ? 'Connected' : 'NOT CONFIGURED'}`);
});
