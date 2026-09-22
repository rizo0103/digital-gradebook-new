const { db } = require('../config/firebase');
const bcrypt = require('bcryptjs');

const isStudentRole = (role) => role === 'student';

const normalizeArray = (value) => Array.isArray(value) ? value.filter(Boolean) : [];

const buildUserPayload = (data = {}) => {
    const payload = { ...data };
    if (payload.fullName && !payload.fullname) payload.fullname = payload.fullName;
    if (payload.fullname && !payload.fullName) payload.fullName = payload.fullname;
    if (payload.student_groups) payload.student_groups = normalizeArray(payload.student_groups);
    if (payload.teacher_groups) payload.teacher_groups = normalizeArray(payload.teacher_groups);
    if (payload.groupIds) payload.groupIds = normalizeArray(payload.groupIds);
    return payload;
};

const generateStrongPassword = (length = 12) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < length; i += 1) {
        password += chars[Math.floor(Math.random() * chars.length)];
    }
    return password;
};

const generateUsername = (fullName, usedUsernames = new Set()) => {
    const translitMap = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
        'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
        'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
        'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
    };

    const cleanName = (fullName || '').toLowerCase().trim();
    let transliterated = '';
    for (const char of cleanName) {
        transliterated += translitMap[char] || (/[a-z0-9]/.test(char) ? char : '');
    }

    const base = (transliterated || 'student').replace(/[^a-z0-9]/g, '').slice(0, 12) || 'student';
    let username = `${base}${Math.floor(100 + Math.random() * 900)}`;
    let counter = 1;

    while (usedUsernames.has(username)) {
        username = `${base}${counter}`;
        counter += 1;
    }

    usedUsernames.add(username);
    return username;
};

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

