import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/useAuth';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertCircle } from 'lucide-react';
import CustomDropdown from '../components/ui/CustomDropdown';

const attendanceOrder = ['present', 'late', 'absent'];
const attendanceLabels = {
    present: 'present',
    late: 'late',
    absent: 'absent'
};
const attendanceShort = {
    present: 'Б',
    late: 'О',
    absent: 'Н'
};

const getValidateLocale = (lang) => {
    const localeMap = {
        'kr': "ko-KR",
        'ko': "ko-KR",
        'ru': "ru-RU",
        'en': "en-US",
        'tj': "tg-TJ",
        'tg': "tg-TJ",
    };

    return localeMap[lang?.toLowerCase()] || lang || 'ru-RU';
};


const normalizeAttendanceStatus = (status) => {
    const normalized = String(status || '').toLowerCase();
    if (['present', 'was', 'came', 'attended'].includes(normalized)) return 'present';
    if (['late', 'delayed', 'tardy', 'opozdal'].includes(normalized)) return 'late';
    if (['absent', 'not_present', 'notpresent', 'missed', 'was_not', 'wasnt', 'notwas', 'not_was'].includes(normalized)) return 'absent';
    return 'absent';
};

const statusFor = (attendance, studentId, lesson) => {
    const key = `${String(studentId)}:${String(lesson.date)}:${String(lesson.subject || '')}`;
    return normalizeAttendanceStatus(attendance[key]);
};

