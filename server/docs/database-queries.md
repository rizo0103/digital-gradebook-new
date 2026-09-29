# Запросы к базе данных

Документ описывает все операции с Firebase Firestore, которые выполняются
сервером Digital Gradebook, и HTTP-примеры для их вызова.

## Общая информация

- База данных: **Cloud Firestore** (`server/src/config/firebase.js`).
- Базовый URL API в локальной разработке: `http://localhost:5000/api`.
- Все маршруты, кроме `POST /auth/login`, требуют заголовок:

  ```http
  Authorization: Bearer <JWT>
  ```

- Роли в JWT: `admin`, `teacher`, `student`.
- Администраторские маршруты дополнительно проверяются `roleMiddleware`.
- В примерах ниже `$TOKEN`, `$GROUP_ID` и `$USER_ID` — переменные окружения
  командной оболочки.

## Структура Firestore

### `users/{userId}`

Основные поля:

| Поле | Назначение |
| --- | --- |
| `email` | Email пользователя |
| `username` | Логин |
| `fullName` / `fullname` | Отображаемое имя |
| `role` | `admin`, `teacher` или `student` |
| `passwordHash` | Хэш пароля; никогда не возвращается клиенту |
| `student_groups` | Группы студента |
| `teacher_groups` | Группы преподавателя |
| `createdAt` | ISO-время создания |

При импорте дополнительные персональные поля (`name_en`, `phone`,
`date_of_birth` и т. п.) сохраняются без преобразования.

### `groups/{groupId}`

```json
{
  "name": "A-101",
  "category": "language",
  "teacherIds": ["teacher-firestore-id"],
  "studentIds": ["student-firestore-id"],
  "createdAt": "2026-09-29T07:00:00.000Z"
}
```

`teacherIds` и `studentIds` используются и для фильтрации доступных групп, и
для проверки доступа к конкретной группе.

### `lessons/{lessonId}`

```json
{
  "groupId": "group-firestore-id",
  "subject": "English",
  "date": "2026-10-01",
  "time": "09:00",
  "teacherId": "teacher-firestore-id",
  "createdAt": "2026-09-29T07:00:00.000Z"
}
```

### `attendance/{attendanceId}`

```json
{
  "groupId": "group-firestore-id",
  "studentId": "student-firestore-id",
  "date": "2026-10-01",
  "subject": "English",
  "status": "present",
  "markedBy": "teacher-firestore-id",
  "createdAt": "2026-09-29T07:00:00.000Z"
}
```

Допустимые значения `status`: `present`, `absent`, `late`, `excused`.
При изменении записи добавляются `updatedBy` и `updatedAt`.

### `schedules/{scheduleId}`

Это отдельная legacy-структура, используемая только старым endpoint
`POST /api/admin/schedule` из `adminController.createSchedule`. Текущий
маршрут генерации расписания сохраняет конкретные занятия в `lessons`, а не в
`schedules`.

## Операции авторизации и пользователей

### Вход: `POST /api/auth/login`

1. Выполняется полный `users.get()` (результат используется для отладочного
   списка).
2. Выполняется поиск `users.where("email", "==", loginInput).limit(1)`.
3. Если результат пуст, выполняется поиск
   `users.where("username", "==", loginInput).limit(1)`.
4. Пароль проверяется через `bcrypt` по `passwordHash` (либо legacy-полю
   `password`), после чего создается JWT.

```bash
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"loginInput\":\"teacher@example.com\",\"password\":\"secret123\"}"
```

### Регистрация пользователя: `POST /api/auth/register`

Только администратор. Сначала проверяется уникальность email:
`users.where("email", "==", email).get()`, затем выполняется
`users.add({...})` с хэшем пароля.

```bash
curl -X POST http://localhost:5000/api/auth/register ^
  -H "Authorization: Bearer $TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"teacher@example.com\",\"password\":\"secret123\",\"fullName\":\"Иван Петров\",\"username\":\"ivan\",\"role\":\"teacher\"}"
```

### Создание студента

`POST /api/admin/students` и legacy-алиас `POST /api/students/create`
выполняют `users/{id}.set(payload)`. Если ID не передан, используется
текущее время; пароль хэшируется, а открытый пароль возвращается один раз в
ответе.

