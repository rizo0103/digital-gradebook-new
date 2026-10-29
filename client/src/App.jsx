/* eslint-disable no-unused-vars */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import GroupsList from './pages/GroupsList';
import AttendanceJournal from './pages/AttendanceJournal';
import AdminPanel from './pages/AdminPanel';
import { useTranslation } from 'react-i18next';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/privacy" element={<>
              # Privacy Policy for Sejong App

              Effective Date: [Укажите дату]

              1. Introduction
              Sejong App ("we", "our", "us") respects your privacy and is committed to protecting the personal data of our users.

              2. Information We Collect
              - Account Information: Name, email address, password hash, student ID.
              - User Content: Profile photo, chat messages, images, and voice recordings shared within the app.
              - Technical Data: Push notification tokens (FCM Token), device information.

              3. How We Use Your Information
              We use your information solely to provide app functionality, including user authentication, academic schedule and gradebook tracking, chat communications, and push notifications.

              4. Data Retention & Account Deletion
              You have the right to delete your account and all associated personal data at any time directly through the app settings or by submitting a request at: [Укажите ссылку на страницу удаления аккаунта или Email поддержки].

              5. Data Security
              All data transmissions are encrypted using HTTPS/TLS protocols. We do not sell or share your personal data with third parties for commercial or marketing purposes.

              6. Contact Us
              For privacy-related inquiries, contact us at: [Укажите контактный email].
              ✅ Чек-лист перед отправкой модераторам Google Play
              Сервер работает исключительно по HTTPS.
              Доступен API эндпоинт для удаления аккаунта.
              Опубликована веб-страница с Политикой Конфиденциальности (Privacy Policy URL).
              Опубликована веб-страница/форма для запроса на удаление данных (Account Deletion Request URL).
              Заполнена форма Data Safety в Google Play Console согласно Таблице из Раздела 2.
            </>} />

            <Route element={<ProtectedRoute />}>
              <Route path="/groups" element={<GroupsList />} />
              <Route path="/journal/:groupId" element={<AttendanceJournal />} />
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminPanel />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/groups" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;