# Cybersecurity Incident Management System

## Project Overview
The Cybersecurity Incident Management System (CIMS) is a full-stack application designed to support the reporting, tracking, and management of cybersecurity incidents within an organization. The system integrates a relational database, backend API, and frontend interface to simulate real-world cybersecurity workflows.

This project demonstrates core concepts from Database Management Systems, including:

relational schema design
entity relationships and constraints
CRUD operations
joins and aggregations
role-based access control
full-stack system integration

## Problem Statement

Organizations face increasing cybersecurity threats but often lack structured systems to:

track incidents
assign responsibilities
analyze trends
ensure timely resolution

This project addresses that gap by providing a centralized platform where:

employees report incidents
analysts investigate and update status
administrators monitor system-wide activity

## System Architecture

Frontend (React / Vite)
        ↓
Backend API (Flask)
        ↓
SQLite Database

Components:
Frontend: User interface for reporting and managing incidents
Backend API: Handles business logic and database interactions
Database: Stores users, incidents, roles, departments, and metadata

## Database Design (Conceptual)
### Core Entities:
Users
Roles
Departments
Incidents
Attack Types
Systems
### Relationships:
Users belong to Departments and Roles
Incidents are reported by Users
Incidents reference Attack Types and Systems

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

## Demo Workflow
### 1. Employee
Log in
Submit 2–3 incidents
### 2. Analyst
Review incidents
Update status (In Progress / Resolved)
### 3. Admin
View dashboard
Show aggregated results

## MySQL vs MySQLite
- MySQL dependency and setup steps
- shell `cd()` auto-start logic
- bundled `venv`, logs, cache files, and macOS metadata
