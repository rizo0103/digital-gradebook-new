const { db } = require('../config/firebase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Вход в систему
exports.login = async (req, res) => {
  try {
    const { loginInput, password } = req.body; // loginInput — это либо email, либо username

    if (!loginInput || !password) {
      return res.status(400).json({ message: 'Заполните все поля' });
    }

    // 1. Проверяем по email
    let userSnapshot = await db.collection('users')
      .where('email', '==', loginInput)
      .limit(1)
      .get();

    // 2. Если по email не нашли, ищем по username
    if (userSnapshot.empty) {
      userSnapshot = await db.collection('users')
        .where('username', '==', loginInput)
        .limit(1)
        .get();
    }

    // Если совпадений нет
    if (userSnapshot.empty) {
      return res.status(400).json({ message: 'Неверный логин (email/username) или пароль' });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    // Сверяем пароль (проверь, чтобы в Firestore поле называлось passwordHash)
    const isMatch = await bcrypt.compare(password, userData.passwordHash || userData.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Неверный логин (email/username) или пароль' });
    }

    // Генерация JWT
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
        username: userData.username,
        email: userData.email,
        role: userData.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера при входе' });
  }
};
// Создание пользователя (только Admin)
exports.registerUser = async (req, res) => {
  try {
    const { email, password, fullName, role, username } = req.body;

    if (!email || !password || !fullName || !['admin', 'teacher', 'student'].includes(role)) {
      return res.status(400).json({ message: 'Некорректная роль пользователя' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Пароль должен содержать минимум 8 символов' });
    }

    const existingUser = await db.collection('users').where('email', '==', email).get();
    if (!existingUser.empty) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUserRef = await db.collection('users').add({
      email,
      username: username || email.split('@')[0],
      fullName,
      role,
      passwordHash,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({ id: newUserRef.id, message: 'Пользователь успешно создан' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при регистрации' });
  }
};