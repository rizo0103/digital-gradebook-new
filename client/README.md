# Digital Gradebook client

React/Vite interface for the Digital Gradebook application.

## Run

```bash
npm install
npm run dev
```

The API defaults to `http://localhost:5000/api`. Set `VITE_API_URL` when the server is hosted elsewhere.

## Checks

```bash
npm run lint
npm run build
```

The application supports admin, teacher, and student roles. Administrators manage users, groups, and lesson dates; teachers manage attendance for assigned groups; students have read-only access to their groups.
