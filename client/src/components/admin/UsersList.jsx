/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { Search, Edit, Trash2, Check, X, Users, Shield, GraduationCap, School } from 'lucide-react';

const fieldClass = "w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 transition-colors";

const UsersList = ({ groups = [] }) => {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedRole, setSelectedRole] = useState('all'); // 'all' | 'student' | 'teacher' | 'admin'
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    // 1. Загрузка всех пользователей
    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error('Ошибка при загрузке пользователей:', err);
        }
    };

    useEffect(() => {
        let ignore = false;

        const loadUsers = async () => {
            try {
                const res = await api.get('/admin/users');
                if (!ignore) setUsers(res.data);
            } catch (err) {
                console.error('Ошибка при загрузке пользователей:', err);
            }
        };

        loadUsers();

        return () => {
            ignore = true;
        };
    }, []);

    // 2. Обработчики действий
    const handleEdit = (user) => {
        setEditingId(user.id);
        setEditForm({ ...user });
    };

    const handleSave = async (id) => {
        try {
            await api.put(`/admin/users/${id}`, editForm);
            setEditingId(null);
            fetchUsers();
        } catch (err) {
            alert('Ошибка при сохранении данных пользователя');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Вы уверены, что хотите удалить этого пользователя?')) return;
        try {
            await api.delete(`/admin/users/${id}`);
            fetchUsers();
        } catch (err) {
            alert('Ошибка при удалении пользователя');
        }
    };

    // 3. Визуальный бейдж роли
    const renderRoleBadge = (role) => {
        switch (role) {
            case 'admin':
                return (
                    <span className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-md font-medium text-[11px]">
                        <Shield className="w-3 h-3" /> Админ
                    </span>
                );
            case 'teacher':
                return (
                    <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-medium text-[11px]">
                        <School className="w-3 h-3" /> Учитель
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md font-medium text-[11px]">
                        <GraduationCap className="w-3 h-3" /> Студент
                    </span>
                );
        }
    };

    // 4. Фильтрация списка (по роли и по строке поиска)
    const filteredUsers = users.filter((u) => {
        const matchesRole = selectedRole === 'all' || u.role === selectedRole;
        const query = search.toLowerCase();
        
        const matchesSearch = 
            (u.name_en || '').toLowerCase().includes(query) ||
            (u.last_name_en || '').toLowerCase().includes(query) ||
            (u.fullname || '').toLowerCase().includes(query) ||
            (u.username || '').toLowerCase().includes(query) ||
            (u.email || '').toLowerCase().includes(query) ||
            String(u.id).includes(query);

        return matchesRole && matchesSearch;
    });

    return (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
            
            {/* ВЕРХНЯЯ ПАНЕЛЬ: Фильтры и Поиск */}
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" /> Список пользователей ({filteredUsers.length})
                    </h3>

                    <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <input
                            type="text"
                            placeholder="Поиск по имени, email или ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                </div>

                {/* Вкладки выбора роли */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {[
                        { id: 'all', label: 'Все' },
                        { id: 'student', label: 'Студенты' },
                        { id: 'teacher', label: 'Учителя' },
                        { id: 'admin', label: 'Администраторы' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedRole(tab.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                selectedRole === tab.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ТАБЛИЦА ПОЛЬЗОВАТЕЛЕЙ */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-medium border-b border-slate-800">
                        <tr>
                            <th className="p-3">ID</th>
                            <th className="p-3">Роль</th>
                            <th className="p-3">Имя / Full Name</th>
                            <th className="p-3">Логин / Email</th>
                            <th className="p-3">Группа</th>
                            <th className="p-3">Телефон</th>
                            <th className="p-3 text-right">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="p-6 text-center text-slate-500">
                                    Пользователи не найдены
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((u) => {
                                const isEditing = editingId === u.id;
                                const displayName = u.fullname || `${u.name_en || ''} ${u.last_name_en || ''}`.trim() || '—';

                                return (
                                    <tr key={u.id} className="hover:bg-slate-800/30 transition">
                                        <td className="p-3 font-mono text-slate-400">{u.id}</td>

                                        {/* Роль */}
                                        <td className="p-3">
                                            {isEditing ? (
                                                <select
                                                    value={editForm.role || 'student'}
                                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                                    className={fieldClass}
                                                >
                                                    <option value="student">Студент</option>
                                                    <option value="teacher">Учитель</option>
                                                    <option value="admin">Админ</option>
                                                </select>
                                            ) : (
                                                renderRoleBadge(u.role)
                                            )}
                                        </td>

                                        {/* Имя */}
                                        <td className="p-3">
                                            {isEditing ? (
                                                <input
                                                    value={editForm.fullname || editForm.name_en || ''}
                                                    onChange={(e) => setEditForm({ 
                                                        ...editForm, 
                                                        fullname: e.target.value,
                                                        name_en: e.target.value 
                                                    })}
                                                    className={fieldClass}
                                                />
                                            ) : (
                                                <span className="font-medium text-white">{displayName}</span>
                                            )}
                                        </td>

                                        {/* Логин / Email */}
                                        <td className="p-3">
                                            {isEditing ? (
                                                <input
                                                    value={editForm.username || editForm.email || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value, email: e.target.value })}
                                                    className={fieldClass}
                                                />
                                            ) : (
                                                <span className="text-slate-400">{u.username || u.email || '—'}</span>
                                            )}
                                        </td>

                                        {/* Группа */}
                                        <td className="p-3">
                                            {isEditing ? (
                                                <select
                                                    value={editForm.student_groups?.[0] || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, student_groups: [e.target.value] })}
                                                    className={fieldClass}
                                                >
                                                    <option value="">Без группы</option>
                                                    {groups.map((g) => (
                                                        <option key={g.id || g.name} value={g.name}>{g.name}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-medium text-[11px]">
                                                    {Array.isArray(u.student_groups) ? (u.student_groups[0] || '—') : (u.student_groups || '—')}
                                                </span>
                                            )}
                                        </td>

                                        {/* Телефон */}
                                        <td className="p-3">
                                            {isEditing ? (
                                                <input
                                                    value={editForm.phone || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                    className={fieldClass}
                                                />
                                            ) : (
                                                u.phone || '—'
                                            )}
                                        </td>

                                        {/* Кнопки управления */}
                                        <td className="p-3 text-right">
                                            {isEditing ? (
                                                <div className="flex justify-end gap-1">
                                                    <button onClick={() => handleSave(u.id)} className="p-1.5 bg-emerald-600/30 text-emerald-400 hover:bg-emerald-600/50 rounded-lg transition cursor-pointer">
                                                        <Check className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-800 text-slate-400 hover:bg-slate-700 rounded-lg transition cursor-pointer">
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end gap-1">
                                                    <button onClick={() => handleEdit(u)} className="p-1.5 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition cursor-pointer">
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => handleDelete(u.id)} className="p-1.5 bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 rounded-lg transition cursor-pointer">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UsersList;