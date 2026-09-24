/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosInstance';
import { Search, Edit, Trash2, Check, X, Users, Shield, GraduationCap, School } from 'lucide-react';

const fieldClass = "w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 transition-colors";

const UsersList = ({ groups = [] }) => {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedRole, setSelectedRole] = useState('all');
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

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

    const getSelectedGroupIds = (user) => {
        const rawGroups = Array.isArray(user?.student_groups)
            ? user.student_groups
            : (Array.isArray(user?.teacher_groups) ? user.teacher_groups : []);

        return Array.from(new Set(rawGroups
            .map((group) => {
                const matchedGroup = groups.find((item) => item.id === group || item.name === group);
                return matchedGroup ? matchedGroup.id : group;
            })
            .filter(Boolean)));
    };

    const getDisplayName = (user) => {
        const fullName = user?.fullName?.trim();
        const multilingualName = [
            user?.name_tj,
            user?.last_name_tj,
            user?.name_kr,
            user?.last_name_kr,
            user?.name_en,
            user?.last_name_en,
        ].filter(Boolean).join(' ').trim();

        return fullName || multilingualName || t('admin.usersList.emptyGroup');
    };

    const handleEdit = (user) => {
        setEditingId(user.id);
        setEditForm({
            ...user,
            role: user.role || 'student',
            student_groups: Array.isArray(user.student_groups) ? user.student_groups : [],
            teacher_groups: Array.isArray(user.teacher_groups) ? user.teacher_groups : [],
            groupIds: getSelectedGroupIds(user)
        });
    };

    const handleSave = async (id) => {
        try {
            const selectedGroupIds = Array.isArray(editForm.groupIds)
                ? editForm.groupIds
                : getSelectedGroupIds(editForm);

            const nextRole = editForm.role || 'student';
            const normalizedGroupIds = Array.from(new Set(selectedGroupIds.map(String).filter(Boolean)));

            const payload = {
                ...editForm,
                role: nextRole,
                fullName: (editForm.fullName || '').trim() || [
                    editForm.name_tj,
                    editForm.last_name_tj,
                    editForm.name_kr,
                    editForm.last_name_kr,
                    editForm.name_en,
                    editForm.last_name_en,
                ].filter(Boolean).join(' ').trim() || editForm.username || 'User',
                groupIds: normalizedGroupIds,
                student_groups: nextRole === 'student' ? normalizedGroupIds : [],
                teacher_groups: nextRole === 'teacher' ? normalizedGroupIds : []
            };

            delete payload.passwordHash;
            delete payload.customId;

            await api.put(`/admin/users/${id}`, payload);
            setEditingId(null);
            await fetchUsers();
        } catch (err) {
            alert(t('admin.usersList.saveError'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('admin.usersList.deleteConfirm'))) return;
        try {
            await api.delete(`/admin/users/${id}`);
            await fetchUsers();
        } catch (err) {
            alert(t('admin.usersList.deleteError'));
        }
    };

    const renderRoleBadge = (role) => {
        switch (role) {
            case 'admin':
                return (
                    <span className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-md font-medium text-[11px]">
                        <Shield className="w-3 h-3" /> {t('admin.usersList.admin')}
                    </span>
                );
            case 'teacher':
                return (
                    <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-medium text-[11px]">
                        <School className="w-3 h-3" /> {t('admin.usersList.teacher')}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md font-medium text-[11px]">
                        <GraduationCap className="w-3 h-3" /> {t('admin.usersList.student')}
                    </span>
                );
        }
    };

    const filteredUsers = users.filter((u) => {
        const matchesRole = selectedRole === 'all' || u.role === selectedRole;
        const query = search.toLowerCase();

        const matchesSearch =
            (u.name_tj || '').toLowerCase().includes(query) ||
            (u.last_name_tj || '').toLowerCase().includes(query) ||
            (u.name_kr || '').toLowerCase().includes(query) ||
            (u.last_name_kr || '').toLowerCase().includes(query) ||
            (u.name_en || '').toLowerCase().includes(query) ||
            (u.last_name_en || '').toLowerCase().includes(query) ||
            (u.fullName || '').toLowerCase().includes(query) ||
            (u.username || '').toLowerCase().includes(query) ||
            (u.email || '').toLowerCase().includes(query) ||
            String(u.id).includes(query);

        return matchesRole && matchesSearch;
    });

    return (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" /> {t('admin.usersList.title', { count: filteredUsers.length })}
                    </h3>

                    <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <input
                            type="text"
                            placeholder={t('admin.usersList.search')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {[
                        { id: 'all', label: t('admin.usersList.all') },
                        { id: 'student', label: t('admin.usersList.students') },
                        { id: 'teacher', label: t('admin.usersList.teachers') },
                        { id: 'admin', label: t('admin.usersList.admins') }
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

            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-medium border-b border-slate-800">
                        <tr>
                            <th className="p-3">{t('admin.usersList.id')}</th>
                            <th className="p-3">{t('admin.usersList.role')}</th>
                            <th className="p-3">{t('admin.usersList.name')}</th>
                            <th className="p-3">{t('admin.usersList.loginEmail')}</th>
                            <th className="p-3">{t('admin.usersList.group')}</th>
                            <th className="p-3">{t('admin.usersList.phone')}</th>
                            <th className="p-3 text-right">{t('admin.usersList.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="p-6 text-center text-slate-500">
                                    {t('admin.usersList.notFound')}
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((u) => {
                                const isEditing = editingId === u.id;
                                const displayName = getDisplayName(u);

                                return (
                                    <tr key={u.id} className="hover:bg-slate-800/30 transition">
                                        <td className="p-3 font-mono text-slate-400">{u.id}</td>

                                        <td className="p-3">
                                            {isEditing ? (
                                                <select
                                                    value={editForm.role || 'student'}
                                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                                    className={fieldClass}
                                                >
                                                    <option value="student">{t('admin.usersList.student')}</option>
                                                    <option value="teacher">{t('admin.usersList.teacher')}</option>
                                                    <option value="admin">{t('admin.usersList.admin')}</option>
                                                </select>
                                            ) : (
                                                renderRoleBadge(u.role)
                                            )}
                                        </td>

                                        <td className="p-3">
                                            {isEditing ? (
                                                <input
                                                    value={editForm.fullName || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                                    className={fieldClass}
                                                />
                                            ) : (
                                                <span className="font-medium text-white">{displayName}</span>
                                            )}
                                        </td>

                                        <td className="p-3">
                                            {isEditing ? (
                                                <input
                                                    value={editForm.username || editForm.email || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value, email: e.target.value })}
                                                    className={fieldClass}
                                                />
                                            ) : (
                                                <span className="text-slate-400">{u.username || u.email || t('admin.usersList.emptyGroup')}</span>
                                            )}
                                        </td>

                                        <td className="p-3">
                                            {isEditing ? (
                                                <select
                                                    multiple
                                                    value={editForm.groupIds || getSelectedGroupIds(u)}
                                                    onChange={(e) => {
                                                        const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                                                        setEditForm({ ...editForm, groupIds: selected, student_groups: selected, teacher_groups: selected });
                                                    }}
                                                    className={`${fieldClass} min-h-[88px]`}
                                                >
                                                    {groups.map((g) => (
                                                        <option key={g.id || g.name} value={g.id || g.name}>{g.name}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div className="flex flex-wrap gap-1">
                                                    {(() => {
                                                        const selectedGroups = getSelectedGroupIds(u);
                                                        return selectedGroups.length > 0
                                                            ? selectedGroups.map((groupId) => {
                                                                const group = groups.find((item) => item.id === groupId || item.name === groupId);
                                                                return (
                                                                    <span key={groupId} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-medium text-[11px]">
                                                                        {group ? group.name : groupId}
                                                                    </span>
                                                                );
                                                            })
                                                            : <span className="text-slate-500">{t('admin.usersList.emptyGroup')}</span>;
                                                    })()}
                                                </div>
                                            )}
                                        </td>

                                        <td className="p-3">
                                            {isEditing ? (
                                                <input
                                                    value={editForm.phone || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                    className={fieldClass}
                                                />
                                            ) : (
                                                u.phone || t('admin.usersList.emptyGroup')
                                            )}
                                        </td>

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
