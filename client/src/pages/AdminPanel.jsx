/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axiosInstance';
import {
    Users, Calendar, Upload, UserPlus,
    CheckCircle2, AlertCircle, FileText, ChevronDown, Check
} from 'lucide-react';

const CustomDropdown = ({ options, value, onChange, placeholder = "-- Выберите --" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const selectedOption = options.find((opt) => String(opt.value) === String(value));

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 flex items-center justify-between focus:outline-none focus:border-blue-500 transition-colors cursor-pointer text-left"
            >
                <span className={selectedOption ? "text-slate-100" : "text-slate-500"}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1.5 w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden py-1 max-h-60 overflow-y-auto">
                    {options.length === 0 ? (
                        <div className="px-4 py-2.5 text-xs text-slate-500">Нет доступных вариантов</div>
                    ) : (
                        options.map((opt) => {
                            const isSelected = String(opt.value) === String(value);
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full px-4 py-2.5 text-sm text-left flex items-center justify-between transition cursor-pointer ${
                                        isSelected
                                            ? 'bg-blue-600/20 text-blue-400 font-medium'
                                            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                                    }`}
                                >
                                    <span>{opt.label}</span>
                                    {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

const AdminPanel = () => {
    const [activeTab, setActiveTab] = useState('students');
    const [studentMode, setStudentMode] = useState('manual');

    const [teachers, setTeachers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [jsonInput, setJsonInput] = useState('');
    const [importStatus, setImportStatus] = useState(null);

    // Расширенная форма создания студента
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
    const [manualStatus, setManualStatus] = useState(null);

    const [groupForm, setGroupForm] = useState({ name: '', category: 'language', teacherIds: [] });

    // Расширенная форма расписания с датами периода
    const [scheduleForm, setScheduleForm] = useState({
        groupId: '',
        subject: '',
        startDate: '',
        endDate: '',
        daysOfWeek: [], // ['Monday', 'Wednesday', ...] или ['Пн', 'Ср', ...]
        time: '14:00',
        teacherId: ''
    });

    const daysOptions = [
        { id: 1, label: 'Пн', value: 'Monday' },
        { id: 2, label: 'Вт', value: 'Tuesday' },
        { id: 3, label: 'Ср', value: 'Wednesday' },
        { id: 4, label: 'Чт', value: 'Thursday' },
        { id: 5, label: 'Пт', value: 'Friday' },
        { id: 6, label: 'Сб', value: 'Saturday' },
        { id: 0, label: 'Вс', value: 'Sunday' }
    ];

    const categoryOptions = [
        { value: 'language', label: 'Курсы Языков' },
        { value: 'topik', label: 'Подготовка к TOPIK' },
        { value: 'other', label: 'Сторонний Предмет' }
    ];

    const fetchInitialData = async () => {
        try {
            const teachersRes = await api.get('/admin/users?role=teacher');
            const groupsRes = await api.get('/groups');
            setTeachers(teachersRes.data);
            setGroups(groupsRes.data);
        } catch (err) {
            console.error('Ошибка загрузки данных:', err);
        }
    };

    useEffect(() => {
        let isMounted = true;
        const loadInitialData = async () => {
            try {
                const teachersRes = await api.get('/admin/users?role=teacher');
                const groupsRes = await api.get('/groups');
                if (isMounted) {
                    setTeachers(teachersRes.data);
                    setGroups(groupsRes.data);
                }
            } catch (err) {
                console.error('Ошибка загрузки данных:', err);
            }
        };
        loadInitialData();
        return () => { isMounted = false; };
    }, []);

    // 1. Ручное создание студента
    const handleCreateStudentManual = async (e) => {
        e.preventDefault();
        try {
            setManualStatus({ type: 'loading', message: 'Создание студента...' });

            const payload = [{
                ...studentForm,
                id: studentForm.id ? Number(studentForm.id) : Date.now(),
                created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
            }];

            const response = await api.post('/admin/import-students', { students: payload });

            setManualStatus({
                type: 'success',
                message: `Студент ${studentForm.name_en || studentForm.name_tj} успешно добавлен!`
            });

            setStudentForm({
                id: '', name_tj: '', last_name_tj: '', name_en: '', last_name_en: '',
                name_kr: '', last_name_kr: '', date_of_birth: '', address: '',
                gender: 'Male', nationality: 'Tajikistan', passportID: '', email: '',
                phone: '', student_groups: [], time_lesson: '14:00'
            });
        } catch (err) {
            setManualStatus({
                type: 'error',
                message: err.response?.data?.message || 'Ошибка при создании студента'
            });
        }
    };

    // 2. Импорт JSON
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => setJsonInput(event.target.result);
            reader.readAsText(file);
        }
    };

    const handleImportStudents = async () => {
        try {
            setImportStatus({ type: 'loading', message: 'Импортируем студентов...' });
            const parsedData = JSON.parse(jsonInput);

            // Приводим ID к числу и форматируем структуры
            const formattedData = (Array.isArray(parsedData) ? parsedData : [parsedData]).map((s) => ({
                ...s,
                id: Number(s.id),
                student_groups: Array.isArray(s.student_groups) ? s.student_groups : [s.student_groups]
            }));

            const response = await api.post('/admin/import-students', { students: formattedData });
            setImportStatus({
                type: 'success',
                message: `${response.data.message || 'Студенты успешно импортированы!'}`
            });
            setJsonInput('');
        } catch (err) {
            setImportStatus({
                type: 'error',
                message: err.response?.data?.message || 'Некорректный JSON формат'
            });
        }
    };

    // 3. Создание группы
    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/groups', groupForm);
            alert('Группа успешно создана!');
            setGroupForm({ name: '', category: 'language', teacherIds: [] });
            fetchInitialData();
        } catch (err) {
            alert('Ошибка при создании группы');
        }
    };

    // 4. Создание расписания c датами
    const handleCreateSchedule = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/schedule', scheduleForm);
            alert('Расписание и даты занятий успешно сгенерированы!');
            setScheduleForm({
                groupId: '', subject: '', startDate: '', endDate: '',
                daysOfWeek: [], time: '14:00', teacherId: ''
            });
        } catch (err) {
            alert('Ошибка при добавлении расписания');
        }
    };

    const toggleDay = (dayValue) => {
        setScheduleForm((prev) => {
            const exists = prev.daysOfWeek.includes(dayValue);
            return {
                ...prev,
                daysOfWeek: exists
                    ? prev.daysOfWeek.filter((d) => d !== dayValue)
                    : [...prev.daysOfWeek, dayValue]
            };
        });
    };

    const fieldInputClass = "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:bg-slate-900/50 transition-colors";

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">

                <div className="mb-8 border-b border-slate-800/80 pb-5">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                        Панель Администратора
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                        Управление студентами, группами и генерацией дат расписания
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 mb-8 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80">
                    <button
                        onClick={() => setActiveTab('students')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                            activeTab === 'students' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <UserPlus className="w-4 h-4" /> Студенты
                    </button>

                    <button
                        onClick={() => setActiveTab('groups')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                            activeTab === 'groups' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Users className="w-4 h-4" /> Создание Групп
                    </button>

                    <button
                        onClick={() => setActiveTab('schedule')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                            activeTab === 'schedule' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Calendar className="w-4 h-4" /> Расписание Уроков
                    </button>
                </div>

                {/* ТАБ 1: Студенты */}
                {activeTab === 'students' && (
                    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8">
                        <div className="flex items-center justify-between flex-wrap gap-4 mb-6 border-b border-slate-800 pb-4">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <UserPlus className="w-5 h-5 text-blue-500" /> Управление студентами
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">Создание по точной структуре или импорт JSON</p>
                            </div>

                            <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                                <button
                                    onClick={() => setStudentMode('manual')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                        studentMode === 'manual' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    Вручную
                                </button>
                                <button
                                    onClick={() => setStudentMode('import')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                        studentMode === 'import' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
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
                                            options={groups.map(g => ({ value: g.name, label: g.name }))}
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

                                {manualStatus && (
                                    <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
                                        manualStatus.type === 'success' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800' : 'bg-rose-950/40 text-rose-300 border-rose-900/60'
                                    }`}>
                                        {manualStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                                        <span>{manualStatus.message}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition cursor-pointer mt-2"
                                >
                                    Создать студента
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-xs text-slate-400">
                                    Загрузите `.json` файл со структурой данных студента. Поле ID будет преобразовано в число.
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

                                {importStatus && (
                                    <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
                                        importStatus.type === 'success' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800' : 'bg-rose-950/40 text-rose-300 border-rose-900/60'
                                    }`}>
                                        {importStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                                        <span>{importStatus.message}</span>
                                    </div>
                                )}

                                <button
                                    onClick={handleImportStudents}
                                    disabled={!jsonInput.trim()}
                                    className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition disabled:opacity-40 cursor-pointer"
                                >
                                    Импортировать в базу
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ТАБ 2: Группы */}
                {activeTab === 'groups' && (
                    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 max-w-xl">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-500" /> Добавление новой группы
                        </h2>

                        <form onSubmit={handleCreateGroup} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase mb-1.5">Название группы</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Например: 초급 2A-1"
                                    value={groupForm.name}
                                    onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                                    className={fieldInputClass}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase mb-1.5">Категория группы</label>
                                <CustomDropdown
                                    options={categoryOptions}
                                    value={groupForm.category}
                                    onChange={(val) => setGroupForm({ ...groupForm, category: val })}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-3 rounded-xl transition cursor-pointer mt-2"
                            >
                                Создать группу
                            </button>
                        </form>
                    </div>
                )}

                {/* ТАБ 3: Расписание с Датами */}
                {activeTab === 'schedule' && (
                    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 max-w-xl">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-500" /> Генерация расписания семестра
                        </h2>

                        <form onSubmit={handleCreateSchedule} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase mb-1.5">Выберите Группу</label>
                                <CustomDropdown
                                    options={groups.map((g) => ({ value: g.id, label: `${g.name} (${g.category})` }))}
                                    value={scheduleForm.groupId}
                                    onChange={(val) => setScheduleForm({ ...scheduleForm, groupId: val })}
                                    placeholder="-- Выберите группу --"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase mb-1.5">Дата начала курса</label>
                                    <input
                                        type="date"
                                        required
                                        value={scheduleForm.startDate}
                                        onChange={(e) => setScheduleForm({ ...scheduleForm, startDate: e.target.value })}
                                        className={fieldInputClass}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase mb-1.5">Дата окончания курса</label>
                                    <input
                                        type="date"
                                        required
                                        value={scheduleForm.endDate}
                                        onChange={(e) => setScheduleForm({ ...scheduleForm, endDate: e.target.value })}
                                        className={fieldInputClass}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase mb-1.5">Предмет / Урок</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Корейский язык / Грамматика"
                                    value={scheduleForm.subject}
                                    onChange={(e) => setScheduleForm({ ...scheduleForm, subject: e.target.value })}
                                    className={fieldInputClass}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase mb-1.5">Дни проведения уроков</label>
                                <div className="flex flex-wrap gap-2">
                                    {daysOptions.map((day) => {
                                        const selected = scheduleForm.daysOfWeek.includes(day.value);
                                        return (
                                            <button
                                                type="button"
                                                key={day.id}
                                                onClick={() => toggleDay(day.value)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                                                    selected
                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                                                }`}
                                            >
                                                {day.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 uppercase mb-1.5">Время проведения</label>
                                <input
                                    type="time"
                                    required
                                    value={scheduleForm.time}
                                    onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                                    className={fieldInputClass}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-3 rounded-xl transition cursor-pointer mt-2"
                            >
                                Создать расписание семестра
                            </button>
                        </form>
                    </div>
                )}

            </div>
        </div>
    );
};

export default AdminPanel;