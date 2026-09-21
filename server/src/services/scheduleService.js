const { db } = require('../config/firebase');

exports.bulkCreateLessons = async (lessonsArray) => {
    const BATCH_SIZE = 500;
    let totalInserted = 0;

    for (let i = 0; i < lessonsArray.length; i += BATCH_SIZE) {
        const chunk = lessonsArray.slice(i, i + BATCH_SIZE);
        const batch = db.batch();

        chunk.forEach((lesson) => {
            const lessonRef = db.collection('lessons').doc();

            batch.set(lessonRef, {
                groupId: lesson.groupId,
                subject: lesson.subject,
                date: lesson.date,
                time: lesson.time,
                teacherId: lesson.teacherId,
                createdAt: new Date().toISOString()
            });
        });

        await batch.commit();
        totalInserted += chunk.length;
    }

    return totalInserted;
};