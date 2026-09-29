# Digital Gradebook

## Документация для фронтенда: как отправлять запросы

Этот документ описывает все API-эндпоинты сервера так, чтобы фронтенд-разработчики знали, какие запросы отправлять, какие заголовки нужны и в каком формате передавать данные.

Полная документация по базе данных и внутренним Firestore-запросам:

- [DB-REQUESTS-DOCUMENTATION.md](./DB-REQUESTS-DOCUMENTATION.md)
- [server/docs/database-queries.md](./server/docs/database-queries.md)

## 1. Базовый URL

Локально:

```text
http://localhost:5000/api
```

Если сервер развернут отдельно, используйте переменную окружения фронта:

```js
const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';
```

Все запросы к защищенным роутам должны содержать JWT в заголовке:

```http
Authorization: Bearer <token>
```

Пример:

```js
fetch('http://localhost:5000/api/groups', {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

## 2. Авторизация и токен

После успешного входа сервер возвращает объект вида:

```json
{
  "token": "eyJhbGciOi...",
  "user": {
    "id": "abc123",
    "fullName": "Иван Петров",
    "username": "ivan",
    "email": "ivan@example.com",
    "role": "admin"
  }
}
```

### Сохранение токена

```js
localStorage.setItem('token', response.data.token);
```

### Использование токена

```js
const token = localStorage.getItem('token');
const headers = {
  Authorization: `Bearer ${token}`
};
```

## 3. Ошибки сервера

Основные коды ответов:

- `200` — OK
- `201` — создано
- `400` — некорректные данные
- `401` — токен отсутствует или невалиден
- `403` — доступ запрещен
- `404` — ресурс не найден
- `500` — внутренняя ошибка сервера

Формат ошибок:

```json
{
  "message": "Описание ошибки"
}
```

## 4. Auth API

### 4.1 Вход в систему

`POST /api/auth/login`

Body:

```json
{
  "loginInput": "ivan@example.com",
  "password": "secret123"
}
```

Также можно логиниться через username:

```json
{
  "loginInput": "ivan",
  "password": "secret123"
}
```

Пример:

```js
const response = await axios.post(`${API_URL}/auth/login`, {
  loginInput: 'ivan@example.com',
  password: 'secret123'
});
```

### 4.2 Регистрация пользователя

`POST /api/auth/register`

Только для админа.

Body:

```json
{
  "email": "teacher@example.com",
  "password": "secret123",
  "fullName": "Иван Петров",
  "username": "ivan",
  "role": "teacher"
}
```

Роли допустимы:

- `admin`
- `teacher`
- `student`

Пример:

```js
await axios.post(`${API_URL}/auth/register`, payload, {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

## 5. Groups API

### 5.1 Получить доступные группы

`GET /api/groups`

Требуется токен.

Пример:

```js
const response = await axios.get(`${API_URL}/groups`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

Ответ:

```json
[
  {
    "id": "group_123",
    "name": "A-101",
    "category": "language",
    "teacherIds": ["teacher_1"],
    "studentIds": ["student_1", "student_2"],
    "createdAt": "2026-09-29T07:00:00.000Z"
  }
]
```

### 5.2 Создать группу

`POST /api/groups`

Только админ.

Body:

```json
{
  "name": "A-101",
  "category": "language",
  "teacherIds": ["teacher_1"],
  "studentIds": ["student_1", "student_2"]
}
```

Пример:

```js
await axios.post(`${API_URL}/groups`, {
  name: 'A-101',
  category: 'language',
  teacherIds: ['teacher_1'],
  studentIds: ['student_1', 'student_2']
}, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### 5.3 Получить студентов группы

`GET /api/groups/:groupId/students`

Требуется токен.

Пример:

```js
const response = await axios.get(`${API_URL}/groups/${groupId}/students`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

Ответ:

```json
[
  {
    "id": "student_1",
    "fullName": "Анна Смирнова",
    "username": "anna",
    "email": "anna@example.com",
    "role": "student",
    "student_groups": ["A-101"]
  }
]
```

### 5.4 Получить занятия группы

`GET /api/groups/:groupId/lessons`

Пример:

```js
const response = await axios.get(`${API_URL}/groups/${groupId}/lessons`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

Ответ:

```json
[
  {
    "id": "lesson_1",
    "groupId": "group_123",
    "subject": "English",
    "date": "2026-10-01",
    "time": "09:00",
    "teacherId": "teacher_1",
    "createdAt": "2026-09-29T07:00:00.000Z"
  }
]
```

## 6. Attendance API

### 6.1 Получить журнал посещаемости

`GET /api/attendance/:groupId`

Можно фильтровать по query-параметрам:

```text
GET /api/attendance/:groupId?date=2026-10-01&subject=English
```

Пример:

```js
const response = await axios.get(`${API_URL}/attendance/${groupId}?date=2026-10-01&subject=English`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

Ответ:

```json
[
  {
    "id": "attendance_1",
    "groupId": "group_123",
    "studentId": "student_1",
    "date": "2026-10-01",
    "subject": "English",
    "status": "present",
    "markedBy": "teacher_1",
    "createdAt": "2026-09-29T07:00:00.000Z"
  }
]
```

### 6.2 Сохранить или обновить посещаемость

`POST /api/attendance`

Доступно только для `admin` и `teacher`.

Body:

```json
{
  "groupId": "group_123",
  "studentId": "student_1",
  "date": "2026-10-01",
  "subject": "English",
  "status": "present"
}
```

Допустимые статусы:

- `present`
- `absent`
- `late`
- `excused`

Пример:

```js
await axios.post(`${API_URL}/attendance`, {
  groupId: groupId,
  studentId: studentId,
  date: '2026-10-01',
  subject: 'English',
  status: 'present'
}, {
  headers: { Authorization: `Bearer ${token}` }
});
```

## 7. Admin API

Все запросы ниже требуют `Authorization` и роль `admin`.

### 7.1 Получить всех пользователей

`GET /api/admin/users`

Опционально фильтр по роли:

```text
GET /api/admin/users?role=teacher
GET /api/admin/users?role=student
```

Пример:

```js
const response = await axios.get(`${API_URL}/admin/users?role=teacher`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### 7.2 Получить список студентов

`GET /api/admin/students`

Пример:

```js
await axios.get(`${API_URL}/admin/students`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### 7.3 Создать студента

`POST /api/admin/students`

Body:

```json
{
  "fullName": "Анна Смирнова",
  "email": "anna@example.com",
  "password": "secret123",
  "groupIds": ["group_123"]
}
```

Пример:

```js
const response = await axios.post(`${API_URL}/admin/students`, {
  fullName: 'Анна Смирнова',
  email: 'anna@example.com',
  password: 'secret123',
  groupIds: [groupId]
}, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### 7.4 Импорт списка студентов

`POST /api/admin/import-students`

Body:

```json
{
  "defaultPassword": "secret123",
  "students": [
    {
      "fullName": "Анна Смирнова",
      "student_group": "A-101"
    },
    {
      "fullName": "Илья Петров",
      "student_group": "A-101"
    }
  ]
}
```

Пример:

```js
await axios.post(`${API_URL}/admin/import-students`, {
  defaultPassword: 'secret123',
  students: [{
    fullName: 'Анна Смирнова',
    student_group: 'A-101'
  }]
}, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### 7.5 Обновить пользователя

`PUT /api/admin/users/:id`

Body можно передавать частично:

```json
{
  "fullName": "Иван Петров",
  "role": "teacher",
  "groupIds": ["group_123"],
  "password": "newPassword123"
}
```

Пример:

```js
await axios.put(`${API_URL}/admin/users/${userId}`, {
  fullName: 'Иван Петров',
  role: 'teacher',
  groupIds: [groupId],
  password: 'newPassword123'
}, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### 7.6 Удалить пользователя

`DELETE /api/admin/users/:id`

```js
await axios.delete(`${API_URL}/admin/users/${userId}`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### 7.7 Обновить группу

`PUT /api/admin/groups/:id`

Body:

```json
{
  "name": "A-101",
  "category": "language",
  "teacherIds": ["teacher_1"],
  "studentIds": ["student_1", "student_2"]
}
```

Пример:

```js
await axios.put(`${API_URL}/admin/groups/${groupId}`, {
  name: 'A-101',
  category: 'language',
  teacherIds: ['teacher_1'],
  studentIds: ['student_1', 'student_2']
}, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### 7.8 Удалить группу

`DELETE /api/admin/groups/:id`

```js
await axios.delete(`${API_URL}/admin/groups/${groupId}`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### 7.9 Сгенерировать расписание занятий

`POST /api/admin/schedule`

Body:

```json
{
  "groupId": "group_123",
  "subject": "English",
  "startDate": "2026-10-01",
  "endDate": "2026-10-31",
  "daysOfWeek": ["Monday", "Wednesday"],
  "time": "09:00",
  "teacherId": "teacher_1"
}
```

Пример:

```js
await axios.post(`${API_URL}/admin/schedule`, {
  groupId,
  subject: 'English',
  startDate: '2026-10-01',
  endDate: '2026-10-31',
  daysOfWeek: ['Monday', 'Wednesday'],
  time: '09:00',
  teacherId: teacherId
}, {
  headers: { Authorization: `Bearer ${token}` }
});
```

## 8. Отдельные legacy-роуты

В проекте есть несколько маршрутов, которые фактически дублируют административные действия:

- `POST /api/students/create`
- `POST /api/students/import-json`
- `PUT /api/students/:id`
- `DELETE /api/students/:id`

Их лучше использовать только при необходимости совместимости с существующим кодом; для новых задач предпочтительнее использовать `/api/admin/...`.

## 9. Рекомендуемый шаблон работы с API

```js
import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

Пример запроса:

```js
const { data } = await api.get('/groups');
```

## 10. Быстрые примеры для фронтенда

### Вход

```js
const { data } = await api.post('/auth/login', {
  loginInput: 'ivan@example.com',
  password: 'secret123'
});
localStorage.setItem('token', data.token);
```

### Получить все группы

```js
const { data } = await api.get('/groups');
```

### Получить журнал посещаемости

```js
const { data } = await api.get(`/attendance/${groupId}?date=2026-10-01&subject=English`);
```

### Проставить посещаемость

```js
await api.post('/attendance', {
  groupId,
  studentId,
  date: '2026-10-01',
  subject: 'English',
  status: 'present'
});
```

## 11. Полезные замечания

- У админских роутов приоритет — использовать `/api/admin`.
- Для всех защищенных запросов обязательно передавать Bearer-токен.
- `status` для посещаемости допускает только: `present`, `absent`, `late`, `excused`.
- Для `daysOfWeek` в генерации расписания допустимы значения: `Sunday`, `Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`, `Saturday`.
- Роли пользователей: `admin`, `teacher`, `student`.

## 12. Структура проекта

- [client](./client) — frontend
- [server](./server) — backend

## 13. Дополнительные источники

- [DB-REQUESTS-DOCUMENTATION.md](./DB-REQUESTS-DOCUMENTATION.md)
- [server/docs/database-queries.md](./server/docs/database-queries.md)
