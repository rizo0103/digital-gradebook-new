# Frontend API Request Guide

Base API prefix is mounted from `server/src/index.js`:

```txt
/api/auth
/api/groups
/api/attendance
/api/admin
/api/students
```

All request and response bodies are JSON. Send:

```http
Content-Type: application/json
```

For every protected route, send the JWT returned by login:

```http
Authorization: Bearer <token>
```

The token payload contains `{ id, role }`. Roles used by the backend are:

```txt
admin | teacher | student
```

## Auth

### Login

```http
POST /api/auth/login
```

Public route.

Request:

```json
{
  "loginInput": "teacher@example.com",
  "password": "password123"
}
```

`loginInput` can be either `email` or `username`.

Success response:

```json
{
  "token": "jwt-token",
  "user": {
    "id": "userId",
    "fullName": "User Name",
    "username": "username",
    "email": "user@example.com",
    "role": "teacher"
  }
}
```

Common errors:

```txt
400 missing fields or wrong credentials
500 server error
```

### Register User

```http
POST /api/auth/register
```

Requires `admin`.

Request:

```json
{
  "email": "teacher@example.com",
  "username": "teacher1",
  "password": "password123",
  "fullName": "Teacher One",
  "role": "teacher"
}
```

Required fields: `email`, `password`, `fullName`, `role`.

Rules:

```txt
role must be admin, teacher, or student
password must be at least 8 characters
username is optional; backend defaults to email prefix
```

Success response:

```json
{
  "id": "createdUserId",
  "message": "..."
}
```

## Groups

### Get Current User Groups

```http
GET /api/groups
```

Requires any authenticated user.

Behavior by role:

```txt
admin: returns all groups
teacher: returns groups where teacherIds includes current user id
student: returns groups where studentIds includes current user id
```

Success response:

```json
[
  {
    "id": "groupId",
    "name": "A1 Korean",
    "category": "language",
    "teacherIds": ["teacherId"],
    "studentIds": ["studentId"],
    "createdAt": "2026-09-30T10:00:00.000Z"
  }
]
```

### Create Group

```http
POST /api/groups
```

Requires `admin`.

Request:

```json
{
  "name": "A1 Korean",
  "category": "language",
  "teacherIds": ["teacherId"],
  "studentIds": ["studentId"]
}
```

Required: `name`.

Optional:

```txt
category defaults to other
teacherIds defaults to []
studentIds defaults to []
```

Success response:

```json
{
  "id": "groupId",
  "name": "A1 Korean",
  "category": "language",
  "teacherIds": ["teacherId"],
  "studentIds": ["studentId"]
}
```

### Get Group Students

```http
GET /api/groups/:groupId/students
```

Requires any authenticated user with access to the group.

Access:

```txt
admin: any group
teacher: only assigned groups
student: only assigned groups; receives only their own user record
```

Success response:

```json
[
  {
    "id": "studentId",
    "fullName": "Student Name",
    "email": "student@example.com",
    "username": "student1",
    "role": "student",
    "student_groups": ["groupId"]
  }
]
```

`passwordHash` is removed from the response.

### Get Group Lessons

```http
GET /api/groups/:groupId/lessons
```

Requires any authenticated user with access to the group.

Success response:

```json
[
  {
    "id": "lessonId",
    "groupId": "groupId",
    "subject": "Korean",
    "date": "2026-10-01",
    "time": "09:00",
    "teacherId": "teacherId"
  }
]
```

Lessons are sorted by `date` and `time`.

## Attendance

### Get Group Attendance

```http
GET /api/attendance/:groupId
GET /api/attendance/:groupId?date=2026-10-01
GET /api/attendance/:groupId?date=2026-10-01&subject=Korean
```

Requires any authenticated user with access to the group.

Access:

```txt
admin: any group
teacher: only assigned groups
student: only assigned groups, and only their own attendance records
```

Query params:

```txt
date optional, exact match, recommended format YYYY-MM-DD
subject optional, exact match
```

Success response:

```json
[
  {
    "id": "attendanceId",
    "groupId": "groupId",
    "studentId": "studentId",
    "date": "2026-10-01",
    "subject": "Korean",
    "status": "present",
    "markedBy": "teacherId",
    "createdAt": "2026-09-30T10:00:00.000Z"
  }
]
```

### Save Attendance

```http
POST /api/attendance
```

Requires `admin` or `teacher`.

Request:

