# Cybersecurity Management System

## Execution
- login with seeded demo users
- report incidents
- view dashboard charts and recent incidents

## Backend
From project root:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python run.py
```

The backend uses a local SQLite file at `backend/app.db` and seeds data automatically on startup.

Health check:

```text
http://localhost:5000/api/health
```

Demo users:
- `admin@cyberguard.local` / `Admin123!`
- `analyst@cyberguard.local` / `Analyst123!`
- `employee@cyberguard.local` / `Employee123!`

## Frontend
Open a second terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open the Vite URL, usually:

```text
http://localhost:5173
```

## MySQL vs MySQLite
- MySQL dependency and setup steps
- shell `cd()` auto-start logic
- bundled `venv`, logs, cache files, and macOS metadata
