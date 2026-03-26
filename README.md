[README.md](https://github.com/user-attachments/files/26286450/README.md)
# CIMS Project Starter

This starter gives you:
- a Flask backend API
- MySQL database connectivity with SQLAlchemy
- JWT login
- incident reporting endpoints
- a tiny frontend starter that calls the API

## Project structure

```text
cims_project_starter/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── admin.py
│   │   │   ├── auth.py
│   │   │   ├── dashboard.py
│   │   │   ├── incidents.py
│   │   │   ├── lookups.py
│   │   │   └── setup.py
│   │   ├── __init__.py
│   │   ├── models.py
│   │   └── utils.py
│   ├── .env.example
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── app.js
│   └── index.html
└── README.md
```

## 1. Install MySQL and create the database

Open MySQL and run:

```sql
CREATE DATABASE cims_db;
```

## 2. Configure the backend

Go into the backend folder:

```bash
cd backend
```

Create a virtual environment.

### macOS / Linux
```bash
python3 -m venv venv
source venv/bin/activate
```

### Windows PowerShell
```powershell
python -m venv venv
venv\Scripts\Activate.ps1
```

Install packages:

```bash
pip install -r requirements.txt
```

Copy the environment file:

### macOS / Linux
```bash
cp .env.example .env
```

### Windows PowerShell
```powershell
copy .env.example .env
```

Edit `.env` and make sure this matches your MySQL username and password:

```env
DATABASE_URL=mysql+pymysql://root:password@localhost/cims_db
JWT_SECRET_KEY=change-this-in-production
FLASK_DEBUG=True
```

Example:

```env
DATABASE_URL=mysql+pymysql://root:MyRealPassword@localhost/cims_db
JWT_SECRET_KEY=my-super-secret-key
FLASK_DEBUG=True
```

## 3. Run the backend

From the `backend` folder:

```bash
python run.py
```

The API will start at:

```text
http://localhost:5000
```

## 4. Initialize the database tables and seed starter data

After the backend is running, call:

### curl
```bash
curl -X POST http://localhost:5000/api/setup
```

This creates:
- tables
- default roles
- starter departments
- starter attack types
- default admin user

Default admin login:

```text
email: admin@cyberguard.local
password: Admin123!
```

## 5. Test the API

### Health check
```bash
curl http://localhost:5000/api/health
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cyberguard.local","password":"Admin123!"}'
```

Copy the returned token.

### Create an incident
```bash
curl -X POST http://localhost:5000/api/incidents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title":"Suspicious phishing email",
    "description":"Employee received a fake Microsoft password reset email.",
    "severity":"High"
  }'
```

### List incidents
```bash
curl http://localhost:5000/api/incidents \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 6. Run the frontend starter

Open a second terminal.

From the `frontend` folder, run a simple static server.

### Python 3
```bash
python -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

The frontend calls the backend at:

```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

If your backend is hosted elsewhere, update `frontend/app.js`.

## 7. How the frontend connects to the API

The flow is:

1. User logs in from the browser.
2. `POST /api/auth/login` returns a JWT token.
3. Frontend stores that token in `localStorage`.
4. Frontend sends the token in the `Authorization` header.
5. Backend validates the token and returns JSON.

Example fetch call:

```javascript
const token = localStorage.getItem('token');

fetch('http://localhost:5000/api/incidents', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 8. Main API endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Lookups
- `GET /api/roles`
- `GET /api/departments`
- `GET /api/attack-types`
- `GET /api/systems`
- `POST /api/systems`

### Incidents
- `GET /api/incidents`
- `POST /api/incidents`
- `GET /api/incidents/<id>`
- `PUT /api/incidents/<id>`
- `PATCH /api/incidents/<id>/assign`

### Admin
- `GET /api/users`
- `GET /api/audit-logs`

### Dashboard
- `GET /api/dashboard/summary`
- `GET /api/dashboard/high-risk-departments`

### Utility
- `POST /api/setup`
- `GET /api/health`

## 9. Common connection issues

### MySQL connection refused
- Make sure MySQL is running.
- Make sure the username, password, and database name in `.env` are correct.

### 401 Unauthorized
- Log in again and use a fresh token.
- Check that your request includes:

```text
Authorization: Bearer YOUR_TOKEN
```

### CORS issues
- The backend already enables CORS for `/api/*`.
- Make sure the frontend is calling the correct backend URL.

## 10. Recommended next steps

- Add file uploads for incident evidence
- Add pagination and search filters
- Add password reset
- Add Docker setup
- Replace the static frontend with React
- Add charts to the dashboard
