/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { Users, ChevronRight } from 'lucide-react';

const GroupsList = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const response = await api.get('/groups');
                setGroups(response.data);
            } catch (err) {
                console.error('Ошибка загрузки', err);
            } finally {
                setLoading(false);
            }
        };
        fetchGroups();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500">Загрузка групп...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6 text-slate-800">Доступные группы</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((group) => (
                    <div
                        key={group.id}
                        onClick={() => navigate(`/journal/${group.id}`)}
                        className="bg-white border border-slate-200 hover:border-brand-blue hover:shadow-md p-5 rounded-2xl cursor-pointer transition flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-50 p-3 rounded-xl text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-slate-800">{group.name}</h3>
                                <p className="text-xs text-slate-500">
                                    Студентов: {group.studentIds?.length || 0}
                                </p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-brand-blue transition" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GroupsList;