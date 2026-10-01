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

module.exports = {
    buildUserPayload,
    generateStrongPassword,
    generateUsername,
    normalizeArray
}
