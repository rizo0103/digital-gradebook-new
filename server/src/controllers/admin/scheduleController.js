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
