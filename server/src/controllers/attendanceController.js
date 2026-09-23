const { db } = require('../config/firebase');

const normalizeAttendanceStatus = (status) => {
    const normalized = String(status || '').toLowerCase();
    if (['present', 'was', 'came', 'attended'].includes(normalized)) return 'present';
    if (['late', 'delayed', 'tardy', 'opozdal'].includes(normalized)) return 'late';
    if (['absent', 'not_present', 'notpresent', 'missed', 'was_not', 'wasnt', 'notwas', 'not_was'].includes(normalized)) return 'absent';
    if (normalized === 'excused') return 'excused';
    return null;
};

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
        const teacherIds = Array.isArray(groupData.teacherIds) ? groupData.teacherIds.map(String) : [];
        const studentIds = Array.isArray(groupData.studentIds) ? groupData.studentIds.map(String) : [];
        const normalizedUserId = String(userId); 

        if (role === 'teacher' && !teacherIds.includes(normalizedUserId)) {
            return res.status(403).json({ message: 'Доступ к этой группе ограничен' });
        }
        if (role === 'student' && !studentIds.includes(normalizedUserId)) {
            return res.status(403).json({ message: 'Доступ к этой группе ограничен' });
        }

        let query = db.collection('attendance').where('groupId', '==', groupId);

        if (date) query = query.where('date', '==', date);
        if (subject) query = query.where('subject', '==', subject);

        if (role === 'student') {
            query = query.where('studentId', '==', String(userId));
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
        const normalizedStatus = normalizeAttendanceStatus(req.body.status);
        const groupId = String(req.body.groupId || '').trim();
        const studentId = String(req.body.studentId || '').trim();
        const date = String(req.body.date || '').trim();
        const subject = String(req.body.subject || '').trim();

        const { id: userId, role } = req.user;
        if (!groupId || !studentId || !date || !normalizedStatus || !['present', 'absent', 'late', 'excused'].includes(normalizedStatus)) {
            return res.status(400).json({ message: 'Некорректные данные посещаемости' });
        }

        if (role === 'teacher') {
            const groupDoc = await db.collection('groups').doc(groupId).get();
            const teacherIds = groupDoc.exists && Array.isArray(groupDoc.data().teacherIds)
                ? groupDoc.data().teacherIds
                : [];
            if (!groupDoc.exists || !teacherIds.includes(String(userId))) {
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
                status: normalizedStatus,
                updatedBy: String(userId),
                updatedAt: new Date().toISOString()
            });
            return res.json({ id: docId, message: 'Статус посещаемости обновлен' });
        }

        const newRecord = await db.collection('attendance').add({
            groupId,
            studentId,
            date,
            subject,
            status: normalizedStatus,
            markedBy: String(userId),
            createdAt: new Date().toISOString()
        });

        res.status(201).json({ id: newRecord.id, message: 'Статус посещаемости сохранен' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сохранения посещаемости' });
    }
};