```bash
curl -X POST http://localhost:5000/api/admin/students ^
  -H "Authorization: Bearer $TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"fullName\":\"Анна Смирнова\",\"email\":\"anna@example.com\",\"password\":\"secret123\",\"groupIds\":[\"$GROUP_ID\"]}"
```

### Импорт студентов

`POST /api/admin/import-students` и `POST /api/students/import-json`:

1. Для каждого студента создается `users/{autoId}`.
2. Все пользовательские записи и найденные группы обновляются одним
   Firestore batch (`batch.set`/`batch.update`, затем `batch.commit`).
3. Группы ищутся по имени:
   `groups.where("name", "==", groupName).limit(1)`.
4. Несуществующая группа пропускается, пользователь при этом создается.

```bash
curl -X POST http://localhost:5000/api/admin/import-students ^
  -H "Authorization: Bearer $TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"defaultPassword\":\"secret123\",\"students\":[{\"fullName\":\"Анна Смирнова\",\"student_group\":\"A-101\"}]}"
```

### Получение пользователей

- `GET /api/admin/users` — `users.get()`.
- `GET /api/admin/users?role=teacher` — `users.where("role", "==", "teacher").get()`.
- `GET /api/admin/students` и `GET /api/students` —
  `users.where("role", "==", "student").get()`.

Во всех ответах `passwordHash` удаляется. ID ответа — фактический Firestore
document ID; сохраненное пользовательское поле `id` возвращается как
`customId` в общем списке пользователей.

```bash
curl "http://localhost:5000/api/admin/users?role=teacher" ^
  -H "Authorization: Bearer $TOKEN"
```

### Изменение и удаление пользователя

- `PUT /api/admin/users/:id` и `PUT /api/admin/students/:id`:
  `users/{id}.get()`, затем `users/{id}.update(updateData)`.
  Новый пароль предварительно хэшируется.
- После изменения роли/групп выполняется синхронизация membership:
  `groups.get()`, вычисление новых `teacherIds`/`studentIds` и batch
  `batch.update` изменившихся групп.
- `DELETE /api/admin/users/:id` и `DELETE /api/admin/students/:id`:
  читается пользователь и `groups.get()`, его ID удаляется из всех
  соответствующих массивов групп batch-операцией, затем выполняется
  `users/{id}.delete()`.

```bash
curl -X PUT http://localhost:5000/api/admin/users/$USER_ID ^
  -H "Authorization: Bearer $TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"fullName\":\"Иван Петров\",\"role\":\"teacher\",\"groupIds\":[\"$GROUP_ID\"]}"

curl -X DELETE http://localhost:5000/api/admin/users/$USER_ID ^
  -H "Authorization: Bearer $TOKEN"
```

## Операции с группами

### Получение доступных групп: `GET /api/groups`

- Администратор: `groups.get()` без фильтра.
- Преподаватель/студент: также `groups.get()`, затем фильтрация в Node.js
  по `teacherIds` или `studentIds`.

```bash
curl http://localhost:5000/api/groups -H "Authorization: Bearer $TOKEN"
```

### Создание группы

`POST /api/groups` и `POST /api/admin/groups` выполняют
`groups.add({name, category, teacherIds, studentIds, createdAt})`.

```bash
curl -X POST http://localhost:5000/api/admin/groups ^
  -H "Authorization: Bearer $TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"A-101\",\"category\":\"language\",\"teacherIds\":[],\"studentIds\":[]}"
```

### Студенты группы: `GET /api/groups/:groupId/students`

1. `groups/{groupId}.get()` проверяет существование и права.
2. Для студента выполняется один `users/{userId}.get()`.
3. Для администратора/преподавателя выполняется `users/{studentId}.get()`
   для каждого ID из `studentIds` параллельно.

Пароль из результата удаляется.

### Занятия группы: `GET /api/groups/:groupId/lessons`

После проверки `groups/{groupId}.get()` выполняется
`lessons.where("groupId", "==", groupId).get()`. Результат сортируется в
сервере по `date`, затем по `time`.

```bash
curl "http://localhost:5000/api/groups/$GROUP_ID/lessons" ^
  -H "Authorization: Bearer $TOKEN"
```

### Изменение и удаление группы

- `PUT /api/admin/groups/:id`: `groups/{id}.get()`, затем
  `groups/{id}.update(nextData)`. Для назначенных преподавателей читаются
  `users/{teacherId}` и batch-операцией обновляется `teacher_groups`.
