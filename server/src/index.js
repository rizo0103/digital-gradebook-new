require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const studentRoutes = require('./routes/studentRoutes');
const resources = require('./config/resources');

const app = express();

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be configured');
}

// Получаем разрешенные домены и удаляем лишние слэши на конце
const allowedOrigins = [
        'https://digital-gradebook.vercel.app',
        resources.urls?.frontend?.replace(/\/$/, ''),
        "*"
      ];

app.use(cors({
    origin: function (origin, callback) {
        // Разрешаем запросы без origin (например, мобильные приложения, Postman, curl)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        } else {
            console.error(`CORS blocked for origin: ${origin}`);
            return callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Явно обрабатываем preflight (OPTIONS) запросы
app.options('*', cors());

app.use(express.json({ limit: '256kb' }));

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/admin', require('./routes/adminSchedule'));
app.use('/api/students', studentRoutes);

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'Что-то пошло не так на сервере' });
});

app.get('/', (req, res) => {
    res.send('Добро пожаловать в API для управления посещаемостью студентов!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});