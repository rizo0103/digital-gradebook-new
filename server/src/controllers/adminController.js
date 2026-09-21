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
        const { students, defaultPassword = process.env.STUDENT_DEFAULT_PASSWORD } = req.body;

        if (!Array.isArray(students) || students.length === 0) {
            return res.status(400).json({ message: 'Передан пустой или некорректный массив студентов' });
        }
        if (!defaultPassword || defaultPassword.length < 8) {
            return res.status(400).json({ message: 'Укажите пароль длиной не менее 8 символов' });
        }

        const defaultPasswordHash = await bcrypt.hash(defaultPassword, 10);
        const createdStudents = [];

        const batch = db.batch();
        const groupMemberships = [];

        for (const student of students) {
            const fullName = student.fullName ||
                [student.name_en, student.last_name_en].filter(Boolean).join(' ') ||
                [student.name_tj, student.last_name_tj].filter(Boolean).join(' ');
            if (!fullName) {
                return res.status(400).json({ message: 'У каждого студента должно быть имя' });
            }
            const username = generateUsername(fullName);
            const userRef = db.collection('users').doc();

            const studentData = {
                ...student,
                fullName,
                email: student.email || `${username}@school.com`,
                username,
                passwordHash: defaultPasswordHash,
                role: 'student',
                createdAt: new Date().toISOString()
            };

            batch.set(userRef, studentData);
            const studentGroups = Array.isArray(student.student_groups)
                ? student.student_groups.filter(Boolean)
                : [];
            studentGroups.forEach((groupId) => groupMemberships.push({ groupId, studentId: userRef.id }));
            createdStudents.push({ id: userRef.id, fullName, email: studentData.email, username });
        }

        const membershipsByGroup = groupMemberships.reduce((groups, membership) => {
            if (!groups[membership.groupId]) groups[membership.groupId] = [];
            groups[membership.groupId].push(membership.studentId);
            return groups;
        }, {});

        for (const [groupId, studentIds] of Object.entries(membershipsByGroup)) {
            const groupRef = db.collection('groups').doc(groupId);
            const groupSnapshot = await groupRef.get();
            if (!groupSnapshot.exists) {
                return res.status(400).json({ message: `Группа ${groupId} не найдена` });
            }
            batch.update(groupRef, {
                studentIds: Array.from(new Set([...(groupSnapshot.data().studentIds || []), ...studentIds]))
            });
        }

        await batch.commit();

        res.status(201).json({
            message: `Успешно импортировано студентов: ${createdStudents.length}`,
            students: createdStudents
        });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка импорта студентов' });
    }
};

// 2. Создание группы с типом (Языковые курсы, TOPIK и др.)
exports.createGroup = async (req, res) => {
    try {
        const { name, category, teacherIds = [], studentIds = [] } = req.body;
        // category: "language" | "topik" | "other"

        if (typeof name !== 'string' || !name.trim() ||
            !['language', 'topik', 'other'].includes(category || 'other') ||
            !Array.isArray(teacherIds) || !Array.isArray(studentIds)) {
            return res.status(400).json({ message: 'Укажите название группы' });
        }

        const newGroup = await db.collection('groups').add({
            name: name.trim(),
            category: category || 'other',
            teacherIds,
            studentIds,
            createdAt: new Date().toISOString()
        });

        res.status(201).json({ id: newGroup.id, message: 'Группа успешно создана' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка создания группы' });
    }
};

// 3. Создание / Запись расписания
exports.createSchedule = async (req, res) => {
    try {
        const { groupId, subject, daysOfWeek, time, teacherId } = req.body;
        if (!groupId || !Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
            return res.status(400).json({ message: 'Укажите группу и дни занятий' });
        }
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
        res.status(500).json({ message: 'Ошибка создания расписания' });
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
        res.status(500).json({ message: 'Ошибка получения пользователей' });
    }
};