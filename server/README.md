# Digital Gradebook server

Express API backed by Firebase Firestore.

## Setup

1. Run `npm install`.
2. Copy `.env.example` to `.env` and set all values.
3. Place the Firebase Admin service account at `serviceAccountKey.json` in this directory.
4. Run `npm run seed:admin` once to create the first administrator.
5. Start the API with `npm run dev` or `npm start`.

The API listens on port `5000` by default. `CLIENT_ORIGIN` accepts a comma-separated list of allowed frontend origins.

## Deploy to Google Cloud Run

Build and deploy the image from this directory:

```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/digital-gradebook-server
gcloud run deploy digital-gradebook-server \
  --image gcr.io/PROJECT_ID/digital-gradebook-server \
  --platform managed \
  --region REGION \
  --allow-unauthenticated \
  --set-env-vars PORT=8080,JWT_SECRET=YOUR_SECRET,CLIENT_ORIGIN=https://YOUR_FRONTEND_DOMAIN
```

Replace `PROJECT_ID`, `REGION`, and the placeholder values with your Google Cloud project, deployment region, and production configuration. Cloud Run supplies the `PORT` variable automatically; the Dockerfile defaults it to `8080`.

For local development, keep `serviceAccountKey.json` at the server root. It is ignored by Git and Docker. In Cloud Run, deploy the service with a Google service account that has the required Firestore permissions; when the local key is absent, the server uses Google Application Default Credentials automatically.

## Main endpoints

- `POST /api/auth/login`
- `GET /api/groups`
- `GET /api/groups/:groupId/students`
- `GET /api/groups/:groupId/lessons`
- `GET /api/attendance/:groupId`
- `POST /api/attendance`
- Admin endpoints under `/api/admin` for users, groups, students, and schedule generation.

## Database query documentation

Полный перечень операций Firestore, структуры коллекций и примеры запросов
описаны в [docs/database-queries.md](docs/database-queries.md).
