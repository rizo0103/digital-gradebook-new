/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import { Users, Calendar, UserPlus } from 'lucide-react';

import StudentsTab from '../components/admin/StudentsTab';
import GroupsTab from '../components/admin/GroupsTab';
import ScheduleTab from '../components/admin/ScheduleTab';

const AdminPanel = () => {
    const [activeTab, setActiveTab] = useState('students');
    const [teachers, setTeachers] = useState([]);
    const [groups, setGroups] = useState([]);

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
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${activeTab === 'students' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        <UserPlus className="w-4 h-4" /> Студенты
                    </button>

                    <button
                        onClick={() => setActiveTab('groups')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${activeTab === 'groups' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        <Users className="w-4 h-4" /> Создание Групп
                    </button>

                    <button
                        onClick={() => setActiveTab('schedule')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${activeTab === 'schedule' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        <Calendar className="w-4 h-4" /> Расписание Уроков
                    </button>
                </div>

                {/* РЕНДЕР ВКЛАДОК */}
                {activeTab === 'students' && <StudentsTab groups={groups} />}
                {activeTab === 'groups' && <GroupsTab onGroupCreated={fetchInitialData} />}
                {activeTab === 'schedule' && <ScheduleTab groups={groups} />}

            </div>
        </div>
    );
};

export default AdminPanel;