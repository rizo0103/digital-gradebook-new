const { db } = require('../config/firebase');

// Получение списка доступных групп
exports.getGroups = async (req, res) => {
    try {
        const { id: userId, role } = req.user;
        let groups = [];

        if (role === 'admin') {
            const snapshot = await db.collection('groups').get();
            groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } else if (role === 'teacher') {
            const snapshot = await db.collection('groups').where('teacherIds', 'array-contains', userId).get();
            groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } else if (role === 'student') {
            const snapshot = await db.collection('groups').where('studentIds', 'array-contains', userId).get();
            groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
        const studentIds = req.user.role === 'student'
            ? [req.user.id]
            : (Array.isArray(group.studentIds) ? group.studentIds : []);
        if (studentIds.length === 0) return res.json([]);

        const users = await Promise.all(studentIds.map((studentId) => db.collection('users').doc(studentId).get()));
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
    const teacherIds = Array.isArray(group.teacherIds) ? group.teacherIds : [];
    const studentIds = Array.isArray(group.studentIds) ? group.studentIds : [];
    if (role !== 'admin' &&
        ((role === 'teacher' && !teacherIds.includes(userId)) ||
            (role === 'student' && !studentIds.includes(userId)))) {
        const error = new Error('Доступ к этой группе ограничен');
        error.statusCode = 403;
        throw error;
    }

    return group;
}