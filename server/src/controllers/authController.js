const { db } = require('../config/firebase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Вход в систему
exports.login = async (req, res) => {
  console.log('[LOGIN] Запрос на вход получен. Body:', req.body);

  try {
    const { loginInput, password } = req.body || {}; // Предотвращаем падение, если req.body undefined
    
    // --- ПОЛУЧЕНИЕ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ ИЗ FIRESTORE ---
    console.log('[LOGIN] Получаем список всех пользователей из Firestore...');
    const allUsersSnapshot = await db.collection('users').get();
    
    const allUsers = allUsersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        fullName: data.fullName,
        username: data.username,
        email: data.email,
        role: data.role,
        createdAt: data.createdAt
      };
    });
    console.log(allUsers);
    if (!loginInput || !password) {
      console.warn('[LOGIN] Ошибка: Не заполнены поля loginInput или password');
      return res.status(400).json({ message: 'Заполните все поля' });
    }

    // 1. Проверяем по email
    console.log(`[LOGIN] Ищем пользователя по email: "${loginInput}"...`);
    let userSnapshot = await db.collection('users')
      .where('email', '==', loginInput)
      .limit(1)
      .get();

    // 2. Если по email не нашли, ищем по username
    if (userSnapshot.empty) {
      console.log(`[LOGIN] По email не найден. Ищем по username: "${loginInput}"...`);
      userSnapshot = await db.collection('users')
        .where('username', '==', loginInput)
        .limit(1)
        .get();
    }

    // Если совпадений нет
    if (userSnapshot.empty) {
      console.warn(`[LOGIN] Пользователь с логином "${loginInput}" не найден в базе.`);
      return res.status(400).json({ message: 'Неверный логин (email/username) или пароль' });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    console.log(`[LOGIN] Пользователь найден. ID: ${userDoc.id}, Role: ${userData.role}`);

    // Сверяем пароль
    console.log('[LOGIN] Проверка пароля...');
    const targetHash = userData.passwordHash || userData.password;
    if (!targetHash) {
      console.error('[LOGIN] Ошибка: У пользователя отсутствует хэш пароля в базе данные!');
    }

    const isMatch = await bcrypt.compare(password, targetHash || '');
    if (!isMatch) {
      console.warn('[LOGIN] Пароль не совпадает');
      return res.status(400).json({ message: 'Неверный логин (email/username) или пароль' });
    }

    console.log('[LOGIN] Пароль верный. Проверка JWT_SECRET...');
    if (!process.env.JWT_SECRET) {
      console.error('[LOGIN] КРИТИЧЕСКАЯ ОШИБКА: process.env.JWT_SECRET не задан!');
    }

    // Генерация JWT
    const token = jwt.sign(
      { id: userDoc.id, role: userData.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('[LOGIN] Успешный вход пользователя:', userDoc.id);


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
  console.log('[REGISTER] Запрос на регистрацию получен. Body:', req.body);

  try {
    const { email, password, fullName, role, username } = req.body || {};

    if (!email || !password || !fullName || !['admin', 'teacher', 'student'].includes(role)) {
      console.warn('[REGISTER] Ошибка валидации: переданы неверные данные или не поддерживаемая роль:', { email, fullName, role });
      return res.status(400).json({ message: 'Некорректная роль пользователя или заполнены не все обязательные поля' });
    }

    if (password.length < 8) {
      console.warn('[REGISTER] Пароль слишком короткий');
      return res.status(400).json({ message: 'Пароль должен содержать минимум 8 символов' });
    }

    console.log(`[REGISTER] Проверка наличия пользователя с email: ${email}...`);
    const existingUser = await db.collection('users').where('email', '==', email).get();
    if (!existingUser.empty) {
      console.warn(`[REGISTER] Пользователь с email ${email} уже существует.`);
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    console.log('[REGISTER] Хэширование пароля...');
    const passwordHash = await bcrypt.hash(password, 10);

    console.log('[REGISTER] Сохранение пользователя в Firestore...');
    const newUserRef = await db.collection('users').add({
      email,
      username: username || email.split('@')[0],
      fullName,
      role,
      passwordHash,
      createdAt: new Date().toISOString()
    });

    console.log(`[REGISTER] Пользователь успешно создан с ID: ${newUserRef.id}`);
    res.status(201).json({ id: newUserRef.id, message: 'Пользователь успешно создан' });
  } catch (error) {
    console.error('[REGISTER ERROR] Ошибка при регистрации:', error);
    res.status(500).json({ message: 'Ошибка при регистрации' });
  }
};