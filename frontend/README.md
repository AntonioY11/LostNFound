Frontend (React + TypeScript)

Minimal Vite + React + TypeScript frontend that talks to the backend API.

Run locally

```powershell
cd frontend
npm install
npm run dev
```

Local environment

Create `frontend/.env` with the API base URL:

```
VITE_API_BASE=http://localhost:3001
```

Pages

- Home — recent lost & found items
- Lost — post a lost item and browse lost items
- Found — post a found item and browse found items
- Profile — sign in and view notifications

Build for production

```powershell
npm run build
```

The build output is in `frontend/dist`. Serve it from a static host (S3, Netlify, Vercel) or from the backend server.

Security

- Do not commit secrets or `.env` files to source control. Keep credentials in the deployment environment.
- Add input validation and HTTPS before deploying to production.

Notes

- This frontend is a simple, self-contained example intended for coursework. It focuses on functionality rather than production hardening.
