/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const CustomDropdown = ({ options, value, onChange, placeholder = "-- Выберите --" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const selectedOption = options.find((opt) => String(opt.value) === String(value));

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 flex items-center justify-between focus:outline-none focus:border-blue-500 transition-colors cursor-pointer text-left"
            >
                <span className={selectedOption ? "text-slate-100" : "text-slate-500"}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1.5 w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden py-1 max-h-60 overflow-y-auto">
                    {options.length === 0 ? (
                        <div className="px-4 py-2.5 text-xs text-slate-500">Нет доступных вариантов</div>
                    ) : (
                        options.map((opt) => {
                            const isSelected = String(opt.value) === String(value);
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full px-4 py-2.5 text-sm text-left flex items-center justify-between transition cursor-pointer ${isSelected
                                            ? 'bg-blue-600/20 text-blue-400 font-medium'
                                            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                                        }`}
                                >
                                    <span>{opt.label}</span>
                                    {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default CustomDropdown;