/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/useAuth';

const STATUSES = {
    present: {
        label: 'Был',
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    },
    absent: {
        label: 'Н/Б',
        bg: 'bg-rose-50 text-brand-burgundy border-rose-200 font-bold'
    },
    late: {
        label: 'Опоздал',
        bg: 'bg-amber-50 text-amber-800 border-amber-200'
    },
    excused: {
        label: 'Уважительная',
        bg: 'bg-blue-50 text-brand-blue border-blue-200'
    },
};

const AttendanceJournal = () => {
    const { groupId } = useParams();
    const { user } = useAuth();

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [subject, setSubject] = useState('Веб-разработка');
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(false);

    const canEdit = user.role === 'admin' || user.role === 'teacher';

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/attendance/${groupId}`, {
                params: { date, subject },
            });
            setAttendance(response.data);
        } catch (err) {
            console.error('Ошибка загрузки посещаемости', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const test = async () => {
            await fetchAttendance();
        }

        test();
    }, [groupId, date, subject]);

    const handleStatusChange = async (studentId, status) => {
        if (!canEdit) return;

        try {
            await api.post('/attendance', {
                groupId,
                studentId,
                date,
                subject,
                status,
            });
            fetchAttendance(); // Перезагружаем актуальные данные
        } catch (err) {
            alert('Не удалось сохранить статус');
        }
    };

    const getStudentStatus = (studentId) => {
        const record = attendance.find((item) => item.studentId === studentId);
        return record ? record.status : null;
    };

    return (
        <div className="max-w-5xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6 text-slate-800">Журнал посещаемости</h1>

            {/* Фильтры по дате и предмету */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 flex flex-wrap gap-4 items-center">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Дата</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="px-3 py-1.5 border rounded-lg text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Предмет</label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="px-3 py-1.5 border rounded-lg text-sm"
                        placeholder="Название предмета"
                    />
                </div>
            </div>

            {/* Список отметки посещаемости */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Загрузка журнала...</div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                            <tr>
                                <th className="p-4">Студент (ID)</th>
                                <th className="p-4">Текущий статус</th>
                                {canEdit && <th className="p-4 text-right">Действия</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {/* Пример записи студента */}
                            {['student_1', 'student_2'].map((studentId) => {
                                const currentStatus = getStudentStatus(studentId);
                                return (
                                    <tr key={studentId} className="hover:bg-slate-50/50">
                                        <td className="p-4 font-medium text-slate-800">{studentId}</td>
                                        <td className="p-4">
                                            {currentStatus ? (
                                                <span
                                                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUSES[currentStatus]?.bg}`}
                                                >
                                                    {STATUSES[currentStatus]?.label}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 italic">Не отмечен</span>
                                            )}
                                        </td>
                                        {canEdit && (
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    {Object.entries(STATUSES).map(([statusKey, cfg]) => (
                                                        <button
                                                            key={statusKey}
                                                            onClick={() => handleStatusChange(studentId, statusKey)}
                                                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${currentStatus === statusKey
                                                                ? 'ring-2 ring-blue-500 border-transparent font-bold'
                                                                : 'bg-white hover:bg-slate-100'
                                                                }`}
                                                        >
                                                            {cfg.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AttendanceJournal;