/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosInstance';
import CustomDropdown from '../ui/CustomDropdown';
import { Calendar } from 'lucide-react';
import { useEffect } from 'react';
import ScheduleManager from './ScheduleManager';

const fieldInputClass = "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:bg-slate-900/50 transition-colors";

const daysOptions = [
    { id: 1, label: 'Пн', value: 'Monday' },
    { id: 2, label: 'Вт', value: 'Tuesday' },
    { id: 3, label: 'Ср', value: 'Wednesday' },
    { id: 4, label: 'Чт', value: 'Thursday' },
    { id: 5, label: 'Пт', value: 'Friday' },
    { id: 6, label: 'Сб', value: 'Saturday' },
    { id: 0, label: 'Вс', value: 'Sunday' }
];

const ScheduleTab = ({ groups, teachers }) => {
    const { t } = useTranslation();

    const [schedules, setSchedules] = useState([]);
    const [loadingSchedules, setLoadingSchedules] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const [scheduleForm, setScheduleForm] = useState({
        groupId: '',
        subject: '',
        startDate: '',
        endDate: '',
        daysOfWeek: [],
        time: '14:00',
        teacherId: ''
    });

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

    const handleCreateSchedule = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/schedule', scheduleForm);
            alert(t('admin.scheduleTab.success'));
            setScheduleForm({
                groupId: '', subject: '', startDate: '', endDate: '',
                daysOfWeek: [], time: '14:00', teacherId: ''
            });
            setRefreshKey((prev) => prev + 1);
        } catch (err) {
            alert(t('admin.scheduleTab.error'));
        }
    };

    const handleDeleteSchedule = async (scheduleId) => {
        const confirmed = window.confirm(
            'Вы действительно хотите удалить это расписание?'
        );

        if (!confirmed) return;

        try {
            await api.delete(`/admin/schedules/${scheduleId}`);

            setSchedules((prev) =>
                prev.filter((schedule) => schedule.id !== scheduleId)
            );

        } catch (error) {
            console.error('Ошибка удаления расписания:', error);

            alert(
                error.response?.data?.message ||
                'Не удалось удалить расписание'
            );
        }
    };

    useEffect(() => {
        let ignore = false;

        const loadSchedules = async () => {
            setLoadingSchedules(true);

            try {
                const response = await api.get('/admin/schedules');

                if (!ignore) {
                    setSchedules(response.data);
                }
            } catch (error) {
                console.error('Ошибка загрузки расписаний:', error);
            } finally {
                if (!ignore) {
                    setLoadingSchedules(false);
                }
            }
        };

        loadSchedules();

        return () => {
            ignore = true;
        };
    }, []);

    return (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 max-w-xl">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" /> {t('admin.scheduleTab.title')}
            </h2>

            <form onSubmit={handleCreateSchedule} className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase mb-1.5">{t('admin.scheduleTab.group')}</label>
                    <CustomDropdown
                        options={groups.map((g) => ({ value: g.id, label: `${g.name} (${g.category})` }))}
                        value={scheduleForm.groupId}
                        onChange={(val) => setScheduleForm({ ...scheduleForm, groupId: val })}
                        placeholder={t('admin.scheduleTab.groupPlaceholder')}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 uppercase mb-1.5">{t('admin.scheduleTab.startDate')}</label>
                        <input
                            type="date"
                            required
                            value={scheduleForm.startDate}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, startDate: e.target.value })}
                            className={fieldInputClass}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 uppercase mb-1.5">{t('admin.scheduleTab.endDate')}</label>
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
                    <label className="block text-xs font-medium text-slate-400 uppercase mb-1.5">{t('admin.scheduleTab.days')}</label>
                    <div className="flex flex-wrap gap-2">
                        {daysOptions.map((day) => {
                            const isSelected = scheduleForm.daysOfWeek.includes(day.value);
                            return (
                                <button
                                    key={day.id}
                                    type="button"
                                    onClick={() => toggleDay(day.value)}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${isSelected
                                        ? 'bg-blue-600 border-blue-500 text-white'
                                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                        }`}
                                >
                                    {day.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 uppercase mb-1.5">{t('admin.scheduleTab.subject')}</label>
                        <input
                            type="text"
                            placeholder={t('admin.scheduleTab.subjectPlaceholder')}
                            value={scheduleForm.subject}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, subject: e.target.value })}
                            className={fieldInputClass}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 uppercase mb-1.5">{t('admin.scheduleTab.teacher')}</label>
                        <CustomDropdown
                            options={teachers.map((teacher) => ({ value: teacher.id, label: teacher.fullName }))}
                            value={scheduleForm.teacherId}
                            onChange={(val) => setScheduleForm({ ...scheduleForm, teacherId: val })}
                            placeholder={t('admin.scheduleTab.teacherPlaceholder')}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 uppercase mb-1.5">{t('admin.scheduleTab.time')}</label>
                        <input
                            type="time"
                            value={scheduleForm.time}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                            className={fieldInputClass}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-3 rounded-xl transition cursor-pointer mt-2"
                >
                    {t('admin.scheduleTab.generate')}
                </button>
            </form>
            <ScheduleManager 
                groups={groups}
                refreshKey={refreshKey}
            />
        </div>
    );
};

export default ScheduleTab;