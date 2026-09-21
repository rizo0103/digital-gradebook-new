# Digital Gradebook server

Express API backed by Firebase Firestore.

## Setup

1. Run `npm install`.
2. Copy `.env.example` to `.env` and set all values.
3. Place the Firebase Admin service account at `serviceAccountKey.json` in this directory.
4. Run `npm run seed:admin` once to create the first administrator.
5. Start the API with `npm run dev` or `npm start`.

The API listens on port `5000` by default. `CLIENT_ORIGIN` accepts a comma-separated list of allowed frontend origins.

## Main endpoints

- `POST /api/auth/login`
- `GET /api/groups`
- `GET /api/groups/:groupId/students`
- `GET /api/groups/:groupId/lessons`
- `GET /api/attendance/:groupId`
- `POST /api/attendance`
- Admin endpoints under `/api/admin` for users, groups, students, and schedule generation.
