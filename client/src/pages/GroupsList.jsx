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
        setGroups(response.data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
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
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-slate-400 font-medium text-sm sm:text-base">
          <div className="w-5 h-5 border-2 border-[#0F4C9C] border-t-transparent rounded-full animate-spin" />
          <span>Загрузка групп...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">

        {/* Заголовок страницы — Адаптивный флекс-контейнер */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 border-b border-slate-800/80 pb-4 sm:pb-5">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 sm:p-2.5 bg-[#0F4C9C]/15 border border-[#0F4C9C]/30 rounded-xl sm:rounded-2xl text-[#0F4C9C] shrink-0 mt-0.5 sm:mt-0">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Доступные группы
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Выберите группу для просмотра или заполнения журнала
              </p>
            </div>
          </div>

          <span className="self-start sm:self-auto text-xs font-semibold px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg sm:rounded-xl text-slate-400 shrink-0">
            Всего: {groups.length}
          </span>
        </div>

        {/* Пустое состояние */}
        {groups.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto my-6">
            <FolderX className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base sm:text-lg font-semibold text-slate-200">Группы не найдены</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              У вас пока нет привязанных групп или список пуст.
            </p>
          </div>
        ) : (
          /* Сетка карточек групп */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {groups.map((group) => (
              <div
                key={group.id}
                onClick={() => navigate(`/journal/${group.id}`)}
                className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-[#0F4C9C]/50 p-4 sm:p-5 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-200 flex items-center justify-between shadow-lg shadow-black/40 hover:shadow-[#0F4C9C]/10 active:scale-[0.98]"
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 pr-2">
                  {/* Иконка группы */}
                  <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 group-hover:text-[#0F4C9C] group-hover:border-[#0F4C9C]/30 transition-colors duration-200 shrink-0">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>

                  {/* Инфо о группе с обрезкой длинного текста */}
                  <div className="min-w-0">
                    <h3 className="font-bold text-base sm:text-lg text-slate-100 group-hover:text-white transition truncate">
                      {group.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                      <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 shrink-0" />
                      <p className="text-xs font-medium text-slate-400 truncate">
                        Студентов: <span className="text-slate-200">{group.studentIds?.length || 0}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Стрелка перехода */}
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-950/50 border border-slate-800 text-slate-500 group-hover:text-[#0F4C9C] group-hover:border-[#0F4C9C]/40 group-hover:translate-x-0.5 transition-all duration-200 shrink-0">
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
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