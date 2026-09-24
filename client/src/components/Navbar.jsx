/* eslint-disable no-unused-vars */
import React from 'react';
import { useAuth } from '../context/useAuth';
import { LogOut, User, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from '../assets/Logo.png';
import CustomDropdown from './ui/CustomDropdown';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { i18n, t } = useTranslation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const languageOptions = [
        { value: 'ru', label: 'Ru' },
        { value: 'en', label: 'En' },
        { value: 'kr', label: 'Kr' },
    ];

    const currentLanguageLabel = i18n.language ? i18n.language.slice(0, 2).toUpperCase() : 'RU';

    const handleLanguageChange = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between sticky top-0 z-50">

            {/* Левая часть: логотип и название */}
            <div
                className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none shrink-0"
                onClick={() => navigate('/groups')}
            >
                <img
                    src={logo}
                    alt="Logo"
                    className="h-7 sm:h-8 w-auto object-contain transition-transform group-hover:scale-105"
                />
                <span className="text-white font-bold text-base sm:text-lg tracking-tight group-hover:text-slate-200 transition hidden xs:inline-block">
                    {t('navbar.digitalGradebook')}
                </span>
            </div>

            {/* Правая часть: Язык, Админка, Пользователь, Выход */}
            <div className="flex items-center gap-2 sm:gap-3">

                {user && (
                    <>
                        {/* Ссылка на Админ-панель */}
                        {user.role === 'admin' && (
                            <button
                                onClick={() => navigate('/admin')}
                                className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/60 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl transition duration-200 cursor-pointer shadow-sm shadow-emerald-950 shrink-0"
                                title={t('navbar.adminPanel')}
                            >
                                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                                <span className="hidden sm:inline-block">
                                    {t('navbar.adminPanel')}
                                </span>
                            </button>
                        )}

                        {/* Инфо о пользователе */}
                        <div className="flex items-center gap-1.5 sm:gap-2.5 text-xs sm:text-sm bg-slate-950/60 border border-slate-800 px-2.5 sm:px-3.5 py-1.5 rounded-xl sm:rounded-2xl shrink-0">
                            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0F4C9C] shrink-0" />

                            <span className="font-medium text-slate-200 hidden md:inline-block max-w-[120px] sm:max-w-none truncate">
                                {user.fullName}
                            </span>

                            <span className="bg-[#8C1D35]/20 text-rose-300 border border-[#8C1D35]/40 px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] uppercase font-bold tracking-wider">
                                {user.role}
                            </span>
                        </div>

                        {/* Кнопка выхода */}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-slate-400 hover:text-rose-400 active:text-rose-400 bg-transparent hover:bg-rose-950/30 p-1.5 sm:px-3 sm:py-2 rounded-xl transition duration-200 font-medium cursor-pointer shrink-0"
                            title={t('navbar.signOut')}
                        >
                            <LogOut className="w-4 h-4 shrink-0" />
                            <span className="hidden sm:inline-block">
                                {t('navbar.signOut')}
                            </span>
                        </button>
                    </>
                )}

                {/* Переключатель языков */}
                <div className="w-18 sm:w-20 shrink-0">
                    <CustomDropdown
                        options={languageOptions}
                        value={i18n.language ? i18n.language.slice(0, 2) : 'ru'}
                        onChange={handleLanguageChange}
                        placeholder={t('navbar.language')}
                        buttonClassName="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium"
                    />
                </div>
            </div>
        </header>
    );
};

export default Navbar;