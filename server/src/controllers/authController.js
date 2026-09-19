const { db } = require('../config/firebase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Вход в систему
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const userSnapshot = await db.collection('users').where('email', '==', email).limit(1).get();
        if (userSnapshot.empty) {
            return res.status(400).json({ message: 'Неверный email или пароль' });
        }

        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();

        const isMatch = await bcrypt.compare(password, userData.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Неверный email или пароль' });
        }

        const token = jwt.sign(
            { id: userDoc.id, role: userData.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: userDoc.id,
                fullName: userData.fullName,
                email: userData.email,
                role: userData.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера при входе', error: error.message });
    }
};

// Создание пользователя (только Admin)
exports.registerUser = async (req, res) => {
    try {
        const { email, password, fullName, role } = req.body;

        if (!['admin', 'teacher', 'student'].includes(role)) {
            return res.status(400).json({ message: 'Некорректная роль пользователя' });
        }

        const existingUser = await db.collection('users').where('email', '==', email).get();
        if (!existingUser.empty) {
            return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newUserRef = await db.collection('users').add({
            email,
            fullName,
            role,
            passwordHash,
            createdAt: new Date().toISOString()
        });

        res.status(201).json({ id: newUserRef.id, message: 'Пользователь успешно создан' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при регистрации', error: error.message });
    }
};