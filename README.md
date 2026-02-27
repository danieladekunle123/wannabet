# WannaBet

WannaBet is a full-stack esports matchmaking and wagering platform.  
Users can create accounts (email or Google), build player profiles, join competitive matches, and manage a linked wallet and escrow system.

This project is under active development.

---

## Tech Stack

**Frontend**
- React + TypeScript (Vite)
- Tailwind CSS
- shadcn/ui

**Backend**
- Node.js + Express
- Prisma ORM
- PostgreSQL
- JWT authentication
- Google OAuth

---

## Running the Project Locally

### 1. Install dependencies
```bash
cd backend
npm install

cd ../frontend
npm install

---

2. Environment variables

Create backend/.env:

DATABASE_URL=postgresql://user:password@localhost:5432/wannabet
JWT_SECRET=your_secret
GOOGLE_CLIENT_ID=your_google_client_id

---

3. Database setup
cd backend
npx prisma migrate dev
npx prisma generate

---

4. Start the app

---

Backend

cd backend
npm run dev

---

Frontend

cd frontend
npm run dev

Frontend: http://localhost:5173
Backend: http://localhost:4000