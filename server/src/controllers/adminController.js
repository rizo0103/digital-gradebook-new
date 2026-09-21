const { db } = require('../config/firebase');
const bcrypt = require('bcryptjs');

// Вспомогательная функция генерации логина (username) из ФИО/имени
const generateUsername = (fullName) => {
    const translitMap = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
        'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
        'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
        'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
    };

    const cleanName = fullName.toLowerCase().trim();
    let transliterated = '';
    for (let char of cleanName) {
        transliterated += translitMap[char] || (/[a-z0-9]/.test(char) ? char : '');
    }

    const randomNum = Math.floor(100 + Math.random() * 900); // 3 случайные цифры
    return `${transliterated.slice(0, 10)}${randomNum}`;
};

// 1. Пакетная загрузка студентов из JSON
exports.importStudents = async (req, res) => {
    try {
        const { students, defaultPassword = 'studentPassword123' } = req.body; // Массив объектов [{ fullName, email }, ...]

        if (!Array.isArray(students) || students.length === 0) {
            return res.status(400).json({ message: 'Передан пустой или некорректный массив студентов' });
        }

        const defaultPasswordHash = await bcrypt.hash(defaultPassword, 10);
        const createdStudents = [];

        const batch = db.batch();

        for (const student of students) {
            const { fullName, email } = student;
            const username = generateUsername(fullName);
            const userRef = db.collection('users').doc();

            const studentData = {
                fullName: fullName || 'Без имени',
                email: email || `${username}@school.com`,
                username,
                passwordHash: defaultPasswordHash,
                role: 'student',
                createdAt: new Date().toISOString()
            };

            batch.set(userRef, studentData);
            createdStudents.push({ id: userRef.id, ...studentData, defaultPassword });
        }

        await batch.commit();

        res.status(201).json({
            message: `Успешно импортировано студентов: ${createdStudents.length}`,
            students: createdStudents
        });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка импорта студентов', error: error.message });
    }
};

// 2. Создание группы с типом (Языковые курсы, TOPIK и др.)
exports.createGroup = async (req, res) => {
    try {
        const { name, category, teacherIds = [], studentIds = [] } = req.body;
        // category: "language" | "topik" | "other"

        if (!name) {
            return res.status(400).json({ message: 'Укажите название группы' });
        }

        const newGroup = await db.collection('groups').add({
            name,
            category: category || 'other',
            teacherIds,
            studentIds,
            createdAt: new Date().toISOString()
        });

        res.status(201).json({ id: newGroup.id, message: 'Группа успешно создана' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка создания группы', error: error.message });
    }
};

// 3. Создание / Запись расписания
exports.createSchedule = async (req, res) => {
    try {
        const { groupId, subject, daysOfWeek, time, teacherId } = req.body;
        // daysOfWeek: ["Пн", "Ср", "Пт"]

        const newSchedule = await db.collection('schedules').add({
            groupId,
            subject,
            daysOfWeek,
            time,
            teacherId,
            createdAt: new Date().toISOString()
        });

        res.status(201).json({ id: newSchedule.id, message: 'Расписание добавлено' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка создания расписания', error: error.message });
    }
};

// 4. Получение списка учителей и студентов
exports.getUsersByRole = async (req, res) => {
    try {
        const { role } = req.query; // 'teacher' или 'student'
        let query = db.collection('users');
        if (role) query = query.where('role', '==', role);

        const snapshot = await query.get();
        const users = snapshot.docs.map(doc => {
            const data = doc.data();
            delete data.passwordHash;
            return { id: doc.id, ...data };
        });

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка получения пользователей', error: error.message });
    }
};

exports.getStudents = async (req, res, next) => {
    try {
        const snapshot = await db.collection('students').get();
        const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(students);
    } catch (err) {
        next(err);
    }
};

exports.updateStudent = async (req, res, next) => {
    try {
        const { id } = req.params;
        await db.collection('students').doc(String(id)).update(req.body);
        res.json({ message: 'Студент обновлен' });
    } catch (err) {
        next(err);
    }
};

exports.deleteStudent = async (req, res, next) => {
    try {
        const { id } = req.params;
        await db.collection('students').doc(String(id)).delete();
        res.json({ message: 'Студент удален' });
    } catch (err) {
        next(err);
    }
};

// --- Группы ---
exports.updateGroup = async (req, res, next) => {
    try {
        const { id } = req.params;
        await db.collection('groups').doc(String(id)).update(req.body);
        res.json({ message: 'Группа обновлена' });
    } catch (err) {
        next(err);
    }
};

exports.deleteGroup = async (req, res, next) => {
    try {
        const { id } = req.params;
        await db.collection('groups').doc(String(id)).delete();
        res.json({ message: 'Группа удалена' });
    } catch (err) {
        next(err);
    }
};
