require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/admin', require('./routes/adminSchedule')); // Добавляем маршрут для генерации расписания

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Что-то пошло не так на сервере' });
});

app.get('/', (req, res) => {
    res.send('Добро пожаловать в API для управления посещаемостью студентов!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});