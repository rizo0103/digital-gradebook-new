/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/useAuth';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
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
            const response = await api.post('/auth/login', { email, password });
            login(response.data.user, response.data.token);
            navigate('/groups');
        } catch (err) {
            setError(err.response?.data?.message || 'Неверный email или пароль');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Мягкое фоновое свечение */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#0F4C9C]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-[#8C1D35]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl shadow-black/80 z-10">

                {/* Шапка формы с местом под логотип .png */}
                <div className="flex flex-col items-center mb-8">
                    <div className="mb-4 flex items-center justify-center">
                        {/* Замените '/logo.png' на верный путь к вашему файлу логотипа */}
                        <img
                            src="src/assets/Logo.png"
                            alt="Logo"
                            className="h-16 w-auto object-contain drop-shadow-[0_0_12px_rgba(15,76,156,0.3)]"
                        />
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                        Digital Gradebook
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Введите данные для входа в систему
                    </p>
                </div>

                {/* Сообщение об ошибке */}
                {error && (
                    <div className="flex items-center gap-2 bg-rose-950/40 border border-rose-800/50 text-rose-300 p-3.5 rounded-2xl text-sm mb-6">
                        <AlertCircle className="w-5 h-5 text-[#8C1D35] flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="teacher@school.com"
                                className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-600 pl-11 pr-4 py-3 rounded-2xl focus:outline-none focus:border-[#0F4C9C] focus:ring-1 focus:ring-[#0F4C9C] transition text-sm"
                            />
                        </div>
                    </div>

                    {/* Пароль */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Пароль
                        </label>
                        <div className="relative">
                            <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-600 pl-11 pr-4 py-3 rounded-2xl focus:outline-none focus:border-[#0F4C9C] focus:ring-1 focus:ring-[#0F4C9C] transition text-sm"
                            />
                        </div>
                    </div>

                    {/* Яркая и четко видимая кнопка входа */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 bg-[#0F4C9C] hover:bg-[#0B3B7A] active:bg-[#082A57] text-white font-semibold py-3.5 rounded-2xl transition-all duration-200 shadow-lg shadow-[#0F4C9C]/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="text-sm">Вход...</span>
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
    );
};

export default Login;