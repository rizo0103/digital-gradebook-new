/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { Users, ChevronRight, GraduationCap, FolderX } from 'lucide-react';

const GroupsList = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await api.get('/groups');
        setGroups(response.data);
      } catch (err) {
        console.error('Ошибка загрузки групп', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400 font-medium">
          <div className="w-5 h-5 border-2 border-[#0F4C9C] border-t-transparent rounded-full animate-spin" />
          <span>Загрузка групп...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Заголовок страницы */}
        <div className="flex items-center justify-between mb-8 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#0F4C9C]/15 border border-[#0F4C9C]/30 rounded-2xl text-[#0F4C9C]">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Доступные группы
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Выберите группу для просмотра или заполнения журнала посещаемости
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-slate-400">
            Всего: {groups.length}
          </span>
        </div>

        {/* Пустое состояние */}
        {groups.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-12 text-center max-w-md mx-auto">
            <FolderX className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-200">Группы не найдены</h3>
            <p className="text-xs text-slate-400 mt-1">
              У вас пока нет привязанных групп или список пуст.
            </p>
          </div>
        ) : (
          /* Сетка карточек групп */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((group) => (
              <div
                key={group.id}
                onClick={() => navigate(`/journal/${group.id}`)}
                className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-[#0F4C9C]/50 p-5 rounded-2xl cursor-pointer transition-all duration-200 flex items-center justify-between shadow-lg shadow-black/40 hover:shadow-[#0F4C9C]/10 active:scale-[0.99]"
              >
                <div className="flex items-center gap-4">
                  {/* Иконка группы с подсвечивающимся фоном */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 group-hover:text-[#0F4C9C] group-hover:border-[#0F4C9C]/30 transition-colors duration-200">
                    <Users className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="font-bold text-lg text-slate-100 group-hover:text-white transition">
                      {group.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                      <p className="text-xs font-medium text-slate-400">
                        Студентов: <span className="text-slate-200">{group.studentIds?.length || 0}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Стрелка перехода */}
                <div className="p-2 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-500 group-hover:text-[#0F4C9C] group-hover:border-[#0F4C9C]/40 group-hover:translate-x-0.5 transition-all duration-200">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupsList;