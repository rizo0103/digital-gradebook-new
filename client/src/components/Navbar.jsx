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
        <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between sticky top-0 z-50">

            {/* Левая часть: логотип и название */}
            <div
                className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none shrink-0"
                onClick={() => navigate('/groups')}
            >
                <img
                    src="/src/assets/Logo.png"
                    alt="Logo"
                    className="h-7 sm:h-8 w-auto object-contain transition-transform group-hover:scale-105"
                />
                {/* Название скрываем на очень маленьких экранах, оставляем от sm: */}
                {/* <span className="text-white font-bold text-base sm:text-lg tracking-tight group-hover:text-slate-200 transition hidden xs:inline-block"> */}
                    Digital Gradebook
                {/* </span> */}
            </div>

            {/* Правая часть: информация о пользователе и выход */}
            {user && (
                <div className="flex items-center gap-2 sm:gap-5">
                    {/* Инфо о пользователе */}
                    <div className="flex items-center gap-1.5 sm:gap-2.5 text-xs sm:text-sm bg-slate-950/60 border border-slate-800 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl">
                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0F4C9C] shrink-0" />

                        {/* Имя отображаем на планшетах и десктопах, на телефонах прячем */}
                        <span className="font-medium text-slate-200 hidden md:inline-block max-w-[120px] sm:max-w-none truncate">
                            {user.fullName}
                        </span>

                        {/* Бейдж роли */}
                        <span className="bg-[#8C1D35]/20 text-rose-300 border border-[#8C1D35]/40 px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] uppercase font-bold tracking-wider">
                            {user.role}
                        </span>
                    </div>

                    {/* Кнопка выхода */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-slate-400 hover:text-rose-400 active:text-rose-400 bg-transparent hover:bg-rose-950/30 p-1.5 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl transition duration-200 font-medium cursor-pointer"
                        title="Выйти"
                    >
                        <LogOut className="w-4 h-4" />
                        {/* Текст "Выйти" прячем на смартфонах, оставляя только иконку */}
                        <span className="hidden sm:inline-block">Выйти</span>
                    </button>
                </div>
            )}
        </header>
    );
};

export default Navbar;