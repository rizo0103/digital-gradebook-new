/* eslint-disable no-unused-vars */
/* eslint-disable no-useless-assignment */
import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

const fieldClass =
    'w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 transition-colors';

const GroupSelectDropdown = ({ groups = [], selectedGroupIds = [], onChange, t }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef(null);

    // Закрытие при клике вне компонента
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleGroup = (groupId) => {
        const exists = selectedGroupIds.includes(groupId);
        let updated = [];
        if (exists) {
            updated = selectedGroupIds.filter((id) => id !== groupId);
        } else {
            updated = [...selectedGroupIds, groupId];
        }
        onChange(updated);
    };

    const filteredGroups = groups.filter((g) =>
        (g.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="relative w-full min-w-[200px]" ref={dropdownRef}>
            {/* Кнопка открытия списка */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`${fieldClass} flex items-center justify-between text-left cursor-pointer hover:border-slate-700`}
            >
                <span className="truncate">
                    {selectedGroupIds.length === 0
                        ? 'Выберите группы...'
                        : `Выбрано групп: ${selectedGroupIds.length}`}
                </span>
                <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                    }`}
                />
            </button>

            {/* Выпадающее меню */}
            {isOpen && (
                <div className="absolute z-50 left-0 top-full mt-1 w-full min-w-[240px] bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-2 flex flex-col gap-2">
                    {/* Поиск по группам */}
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
                        <input
                            type="text"
                            placeholder="Поиск группы..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-2 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Список групп с чекбоксами */}
                    <div className="max-h-40 overflow-y-auto flex flex-col gap-1 pr-1 custom-scrollbar">
                        {filteredGroups.length === 0 ? (
                            <span className="text-[11px] text-slate-500 p-2 text-center">
                                Группы не найдены
                            </span>
                        ) : (
                            filteredGroups.map((g) => {
                                const gId = g.id || g.name;
                                const isSelected = selectedGroupIds.includes(gId);
                                return (
                                    <label
                                        key={gId}
                                        onClick={() => toggleGroup(gId)}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-xs transition ${
                                            isSelected
                                                ? 'bg-blue-600/20 text-blue-300 font-medium'
                                                : 'text-slate-300 hover:bg-slate-900'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => {}} // Обработка через onClick родительского label
                                            className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 focus:ring-offset-0"
                                        />
                                        <span className="truncate">{g.name}</span>
                                    </label>
                                );
                            })
                        )}
                    </div>

                    {/* Дополнительное действие: Очистить все */}
                    {selectedGroupIds.length > 0 && (
                        <div className="pt-1 border-t border-slate-800/80 flex justify-end">
                            <button
                                type="button"
                                onClick={() => onChange([])}
                                className="text-[10px] text-rose-400 hover:text-rose-300 font-medium px-1"
                            >
                                Очистить выбор
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Выбранные группы в виде стильных тегов под инпутом */}
            {selectedGroupIds.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5 max-w-[280px]">
                    {selectedGroupIds.map((gId) => {
                        const groupObj = groups.find((item) => item.id === gId || item.name === gId);
                        return (
                            <span
                                key={gId}
                                className="inline-flex items-center gap-1 bg-slate-800 text-slate-200 border border-slate-700/80 px-1.5 py-0.5 rounded text-[10px] font-medium"
                            >
                                {groupObj ? groupObj.name : gId}
                                <button
                                    type="button"
                                    onClick={() => toggleGroup(gId)}
                                    className="hover:text-rose-400 transition"
                                >
                                    <X className="w-2.5 h-2.5" />
                                </button>
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default GroupSelectDropdown;