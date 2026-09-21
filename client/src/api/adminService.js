import api from './axiosInstance';

// --- Студенты ---
export const getStudents = () => api.get('/admin/students');
export const updateStudent = (id, data) => api.put(`/admin/students/${id}`, data);
export const deleteStudent = (id) => api.delete(`/admin/students/${id}`);

// --- Группы ---
export const getGroups = () => api.get('/groups');
export const updateGroup = (id, data) => api.put(`/admin/groups/${id}`, data);
export const deleteGroup = (id) => api.delete(`/admin/groups/${id}`);