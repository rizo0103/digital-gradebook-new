const { db } = require('../config/firebase');


// Синхронизация групп и участников
const syncGroupMemberships = async (userId, role, selectedGroupIds) => {
    const groupIds = normalizeArray(selectedGroupIds);
    const groupSnapshot = await db.collection('groups').get();

    const updates = [];
    groupSnapshot.docs.forEach((groupDoc) => {
        const groupData = groupDoc.data() || {};
        const currentTeacherIds = normalizeArray(groupData.teacherIds);
        const currentStudentIds = normalizeArray(groupData.studentIds);

        if (role === 'teacher') {
            const nextTeacherIds = groupIds.includes(groupDoc.id) || groupIds.includes(groupData.name)
                ? Array.from(new Set([...currentTeacherIds, userId]))
                : currentTeacherIds.filter((id) => id !== userId);

            if (JSON.stringify(currentTeacherIds) !== JSON.stringify(nextTeacherIds)) {
                updates.push({ ref: groupDoc.ref, data: { teacherIds: nextTeacherIds } });
            }
        }

        if (role === 'student') {
            const nextStudentIds = groupIds.includes(groupDoc.id) || groupIds.includes(groupData.name)
                ? Array.from(new Set([...currentStudentIds, userId]))
                : currentStudentIds.filter((id) => id !== userId);

            if (JSON.stringify(currentStudentIds) !== JSON.stringify(nextStudentIds)) {
                updates.push({ ref: groupDoc.ref, data: { studentIds: nextStudentIds } });
            }
        }
    });

    if (updates.length > 0) {
        const batch = db.batch();
        updates.forEach(({ ref, data }) => batch.update(ref, data));
        await batch.commit();
    }
};

module.exports = {
    syncGroupMemberships
}
