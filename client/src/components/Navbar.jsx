/* eslint-disable no-unused-vars */
import React from 'react';
import { useAuth } from '../context/useAuth';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-50">

            {/* Левая часть: логотип и название */}
            <div
                className="flex items-center gap-3 cursor-pointer group select-none"
                onClick={() => navigate('/groups')}
            >
                <img
                    src="/src/assets/Logo.png"
                    alt="Logo"
                    className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
                />
                <span className="text-white font-bold text-lg tracking-tight group-hover:text-slate-200 transition">
                    Digital Gradebook
                </span>
            </div>

            {/* Правая часть: информация о пользователе и выход */}
            {user && (
                <div className="flex items-center gap-5">
                    {/* Инфо о пользователе */}
                    <div className="flex items-center gap-2.5 text-sm bg-slate-950/60 border border-slate-800 px-3.5 py-1.5 rounded-2xl">
                        <User className="w-4 h-4 text-[#0F4C9C]" />
                        <span className="font-medium text-slate-200">{user.fullName}</span>
                        <span className="bg-[#8C1D35]/20 text-rose-300 border border-[#8C1D35]/40 px-2 py-0.5 rounded-lg text-[10px] uppercase font-bold tracking-wider">
                            {user.role}
                        </span>
                    </div>

                    {/* Кнопка выхода */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-rose-400 bg-transparent hover:bg-rose-950/30 px-3 py-1.5 rounded-xl transition duration-200 font-medium cursor-pointer"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Выйти</span>
                    </button>
                </div>
            )}
        </header>
    );
};

export default Navbar;