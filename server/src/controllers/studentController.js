const { db } = require('../config/firebase'); // Или '../config/firebase'
const bcrypt = require('bcryptjs');

// Вспомогательная функция для генерации username
const generateUsername = (nameEn, lastNameEn, studentId) => {
    if (studentId) return `std_${studentId}`;
    const baseName = (nameEn || 'student').toLowerCase().replace(/\s+/g, '');
    const baseLastName = (lastNameEn || '').toLowerCase().replace(/\s+/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${baseName}${baseLastName ? '_' + baseLastName : ''}_${randomNum}`;
};

// 1. Ручное создание одного студента (с аккаунтом для входа)
exports.createStudent = async (req, res, next) => {
    try {
        const studentData = req.body; // id, name_tj, name_en, last_name_en, email, student_groups, passportID и т.д.

        // Дефолтный пароль, если не передан явно
        const password = studentData.password || 'student123';
        const passwordHash = await bcrypt.hash(password, 10);

        // Формируем username
        const username = studentData.username || generateUsername(studentData.name_en, studentData.last_name_en, studentData.id);

        const docId = studentData.id ? String(studentData.id) : Date.now().toString();

        // Объект студента/пользователя
        const payload = {
            ...studentData,
            id: docId,
            username,
            email: studentData.email || `${username}@school.com`,
            passwordHash,
            role: 'student',
            created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };

        // Сохраняем в коллекцию 'students' (и/или 'users')
        await db.collection('students').doc(docId).set(payload);

        res.status(201).json({
            message: 'Студент успешно создан',
            student: {
                id: docId,
                username,
                defaultPassword: password,
                ...studentData
            }
        });
    } catch (err) {
        next(err);
    }
};

// 2. Массовый импорт студентов из JSON (Bulk Import)
exports.importStudents = async (req, res, next) => {
    try {
        const { students, defaultPassword = 'studentPassword123' } = req.body;

        if (!Array.isArray(students) || students.length === 0) {
            return res.status(400).json({ message: 'Передан пустой или некорректный массив студентов' });
        }

        const defaultPasswordHash = await bcrypt.hash(defaultPassword, 10);
        const batch = db.batch();
        const createdStudents = [];

        for (const s of students) {
            const docId = s.id ? String(s.id) : Date.now().toString() + Math.floor(Math.random() * 100);
            const username = generateUsername(s.name_en, s.last_name_en, docId);

            const studentPayload = {
                ...s,
                id: docId,
                username,
                email: s.email || `${username}@school.com`,
                passwordHash: defaultPasswordHash,
                role: 'student',
                student_groups: Array.isArray(s.student_groups) ? s.student_groups : [s.student_groups],
                created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
            };

            const docRef = db.collection('students').doc(docId);
            batch.set(docRef, studentPayload);

            createdStudents.push({
                id: docId,
                username,
                defaultPassword,
                name_en: s.name_en,
                name_tj: s.name_tj
            });
        }

        await batch.commit();

        res.status(201).json({
            message: `Успешно импортировано студентов: ${createdStudents.length}`,
            students: createdStudents
        });
    } catch (err) {
        next(err);
    }
};

// 3. Получение списка всех студентов
exports.getStudents = async (req, res, next) => {
    try {
        const snapshot = await db.collection('students').get();
        const students = snapshot.docs.map(doc => {
            const data = doc.data();
            delete data.passwordHash; // Не отдаем хэш пароля на клиент
            return { id: doc.id, ...data };
        });

        res.json(students);
    } catch (err) {
        next(err);
    }
};

// 4. Обновление данных студента
exports.updateStudent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Если обновляется пароль — хэшируем его
        if (updateData.password) {
            updateData.passwordHash = await bcrypt.hash(updateData.password, 10);
            delete updateData.password;
        }

        await db.collection('students').doc(String(id)).update(updateData);

        res.json({ message: 'Данные студента успешно обновлены' });
    } catch (err) {
        next(err);
    }
};

// 5. Удаление студента
exports.deleteStudent = async (req, res, next) => {
    try {
        const { id } = req.params;
        await db.collection('students').doc(String(id)).delete();

        res.json({ message: 'Студент удален' });
    } catch (err) {
        next(err);
    }
};