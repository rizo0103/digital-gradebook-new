/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { updateGroup, deleteGroup } from '../../api/adminService';
import { Users, Edit, Trash2, Check, X } from 'lucide-react';

const fieldClass = "w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500";

const GroupsList = ({ groups, teachers = [], onRefresh }) => {
    const { t } = useTranslation();
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    const handleEdit = (group) => {
        setEditingId(group.id);
        setEditForm({
            ...group,
            teacherIds: Array.isArray(group.teacherIds) ? group.teacherIds : []
        });
    };

    const handleSave = async (id) => {
        try {
            await updateGroup(id, {
                ...editForm,
                teacherIds: Array.isArray(editForm.teacherIds) ? editForm.teacherIds : [],
                studentIds: Array.isArray(editForm.studentIds) ? editForm.studentIds : []
            });
            setEditingId(null);
            onRefresh();
        } catch (err) {
            alert(t('admin.groupsList.saveError'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('admin.groupsList.deleteConfirm'))) return;
        try {
            await deleteGroup(id);
            onRefresh();
        } catch (err) {
            alert(t('admin.groupsList.deleteError'));
        }
    };

    return (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-6">
                <Users className="w-4 h-4 text-blue-500" /> {t('admin.groupsList.title', { count: groups.length })}
            </h3>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-medium border-b border-slate-800">
                        <tr>
                            <th className="p-3">{t('admin.groupsList.name')}</th>
                            <th className="p-3">{t('admin.groupsList.category')}</th>
                            <th className="p-3">{t('admin.groupsList.teachers')}</th>
                            <th className="p-3 text-right">{t('admin.groupsList.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {groups.map((g) => (
                            <tr key={g.id || g.name} className="hover:bg-slate-800/30 transition">
                                <td className="p-3 font-medium text-white">
                                    {editingId === g.id ? (
                                        <input
                                            value={editForm.name || ''}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            className={fieldClass}
                                        />
                                    ) : (
                                        g.name
                                    )}
                                </td>
                                <td className="p-3">
                                    {editingId === g.id ? (
                                        <select
                                            value={editForm.category || 'language'}
                                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                            className={fieldClass}
                                        >
                                            <option value="language">{t('admin.groupsTab.categoryOptions.language')}</option>
                                            <option value="topik">{t('admin.groupsTab.categoryOptions.topik')}</option>
                                            <option value="other">{t('admin.groupsTab.categoryOptions.other')}</option>
                                        </select>
                                    ) : (
                                        <span className="capitalize">{g.category}</span>
                                    )}
                                </td>
                                <td className="p-3">
                                    {editingId === g.id ? (
                                        <select
                                            multiple
                                            value={editForm.teacherIds || []}
                                            onChange={(e) => {
                                                const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
                                                setEditForm({ ...editForm, teacherIds: selectedOptions });
                                            }}
                                            className={`${fieldClass} min-h-[90px]`}
                                        >
                                            {teachers.length === 0 ? (
                                                <option value="">{t('admin.groupsList.noTeachers')}</option>
                                            ) : (
                                                teachers.map((teacher) => (
                                                    <option key={teacher.id} value={teacher.id}>
                                                        {teacher.fullName || teacher.username || teacher.email || teacher.id}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    ) : (
                                        <span className="text-slate-400">
                                            {Array.isArray(g.teacherIds) && g.teacherIds.length > 0
                                                ? t('admin.groupsList.teachersCount', { count: g.teacherIds.length })
                                                : t('admin.groupsList.noTeachers')}
                                        </span>
                                    )}
                                </td>
                                <td className="p-3 text-right">
                                    {editingId === g.id ? (
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => handleSave(g.id)} className="p-1.5 bg-emerald-600/30 text-emerald-400 hover:bg-emerald-600/50 rounded-lg transition">
                                                <Check className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-800 text-slate-400 hover:bg-slate-700 rounded-lg transition">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => handleEdit(g)} className="p-1.5 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition">
                                                <Edit className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => handleDelete(g.id)} className="p-1.5 bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 rounded-lg transition">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GroupsList;