import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/useAuth';

const statusFor = (attendance, studentId, lesson) =>
    attendance[`${studentId}:${lesson.date}:${lesson.subject || ''}`] || 'absent';

const AttendanceJournal = () => {
    const { groupId } = useParams();
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const canEdit = user?.role === 'admin' || user?.role === 'teacher';

    useEffect(() => {
        let cancelled = false;
        const fetchJournalData = async () => {
            try {
                setLoading(true);
                setError('');
                const [studentsRes, lessonsRes, attendanceRes] = await Promise.all([
                    api.get(`/groups/${groupId}/students`),
                    api.get(`/groups/${groupId}/lessons`),
                    api.get(`/attendance/${groupId}`)
                ]);
                if (cancelled) return;

                const nextAttendance = {};
                attendanceRes.data.forEach((record) => {
                    nextAttendance[`${record.studentId}:${record.date}:${record.subject || ''}`] = record.status;
                });
                setStudents(studentsRes.data);
                setLessons(lessonsRes.data);
                setAttendance(nextAttendance);
            } catch (err) {
                if (!cancelled) setError(err.response?.data?.message || 'Не удалось загрузить журнал');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchJournalData();
        return () => { cancelled = true; };
    }, [groupId]);

    const lessonCount = useMemo(() => lessons.length, [lessons]);

    const toggleAttendance = async (studentId, lesson) => {
        if (!canEdit) return;
        const key = `${studentId}:${lesson.date}:${lesson.subject || ''}`;
        const nextStatus = statusFor(attendance, studentId, lesson) === 'present' ? 'absent' : 'present';
        setAttendance((current) => ({ ...current, [key]: nextStatus }));
        try {
            await api.post('/attendance', {
                groupId,
                studentId,
                date: lesson.date,
                subject: lesson.subject || '',
                status: nextStatus
            });
        } catch (err) {
            setAttendance((current) => ({ ...current, [key]: nextStatus === 'present' ? 'absent' : 'present' }));
            setError(err.response?.data?.message || 'Не удалось сохранить отметку');
        }
    };

    if (loading) return <div className="p-8 text-slate-400">Загрузка журнала...</div>;
    if (error && students.length === 0) return <div className="p-8 text-rose-300">{error}</div>;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-5">
                    <h1 className="text-xl sm:text-2xl font-bold">Журнал посещаемости</h1>
                    <span className="text-xs text-slate-400">Занятий: {lessonCount}</span>
                </div>
                {error && <div className="mb-4 p-3 rounded-xl border border-rose-800 bg-rose-950/40 text-rose-300 text-sm">{error}</div>}
                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900 border-b border-slate-800 text-xs text-slate-400">
                                <th className="p-3 sticky left-0 bg-slate-900">Студент</th>
                                {lessons.map((lesson) => (
                                    <th key={lesson.id} className="p-3 text-center min-w-[70px]">
                                        {new Date(`${lesson.date}T00:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'numeric' })}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student) => (
                                <tr key={student.id} className="border-b border-slate-800/50 hover:bg-slate-900/30">
                                    <td className="p-3 font-medium text-sm text-slate-200 whitespace-nowrap sticky left-0 bg-slate-950">
                                        {student.name_en || student.fullName} {student.last_name_en}
                                    </td>
                                    {lessons.map((lesson) => {
                                        const status = statusFor(attendance, student.id, lesson);
                                        return (
                                            <td key={lesson.id} className="p-3 text-center">
                                                <button
                                                    type="button"
                                                    disabled={!canEdit}
                                                    onClick={() => toggleAttendance(student.id, lesson)}
                                                    className={`w-8 h-8 rounded-lg text-xs font-bold ${status === 'present' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'} ${canEdit ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                                                    title={status}
                                                >
                                                    {status === 'present' ? '+' : '-'}
                                                </button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AttendanceJournal;
