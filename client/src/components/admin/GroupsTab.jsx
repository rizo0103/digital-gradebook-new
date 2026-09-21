/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import api from '../../api/axiosInstance';
import CustomDropdown from '../ui/CustomDropdown';
import { Users } from 'lucide-react';

const fieldInputClass = "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:bg-slate-900/50 transition-colors";

const categoryOptions = [
    { value: 'language', label: 'Курсы Языков' },
    { value: 'topik', label: 'Подготовка к TOPIK' },
    { value: 'other', label: 'Сторонний Предмет' }
];

const GroupsTab = ({ onGroupCreated }) => {
    const [groupForm, setGroupForm] = useState({ name: '', category: 'language', teacherIds: [] });

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/groups', groupForm);
            alert('Группа успешно создана!');
            setGroupForm({ name: '', category: 'language', teacherIds: [] });
            if (onGroupCreated) onGroupCreated();
        } catch (err) {
            alert('Ошибка при создании группы');
        }
    };

    return (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 max-w-xl">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" /> Добавление новой группы
            </h2>

            <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase mb-1.5">Название группы</label>
                    <input
                        type="text"
                        required
                        placeholder="Например: 초급 2A-1"
                        value={groupForm.name}
                        onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                        className={fieldInputClass}
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase mb-1.5">Категория группы</label>
                    <CustomDropdown
                        options={categoryOptions}
                        value={groupForm.category}
                        onChange={(val) => setGroupForm({ ...groupForm, category: val })}
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-3 rounded-xl transition cursor-pointer mt-2"
                >
                    Создать группу
                </button>
            </form>
        </div>
    );
};

export default GroupsTab;