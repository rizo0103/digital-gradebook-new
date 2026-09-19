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
        res.status(500).json({ message: 'Ошибка получения групп', error: error.message });
    }
};

// Создание группы (только Admin)
exports.createGroup = async (req, res) => {
    try {
        const { name, teacherIds = [], studentIds = [] } = req.body;

        const groupRef = await db.collection('groups').add({
            name,
            teacherIds,
            studentIds,
            createdAt: new Date().toISOString()
        });

        res.status(201).json({ id: groupRef.id, name, teacherIds, studentIds });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка создания группы', error: error.message });
    }
};