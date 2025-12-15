# LostNFound
A lightweight Lost & Found web app. Backend is Node.js/Express with MySQL (RDS-ready) and S3 image uploads. Frontend is React + TypeScript.

## What it does
- Users register/login (JWT)
- Post lost/found items with images
- Browse, filter, edit/delete your own posts
- See poster contact info (name/email/phone)

## Stack
- Backend: Node.js, Express, mysql2, JWT auth, S3 uploads
- Frontend: React + TypeScript (Vite)
- Deploy: Elastic Beanstalk (backend) + S3 (frontend)

## Environment (backend)
Copy `backend/.env.example` to `backend/.env` and fill in:
- `RDS_HOST`, `RDS_PORT`, `RDS_USER`, `RDS_PASSWORD`, `RDS_DATABASE`
- `JWT_SECRET`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET` (for image uploads)

## Run locally
Backend
```powershell
cd backend
npm install
npm start
# runs on http://localhost:3001
```

Frontend
```powershell
cd frontend
npm install
npm run dev
# runs on http://localhost:5173 (Vite)
```
Set `VITE_API_BASE` in `frontend/.env` to your backend URL (e.g., `http://localhost:3001`).

## Deploy (outline)
- Backend: zip via GitHub Actions (or locally) → upload to S3 → Elastic Beanstalk app version.
- Frontend: `npm run build` in `frontend` → upload `dist/` to your S3 static site (or CloudFront).

## API quick reference
- `POST /api/register` — `name`, `email`, `password`
- `POST /api/login` — `email`, `password` → JWT
- `POST /api/lost` (auth, multipart: `image`, fields)
- `GET /api/lost` (filters: `category`, `location`, `q`)
- `PUT /api/lost/:id` (auth, owner only)
- `DELETE /api/lost/:id` (auth, owner only)
- Same pattern for `/api/found`

## Security notes
- S3 bucket should allow the app role/keys to `PutObject` and `GetObject`; avoid public ACLs unless intended.
- Lock RDS security groups to EB/your IPs.

## Housekeeping
- Build artifacts (`frontend/dist`) and local uploads are not tracked.


