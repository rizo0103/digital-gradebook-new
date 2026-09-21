const { db } = require('../config/firebase');

// Получение журнала посещаемости для группы
exports.getGroupAttendance = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { date, subject } = req.query;
        const { id: userId, role } = req.user;

        // Проверка прав доступа к группе
        const groupDoc = await db.collection('groups').doc(groupId).get();
        if (!groupDoc.exists) {
            return res.status(404).json({ message: 'Группа не найдена' });
        }

        const groupData = groupDoc.data();
        const teacherIds = Array.isArray(groupData.teacherIds) ? groupData.teacherIds : [];
        const studentIds = Array.isArray(groupData.studentIds) ? groupData.studentIds : [];
        if (role === 'teacher' && !teacherIds.includes(userId)) {
            return res.status(403).json({ message: 'Доступ к этой группе ограничен' });
        }
        if (role === 'student' && !studentIds.includes(userId)) {
            return res.status(403).json({ message: 'Доступ к этой группе ограничен' });
        }

        let query = db.collection('attendance').where('groupId', '==', groupId);

        if (date) query = query.where('date', '==', date);
        if (subject) query = query.where('subject', '==', subject);

        // Студенты видят только свои отметки
        if (role === 'student') {
            query = query.where('studentId', '==', userId);
        }

        const snapshot = await query.get();
        const attendance = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка получения посещаемости', error: error.message });
    }
};

// Простановка / Обновление посещаемости (Admin и Teacher)
exports.saveAttendance = async (req, res) => {
    try {
        const { groupId, studentId, date, subject = '', status } = req.body;
        // status: "present" | "absent" | "late" | "excused"
        const { id: userId, role } = req.user;
        if (!groupId || !studentId || !date || !['present', 'absent', 'late', 'excused'].includes(status)) {
            return res.status(400).json({ message: 'Некорректные данные посещаемости' });
        }

        // Проверка доступа учителя
        if (role === 'teacher') {
            const groupDoc = await db.collection('groups').doc(groupId).get();
            const teacherIds = groupDoc.exists && Array.isArray(groupDoc.data().teacherIds)
                ? groupDoc.data().teacherIds
                : [];
            if (!groupDoc.exists || !teacherIds.includes(userId)) {
                return res.status(403).json({ message: 'У вас нет прав на редактирование этой группы' });
            }
        }

        const studentDoc = await db.collection('users').doc(studentId).get();
        if (!studentDoc.exists || studentDoc.data().role !== 'student') {
            return res.status(400).json({ message: 'Студент не найден' });
        }

        const existingDoc = await db.collection('attendance')
            .where('groupId', '==', groupId)
            .where('studentId', '==', studentId)
            .where('date', '==', date)
            .where('subject', '==', subject)
            .limit(1)
            .get();

        if (!existingDoc.empty) {
            const docId = existingDoc.docs[0].id;
            await db.collection('attendance').doc(docId).update({
                status,
                updatedBy: userId,
                updatedAt: new Date().toISOString()
            });
            return res.json({ id: docId, message: 'Статус посещаемости обновлен' });
        }

        const newRecord = await db.collection('attendance').add({
            groupId,
            studentId,
            date,
            subject,
            status,
            markedBy: userId,
            createdAt: new Date().toISOString()
        });

        res.status(201).json({ id: newRecord.id, message: 'Статус посещаемости сохранен' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сохранения посещаемости' });
    }
};