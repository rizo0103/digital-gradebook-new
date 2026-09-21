require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

const app = express();

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be configured');
}

const allowedOrigins = process.env.CLIENT_ORIGIN
    ? process.env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim())
    : ['http://localhost:5173'];

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '256kb' }));

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/admin', require('./routes/adminSchedule'));

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'Что-то пошло не так на сервере' });
});

app.get('/', (req, res) => {
    res.send('Добро пожаловать в API для управления посещаемостью студентов!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});