# LostNFound
Smart Lost & Found web application scaffold

This repository contains a scaffold for a Lost & Found system. It includes a Node.js + Express backend (configured for RDS in production) with image upload support. The frontend is implemented with React + TypeScript (see `frontend/README.md`).

Quickstart (backend)

1. Install dependencies for the backend:

```powershell
cd backend
npm install
```

2. Configure your database connection via environment variables (see `backend/.env.example`). This project expects you to provide RDS connection values (e.g. `RDS_HOST`, `RDS_USER`, `RDS_PASSWORD`, `RDS_DATABASE`, and `DB_CLIENT`).

3. Start the backend server:

```powershell
npm start
```

The server listens on port `3001` by default. Available API endpoints:

- `POST /api/register` — register (body: `name`, `email`, `password`)
- `POST /api/login` — login (body: `email`, `password`) — returns a JWT
- `POST /api/lost` — create lost item (multipart/form-data: file field `image` and form fields)
- `GET /api/lost` — list lost items (filters: `category`, `location`, `q`)
- `POST /api/found` — create found item (same format as lost)
- `GET /api/found` — list found items
- `GET /api/notifications` — get in-app notifications (requires `Authorization: Bearer <token>`)

`AWS (optional)`

Configure S3 uploads by creating a `.env` file in the `backend` folder based on `.env.example` and providing the necessary AWS variables (e.g. `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET`). When configured, uploaded images will be stored in S3 and public URLs returned.

Switching to RDS / MySQL

This scaffold is prepared for production use with AWS RDS (MySQL). A MySQL adapter using `mysql2` is included in `backend/db.js`. To connect, set the RDS connection environment variables in `backend/.env` (or in your EB environment settings): `RDS_HOST`, `RDS_PORT`, `RDS_USER`, `RDS_PASSWORD`, `RDS_DATABASE`, and optionally `DB_POOL_SIZE`.

If you prefer Postgres or want a richer migration/migration toolchain, consider using `pg` and an ORM or migration tool such as `knex` or `sequelize`.

Frontend

See `frontend/README.md` for instructions to run the React + TypeScript frontend. The frontend stores the JWT and calls the backend API endpoints.

Security note

- Do not commit secrets or credentials to source control. Keep real secrets in an environment file on the server (e.g. `backend/.env`) and ensure `.gitignore` excludes it.
- Remove local database files and upload folders from the repository before publishing (the repo includes a `.gitignore` to help with this).

Next steps (suggested)

- Implement or refine the frontend UI
- Add email notifications via AWS SES (optional)

If you would like, I can apply a small polish to this README (examples, diagram, or deployment checklist for EC2 + RDS).
