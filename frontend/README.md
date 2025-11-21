Frontend (React + TypeScript) quick scaffold

This folder contains a minimal Vite + React + TypeScript scaffold to call the backend.

Run locally:

```powershell
cd frontend
npm install
npm run dev
```

Environment:
- Create a file `.env` in `frontend` with `VITE_API_BASE=http://localhost:3001` if backend runs locally.

Pages included:
- Home: shows recent lost/found items
- Lost: form to post lost items and list
- Found: form to post found items and list
- Profile: sign-in and notifications (a seeded account is available for testing)

Notes:
- This is a minimal app — no routing library used, simple in-memory route state.
- For production, add proper authentication flows, form validation, and nicer UI.
