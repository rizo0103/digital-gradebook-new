const { db } = require('../config/firebase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Вход в систему
exports.login = async (req, res) => {

  try {
    
    const { loginInput, password } = req.body || {}; // Предотвращаем падение, если req.body undefined
    
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

    // Сверяем пароль
    const targetHash = userData.passwordHash || userData.password;
    if (!targetHash) {
      return res.status(500).json({ message: 'Ошибка сервера при входе, хэш пароля отсутствует' });
    }

    const isMatch = await bcrypt.compare(password, targetHash || '');
    if (!isMatch) {
      return res.status(400).json({ message: 'Неверный логин (email/username) или пароль' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Ошибка сервера при входе, JWT_SECRET не задан' });
    }

    // Генерация JWT
    const token = jwt.sign(
      { id: userDoc.id, role: userData.role },
      process.env.JWT_SECRET,
    );

    res.json({
      token,
      user: {
        id: userDoc.id,
        fullName: userData.fullName,
        username: userData.username,
        email: userData.email,
        role: userData.role
      },
    });
  } catch (error) {
    console.error('[LOGIN ERROR] Ошибка при обработке входа:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Ошибка сервера при входе' });
  }
};
// Создание пользователя (только Admin)
exports.registerUser = async (req, res) => {

  try {
    const { email, password, fullName, role, username } = req.body || {};

    if (!email || !password || !fullName || !['admin', 'teacher', 'student'].includes(role)) {
      return res.status(400).json({ message: 'Некорректная роль пользователя или заполнены не все обязательные поля' });
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