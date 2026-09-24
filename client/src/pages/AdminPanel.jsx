/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import { Users, Calendar, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import StudentsTab from '../components/admin/UsersTab';
import GroupsTab from '../components/admin/GroupsTab';
import ScheduleTab from '../components/admin/ScheduleTab';
import StudentsList from '../components/admin/UsersList';
import GroupsList from '../components/admin/GroupsList';

const AdminPanel = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('students');
    const [groups, setGroups] = useState([]);
    const [teachers, setTeachers] = useState([]);

    const fetchInitialData = async () => {
        try {
            const [groupsRes, teachersRes] = await Promise.all([
                api.get('/groups'),
                api.get('/admin/users?role=teacher')
            ]);            
            setGroups(groupsRes.data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
            setTeachers(teachersRes.data);
        } catch (err) {
            console.error('Ошибка загрузки данных:', err);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            await fetchInitialData();
        };

        loadInitialData();
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto space-y-8">

                <div className="border-b border-slate-800/80 pb-5">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                        {t('admin.title')}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                        {t('admin.subtitle')}
                    </p>
                </div>

                {/* Навигационные табы */}
                <div className="flex flex-wrap gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80">
                    <button
                        onClick={() => setActiveTab('students')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                            activeTab === 'students' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <UserPlus className="w-4 h-4" /> {t('admin.tabs.students')}
                    </button>

                    <button
                        onClick={() => setActiveTab('groups')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                            activeTab === 'groups' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Users className="w-4 h-4" /> {t('admin.tabs.groups')}
                    </button>

                    <button
                        onClick={() => setActiveTab('schedule')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                            activeTab === 'schedule' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Calendar className="w-4 h-4" /> {t('admin.tabs.schedule')}
                    </button>
                </div>

                {/* Вкладка Пользователи: форма добавления + список управления */}
                {activeTab === 'students' && (
                    <div className="space-y-8">
                        <StudentsTab groups={groups} />
                        <StudentsList groups={groups} />
                    </div>
                )}

                {/* Вкладка Группы: форма добавления + список управления */}
                {activeTab === 'groups' && (
                    <div className="space-y-8">
                        <GroupsTab teachers={teachers} onGroupCreated={fetchInitialData} />
                        <GroupsList groups={groups} teachers={teachers} onRefresh={fetchInitialData} />
                    </div>
                )}

                {/* Вкладка Расписание */}
                {activeTab === 'schedule' && (
                    <ScheduleTab groups={groups} teachers={teachers} />
                )}
            </div>
        </div>
    );
};

export default AdminPanel;