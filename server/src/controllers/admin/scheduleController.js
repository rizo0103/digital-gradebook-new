const { db } = require('../../config/firebase');

exports.createSchedule = async (req, res) => {
    try {
        const { groupId, subject, daysOfWeek, time, teacherId } = req.body;
        if (!groupId || !Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
            return res.status(400).json({ message: 'Укажите группу и дни занятий' });
        }

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

exports.deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                message: 'Не указан ID расписания'
            });
        }

        const scheduleRef = db.collection('schedules').doc(String(id));
        const scheduleDoc = await scheduleRef.get();

        if (!scheduleDoc.exists) {
            return res.status(404).json({
                message: 'Расписание не найдено'
            });
        }

        await scheduleRef.delete();

        return res.json({
            message: 'Расписание успешно удалено',
            id: scheduleDoc.id
        });

    } catch (error) {
        console.error('Delete Schedule Error:', error);

        return res.status(500).json({
            message: 'Ошибка удаления расписания'
        });
    }
};

exports.getSchedules = async (req, res) => {
    try {
        const { groupId } = req.query;

        let query = db.collection('schedules');

        if (groupId) {
            query = query.where('groupId', '==', String(groupId));
        }

        const snapshot = await query.get();

        const schedules = snapshot.docs
            .map((doc) => ({
                ...doc.data(),
                id: doc.id
            }))
            .sort((a, b) =>
                String(b.createdAt || '').localeCompare(
                    String(a.createdAt || '')
                )
            );

        return res.json(schedules);

    } catch (error) {
        console.error('Get Schedules Error:', error);

        return res.status(500).json({
            message: 'Ошибка получения расписаний'
        });
    }
};
