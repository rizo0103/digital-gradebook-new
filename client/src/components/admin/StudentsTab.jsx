/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import api from '../../api/axiosInstance';
import CustomDropdown from '../ui/CustomDropdown';
import { UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';

const fieldInputClass = "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:bg-slate-900/50 transition-colors";

const StudentsTab = ({ groups }) => {
    const [studentMode, setStudentMode] = useState('manual');
    const [jsonInput, setJsonInput] = useState('');
    const [importStatus, setImportStatus] = useState(null);
    const [manualStatus, setManualStatus] = useState(null);

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

    const handleCreateStudentManual = async (e) => {
        e.preventDefault();
        try {
            setManualStatus({ type: 'loading', message: 'Создание студента...' });

            const payload = [{
                ...studentForm,
                id: studentForm.id ? Number(studentForm.id) : Date.now(),
                created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
            }];

            await api.post('/admin/import-students', { students: payload });

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

    return (
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
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${studentMode === 'manual' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        Вручную
                    </button>
                    <button
                        onClick={() => setStudentMode('import')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${studentMode === 'import' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
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
                                options={groups.map(g => ({ value: g.id, label: g.name }))}
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
                        <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${manualStatus.type === 'success' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800' : 'bg-rose-950/40 text-rose-300 border-rose-900/60'
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
                        <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${importStatus.type === 'success' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800' : 'bg-rose-950/40 text-rose-300 border-rose-900/60'
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
    );
};

export default StudentsTab;