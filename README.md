[README.md](https://github.com/user-attachments/files/26446550/README.md)
# CyberGuard with Figma

Full-stack layout with Figma-generated frontend connects cleanly to a Flask API.

## Project structure

```text
Cyberguard_DBMS/
├── backend/
│   ├── run.py
│   ├── requirements.txt
│   ├── .env.example
│   └── src/
│       └── app/
│           ├── __init__.py
│           ├── config.py
│           ├── extensions.py
│           ├── models.py
│           ├── utils.py
│           └── routes/
│               ├── admin.py
│               ├── auth.py
│               ├── dashboard.py
│               ├── incidents.py
│               ├── lookups.py
│               └── setup.py
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── .env.example
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── components/
│       ├── context/
│       ├── lib/
│       ├── pages/
│       ├── routes/
│       ├── styles/
│       └── types/
└── README.md
```

## Why this restructure helps

The Figma export is good for layout, but it usually starts with mock arrays and simulated logins. 
Bridge layer:

- `frontend/src/lib/api.ts` is the **frontend bridge**.
- `backend/src/app/routes/*.py` are the **backend API endpoints**.
- `backend/src/app/models.py` is the **database bridge** to MySQL.

Creates path:

```text
Figma screen -> React component -> api.ts -> Flask route -> SQLAlchemy model -> MySQL
```

## 1) Run backend

### Create database

In MySQL:

```sql
CREATE DATABASE cyber_db;
```

### Start the backend

```bash
cd backend
python -m venv venv
```

#### macOS / Linux
```bash
source venv/bin/activate
cp .env.example .env
pip install -r requirements.txt
python run.py
```

#### Windows PowerShell
```powershell
venv\Scripts\Activate.ps1
copy .env.example .env
pip install -r requirements.txt
python run.py
```

Edit `.env` first if your MySQL password is not `password`.

API base URL:

```text
http://localhost:5000/api
```

### Seed starter data

Open a second terminal:

```bash
curl -X POST http://localhost:5000/api/setup
```

Seeded users:

- admin@cyberguard.local / Admin123!
- analyst@cyberguard.local / Analyst123!
- employee@cyberguard.local / Employee123!

## 2) Run the frontend

```bash
cd frontend
npm install
```

Create the frontend env file:

#### macOS / Linux
```bash
cp .env.example .env
```

#### Windows PowerShell
```powershell
copy .env.example .env
```

Start Vite:

```bash
npm run dev
```

Open the address shown by Vite, usually:

```text
http://localhost:5173
```

## 3) Where the API bridge lives

### Frontend bridge: `frontend/src/lib/api.ts`

This file centralizes every HTTP request.

Important lines:

```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
```

This lets the Figma frontend point to Flask backend.

```ts
const token = storage.getToken();
headers.set('Authorization', `Bearer ${token}`);
```

This is the authentication bridge. After login, every protected request carries the JWT token.

```ts
fetch(`${API_BASE_URL}${path}`, ...)
```

This is the actual handoff from the frontend to Flask.

### Backend bridge: Flask routes

- `auth.py` handles login and registration.
- `incidents.py` accepts incident JSON from the frontend.
- `dashboard.py` returns chart-ready analytics.
- `lookups.py` returns dropdown data like attack types and systems.

Example:

```py
@bp.post('')
@jwt_required()
def create_incident():
```

This protects the route and ensures only logged-in users can submit incidents.

```py
incident = Incident(...)
db.session.add(incident)
db.session.commit()
```

This is the backend-to-database bridge.

## 4) Figma screens

### Login screen
Original Figma exports usually use mock credential arrays. This version now does:

```ts
const user = await login(email, password);
```

That calls:

```text
POST /api/auth/login
```

If successful:
- token goes to localStorage
- user object goes to context
- page navigates by role

### Incident reporting form
In Figma, the form is visual only. In this project the submit button now calls:

```ts
await api.createIncident({ ... })
```

That becomes:

```text
POST /api/incidents
```

### Dashboard page
Instead of mock chart data, the dashboard now loads:

- `GET /api/dashboard/summary`
- `GET /api/incidents`

## 5) What to edit when Figma design changes

When you change the design in Figma:

- edit page layout in `frontend/src/pages/*`
- edit reusable visual blocks in `frontend/src/components/*`
- keep API calls in `frontend/src/lib/api.ts`
- keep backend routes stable in `backend/src/app/routes/*`

That separation lets you redesign the UI without breaking backend connectivity.

## 6) Next upgrades

- add file uploads for evidence
- add pagination and search to incidents
- add edit/update incident modal for analysts
- add Docker Compose for backend + MySQL + frontend
- replace direct SQLAlchemy table creation with Alembic migrations
