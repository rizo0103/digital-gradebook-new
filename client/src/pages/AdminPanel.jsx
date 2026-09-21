/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import {
    Users, Calendar, BookOpen, Upload, UserPlus,
    CheckCircle2, AlertCircle, Clock, FileText
} from 'lucide-react';

const AdminPanel = () => {
    const [activeTab, setActiveTab] = useState('import'); // 'import' | 'groups' | 'schedule'

    // Данные для форм
    const [teachers, setTeachers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [jsonInput, setJsonInput] = useState('');
    const [importStatus, setImportStatus] = useState(null);

    // Состояние создания группы
    const [groupForm, setGroupForm] = useState({ name: '', category: 'language', teacherIds: [] });

    // Состояние расписания
    const [scheduleForm, setScheduleForm] = useState({
        groupId: '', subject: '', daysOfWeek: [], time: '14:00', teacherId: ''
    });

    const daysOptions = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    
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

        return () => {
            isMounted = false;
        };
    }, []);
    
    // 1. Загрузка/Импорт JSON файла
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

            const response = await api.post('/admin/import-students', { students: parsedData });
            setImportStatus({
                type: 'success',
                message: `${response.data.message}. Дефолтный пароль: studentPassword123`
            });
            setJsonInput('');
        } catch (err) {
            setImportStatus({
                type: 'error',
                message: err.response?.data?.message || 'Некорректный JSON формат файла'
            });
        }
    };

    // 2. Создание группы
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

    // 3. Создание расписания
    const handleCreateSchedule = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/schedule', scheduleForm);
            alert('Расписание сохранено!');
            setScheduleForm({ groupId: '', subject: '', daysOfWeek: [], time: '14:00', teacherId: '' });
        } catch (err) {
            alert('Ошибка при добавлении расписания');
        }
    };

    const toggleDay = (day) => {
        setScheduleForm((prev) => {
            const exists = prev.daysOfWeek.includes(day);
            return {
                ...prev,
                daysOfWeek: exists
                    ? prev.daysOfWeek.filter((d) => d !== day)
                    : [...prev.daysOfWeek, day]
            };
        });
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">

                {/* Шапка админки */}
                <div className="mb-8 border-b border-slate-800 pb-5">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                        Панель Администратора
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                        Управление студентами, группами, предметами и расписанием
                    </p>
                </div>

                {/* Навигационные табы */}
                <div className="flex flex-wrap gap-2 mb-8 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
                    <button
                        onClick={() => setActiveTab('import')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${activeTab === 'import' ? 'bg-[#0F4C9C] text-white shadow-lg shadow-[#0F4C9C]/30' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Upload className="w-4 h-4" /> Импорт Студентов (JSON)
                    </button>

                    <button
                        onClick={() => setActiveTab('groups')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${activeTab === 'groups' ? 'bg-[#0F4C9C] text-white shadow-lg shadow-[#0F4C9C]/30' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Users className="w-4 h-4" /> Создание Групп
                    </button>

                    <button
                        onClick={() => setActiveTab('schedule')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${activeTab === 'schedule' ? 'bg-[#0F4C9C] text-white shadow-lg shadow-[#0F4C9C]/30' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Calendar className="w-4 h-4" /> Расписание Уроков
                    </button>
                </div>

                {/* ТАБ 1: Импорт Студентов из JSON */}
                {activeTab === 'import' && (
                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8">
                        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                            <FileText className="text-[#0F4C9C]" /> Импорт Студентов с автоматическим Username
                        </h2>
                        <p className="text-xs text-slate-400 mb-6">
                            Загрузите `.json` файл со списком студентов в формате: <code className="text-rose-300">[{`{"fullName": "Иван Иванов", "email": "ivan@mail.com"}`}]</code>
                        </p>

                        <div className="space-y-4">
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleFileUpload}
                                className="block w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#0F4C9C]/20 file:text-[#0F4C9C] hover:file:bg-[#0F4C9C]/30 cursor-pointer"
                            />

                            <textarea
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                                placeholder="Или вставьте содержимое JSON вручную..."
                                rows={6}
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-[#0F4C9C]"
                            />

                            {importStatus && (
                                <div className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${importStatus.type === 'success' ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800' : 'bg-rose-950/40 text-rose-300 border border-rose-800'
                                    }`}>
                                    {importStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                    <span>{importStatus.message}</span>
                                </div>
                            )}

                            <button
                                onClick={handleImportStudents}
                                disabled={!jsonInput.trim()}
                                className="bg-[#0F4C9C] hover:bg-[#0B3B7A] text-white text-sm font-semibold px-6 py-3 rounded-2xl transition shadow-lg shadow-[#0F4C9C]/20 disabled:opacity-50 cursor-pointer"
                            >
                                Импортировать в базу
                            </button>
                        </div>
                    </div>
                )}

                {/* ТАБ 2: Создание Группы */}
                {activeTab === 'groups' && (
                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Users className="text-[#0F4C9C]" /> Добавление новой группы
                        </h2>

                        <form onSubmit={handleCreateGroup} className="space-y-5">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Название группы</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Например: Корейский Язык A1 или TOPIK II"
                                    value={groupForm.name}
                                    onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-sm text-slate-100 focus:outline-none focus:border-[#0F4C9C]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Категория группы</label>
                                <select
                                    value={groupForm.category}
                                    onChange={(e) => setGroupForm({ ...groupForm, category: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-sm text-slate-100 focus:outline-none focus:border-[#0F4C9C]"
                                >
                                    <option value="language">Курсы Языков</option>
                                    <option value="topik">Подготовка к TOPIK</option>
                                    <option value="other">Сторонний Предмет</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-[#0F4C9C] hover:bg-[#0B3B7A] text-white text-sm font-semibold py-3.5 rounded-2xl transition cursor-pointer shadow-lg shadow-[#0F4C9C]/20"
                            >
                                Создать группу
                            </button>
                        </form>
                    </div>
                )}

                {/* ТАБ 3: Создание Расписания */}
                {activeTab === 'schedule' && (
                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Calendar className="text-[#0F4C9C]" /> Создание расписания занятий
                        </h2>

                        <form onSubmit={handleCreateSchedule} className="space-y-5">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Выберите Группу</label>
                                <select
                                    value={scheduleForm.groupId}
                                    onChange={(e) => setScheduleForm({ ...scheduleForm, groupId: e.target.value })}
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-sm text-slate-100 focus:outline-none focus:border-[#0F4C9C]"
                                >
                                    <option value="">-- Не выбрано --</option>
                                    {groups.map((g) => (
                                        <option key={g.id} value={g.id}>{g.name} ({g.category})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Предмет / Урок</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Грамматика / Чтение"
                                    value={scheduleForm.subject}
                                    onChange={(e) => setScheduleForm({ ...scheduleForm, subject: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-sm text-slate-100 focus:outline-none focus:border-[#0F4C9C]"
                                />
                            </div>

                            {/* Выбор дней недели */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Дни проведения уроков</label>
                                <div className="flex flex-wrap gap-2">
                                    {daysOptions.map((day) => {
                                        const selected = scheduleForm.daysOfWeek.includes(day);
                                        return (
                                            <button
                                                type="button"
                                                key={day}
                                                onClick={() => toggleDay(day)}
                                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${selected
                                                        ? 'bg-[#0F4C9C] text-white border-[#0F4C9C]'
                                                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                                                    }`}
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Время проведения</label>
                                <input
                                    type="time"
                                    required
                                    value={scheduleForm.time}
                                    onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-sm text-slate-100 focus:outline-none focus:border-[#0F4C9C]"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-[#0F4C9C] hover:bg-[#0B3B7A] text-white text-sm font-semibold py-3.5 rounded-2xl transition cursor-pointer shadow-lg shadow-[#0F4C9C]/20"
                            >
                                Сохранить расписание
                            </button>
                        </form>
                    </div>
                )}

            </div>
        </div>
    );
};

export default AdminPanel;