```json
{
  "groupId": "groupId",
  "studentId": "studentId",
  "date": "2026-10-01",
  "subject": "Korean",
  "status": "present"
}
```

Required fields:

```txt
groupId
studentId
date
status
```

`subject` is read as a string and may be empty, but frontend should send it if lessons use subjects.

Accepted status values and aliases:

```txt
present: present, was, came, attended
late: late, delayed, tardy, opozdal
absent: absent, not_present, notpresent, missed, was_not, wasnt, notwas, not_was
excused: excused
```

The backend stores the normalized status: `present`, `late`, `absent`, or `excused`.

If a record already exists for the same `groupId + studentId + date + subject`, backend updates it.

Create response:

```json
{
  "id": "attendanceId",
  "message": "..."
}
```

Update response:

```json
{
  "id": "attendanceId",
  "message": "..."
}
```

### Student Attendance Stats

```http
GET /api/attendance/get-student-attendance
```

Intended role: `student`.

Important backend caveat: this route is currently declared after `GET /api/attendance/:groupId`, so Express will match `get-student-attendance` as a `groupId` first. Until the backend route order is changed, this endpoint may not work as intended.

Expected success response after route fix:

```json
{
  "userId": "studentId",
  "groups": [
    {
      "groupId": "groupId",
      "groupName": "A1 Korean",
      "present": 10,
      "absent": 2,
      "late": 1
    }
  ]
}
```

## Admin Users And Students

All routes in this section require `admin`.

### Get Users

```http
GET /api/admin/users
GET /api/admin/users?role=teacher
GET /api/admin/users?role=student
GET /api/admin/users?role=admin
```

Success response:

```json
[
  {
    "id": "firestoreUserId",
    "customId": "optionalOriginalId",
    "fullName": "User Name",
    "email": "user@example.com",
    "username": "username",
    "role": "student",
    "student_groups": ["groupId"]
  }
]
```

`passwordHash` is removed from the response. If user data had its own `id` field, backend returns Firestore document id as `id` and the original value as `customId`.

### Get Students

```http
GET /api/admin/students
GET /api/students
```

Both routes call the same controller.

Success response:

```json
[
  {
    "id": "studentId",
    "fullName": "Student Name",
    "email": "student@example.com",
    "username": "student1",
    "role": "student",
    "student_groups": ["groupId"]
  }
]
```

### Create Student

```http
POST /api/admin/students
POST /api/students/create
```

Both routes call the same controller.

Request:

```json
{
  "fullName": "Student Name",
  "email": "student@example.com",
  "username": "student1",
  "password": "password123",
  "student_groups": ["groupId"]
}
```

Useful optional fields supported by backend:

```txt
id
fullname
groupIds
name_en
last_name_en
name_tj
last_name_tj
name_kr
last_name_kr
date_of_birth
gender
nationality
phone
```

Defaults:

```txt
id defaults to Date.now().toString()
username is generated if missing
email defaults to <username>@school.com
password is generated if missing
role is forced to student
student_groups can also be sent as groupIds
```

Success response:

```json
{
  "message": "...",
  "student": {
    "id": "studentId",
    "username": "student1",
    "defaultPassword": "password123",
    "email": "student@example.com"
  }
}
```

Save `defaultPassword` on the frontend if the admin needs to show it once.

### Import Students

```http
POST /api/admin/import-students
POST /api/students/import-json
```

Both routes call the same controller.

Request:

```json
{
  "defaultPassword": "password123",
  "students": [
    {
      "fullName": "Student One",
      "email": "student1@example.com",
      "username": "student1",
      "student_group": "A1 Korean"
    },
    {
      "name_en": "Student",
      "last_name_en": "Two",
      "groupName": "A1 Korean"
    }
  ]
}
```

Required:

```txt
students must be a non-empty array
each student must have fullName, or enough name fields to build one
```

Student group field aliases:

```txt
student_group
student_groups
group
group_name
groupName
```

`defaultPassword` is used only if it is at least 8 characters. Otherwise backend uses `STUDENT_DEFAULT_PASSWORD` if valid, or generates passwords.

Success response:

```json
{
  "message": "...",
  "students": [
    {
      "id": "studentId",
      "fullName": "Student One",
      "email": "student1@example.com",
      "username": "student1",
      "password": "password123",
      "groups": ["A1 Korean"]
    }
  ]
}
```

Group import note: imported students are linked to existing groups by group `name`, not group id.