exports.createStudent = async (req, res) => {
    try {
        const studentData = buildUserPayload(req.body);
        const password = studentData.password || generateStrongPassword();
        const username = studentData.username || generateUsername(
            studentData.fullName || studentData.fullname || studentData.name_en || 'student',
            new Set()
        );

        const docId = studentData.id ? String(studentData.id) : Date.now().toString();
        const payload = {
            ...studentData,
            id: docId,
            username,
            email: studentData.email || `${username}@school.com`,
            passwordHash: await bcrypt.hash(password, 10),
            role: 'student',
            student_groups: normalizeArray(studentData.student_groups || studentData.groupIds),
            createdAt: new Date().toISOString()
        };

        delete payload.password;
        delete payload.groupIds;

        await db.collection('users').doc(docId).set(payload);

        res.status(201).json({
            message: 'Студент успешно создан',
            student: {
                id: docId,
                username,
                defaultPassword: password,
                email: payload.email
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка создания студента' });
    }
};

// 1. Пакетная загрузка студентов из JSON
exports.importStudents = async (req, res) => {
    try {
        const { students, defaultPassword } = req.body;

        if (!Array.isArray(students) || students.length === 0) {
            return res.status(400).json({ message: 'Передан пустой или некорректный массив студентов' });
        }

        const safeDefaultPassword = typeof defaultPassword === 'string' && defaultPassword.trim().length >= 8
            ? defaultPassword.trim()
            : process.env.STUDENT_DEFAULT_PASSWORD && process.env.STUDENT_DEFAULT_PASSWORD.trim().length >= 8
                ? process.env.STUDENT_DEFAULT_PASSWORD.trim()
                : null;

        const usedUsernames = new Set();
        const createdStudents = [];
        const batch = db.batch();
        const groupMemberships = [];

        for (const student of students) {
            const fullName = student.fullName ||
                [student.last_name_en, student.name_en].filter(Boolean).join(' ') ||
                [student.last_name_tj, student.name_tj].filter(Boolean).join(' ');

            if (!fullName) {
                return res.status(400).json({ message: 'У каждого студента должно быть имя' });
            }

            const username = student.username || generateUsername(fullName, usedUsernames);
            const generatedPassword = typeof student.password === 'string' && student.password.trim().length >= 8
                ? student.password.trim()
                : safeDefaultPassword || generateStrongPassword();
            const passwordHash = await bcrypt.hash(generatedPassword, 10);
            const userRef = db.collection('users').doc();

            const studentData = {
                ...student,
                fullName,
                email: student.email || `${username}@school.com`,
                username,
                passwordHash,
                role: 'student',
                createdAt: new Date().toISOString()
            };

            batch.set(userRef, studentData);
            const studentGroups = Array.isArray(student.student_groups)
                ? student.student_groups.filter(Boolean)
                : [];
            studentGroups.forEach((groupId) => groupMemberships.push({ groupId, studentId: userRef.id }));
            createdStudents.push({
                id: userRef.id,
                fullName,
                email: studentData.email,
                username,
                password: generatedPassword
            });
        }

        const membershipsByGroup = groupMemberships.reduce((groups, membership) => {
            if (!groups[membership.groupId]) groups[membership.groupId] = [];
            groups[membership.groupId].push(membership.studentId);
            return groups;
        }, {});

        for (const [groupId, studentIds] of Object.entries(membershipsByGroup)) {
            const groupQuery = db.collection('groups').where('name', '==', groupId).limit(1);
            const groupSnapshot = await groupQuery.get();

            if (groupSnapshot.empty) {
                return res.status(400).json({ message: `Группа ${groupId} не найдена` });
            }

            const groupDoc = groupSnapshot.docs[0];
            const groupRef = groupDoc.ref;
            const groupData = groupDoc.data();

            const existingStudentIds = groupData.studentIds || [];
            const updatedStudentIds = Array.from(new Set([...existingStudentIds, ...studentIds]));

            batch.update(groupRef, {
                studentIds: updatedStudentIds
            });
        }

        await batch.commit();

        res.status(201).json({
            message: `Успешно импортировано студентов: ${createdStudents.length}`,
            students: createdStudents
        });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка импорта студентов' });
    }
};

// 2. Создание группы
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

// 3. Создание расписания
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

// 4. Получение списка пользователей по роли (ИСПРАВЛЕНО: ганантированный Firestore ID в `id`)
exports.getUsersByRole = async (req, res) => {
    try {
        const { role } = req.query;
        let query = db.collection('users');
        if (role) query = query.where('role', '==', role);

        const snapshot = await query.get();
        const users = snapshot.docs.map(doc => {
            const data = doc.data();
            delete data.passwordHash;
            
            // Если в документе уже было поле `id` (например, из JSON), перемещаем его в customId
            const customId = data.id !== undefined ? data.id : null;
            
            return {
                ...data,
                id: doc.id, // Гарантированно использовать ID документа Firestore
                ...(customId && { customId })
            };
        });

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка получения пользователей' });
    }
};

exports.getStudents = async (req, res, next) => {
    try {
        const snapshot = await db.collection('users').where('role', '==', 'student').get();
        const students = snapshot.docs.map(doc => {
            const data = doc.data();
            delete data.passwordHash;
            return { id: doc.id, ...data };
        });
        res.json(students);
    } catch (err) {
        next(err);
    }
};

exports.updateStudent = async (req, res, next) => {
    try {
        await exports.updateUser(req, res);
    } catch (err) {
        next(err);
    }
};

exports.deleteStudent = async (req, res, next) => {
    try {
        await exports.deleteUser(req, res, next);
    } catch (err) {
        next(err);
    }
};

// 5. Обновление пользователя (ИСПРАВЛЕНО: исключение ID из updateData)
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Извлекаем id и customId, чтобы не затирать системные поля
        const { id: bodyId, customId, role, student_groups, teacher_groups, groupIds, ...updateData } = req.body;

        console.log(req.body);

        const normalizedRole = typeof role === 'string' ? role : 'student';
        const nextGroupIds = normalizeArray(groupIds || (normalizedRole === 'teacher' ? teacher_groups : student_groups));

        const userRef = db.collection('users').doc(String(id));
        const userSnapshot = await userRef.get();
        
        if (!userSnapshot.exists) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const currentRole = userSnapshot.data().role;
        const userUpdate = { ...updateData };

        if (normalizedRole === 'student') {
            userUpdate.student_groups = nextGroupIds;
            delete userUpdate.teacher_groups;
        }

        if (normalizedRole === 'teacher') {
            userUpdate.teacher_groups = nextGroupIds;
            delete userUpdate.student_groups;
        }

        if (userUpdate.username) userUpdate.username = userUpdate.username.trim();
        if (userUpdate.email) userUpdate.email = userUpdate.email.trim();
        if (normalizedRole) userUpdate.role = normalizedRole;
        if (userUpdate.fullName) userUpdate.fullName = userUpdate.fullName.trim();
        else userUpdate.fullName = `${userUpdate.name_en} ${userUpdate.last_name_en}`;

        await userRef.update(userUpdate);

        if (['student', 'teacher'].includes(normalizedRole) || ['student', 'teacher'].includes(currentRole)) {
            await syncGroupMemberships(String(id), normalizedRole || currentRole, nextGroupIds);
        }

        res.json({ message: 'Данные пользователя обновлены' });
    } catch (err) {
        console.error('Update User Error:', err);
        res.status(500).json({ message: 'Ошибка при обновлении пользователя' });
    }
};

// 6. Удаление пользователя
exports.deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userDoc = await db.collection('users').doc(String(id)).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            const groupSnapshot = await db.collection('groups').get();
            const batch = db.batch();
            let hasGroupWrites = false;

            groupSnapshot.docs.forEach((groupDoc) => {
                const groupData = groupDoc.data() || {};
                
                if (userData.role === 'teacher') {
                    const teacherIds = normalizeArray(groupData.teacherIds).filter((teacherId) => teacherId !== String(id));
                    if (teacherIds.length !== normalizeArray(groupData.teacherIds).length) {
                        batch.update(groupDoc.ref, { teacherIds });
                        hasGroupWrites = true;
                    }
                }
                
                if (userData.role === 'student') {
                    const studentIds = normalizeArray(groupData.studentIds).filter((studentId) => studentId !== String(id));
                    if (studentIds.length !== normalizeArray(groupData.studentIds).length) {
                        batch.update(groupDoc.ref, { studentIds });
                        hasGroupWrites = true;
                    }
                }
            });

            if (hasGroupWrites) {
                await batch.commit();
            }
        }

        await db.collection('users').doc(String(id)).delete();
        res.json({ message: 'Пользователь удален' });
    } catch (err) {
        next(err);
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