const AttendanceJournal = () => {
    const { t, i18n } = useTranslation();
    const currentLang = useMemo(() => getValidateLocale(i18n.language), [i18n.language]);

    const { groupId } = useParams();
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');

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
                    const key = `${String(record.studentId)}:${String(record.date)}:${String(record.subject || '')}`;
                    nextAttendance[key] = normalizeAttendanceStatus(record.status);
                });

                const sortedLessons = lessonsRes.data.sort((a, b) => a.date.localeCompare(b.date));
                const monthList = [...new Set(sortedLessons.map((lesson) => lesson.date.slice(0, 7)))].sort();

                setStudents(studentsRes.data);
                setLessons(sortedLessons);
                setAttendance(nextAttendance);

                // Определение текущего месяца в формате YYYY-MM
                const today = new Date();
                const nowMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

                if (monthList.includes(nowMonth)) {
                    setSelectedMonth(nowMonth); // Выбираем текущий месяц, если в нём есть уроки
                } else if (monthList.length > 0) {
                    setSelectedMonth(monthList[monthList.length - 1]); // Иначе последний доступный
                } else {
                    setSelectedMonth('');
                }
            } catch (err) {
                if (!cancelled) setError(err.response?.data?.message || t('journal.cancelled'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchJournalData();
        return () => { cancelled = true; };
    }, [groupId, t]);

    const availableMonths = useMemo(() => {
        const months = [...new Set(lessons.map((lesson) => lesson.date.slice(0, 7)))];
        return months.sort();
    }, [lessons]);

    // Варианты для CustomDropdown с локализацией названий месяцев
    const monthOptions = useMemo(() => {
        return availableMonths.map((month) => {
            const dateObj = new Date(`${month}-01T00:00:00`);
            const label = dateObj.toLocaleDateString(currentLang, { month: 'long', year: 'numeric' });
            // Делаем первую букву заглавной
            const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);
            return {
                value: month,
                label: formattedLabel
            };
        });
    }, [availableMonths, currentLang]);

    const filteredLessons = useMemo(() => {
        if (!selectedMonth) return lessons;
        return lessons.filter((lesson) => lesson.date.startsWith(selectedMonth));
    }, [lessons, selectedMonth]);

    const lessonCount = useMemo(() => filteredLessons.length, [filteredLessons]);

    const cycleStatus = (currentStatus) => {
        const currentIndex = attendanceOrder.indexOf(currentStatus);
        const nextIndex = (currentIndex + 1) % attendanceOrder.length;
        return attendanceOrder[nextIndex];
    };

    const toggleAttendance = async (studentId, lesson) => {
        if (!canEdit) return;

        const key = `${String(studentId)}:${String(lesson.date)}:${String(lesson.subject || '')}`;
        const currentStatus = statusFor(attendance, studentId, lesson);
        const nextStatus = cycleStatus(currentStatus);

        setAttendance((current) => ({ ...current, [key]: nextStatus }));

        try {
            await api.post('/attendance', {
                groupId: String(groupId),
                studentId: String(studentId),
                date: String(lesson.date),
                subject: String(lesson.subject || ''),
                status: nextStatus
            });
        } catch (err) {
            setAttendance((current) => ({ ...current, [key]: currentStatus }));
            setError(err.response?.data?.message || t('journal.cantSave'));
        }
    };

    if (loading) {
        return (
            <div className="min-h-[100vh] bg-slate-950 flex items-center justify-center p-4">
                <Loader2 className="w-7 h-7 text-[#0F4C9C] animate-spin mr-2" />
                <span className="text-slate-300 font-medium text-sm sm:text-base tracking-wide">
                    {t('journal.loading')}
                </span>
            </div>
        );
    }

    if (error && students.length === 0) {
        return (
            <div className="min-h-[80vh] bg-slate-950 flex items-center justify-center p-4">
                <div className="flex flex-col items-center text-center max-w-md bg-rose-950/20 border border-rose-900/50 backdrop-blur-md px-6 py-6 rounded-2xl shadow-xl shadow-black/50">
                    <AlertCircle className="w-10 h-10 text-rose-400 mb-2 shrink-0" />
                    <h3 className="text-base font-semibold text-rose-200 mb-1">{t('journal.error')}</h3>
                    <p className="text-xs sm:text-sm text-rose-300/80 leading-relaxed">
                        {error}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
                    <h1 className="text-xl sm:text-2xl font-bold">{t('journal.title')}</h1>
                    <div className="flex items-center gap-3">
                        {availableMonths.length > 0 && (
                            <div className="flex items-center gap-2 text-xs text-slate-300 min-w-[180px] sm:min-w-[200px]">
                                <span className="shrink-0">{t('journal.month')}:</span>
                                <CustomDropdown
                                    options={monthOptions}
                                    value={selectedMonth}
                                    onChange={setSelectedMonth}
                                    placeholder={t('journal.selectMonth') || "-- Месяц --"}
                                    buttonClassName="px-3 py-1.5 text-xs sm:text-sm"
                                />
                            </div>
                        )}
                        <span className="text-xs text-slate-400 whitespace-nowrap">{t('journal.lessons')}: {lessonCount}</span>
                    </div>
                </div>
                {error && <div className="mb-4 p-3 rounded-xl border border-rose-800 bg-rose-950/40 text-rose-300 text-sm">{error}</div>}

                {filteredLessons.length === 0 ? (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-slate-400">
                        {t('journal.noLessons')}
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-800">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-900 border-b border-slate-800 text-xs text-slate-400">
                                    <th className="p-3 sticky left-0 bg-slate-900">{t('journal.student')}</th>
                                    {filteredLessons.map((lesson) => (
                                        <th key={lesson.id || `${lesson.date}-${lesson.subject}`} className="p-3 text-center min-w-[82px]">
                                            <div className="font-medium text-slate-300">
                                                {new Date(`${lesson.date}T00:00:00`).toLocaleDateString(currentLang, { day: 'numeric', month: 'numeric' })}
                                            </div>
                                            <div className="text-[10px] uppercase text-slate-500 mt-1">
                                                {new Date(`${lesson.date}T00:00:00`).toLocaleDateString(currentLang, { weekday: 'short' })}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student) => (
                                    <tr key={student.id} className="border-b border-slate-800/50 hover:bg-slate-900/30">
                                        <td className="p-3 font-medium text-sm text-slate-200 whitespace-nowrap sticky left-0 bg-slate-950">
                                            {student.fullName || student.id}
                                        </td>
                                        {filteredLessons.map((lesson) => {
                                            const status = statusFor(attendance, student.id, lesson);
                                            const statusColor = status === 'present' ? 'bg-emerald-600 text-white' : status === 'late' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300';
                                            const statusLabel = t(`journal.${attendanceLabels[status] || 'absent'}`);
                                            return (
                                                <td key={`${student.id}-${lesson.id || lesson.date}-${lesson.subject || ''}`} className="p-3 text-center">
                                                    <button
                                                        type="button"
                                                        disabled={!canEdit}
                                                        onClick={() => toggleAttendance(student.id, lesson)}
                                                        className={`w-9 h-9 rounded-lg text-xs font-bold ${statusColor} ${canEdit ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                                                        title={`${statusLabel} · ${lesson.subject || t('journal.lesson')}`}
                                                    >
                                                        {t(`journal.${attendanceShort[status]}`) || 'Н'}
                                                    </button>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendanceJournal;