/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { Trash2, RefreshCw } from 'lucide-react';
import api from '../../api/axiosInstance';
import CustomDropdown from '../ui/CustomDropdown';

const ScheduleManager = ({ groups, refreshKey = 0 }) => {
    const [groupId, setGroupId] = useState('');
    const [lessons, setLessons] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const loadLessons = async () => {
        if (!groupId) {
            setLessons([]);
            return;
        }

        setLoading(true);

        try {
            const response = await api.get('/admin/schedules', {
                params: { groupId }
            });

            setLessons(response.data);
        } catch (error) {
            console.error(error);
            alert('Ошибка загрузки занятий');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        if (!groupId) {
            setLessons([]);
            return;
        }

        setLoading(true);

        api.get('/admin/schedules', {
            params: { groupId }
        })
            .then((response) => {
                if (!cancelled) setLessons(response.data);
            })
            .catch((error) => {
                if (!cancelled) {
                    console.error(error);
                    alert('Ошибка загрузки занятий');
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [groupId, refreshKey]);

    const handleDeleteOne = async (lesson) => {
        if (deleting) return;

        if (!window.confirm(
            `Удалить занятие ${lesson.date} в ${lesson.time}?`
        )) return;

        setDeleting(true);

        try {
            await api.delete(`/admin/schedules/${lesson.id}`);

            setLessons((prev) =>
                prev.filter((item) => item.id !== lesson.id)
            );
        } catch (error) {
            alert(
                error.response?.data?.message ||
                'Ошибка удаления занятия'
            );
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteBulk = async () => {
        if (deleting) return;

        if (!groupId || !startDate || !endDate ||
            startDate > endDate) {
            alert('Выберите корректный период');
            return;
        }

        if (!window.confirm(
            `Удалить будущие занятия с ${startDate} по ${endDate}?`
        )) return;

        setDeleting(true);

        try {
            const response = await api.delete(
                '/admin/schedules/bulk',
                {
                    data: { groupId, startDate, endDate }
                }
            );

            const { deleted, skipped } = response.data;

            alert(
                `Удалено: ${deleted}\nПропущено: ${skipped}`
            );

            await loadLessons();
        } catch (error) {
            alert(
                error.response?.data?.message ||
                'Ошибка массового удаления'
            );
        } finally {
            setDeleting(false);
        }
    };

    const today = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dushanbe',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(new Date());

    const datePart = (type) =>
        today.find((part) => part.type === type)?.value;

    const todayString =
        `${datePart('year')}-${datePart('month')}-${datePart('day')}`;

    return (
        <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-lg font-bold text-white">
                    Управление расписанием
                </h2>

                <CustomDropdown
                    options={groups.map((group) => ({
                        value: group.id,
                        label: group.name
                    }))}
                    value={groupId}
                    onChange={setGroupId}
                    placeholder="Выберите группу"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                    />
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                    />
                </div>

                <button
                    type="button"
                    disabled={deleting || !groupId ||
                        !startDate || !endDate ||
                        startDate <= todayString ||
                        startDate > endDate}
                    onClick={handleDeleteBulk}
                    className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl py-3 font-semibold"
                >
                    Удалить будущие занятия за период
                </button>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">
                        Занятия ({lessons.length})
                    </h3>

                    <button
                        type="button"
                        onClick={loadLessons}
                        disabled={loading || deleting}
                        className="text-slate-400 hover:text-white"
                        title="Обновить"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>

                {loading ? (
                    <p className="text-slate-400">Загрузка...</p>
                ) : !groupId ? (
                    <p className="text-slate-400">
                        Сначала выберите группу
                    </p>
                ) : lessons.length === 0 ? (
                    <p className="text-slate-400">
                        Занятий не найдено
                    </p>
                ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {lessons.map((lesson) => {
                            return (
                                <div
                                    key={lesson.id}
                                    className="flex items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3"
                                >
                                    <div>
                                        <p className="text-white text-sm font-medium">
                                            {lesson.date} · {lesson.time}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {lesson.subject || 'Занятие'}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={deleting}
                                        onClick={() => handleDeleteOne(lesson)}
                                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg disabled:opacity-30"
                                        title="Удалить занятие"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScheduleManager;
