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
const CENTER_TIME_ZONE = 'Asia/Dushanbe';

const getTodayInCenter = () => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: CENTER_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(new Date());

    const get = (type) =>
        parts.find((part) => part.type === type)?.value;

    return `${get('year')}-${get('month')}-${get('day')}`;
};

const isValidDate = (value) => {
    if (typeof value !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const parsed = new Date(`${value}T00:00:00Z`);

    return !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === value;
};

const hasAttendanceForLesson = async (lesson) => {
    const snapshot = await db.collection('attendance')
        .where('groupId', '==', lesson.groupId)
        .where('date', '==', lesson.date)
        .get();

    return snapshot.docs.some((doc) =>
        String(doc.data().subject || '') ===
        String(lesson.subject || '')
    );
};

// Получить занятия
exports.getSchedules = async (req, res, next) => {
    try {
        const { groupId } = req.query;

        let query = db.collection('lessons');

        if (groupId) {
            query = query.where('groupId', '==', String(groupId));
        }

        const snapshot = await query.get();

        const lessons = snapshot.docs
            .map((doc) => ({
                ...doc.data(),
                id: doc.id
            }))
            .sort((a, b) =>
                `${a.date || ''} ${a.time || ''}`.localeCompare(
                    `${b.date || ''} ${b.time || ''}`
                )
            );

        return res.json(lessons);
    } catch (error) {
        next(error);
    }
};

// Удалить одно занятие
exports.deleteSchedule = async (req, res, next) => {
    try {
        const lessonRef = db.collection('lessons')
            .doc(String(req.params.id));

        const lessonDoc = await lessonRef.get();

        if (!lessonDoc.exists) {
            return res.status(404).json({
                message: 'Занятие не найдено'
            });
        }

        const lesson = lessonDoc.data();

        if (await hasAttendanceForLesson(lesson)) {
            return res.status(409).json({
                message: 'Для занятия уже есть посещаемость'
            });
        }

        await lessonRef.delete();

        return res.json({
            message: 'Занятие удалено',
            id: lessonDoc.id
        });
    } catch (error) {
        next(error);
    }
};

// Массовое удаление будущих занятий
exports.deleteSchedulesBulk = async (req, res, next) => {
    try {
        const { groupId, startDate, endDate } = req.body;

        if (!groupId ||
            !isValidDate(startDate) ||
            !isValidDate(endDate) ||
            startDate > endDate) {
            return res.status(400).json({
                message: 'Укажите группу и корректный период'
            });
        }

        const today = getTodayInCenter();

        if (startDate <= today) {
            return res.status(400).json({
                message: 'Начало периода должно быть позже сегодняшней даты'
            });
        }

        const groupDoc = await db.collection('groups')
            .doc(String(groupId))
            .get();

        if (!groupDoc.exists) {
            return res.status(404).json({
                message: 'Группа не найдена'
            });
        }

        const snapshot = await db.collection('lessons')
            .where('groupId', '==', String(groupId))
            .get();

        const candidates = snapshot.docs.filter((doc) => {
            const date = doc.data().date;

            return isValidDate(date) &&
                date >= startDate &&
                date <= endDate &&
                date > today;
        });

        // Получаем посещаемость группы за выбранный период.
        const attendanceSnapshot = await db.collection('attendance')
            .where('groupId', '==', String(groupId))
            .get();

        const protectedKeys = new Set(
            attendanceSnapshot.docs
                .map((doc) => doc.data())
                .filter((record) =>
                    record.date >= startDate &&
                    record.date <= endDate
                )
                .map((record) =>
                    JSON.stringify([
                        record.date,
                        String(record.subject || '')
                    ])
                )
        );

        const deletable = candidates.filter((doc) => {
            const lesson = doc.data();

            const key = JSON.stringify([
                lesson.date,
                String(lesson.subject || '')
            ]);

            return !protectedKeys.has(key);
        });

        const BATCH_SIZE = 400;

        for (let i = 0; i < deletable.length; i += BATCH_SIZE) {
            const batch = db.batch();

            deletable.slice(i, i + BATCH_SIZE)
                .forEach((doc) => batch.delete(doc.ref));

            await batch.commit();
        }

        return res.json({
            message: 'Обработка завершена',
            deleted: deletable.length,
            skipped: candidates.length - deletable.length,
            deletedIds: deletable.map((doc) => doc.id)
        });
    } catch (error) {
        next(error);
    }
};
