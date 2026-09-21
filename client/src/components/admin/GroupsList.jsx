/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { updateGroup, deleteGroup } from '../../api/adminService';
import { Users, Edit, Trash2, Check, X } from 'lucide-react';

const fieldClass = "w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500";

const GroupsList = ({ groups, onRefresh }) => {
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    const handleEdit = (group) => {
        setEditingId(group.id);
        setEditForm({ ...group });
    };

    const handleSave = async (id) => {
        try {
            await updateGroup(id, editForm);
            setEditingId(null);
            onRefresh();
        } catch (err) {
            alert('Ошибка при сохранении группы');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Удалить эту группу?')) return;
        try {
            await deleteGroup(id);
            onRefresh();
        } catch (err) {
            alert('Ошибка при удалении группы');
        }
    };

    return (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-6">
                <Users className="w-4 h-4 text-blue-500" /> Управление группами ({groups.length})
            </h3>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-medium border-b border-slate-800">
                        <tr>
                            <th className="p-3">Название</th>
                            <th className="p-3">Категория</th>
                            <th className="p-3 text-right">Действия</th>
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
                                            <option value="language">Курсы Языков</option>
                                            <option value="topik">Подготовка к TOPIK</option>
                                            <option value="other">Сторонний Предмет</option>
                                        </select>
                                    ) : (
                                        <span className="capitalize">{g.category}</span>
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