const { db } = require('../../config/firebase');

exports.getStudentAttendanceStats = async (req, res) => {
    try {
        // req.user.id извлекается из middleware авторизации по токену
        const userId = req.user?.id || req.user?.uid;

        if (!userId) {
            return res.status(401).json({ message: 'Пользователь не авторизован' });
        }

        // 1. Получаем все записи посещаемости текущего студента
        const attendanceSnapshot = await db.collection('attendance')
            .where('studentId', '==', String(userId))
            .get();

        if (attendanceSnapshot.empty) {
            return res.json({
                userId,
                groups: []
            });
        }

        // 2. Агрегируем подсчеты по groupId
        // Структура: { [groupId]: { present: 0, absent: 0, late: 0 } }
        const statsByGroup = {};

        attendanceSnapshot.docs.forEach((doc) => {
            const data = doc.data();
            const groupId = data.groupId;
            const rawStatus = String(data.status || '').toLowerCase();

            if (!groupId) return;

            if (!statsByGroup[groupId]) {
                statsByGroup[groupId] = {
                    present: 0, // Присутствия
                    absent: 0,  // Пропуски
                    late: 0     // Опоздания
                };
            }

            // Нормализация статуса
            if (['present', 'was', 'came', 'attended'].includes(rawStatus)) {
                statsByGroup[groupId].present += 1;
            } else if (['late', 'delayed', 'tardy', 'opozdal'].includes(rawStatus)) {
                statsByGroup[groupId].late += 1;
            } else if (['absent', 'not_present', 'notpresent', 'missed', 'was_not', 'wasnt', 'notwas', 'not_was'].includes(rawStatus)) {
                statsByGroup[groupId].absent += 1;
            } else {
                // По умолчанию считаем пропуском, если статус неизвестен
                statsByGroup[groupId].absent += 1;
            }
        });

        const groupIds = Object.keys(statsByGroup);

        if (groupIds.length === 0) {
            return res.json({ userId, groups: [] });
        }

        // 3. Получаем наименования групп из коллекции 'groups'
        const groupsSnapshot = await db.collection('groups')
            .where('__name__', 'in', groupIds)
            .get();

        const groupNamesMap = {};
        groupsSnapshot.docs.forEach((doc) => {
            groupNamesMap[doc.id] = doc.data().name || `Группа ${doc.id}`;
        });

        // 4. Формируем итоговый массив ответа
        const result = groupIds.map((groupId) => ({
            groupId,
            groupName: groupNamesMap[groupId] || `Группа ${groupId}`,
            present: statsByGroup[groupId].present,
            absent: statsByGroup[groupId].absent,
            late: statsByGroup[groupId].late
        }));

        res.json({
            userId,
            groups: result
        });
    } catch (error) {
        console.error('Get My Attendance Stats Error:', error);
        res.status(500).json({ message: 'Ошибка при получении статистики посещаемости' });
    }
};
