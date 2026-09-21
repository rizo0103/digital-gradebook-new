/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/useAuth';
import { LogIn, User, Lock, AlertCircle, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import logo from '../assets/Logo.png';

const Login = () => {
    const [loginInput, setLoginInput] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { loginInput, password });
            login(response.data.user, response.data.token);
            navigate('/groups');
        } catch (err) {
            setError(err.response?.data?.message || 'Неверный логин или пароль');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row justify-between relative overflow-hidden">

            <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900/60 border-r border-slate-800/80 p-12 flex-col justify-between overflow-hidden">
                {/* Фоновые свечения */}
                <div className="absolute -top-20 -left-20 w-96 h-96 bg-[#0F4C9C]/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-[#8C1D35]/20 rounded-full blur-3xl pointer-events-none" />

                {/* Векторная SVG-иллюстрация + Текст */}
                <div className="relative z-10 my-auto flex flex-col items-center text-center max-w-lg mx-auto">
                    {/* Кастомная SVG Графика посещаемости */}
                    <div className="w-full max-w-sm mb-8 relative">
                        <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto drop-shadow-2xl">
                            {/* Сетка фоновая */}
                            <path d="M50 250H350M50 200H350M50 150H350M50 100H350" stroke="#1E293B" strokeWidth="1.5" strokeDasharray="4 4" />

                            {/* Карточка плашки 1 */}
                            <rect x="60" y="80" width="120" height="150" rx="16" fill="#0F172A" stroke="#1E293B" strokeWidth="2" />
                            <rect x="80" y="105" width="80" height="10" rx="5" fill="#0F4C9C" />
                            <rect x="80" y="125" width="50" height="8" rx="4" fill="#334155" />
                            <circle cx="100" cy="170" r="16" fill="#0F4C9C" fillOpacity="0.2" stroke="#0F4C9C" strokeWidth="2" />
                            <path d="M95 170L99 174L105 166" stroke="#0F4C9C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                            {/* Карточка плашки 2 */}
                            <rect x="220" y="50" width="120" height="180" rx="16" fill="#0F172A" stroke="#0F4C9C" strokeWidth="2" strokeOpacity="0.5" />
                            <rect x="240" y="75" width="80" height="10" rx="5" fill="#8C1D35" />
                            <rect x="240" y="95" width="60" height="8" rx="4" fill="#334155" />

                            {/* Интерактивные иконки статусов в графике */}
                            <rect x="240" y="125" width="80" height="28" rx="8" fill="#8C1D35" fillOpacity="0.15" stroke="#8C1D35" strokeOpacity="0.4" />
                            <text x="280" y="143" fill="#F43F5E" fontSize="10" fontWeight="bold" textAnchor="middle">Н / Б</text>

                            <rect x="240" y="165" width="80" height="28" rx="8" fill="#0F4C9C" fillOpacity="0.15" stroke="#0F4C9C" strokeOpacity="0.4" />
                            <text x="280" y="183" fill="#38BDF8" fontSize="10" fontWeight="bold" textAnchor="middle">БЫЛ</text>

                            {/* Декоративный соединительный график */}
                            <path d="M120 170 C 170 120, 190 200, 240 140" stroke="url(#paint0_linear)" strokeWidth="3" strokeLinecap="round" />

                            <defs>
                                <linearGradient id="paint0_linear" x1="120" y1="170" x2="240" y2="140" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#0F4C9C" />
                                    <stop offset="1" stopColor="#8C1D35" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>

                    <h1 className="text-2xl font-extrabold text-white mb-3">
                        Электронный журнал посещаемости
                    </h1>
                    <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
                        Быстрый и удобный учет присутствия студентов на занятиях с разграничением прав доступа.
                    </p>

                    {/* Фичи системы */}
                    <div className="flex items-center gap-6 mt-8 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-[#0F4C9C]" />
                            <span>Безопасный доступ</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Zap className="w-4 h-4 text-[#8C1D35]" />
                            <span>Мгновенный отклик</span>
                        </div>
                    </div>
                </div>

                {/* Футер слева */}
                <div className="relative z-10 text-xs text-slate-600">
                    © 2026 Digital Gradebook. Все права защищены.
                </div>
            </div>

            {/* Правая часть с формой входа */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
                {/* Фоновое свечение для мобилок */}
                <div className="lg:hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#0F4C9C]/15 rounded-full blur-3xl pointer-events-none" />

                <div className="w-full max-w-md space-y-8 relative z-10 border border-slate-800/50 bg-slate-900/60 backdrop-blur-md rounded-3xl p-8 sm:p-10 shadow-lg shadow-[#0F4C9C]/20">

                    {/* Логотип для МОБИЛЬНЫХ устройств (скрыт на десктопе) */}
                    <div className="flex lg:hidden flex-col items-center text-center mb-6">
                        <img
                            src={logo}
                            alt="Logo"
                            className="h-14 w-auto object-contain mb-3 drop-shadow-[0_0_12px_rgba(15,76,156,0.3)]"
                        />
                        <h2 className="text-xl font-bold text-white">Digital Gradebook</h2>
                    </div>

                    {/* Заголовок формы */}
                    <div className="text-center mb-6">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                            Вход в систему
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-400 mt-2">
                            Пожалуйста, введите ваш логин или email и пароль
                        </p>
                    </div>

                    {/* Сообщение об ошибке */}
                    {error && (
                        <div className="flex items-center gap-2.5 bg-rose-950/40 border border-rose-800/50 text-rose-300 p-4 rounded-2xl text-sm animate-fade-in">
                            <AlertCircle className="w-5 h-5 text-[#8C1D35] flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Форма */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Поле Логин/Email */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                Логин или Email
                            </label>
                            <div className="relative">
                                <User className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={loginInput}
                                    onChange={(e) => setLoginInput(e.target.value)}
                                    required
                                    placeholder="Username или name@school.com"
                                    className="w-full bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-600 pl-12 pr-4 py-3.5 rounded-2xl focus:outline-none focus:border-[#0F4C9C] focus:ring-1 focus:ring-[#0F4C9C] transition text-sm shadow-inner"
                                />
                            </div>
                        </div>

                        {/* Поле Пароль */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                Пароль
                            </label>
                            <div className="relative">
                                <Lock className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-600 pl-12 pr-4 py-3.5 rounded-2xl focus:outline-none focus:border-[#0F4C9C] focus:ring-1 focus:ring-[#0F4C9C] transition text-sm shadow-inner"
                                />
                            </div>
                        </div>

                        {/* Кнопка Входа */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-4 bg-[#0F4C9C] hover:bg-[#0B3B7A] active:bg-[#082A57] text-white font-semibold py-4 rounded-2xl transition-all duration-200 shadow-lg shadow-[#0F4C9C]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                        >
                            {loading ? (
                                <span className="text-sm">Авторизация...</span>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    <span>Войти в аккаунт</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;