const { normalizeArray } = require('../../utils/userUtils');
const { db } = require('../../config/firebase');

exports.createGroup = async (req, res) => {
    try {
        const { name, category, teacherIds = [], studentIds = [] } = req.body;

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

// 7. Обновление группы
exports.updateGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { teacherIds, studentIds, ...updateData } = req.body;

        const groupRef = db.collection('groups').doc(String(id));
        const groupSnapshot = await groupRef.get();
        if (!groupSnapshot.exists) {
            return res.status(404).json({ message: 'Группа не найдена' });
        }

        const normalizedTeacherIds = normalizeArray(teacherIds);
        const normalizedStudentIds = normalizeArray(studentIds);

        const nextData = {
            ...updateData,
            teacherIds: normalizedTeacherIds,
            studentIds: normalizedStudentIds
        };

        await groupRef.update(nextData);

        if (normalizedTeacherIds.length > 0) {
            const teacherBatch = db.batch();
            for (const teacherId of normalizedTeacherIds) {
                const teacherRef = db.collection('users').doc(String(teacherId));
                const teacherDoc = await teacherRef.get();
                if (teacherDoc.exists) {
                    const currentGroups = normalizeArray(teacherDoc.data().teacher_groups);
                    const nextGroups = Array.from(new Set([...currentGroups, String(id)]));
                    teacherBatch.update(teacherRef, { teacher_groups: nextGroups });
                }
            }
            await teacherBatch.commit();
        }

        res.json({ message: 'Группа обновлена' });
    } catch (err) {
        res.status(500).json({ message: 'Ошибка при обновлении группы' });
    }
};

// 8. Удаление группы
exports.deleteGroup = async (req, res, next) => {
    try {
        const { id } = req.params;
        const groupDoc = await db.collection('groups').doc(String(id)).get();
        if (groupDoc.exists) {
            const groupData = groupDoc.data();
            const batch = db.batch();
            const teacherIds = normalizeArray(groupData.teacherIds);
            const studentIds = normalizeArray(groupData.studentIds);

            for (const teacherId of teacherIds) {
                const teacherRef = db.collection('users').doc(String(teacherId));
                const teacherDoc = await teacherRef.get();
                if (teacherDoc.exists) {
                    const currentGroups = normalizeArray(teacherDoc.data().teacher_groups).filter((groupId) => groupId !== String(id));
                    batch.update(teacherRef, { teacher_groups: currentGroups });
                }
            }

            for (const studentId of studentIds) {
                const studentRef = db.collection('users').doc(String(studentId));
                const studentDoc = await studentRef.get();
                if (studentDoc.exists) {
                    const currentGroups = normalizeArray(studentDoc.data().student_groups).filter((groupId) => groupId !== String(id));
                    batch.update(studentRef, { student_groups: currentGroups });
                }
            }

            await batch.commit();
        }
        await db.collection('groups').doc(String(id)).delete();
        res.json({ message: 'Группа удалена' });
    } catch (err) {
        next(err);
    }
};
