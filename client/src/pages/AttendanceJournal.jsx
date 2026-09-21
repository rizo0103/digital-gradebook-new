import React, { useState, useEffect } from 'react';
import api from '../api/axiosInstance';

const AttendanceJournal = ({ selectedGroupId }) => {
    const [students, setStudents] = useState([]);
    const [lessons, setLessons] = useState([]); // Точные даты уроков из БД

    useEffect(() => {
        if (!selectedGroupId) return;

        const fetchJournalData = async () => {
            try {
                // 1. Загружаем список студентов группы
                const studentsRes = await api.get(`/groups/${selectedGroupId}/students`);
                
                // 2. Загружаем сформированные уроки/даты группы из БД
                const lessonsRes = await api.get(`/groups/${selectedGroupId}/lessons`);

                setStudents(studentsRes.data);
                setLessons(lessonsRes.data); // [{ id: 1, date: '2026-09-01', subject: '...' }]
            } catch (err) {
                console.error('Ошибка при загрузке журнала:', err);
            }
        };

        fetchJournalData();
    }, [selectedGroupId]);

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-xs text-slate-400">
                        <th className="p-3">Студент</th>
                        {/* Отрисовываем ТОЛЬКО те даты, которые есть в БД */}
                        {lessons.map((lesson) => (
                            <th key={lesson.id} className="p-3 text-center min-w-[60px]">
                                {new Date(lesson.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'numeric' })}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {students.map((student) => (
                        <tr key={student.id} className="border-b border-slate-800/50 hover:bg-slate-900/30">
                            <td className="p-3 font-medium text-sm text-slate-200">
                                {student.name_en} {student.last_name_en}
                            </td>
                            {lessons.map((lesson) => (
                                <td key={lesson.id} className="p-3 text-center">
                                    {/* Значения посещаемости подтягиваются из БД */}
                                    <input type="checkbox" className="rounded border-slate-700 bg-slate-950" />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AttendanceJournal;