- `DELETE /api/admin/groups/:id`: `groups/{id}.get()`, читаются все
  связанные пользователи, их `student_groups`/`teacher_groups` обновляются
  batch-операцией, затем выполняется `groups/{id}.delete()`.

```bash
curl -X PUT http://localhost:5000/api/admin/groups/$GROUP_ID ^
  -H "Authorization: Bearer $TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"A-101 updated\",\"category\":\"language\",\"teacherIds\":[],\"studentIds\":[\"$USER_ID\"]}"
```

## Операции с посещаемостью

### Чтение: `GET /api/attendance/:groupId`

Сначала читается `groups/{groupId}.get()` для проверки принадлежности.
Затем строится составной запрос:

```js
db.collection('attendance')
  .where('groupId', '==', groupId)
  // опционально: .where('date', '==', date)
  // опционально: .where('subject', '==', subject)
  // для student: .where('studentId', '==', userId)
  .get();
```

Параметры `date` и `subject` передаются query string:

```bash
curl "http://localhost:5000/api/attendance/$GROUP_ID?date=2026-10-01&subject=English" ^
  -H "Authorization: Bearer $TOKEN"
```

### Запись или обновление: `POST /api/attendance`

Доступно администратору и преподавателю. Для преподавателя сначала читается
группа и проверяется `teacherIds`. Затем проверяется студент через
`users/{studentId}.get()`.

Для предотвращения дублей выполняется поиск:

```js
attendance
  .where('groupId', '==', groupId)
  .where('studentId', '==', studentId)
  .where('date', '==', date)
  .where('subject', '==', subject)
  .limit(1)
  .get();
```

Если запись найдена — `attendance/{id}.update({status, updatedBy, updatedAt})`.
Иначе — `attendance.add({groupId, studentId, date, subject, status, markedBy,
createdAt})`.

```bash
curl -X POST http://localhost:5000/api/attendance ^
  -H "Authorization: Bearer $TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"groupId\":\"$GROUP_ID\",\"studentId\":\"$USER_ID\",\"date\":\"2026-10-01\",\"subject\":\"English\",\"status\":\"present\"}"
```

## Операции с расписанием

### Генерация занятий: `POST /api/admin/schedule`

Администратор сначала читает `groups/{groupId}.get()` и проверяет диапазон
дат. Для каждого подходящего дня создается объект занятия, затем сервис
`bulkCreateLessons` записывает его в `lessons`.

Запись выполняется пакетами максимум по 500 документов:

```js
const batch = db.batch();
const lessonRef = db.collection('lessons').doc();
batch.set(lessonRef, {
  groupId, subject, date, time, teacherId, createdAt
});
await batch.commit();
```

```bash
curl -X POST http://localhost:5000/api/admin/schedule ^
  -H "Authorization: Bearer $TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"groupId\":\"$GROUP_ID\",\"subject\":\"English\",\"startDate\":\"2026-10-01\",\"endDate\":\"2026-10-31\",\"daysOfWeek\":[\"Monday\",\"Wednesday\"],\"time\":\"09:00\",\"teacherId\":\"$USER_ID\"}"
```

### Legacy-создание расписания

Функция `adminController.createSchedule` выполняет
`schedules.add({groupId, subject, daysOfWeek, time, teacherId, createdAt})`.
В текущем списке маршрутов она не подключена; актуальный endpoint — генерация
занятий выше.

## Инициализация первого администратора

Команда `npm run seed:admin` выполняет:

1. `users.where("email", "==", ADMIN_EMAIL).get()`;
2. если пользователь не найден — `users.add({...})` с ролью `admin` и
   хэшем пароля.

Команду следует запускать после настройки `.env` и только один раз для
первичного создания администратора.

## Важные особенности запросов

1. Фильтрация групп по ID выполняется в приложении после чтения всей
   коллекции `groups`; это не Firestore `array-contains`.
2. Сортировка занятий выполняется в Node.js, поэтому отдельный индекс
   Firestore для сортировки `lessons` не требуется.
3. Составные запросы посещаемости могут потребовать composite index в
   Firestore. При ошибке `FAILED_PRECONDITION` нужно создать индекс по
   указанным в сообщении полям.
4. Firestore batch имеет лимит 500 операций. Генерация занятий разбивает
   запись на чанки по 500, а импорт студентов и синхронизации групп этот
   лимит отдельно не разбивают — большие импорты следует выполнять частями.
