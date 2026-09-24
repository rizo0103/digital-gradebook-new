/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosInstance';
import CustomDropdown from '../ui/CustomDropdown';
import { UserPlus, CheckCircle2, AlertCircle, Shield, GraduationCap, School } from 'lucide-react';

const fieldInputClass = "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:bg-slate-900/50 transition-colors";

const UsersTab = ({ groups = [] }) => {
    const { t } = useTranslation();
    const [role, setRole] = useState('student');
    const [studentMode, setStudentMode] = useState('manual');
    const [jsonInput, setJsonInput] = useState('');
    const [status, setStatus] = useState(null);

    const [simpleForm, setSimpleForm] = useState({
        username: '',
        fullName: '',
        email: '',
        password: ''
    });

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

    const handleRoleChange = (newRole) => {
        setRole(newRole);
        setStatus(null);
    };

    const handleCreateSimpleUser = async (e) => {
        e.preventDefault();
        setStatus({
            type: 'loading',
            message: t('admin.usersTab.loadingCreateUser', { role: role === 'admin' ? t('admin.usersTab.admin') : t('admin.usersTab.teacher') })
        });

        try {
            const payload = {
                username: simpleForm.username.trim(),
                fullName: simpleForm.fullName.trim(),
                email: simpleForm.email.trim(),
                password: simpleForm.password,
                role: role
            };

            await api.post('/auth/register', payload);

            setStatus({
                type: 'success',
                message: t('admin.usersTab.createdUserSuccess', {
                    role: role === 'admin' ? t('admin.usersTab.admin') : t('admin.usersTab.teacher'),
                    name: simpleForm.fullName || simpleForm.username
                })
            });

            setSimpleForm({ username: '', fullName: '', email: '', password: '' });
        } catch (err) {
            setStatus({
                type: 'error',
                message: err.response?.data?.message || t('admin.usersTab.userCreateError')
            });
        }
    };

    const showStudentCredentials = (students = []) => {
        const credentials = students
            .map((student) => `• ${student.username} / ${student.password}`)
            .join('\n');

        if (credentials) {
            window.alert(t('admin.usersTab.studentCredentialsAlert', { credentials }));
        }
    };

    const handleCreateStudentManual = async (e) => {
        e.preventDefault();
        setStatus({ type: 'loading', message: t('admin.usersTab.loadingCreateStudent') });

        try {
            const studentPayload = {
                ...studentForm,
                role: 'student',
                id: studentForm.id ? Number(studentForm.id) : Date.now(),
                student_groups: Array.isArray(studentForm.student_groups) ? studentForm.student_groups : [studentForm.student_groups],
                created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
            };

            const response = await api.post('/admin/import-students', { students: [studentPayload] });
            const createdStudents = response.data?.students || [];

            if (createdStudents.length > 0) {
                showStudentCredentials(createdStudents);
            }

            setStatus({
                type: 'success',
                message: t('admin.usersTab.createdStudentSuccess', {
                    name: studentForm.name_en || studentForm.name_tj || 'user'
                })
            });

            setStudentForm({
                id: '', name_tj: '', last_name_tj: '', name_en: '', last_name_en: '',
                name_kr: '', last_name_kr: '', date_of_birth: '', address: '',
                gender: 'Male', nationality: 'Tajikistan', passportID: '', email: '',
                phone: '', student_groups: [], time_lesson: '14:00'
            });
        } catch (err) {
            setStatus({
                type: 'error',
                message: err.response?.data?.message || t('admin.usersTab.studentCreateError')
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
        setStatus({ type: 'loading', message: t('admin.usersTab.loadingImportStudents') });
        try {
            const parsedData = JSON.parse(jsonInput);

            const formattedData = (Array.isArray(parsedData) ? parsedData : [parsedData]).map((s) => ({
                ...s,
                role: 'student',
                id: s.id ? Number(s.id) : Date.now(),
                student_groups: Array.isArray(s.student_groups) ? s.student_groups : (s.student_groups ? [s.student_groups] : [])
            }));

            const response = await api.post('/admin/import-students', { students: formattedData });
            const createdStudents = response.data?.students || [];

            if (createdStudents.length > 0) {
                showStudentCredentials(createdStudents);
            }

            setStatus({
                type: 'success',
                message: response.data?.message || t('admin.usersTab.importedStudentsSuccess', { count: formattedData.length })
            });

            setJsonInput('');
        } catch (err) {
            setStatus({
                type: 'error',
                message: err.response?.data?.message || (err instanceof SyntaxError ? t('admin.usersTab.invalidJson') : t('admin.usersTab.importStudentsError'))
            });
        }
    };

    return (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-blue-500" /> {t('admin.usersTab.title')}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">{t('admin.usersTab.subtitle')}</p>
                </div>

                <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                    <button type="button" onClick={() => handleRoleChange('student')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${role === 'student' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                        <GraduationCap className="w-3.5 h-3.5" /> {t('admin.usersTab.student')}
                    </button>
                    <button type="button" onClick={() => handleRoleChange('teacher')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${role === 'teacher' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                        <School className="w-3.5 h-3.5" /> {t('admin.usersTab.teacher')}
                    </button>
                    <button type="button" onClick={() => handleRoleChange('admin')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${role === 'admin' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                        <Shield className="w-3.5 h-3.5" /> {t('admin.usersTab.admin')}
                    </button>
                </div>
            </div>

            {(role === 'admin' || role === 'teacher') && (
                <form onSubmit={handleCreateSimpleUser} className="space-y-4 max-w-2xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 uppercase mb-1">{t('admin.usersTab.username')}</label>
                            <input type="text" required placeholder="e.g. john_doe" value={simpleForm.username} onChange={(e) => setSimpleForm({ ...simpleForm, username: e.target.value })} className={fieldInputClass} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 uppercase mb-1">{t('admin.usersTab.fullName')}</label>
                            <input type="text" required placeholder="e.g. John Doe" value={simpleForm.fullName} onChange={(e) => setSimpleForm({ ...simpleForm, fullName: e.target.value })} className={fieldInputClass} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 uppercase mb-1">{t('admin.usersTab.email')}</label>
                            <input type="email" required placeholder="email@example.com" value={simpleForm.email} onChange={(e) => setSimpleForm({ ...simpleForm, email: e.target.value })} className={fieldInputClass} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 uppercase mb-1">{t('admin.usersTab.password')}</label>
                            <input type="password" required placeholder="••••••••" value={simpleForm.password} onChange={(e) => setSimpleForm({ ...simpleForm, password: e.target.value })} className={fieldInputClass} />
                        </div>
                    </div>

                    {status && (
                        <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${status.type === 'success' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800' : 'bg-rose-950/40 text-rose-300 border-rose-900/60'}`}>
                            {status.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                            <span>{status.message}</span>
                        </div>
                    )}

                    <button type="submit" disabled={status?.type === 'loading'} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition cursor-pointer mt-2 disabled:opacity-50">
                        {t('admin.usersTab.createUser', { role: role === 'admin' ? t('admin.usersTab.admin') : t('admin.usersTab.teacher') })}
                    </button>
                </form>
            )}

            {role === 'student' && (
                <div>
                    <div className="flex justify-end mb-4">
                        <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                            <button type="button" onClick={() => setStudentMode('manual')} className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${studentMode === 'manual' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                                {t('admin.usersTab.manual')}
                            </button>
                            <button type="button" onClick={() => setStudentMode('import')} className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${studentMode === 'import' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                                {t('admin.usersTab.jsonImport')}
                            </button>
                        </div>
                    </div>

                    {studentMode === 'manual' ? (
                        <form onSubmit={handleCreateStudentManual} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase mb-1">{t('admin.usersTab.idNumber')}</label>
                                    <input type="number" placeholder="Авто / Напр. 97" value={studentForm.id} onChange={(e) => setStudentForm({ ...studentForm, id: e.target.value })} className={fieldInputClass} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase mb-1">{t('admin.usersTab.groupStudy')}</label>
                                    <CustomDropdown
                                        options={groups.map(g => ({ value: g.name || g.id, label: g.name }))}
                                        value={studentForm.student_groups[0] || ''}
                                        onChange={(val) => setStudentForm({ ...studentForm, student_groups: [val] })}
                                        placeholder={t('admin.usersTab.chooseGroup')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 uppercase mb-1">{t('admin.usersTab.lessonTime')}</label>
                                    <input type="time" value={studentForm.time_lesson} onChange={(e) => setStudentForm({ ...studentForm, time_lesson: e.target.value })} className={fieldInputClass} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div><label className="block text-xs font-medium text-slate-400 uppercase mb-1">{t('admin.usersTab.nameTj')}</label><input type="text" value={studentForm.name_tj} onChange={(e) => setStudentForm({ ...studentForm, name_tj: e.target.value })} className={fieldInputClass} /></div>
                                <div><label className="block text-xs font-medium text-slate-400 uppercase mb-1">{t('admin.usersTab.lastNameTj')}</label><input type="text" value={studentForm.last_name_tj} onChange={(e) => setStudentForm({ ...studentForm, last_name_tj: e.target.value })} className={fieldInputClass} /></div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div><label className="block text-xs font-medium text-slate-400 uppercase mb-1">{t('admin.usersTab.nameEn')}</label><input type="text" required value={studentForm.name_en} onChange={(e) => setStudentForm({ ...studentForm, name_en: e.target.value })} className={fieldInputClass} /></div>
                                <div><label className="block text-xs font-medium text-slate-400 uppercase mb-1">{t('admin.usersTab.lastNameEn')}</label><input type="text" required value={studentForm.last_name_en} onChange={(e) => setStudentForm({ ...studentForm, last_name_en: e.target.value })} className={fieldInputClass} /></div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div><label className="block text-xs font-medium text-slate-400 uppercase mb-1">{t('admin.usersTab.nameKr')}</label><input type="text" value={studentForm.name_kr} onChange={(e) => setStudentForm({ ...studentForm, name_kr: e.target.value })} className={fieldInputClass} /></div>
                                <div><label className="block text-xs font-medium text-slate-400 uppercase mb-1">{t('admin.usersTab.lastNameKr')}</label><input type="text" value={studentForm.last_name_kr} onChange={(e) => setStudentForm({ ...studentForm, last_name_kr: e.target.value })} className={fieldInputClass} /></div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div><label className="block text-xs font-medium text-slate-400 uppercase mb-1">{t('admin.usersTab.dateOfBirth')}</label><input type="date" value={studentForm.date_of_birth} onChange={(e) => setStudentForm({ ...studentForm, date_of_birth: e.target.value })} className={fieldInputClass} /></div>
                                <div><label className="block text-xs font-medium text-slate-400 uppercase mb-1">{t('admin.usersTab.gender')}</label><CustomDropdown options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }]} value={studentForm.gender} onChange={(val) => setStudentForm({ ...studentForm, gender: val })} /></div>
                                <div><label className="block text-xs font-medium text-slate-400 uppercase mb-1">{t('admin.usersTab.nationality')}</label><input type="text" value={studentForm.nationality} onChange={(e) => setStudentForm({ ...studentForm, nationality: e.target.value })} className={fieldInputClass} /></div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div><label className="block text-xs font-medium text-slate-400 uppercase mb-1">{t('admin.usersTab.address')}</label><input type="text" value={studentForm.address} onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })} className={fieldInputClass} /></div>
                                <div><label className="block text-xs font-medium text-slate-400 uppercase mb-1">{t('admin.usersTab.phone')}</label><input type="text" value={studentForm.phone} onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })} className={fieldInputClass} /></div>
                            </div>

                            {status && (
                                <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${status.type === 'success' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800' : 'bg-rose-950/40 text-rose-300 border-rose-900/60'}`}>
                                    {status.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                                    <span>{status.message}</span>
                                </div>
                            )}

                            <button type="submit" disabled={status?.type === 'loading'} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition cursor-pointer mt-2 disabled:opacity-50">{t('admin.usersTab.createStudent')}</button>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-xs text-slate-400">{t('admin.usersTab.uploadJson')}</p>
                            <input type="file" accept=".json" onChange={handleFileUpload} className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border file:border-slate-800 file:text-xs file:font-semibold file:bg-slate-900 file:text-slate-200 hover:file:bg-slate-800 cursor-pointer" />
                            <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} placeholder={t('admin.usersTab.placeholderJson')} rows={6} className={`${fieldInputClass} font-mono text-xs`} />

                            {status && (
                                <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${status.type === 'success' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800' : 'bg-rose-950/40 text-rose-300 border-rose-900/60'}`}>
                                    {status.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                                    <span>{status.message}</span>
                                </div>
                            )}

                            <button onClick={handleImportStudents} disabled={!jsonInput.trim() || status?.type === 'loading'} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition disabled:opacity-40 cursor-pointer">{t('admin.usersTab.importDatabase')}</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UsersTab;