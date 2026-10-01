const { syncGroupMemberships } = require('../../utils/groupUtils');
const { buildUserPayload, generateUsername, generateStrongPassword, normalizeArray } = require('../../utils/userUtils');
const { db } = require('../../config/firebase');
const bcrypt = require('bcryptjs');

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

            // Извлекаем название группы (поддерживаем student_group, student_groups, group и т.д.)
            const rawGroup = student.student_group || student.student_groups || student.group || student.group_name || student.groupName;
            
            let studentGroups = [];
            if (Array.isArray(rawGroup)) {
                studentGroups = rawGroup.map(g => String(g).trim()).filter(Boolean);
            } else if (rawGroup) {
                studentGroups = [String(rawGroup).trim()].filter(Boolean);
            }

            const studentData = {
                fullName,
                name_en: student.name_en,
                last_name_en: student.last_name_en,
                name_tj: student.name_tj,
                last_name_tj: student.last_name_tj,
                name_kr: student.name_kr,
                last_name_kr: student.last_name_kr,
                date_of_birth: student.date_of_birth,
                gender: student.gender,
                nationality: student.nationality,
                phone: student.phone,
                email: student.email || `${username}@school.com`,
                username,
                passwordHash,
                role: 'student',
                student_groups: studentGroups, // Сохраняем массив групп в документе пользователя
                createdAt: new Date().toISOString()
            };

            batch.set(userRef, studentData);

            // Собираем связи "группа -> студент"
            studentGroups.forEach((groupName) => {
                groupMemberships.push({ groupName, studentId: userRef.id });
            });

            createdStudents.push({
                id: userRef.id,
                fullName,
                email: studentData.email,
                username,
                password: generatedPassword,
                groups: studentGroups
            });
        }

        // Группируем студентов по имени группы
        const membershipsByGroupName = groupMemberships.reduce((groups, membership) => {
            if (!groups[membership.groupName]) groups[membership.groupName] = [];
            groups[membership.groupName].push(membership.studentId);
            return groups;
        }, {});

        // Поиск групп в Firestore по полю 'name' и их обновление
        for (const [groupName, studentIds] of Object.entries(membershipsByGroupName)) {
            const groupQuery = db.collection('groups').where('name', '==', groupName).limit(1);
            const groupSnapshot = await groupQuery.get();

            // Если группа не найдена — игнорируем её и переходим к следующей
            if (groupSnapshot.empty) {
                console.warn(`Группа "${groupName}" не найдена в Firestore. Пропускаем привязку.`);
                continue;
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

        // Фиксируем транзакцию
        await batch.commit();

        res.status(201).json({
            message: `Успешно импортировано студентов: ${createdStudents.length}`,
            students: createdStudents
        });
    } catch (error) {
        console.error('Import Students Error:', error);
        res.status(500).json({ message: 'Ошибка импорта студентов' });
    }
};

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

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Извлекаем password из body, чтобы обработать его отдельно
        const { id: bodyId, customId, role, student_groups, teacher_groups, groupIds, password, ...updateData } = req.body;

        const normalizedRole = typeof role === 'string' ? role : 'student';
        const nextGroupIds = normalizeArray(groupIds || (normalizedRole === 'teacher' ? teacher_groups : student_groups));

        const userRef = db.collection('users').doc(String(id));
        const userSnapshot = await userRef.get();
        
        if (!userSnapshot.exists) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const currentRole = userSnapshot.data().role;
        const userUpdate = { ...updateData };

        // Если передан новый пароль (строка не пустая и длиной хотя бы от 4-6 символов)
        if (typeof password === 'string' && password.trim().length > 0) {
            userUpdate.passwordHash = await bcrypt.hash(password.trim(), 10);
        }

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
        
        if (userUpdate.fullName) {
            userUpdate.fullName = userUpdate.fullName.trim();
        } else if (userUpdate.name_en && userUpdate.last_name_en) {
            userUpdate.fullName = `${userUpdate.name_en} ${userUpdate.last_name_en}`.trim();
        }

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
