const { db } = require('../config/firebase');

const normalizeIdValue = (value) => String(value ?? '').trim();
const normalizeIdList = (value) => {
    if (!Array.isArray(value)) return [];
    return value.map(normalizeIdValue).filter(Boolean);
};

// Получение списка доступных групп
exports.getGroups = async (req, res) => {
    try {
        const { id: userId, role } = req.user;
        let groups = [];
        const normalizedUserId = normalizeIdValue(userId);

        if (role === 'admin') {
            const snapshot = await db.collection('groups').get();
            groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } else if (role === 'teacher') {
            const snapshot = await db.collection('groups').get();
            groups = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter((group) => normalizeIdList(group.teacherIds).includes(normalizedUserId));
        } else if (role === 'student') {
            const snapshot = await db.collection('groups').get();
            groups = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter((group) => normalizeIdList(group.studentIds).includes(normalizedUserId));
        }

        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка получения групп' });
    }
};

// Создание группы (только Admin)
exports.createGroup = async (req, res) => {
    try {
        const { name, category = 'other', teacherIds = [], studentIds = [] } = req.body;

        if (typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ message: 'Укажите название группы' });
        }
        if (!Array.isArray(teacherIds) || !Array.isArray(studentIds)) {
            return res.status(400).json({ message: 'teacherIds и studentIds должны быть массивами' });
        }

        const groupRef = await db.collection('groups').add({
            name: name.trim(),
            category,
            teacherIds,
            studentIds,
            createdAt: new Date().toISOString()
        });

        res.status(201).json({ id: groupRef.id, name: name.trim(), category, teacherIds, studentIds });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка создания группы' });
    }
};

exports.getGroupStudents = async (req, res) => {
    try {
        const group = await getAccessibleGroup(req);
        const normalizedStudentIds = normalizeIdList(group.studentIds);

        if (req.user.role === 'student') {
            const ownId = normalizeIdValue(req.user.id);
            const studentDoc = await db.collection('users').doc(ownId).get();
            if (!studentDoc.exists) return res.json([]);
            const { passwordHash, ...publicData } = studentDoc.data();
            return res.json([{ id: studentDoc.id, ...publicData }]);
        }

        if (normalizedStudentIds.length === 0) return res.json([]);

        const users = await Promise.all(normalizedStudentIds.map((studentId) => db.collection('users').doc(studentId).get()));
        res.json(users.filter((doc) => doc.exists).map((doc) => {
            const { passwordHash, ...publicData } = doc.data();
            return { id: doc.id, ...publicData };
        }));
    } catch (error) {
        const status = error.statusCode || 500;
        res.status(status).json({ message: error.message || 'Ошибка получения студентов группы' });
    }
};

exports.getGroupLessons = async (req, res) => {
    try {
        await getAccessibleGroup(req);
        const snapshot = await db.collection('lessons')
            .where('groupId', '==', req.params.groupId)
            .get();
        const lessons = snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => `${a.date} ${a.time || ''}`.localeCompare(`${b.date} ${b.time || ''}`));
        res.json(lessons);
    } catch (error) {
        const status = error.statusCode || 500;
        res.status(status).json({ message: error.message || 'Ошибка получения расписания группы' });
    }
};

async function getAccessibleGroup(req) {
    const snapshot = await db.collection('groups').doc(req.params.groupId).get();
    if (!snapshot.exists) {
        const error = new Error('Группа не найдена');
        error.statusCode = 404;
        throw error;
    }

    const group = snapshot.data();
    const { id: userId, role } = req.user;
    const normalizedUserId = normalizeIdValue(userId);
    const teacherIds = normalizeIdList(group.teacherIds);
    const studentIds = normalizeIdList(group.studentIds);

    if (role !== 'admin' &&
        ((role === 'teacher' && !teacherIds.includes(normalizedUserId)) ||
            (role === 'student' && !studentIds.includes(normalizedUserId)))) {
        const error = new Error('Доступ к этой группе ограничен');
        error.statusCode = 403;
        throw error;
    }

    return group;
}