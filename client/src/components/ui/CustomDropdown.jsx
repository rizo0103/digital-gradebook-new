/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const CustomDropdown = ({ 
    options, 
    value, 
    onChange, 
    placeholder = "-- Выберите --",
    className = "w-full",
    buttonClassName = "px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
}) => {
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
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-slate-950/60 border border-slate-800 rounded-xl sm:rounded-2xl text-slate-100 flex items-center justify-between gap-1.5 focus:outline-none focus:border-slate-600 hover:bg-slate-900 transition-all cursor-pointer text-left ${buttonClassName}`}
            >
                <span className={`font-medium ${selectedOption ? "text-slate-200" : "text-slate-500"}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-blue-400' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 z-50 mt-1.5 min-w-[100px] w-full bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl overflow-hidden py-1 max-h-60 overflow-y-auto">
                    {options.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-slate-500">Нет вариантов</div>
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
                                    className={`w-full px-3 py-1.5 text-xs sm:text-sm text-left flex items-center justify-between gap-2 transition cursor-pointer ${
                                        isSelected
                                            ? 'bg-blue-600/20 text-blue-400 font-medium'
                                            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                                    }`}
                                >
                                    <span>{opt.label}</span>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
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