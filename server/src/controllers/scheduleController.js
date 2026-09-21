const scheduleService = require('../services/scheduleService');
const { db } = require('../config/firebase');

exports.generateSchedule = async (req, res, next) => {
    try {
        const { groupId, subject, startDate, endDate, daysOfWeek, time, teacherId } = req.body;

        // Базовая валидация входящих данных
        if (!groupId || !startDate || !endDate || !daysOfWeek || !Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
            return res.status(400).json({
                message: 'Заполните все обязательные поля: groupId, startDate, endDate, daysOfWeek'
            });
        }
        const groupSnapshot = await db.collection('groups').doc(groupId).get();
        if (!groupSnapshot.exists) {
            return res.status(400).json({ message: 'Группа не найдена' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: 'Некорректный формат дат' });
        }
        if (typeof startDate !== 'string' || typeof endDate !== 'string' ||
            !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
            return res.status(400).json({ message: 'Даты должны быть в формате YYYY-MM-DD' });
        }
        if (time && !/^\d{2}:\d{2}$/.test(time)) {
            return res.status(400).json({ message: 'Некорректный формат времени' });
        }

        if (start > end) {
            return res.status(400).json({ message: 'Дата начала не может быть позже даты окончания' });
        }

        // Преобразование названий дней недели в индексы JavaScript (0 = Вс, 1 = Пн, ...)
        const dayMap = {
            Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
            Thursday: 4, Friday: 5, Saturday: 6
        };
        const targetDays = daysOfWeek.map(d => dayMap[d]).filter(d => d !== undefined);

        if (targetDays.length === 0) {
            return res.status(400).json({ message: 'Переданы некорректные дни недели' });
        }

        const lessonsToCreate = [];
        let current = new Date(start);

        // Генерация занятий по указанным дням
        // Внутри цикла while в controllers/scheduleController.js:
        while (current <= end) {
            if (targetDays.includes(current.getDay())) {
                const year = current.getFullYear();
                const month = String(current.getMonth() + 1).padStart(2, '0');
                const day = String(current.getDate()).padStart(2, '0');
                const formattedDate = `${year}-${month}-${day}`;

                // Для Firestore формируем объект:
                lessonsToCreate.push({
                    groupId,
                    subject: subject || '',
                    date: formattedDate,
                    time: time || '00:00',
                    teacherId: teacherId || null
                });
            }
            current.setDate(current.getDate() + 1);
        }

        if (lessonsToCreate.length === 0) {
            return res.status(400).json({ message: 'В выбранном диапазоне дат нет указанных дней недели' });
        }

        // Вызов сервисного слоя для сохранения в БД
        const insertedCount = await scheduleService.bulkCreateLessons(lessonsToCreate);

        return res.status(201).json({
            message: `Успешно создано ${insertedCount} уроков`,
            count: insertedCount
        });

    } catch (error) {
        // Передаем ошибку в глобальный errorHandler middleware
        next(error);
    }
};