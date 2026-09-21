const db = require('../config/firebase'); // Ваши инициализированные данные db = admin.firestore()

exports.bulkCreateLessons = async (lessonsArray) => {
    // В Firestore batch ограничен 500 операциями за один раз
    const BATCH_SIZE = 500;
    let totalInserted = 0;

    // Разбиваем массив lessonsArray на чанки по 500 элементов
    for (let i = 0; i < lessonsArray.length; i += BATCH_SIZE) {
        const chunk = lessonsArray.slice(i, i + BATCH_SIZE);
        const batch = db.batch();

        chunk.forEach((lesson) => {
            // Создаем новый документ с авто-генерируемым ID в коллекции 'lessons'
            const lessonRef = db.collection('lessons').doc();

            batch.set(lessonRef, {
                groupId: lesson.groupId,
                subject: lesson.subject,
                date: lesson.date,      // YYYY-MM-DD
                time: lesson.time,      // HH:mm
                createdAt: new Date().toISOString()
            });
        });

        // Атомарно сохраняем пачку уроков в Firestore
        await batch.commit();
        totalInserted += chunk.length;
    }

    return totalInserted;
};