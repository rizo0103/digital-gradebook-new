/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import api from '../../api/axiosInstance';
import CustomDropdown from '../ui/CustomDropdown';
import { UserPlus, CheckCircle2, AlertCircle, Shield, GraduationCap, School } from 'lucide-react';

const fieldInputClass = "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:bg-slate-900/50 transition-colors";

const UsersTab = ({ groups = [] }) => {
    // 1. Выбор роли пользователя
    const [role, setRole] = useState('student'); // 'student' | 'teacher' | 'admin'

    // 2. Состояние для Студента (ручной / импорт JSON)
    const [studentMode, setStudentMode] = useState('manual');
    const [jsonInput, setJsonInput] = useState('');

    // 3. Состояние статусов запроса (loading, success, error)
    const [status, setStatus] = useState(null);

    // --- Форма для Администратора и Учителя ---
    const [simpleForm, setSimpleForm] = useState({
        username: '',
        fullName: '',
        email: '',
        password: ''
    });

    // --- Форма для Студента ---
    const [studentForm, setStudentForm] = useState({
        id: '',
        name_tj: '',
        last_name_tj: '',
        name_en: '',
        last_name_en: '',
        name_kr: '',
        last_name_kr: '',
        date_of_birth: '',
        address: '',
        gender: 'Male',
        nationality: 'Tajikistan',
        passportID: '',
        email: '',
        phone: '',
        student_groups: [],
        time_lesson: '14:00'
    });

    // Сброс формы и статуса при переключении роли
    const handleRoleChange = (newRole) => {
        setRole(newRole);
        setStatus(null);
    };

    // ==========================================
    // 1. ОБРАБОТЧИК ДЛЯ АДМИНА И УЧИТЕЛЯ
    // ==========================================
    const handleCreateSimpleUser = async (e) => {
        e.preventDefault();
        setStatus({ type: 'loading', message: `Создание пользователя (${role === 'admin' ? 'Администратор' : 'Учитель'})...` });

        try {
            const payload = {
                username: simpleForm.username.trim(),
                fullName: simpleForm.fullName.trim(), // Синхронизировано с бэкендом (fullName)
                email: simpleForm.email.trim(),
                password: simpleForm.password,
                role: role // 'admin' или 'teacher'
            };

            // Запрос на создание администратора или учителя
            const response = await api.post('/auth/register', payload);

            setStatus({
                type: 'success',
                message: `${role === 'admin' ? 'Администратор' : 'Учитель'} "${simpleForm.fullName || simpleForm.username}" успешно создан!`
            });

            // Очистка формы
            setSimpleForm({ username: '', fullName: '', email: '', password: '' });
        } catch (err) {
            setStatus({
                type: 'error',
                message: err.response?.data?.message || 'Ошибка при создании пользователя'
            });
        }
    };

    // ==========================================
    // 2. ОБРАБОТЧИК ДЛЯ СТУДЕНТА (ВРУЧНУЮ)
    // ==========================================
    const handleCreateStudentManual = async (e) => {
        e.preventDefault();
        setStatus({ type: 'loading', message: 'Создание студента...' });

        try {
            const studentPayload = {
                ...studentForm,
                role: 'student',
                id: studentForm.id ? Number(studentForm.id) : Date.now(),
                student_groups: Array.isArray(studentForm.student_groups) ? studentForm.student_groups : [studentForm.student_groups],
                created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
            };

            // Отправляем массив с одним студентом на универсальный эндпоинт импорта
            const response = await api.post('/admin/import-students', { students: [studentPayload] });

            setStatus({
                type: 'success',
                message: `Студент ${studentForm.name_en || studentForm.name_tj || 'пользователь'} успешно добавлен!`
            });

            // Очистка формы
            setStudentForm({
                id: '', name_tj: '', last_name_tj: '', name_en: '', last_name_en: '',
                name_kr: '', last_name_kr: '', date_of_birth: '', address: '',
                gender: 'Male', nationality: 'Tajikistan', passportID: '', email: '',
                phone: '', student_groups: [], time_lesson: '14:00'
            });
        } catch (err) {
            setStatus({
                type: 'error',
                message: err.response?.data?.message || 'Ошибка при создании студента'
            });
        }
    };

    // ==========================================
    // 3. ОБРАБОТЧИК ДЛЯ СТУДЕНТОВ (ИМПОРТ JSON)
    // ==========================================
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => setJsonInput(event.target.result);
            reader.readAsText(file);
        }
    };

    const handleImportStudents = async () => {
        setStatus({ type: 'loading', message: 'Импортируем студентов...' });
        try {
            const parsedData = JSON.parse(jsonInput);

            // Валидация и подготовка массива
            const formattedData = (Array.isArray(parsedData) ? parsedData : [parsedData]).map((s) => ({
                ...s,
                role: 'student',
                id: s.id ? Number(s.id) : Date.now(),
                student_groups: Array.isArray(s.student_groups) ? s.student_groups : (s.student_groups ? [s.student_groups] : [])
            }));

            const response = await api.post('/admin/import-students', { students: formattedData });

            setStatus({
                type: 'success',
                message: response.data?.message || `Студенты (${formattedData.length}) успешно импортированы!`
            });

            setJsonInput('');
        } catch (err) {
            setStatus({
                type: 'error',
                message: err.response?.data?.message || (err instanceof SyntaxError ? 'Некорректный формат JSON' : 'Ошибка при импорте студентов')
            });
        }
    };

    return (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8">
            
            {/* ШАПКА: Выбор роли пользователя */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-blue-500" /> Создать пользователя
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Выберите роль пользователя и заполните необходимые данные</p>
                </div>

                {/* Переключатель ролей */}
                <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => handleRoleChange('student')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            role === 'student' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <GraduationCap className="w-3.5 h-3.5" /> Студент
                    </button>
                    <button
                        type="button"
                        onClick={() => handleRoleChange('teacher')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            role === 'teacher' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <School className="w-3.5 h-3.5" /> Учитель
                    </button>
                    <button
                        type="button"
                        onClick={() => handleRoleChange('admin')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            role === 'admin' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Shield className="w-3.5 h-3.5" /> Админ
                    </button>
                </div>
            </div>

            {/* --- ВАР. A: ФОРМА ДЛЯ УЧИТЕЛЯ / АДМИНИСТРАТОРА --- */}
            {(role === 'admin' || role === 'teacher') && (
                <form onSubmit={handleCreateSimpleUser} className="space-y-4 max-w-2xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 uppercase mb-1">
                                Username (Логин)
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. john_doe"
                                value={simpleForm.username}
                                onChange={(e) => setSimpleForm({ ...simpleForm, username: e.target.value })}
                                className={fieldInputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 uppercase mb-1">
                                ФИО (Full Name)
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. John Doe"
                                value={simpleForm.fullName}
                                onChange={(e) => setSimpleForm({ ...simpleForm, fullName: e.target.value })}
                                className={fieldInputClass}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 uppercase mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                required
                                placeholder="email@example.com"
                                value={simpleForm.email}
                                onChange={(e) => setSimpleForm({ ...simpleForm, email: e.target.value })}
                                className={fieldInputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 uppercase mb-1">
                                Пароль
                            </label>
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                value={simpleForm.password}
                                onChange={(e) => setSimpleForm({ ...simpleForm, password: e.target.value })}
                                className={fieldInputClass}
                            />
                        </div>
                    </div>

                    {status && (
                        <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
                            status.type === 'success' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800' : 'bg-rose-950/40 text-rose-300 border-rose-900/60'
                        }`}>
                            {status.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                            <span>{status.message}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={status?.type === 'loading'}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition cursor-pointer mt-2 disabled:opacity-50"
                    >
                        Создать {role === 'admin' ? 'администратора' : 'учителя'}
                    </button>
                </form>
            )}

            {/* --- ВАР. B: ФОРМА ДЛЯ СТУДЕНТА (РУЧНАЯ ИЛИ JSON) --- */}
            {role === 'student' && (
                <div>
                    {/* Переключатель режима ввода */}
                    <div className="flex justify-end mb-4">
                        <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                            <button
                                type="button"
                                onClick={() => setStudentMode('manual')}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                    studentMode === 'manual' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                Вручную
                            </button>
                            <button
                                type="button"
                                onClick={() => setStudentMode('import')}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                    studentMode === 'import' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                Импорт JSON
                            </button>
                        </div>
                    </div>

                    {studentMode === 'manual' ? (
                        <form onSubmit={handleCreateStudentManual} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase mb-1">ID (Число)</label>
                                    <input
                                        type="number"
                                        placeholder="Авто / Напр. 97"
                                        value={studentForm.id}
                                        onChange={(e) => setStudentForm({ ...studentForm, id: e.target.value })}
                                        className={fieldInputClass}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Группа обучения</label>
                                    <CustomDropdown
                                        options={groups.map(g => ({ value: g.name || g.id, label: g.name }))}
                                        value={studentForm.student_groups[0] || ''}
                                        onChange={(val) => setStudentForm({ ...studentForm, student_groups: [val] })}
                                        placeholder="-- Выберите группу --"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Время урока</label>
                                    <input
                                        type="time"
                                        value={studentForm.time_lesson}
                                        onChange={(e) => setStudentForm({ ...studentForm, time_lesson: e.target.value })}
                                        className={fieldInputClass}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Имя (TJ)</label>
                                    <input
                                        type="text"
                                        value={studentForm.name_tj}
                                        onChange={(e) => setStudentForm({ ...studentForm, name_tj: e.target.value })}
                                        className={fieldInputClass}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Фамилия (TJ)</label>
                                    <input
                                        type="text"
                                        value={studentForm.last_name_tj}
                                        onChange={(e) => setStudentForm({ ...studentForm, last_name_tj: e.target.value })}
                                        className={fieldInputClass}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Имя (EN)</label>
                                    <input
                                        type="text"
                                        required
                                        value={studentForm.name_en}
                                        onChange={(e) => setStudentForm({ ...studentForm, name_en: e.target.value })}
                                        className={fieldInputClass}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Фамилия (EN)</label>
                                    <input
                                        type="text"
                                        required
                                        value={studentForm.last_name_en}
                                        onChange={(e) => setStudentForm({ ...studentForm, last_name_en: e.target.value })}
                                        className={fieldInputClass}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Имя (KR)</label>
                                    <input
                                        type="text"
                                        value={studentForm.name_kr}
                                        onChange={(e) => setStudentForm({ ...studentForm, name_kr: e.target.value })}
                                        className={fieldInputClass}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Фамилия (KR)</label>
                                    <input
                                        type="text"
                                        value={studentForm.last_name_kr}
                                        onChange={(e) => setStudentForm({ ...studentForm, last_name_kr: e.target.value })}
                                        className={fieldInputClass}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Дата рождения</label>
                                    <input
                                        type="date"
                                        value={studentForm.date_of_birth}
                                        onChange={(e) => setStudentForm({ ...studentForm, date_of_birth: e.target.value })}
                                        className={fieldInputClass}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Пол</label>
                                    <CustomDropdown
                                        options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }]}
                                        value={studentForm.gender}
                                        onChange={(val) => setStudentForm({ ...studentForm, gender: val })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Национальность</label>
                                    <input
                                        type="text"
                                        value={studentForm.nationality}
                                        onChange={(e) => setStudentForm({ ...studentForm, nationality: e.target.value })}
                                        className={fieldInputClass}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Адрес</label>
                                    <input
                                        type="text"
                                        value={studentForm.address}
                                        onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
                                        className={fieldInputClass}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Телефон</label>
                                    <input
                                        type="text"
                                        value={studentForm.phone}
                                        onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                                        className={fieldInputClass}
                                    />
                                </div>
                            </div>

                            {status && (
                                <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
                                    status.type === 'success' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800' : 'bg-rose-950/40 text-rose-300 border-rose-900/60'
                                }`}>
                                    {status.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                                    <span>{status.message}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={status?.type === 'loading'}
                                className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition cursor-pointer mt-2 disabled:opacity-50"
                            >
                                Создать студента
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-xs text-slate-400">
                                Загрузите `.json` файл со структурой данных студентов или вставьте его текстом.
                            </p>

                            <input
                                type="file"
                                accept=".json"
                                onChange={handleFileUpload}
                                className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border file:border-slate-800 file:text-xs file:font-semibold file:bg-slate-900 file:text-slate-200 hover:file:bg-slate-800 cursor-pointer"
                            />

                            <textarea
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                                placeholder="Или вставьте массив JSON объектов..."
                                rows={6}
                                className={`${fieldInputClass} font-mono text-xs`}
                            />

                            {status && (
                                <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
                                    status.type === 'success' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800' : 'bg-rose-950/40 text-rose-300 border-rose-900/60'
                                }`}>
                                    {status.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                                    <span>{status.message}</span>
                                </div>
                            )}

                            <button
                                onClick={handleImportStudents}
                                disabled={!jsonInput.trim() || status?.type === 'loading'}
                                className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition disabled:opacity-40 cursor-pointer"
                            >
                                Импортировать в базу
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UsersTab;