### Update User Or Student

```http
PUT /api/admin/users/:id
PUT /api/admin/students/:id
PUT /api/students/:id
```

These routes call the same update logic.

Request examples:

```json
{
  "fullName": "New Name",
  "email": "new@example.com",
  "username": "newusername",
  "role": "student",
  "student_groups": ["groupId"],
  "password": "newPassword123"
}
```

```json
{
  "fullName": "Teacher Name",
  "role": "teacher",
  "teacher_groups": ["groupId"]
}
```

Group assignment can also be sent as:

```json
{
  "role": "student",
  "groupIds": ["groupId"]
}
```

Rules:

```txt
id, customId, and groupIds are not saved directly to the user document
password is hashed and saved as passwordHash if non-empty
role defaults to student if omitted
student role writes student_groups and removes teacher_groups
teacher role writes teacher_groups and removes student_groups
group membership arrays in groups are synchronized after update
```

Success response:

```json
{
  "message": "..."
}
```

### Delete User Or Student

```http
DELETE /api/admin/users/:id
DELETE /api/admin/students/:id
DELETE /api/students/:id
```

These routes call the same delete logic.

Behavior:

```txt
removes deleted teacher id from group.teacherIds
removes deleted student id from group.studentIds
deletes the user document
```

Success response:

```json
{
  "message": "..."
}
```

## Admin Groups

All routes in this section require `admin`.

### Create Group

```http
POST /api/admin/groups
```

Request:

```json
{
  "name": "A1 Korean",
  "category": "language",
  "teacherIds": ["teacherId"],
  "studentIds": ["studentId"]
}
```

Rules:

```txt
name is required
category must be language, topik, or other
teacherIds and studentIds must be arrays
```

Success response:

```json
{
  "id": "groupId",
  "message": "..."
}
```

### Update Group

```http
PUT /api/admin/groups/:id
```

Request:

```json
{
  "name": "A1 Korean Updated",
  "category": "language",
  "teacherIds": ["teacherId"],
  "studentIds": ["studentId"]
}
```

Rules:

```txt
teacherIds defaults to [] if omitted
studentIds defaults to [] if omitted
teacher user documents are updated to include this group id in teacher_groups
student user documents are not updated here; only group.studentIds is updated
```

Success response:

```json
{
  "message": "..."
}
```

### Delete Group

```http
DELETE /api/admin/groups/:id
```

Behavior:

```txt
removes group id from assigned teachers' teacher_groups
removes group id from assigned students' student_groups
deletes the group document
```

Success response:

```json
{
  "message": "..."
}
```

## Admin Schedule

### Generate Lessons For A Date Range

```http
POST /api/admin/schedule
```

Requires `admin`.

Request:

```json
{
  "groupId": "groupId",
  "subject": "Korean",
  "startDate": "2026-10-01",
  "endDate": "2026-10-31",
  "daysOfWeek": ["Monday", "Wednesday", "Friday"],
  "time": "09:00",
  "teacherId": "teacherId"
}
```

Required:

```txt
groupId
startDate in YYYY-MM-DD format
endDate in YYYY-MM-DD format
daysOfWeek as a non-empty array
```

Optional:

```txt
subject defaults to empty string
time defaults to 00:00, but if sent must be HH:mm
teacherId defaults to null
```

Allowed `daysOfWeek` values:

```txt
Sunday
Monday
Tuesday
Wednesday
Thursday
Friday
Saturday
```

Success response:

```json
{
  "message": "...",
  "count": 12
}
```

## Legacy Admin Schedule Controller

`adminController.createSchedule` exists in code but is not mounted in the current routes. The mounted schedule endpoint is:

```http
POST /api/admin/schedule
```

using `scheduleController.generateSchedule`.

## Error Shape

Most errors return:

```json
{
  "message": "error text"
}
```

Some attendance read errors also include:

```json
{
  "message": "error text",
  "error": "internal error message"
}
```

Common status codes:

```txt
400 invalid or missing request data
401 missing, invalid, or expired token
403 authenticated but role/access is not allowed
404 requested group/user was not found
500 server error
```

## Frontend Fetch Example

```js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || `Request failed with ${res.status}`);
  }

  return data;
}

const login = await api('/api/auth/login', {
  method: 'POST',
  body: {
    loginInput: 'admin@example.com',
    password: 'password123'
  }
});

const groups = await api('/api/groups', {
  token: login.token
});
```
