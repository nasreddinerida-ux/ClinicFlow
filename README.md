Here is the updated and polished `README.md` content for **ClinicFlow**, updated to include the **Zod validation library**, precise package installation commands, and fully aligned with your latest stack specifications.

---

```markdown
# 🏥 ClinicFlow - Patient & Appointment Management System

ClinicFlow is a full-stack web application designed for small clinics to manage patients, schedule appointments, and monitor clinic metrics in real time. It is built using the **PERN stack** (PostgreSQL, Express.js, React/Next.js, Node.js) and containerized with **Docker Compose**.

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack & Dependencies](#-tech-stack--dependencies)
- [Architecture & Database Schema](#-architecture--database-schema)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Environment Variables](#-environment-variables)
- [Installation & Setup (Docker Compose)](#-installation--setup-docker-compose)
- [Database Initialization & Seeding](#-database-initialization--seeding)
- [API Reference](#-api-reference)
- [Business Rules](#-business-rules)
- [Demo Credentials](#-demo-credentials)

---

## ✨ Features

- **Authentication & Role-Based Access Control (RBAC):**
  - Secure login using JWT and hashed passwords (`bcryptjs`).
  - Input payload validation using **Zod**.
  - Two distinct roles: `admin` and `staff`.
  - Admin-only privileges (e.g., patient deletion).
- **Patient Management:**
  - Full CRUD capabilities.
  - Search by full name or CIN.
  - Paginated list display for performance optimization.
- **Appointment Scheduling:**
  - Create and manage appointments (`pending`, `confirmed`, `cancelled`).
  - **Business Rule Enforcement:** Prevents booking 2 confirmed appointments for the same patient within a 30-minute window.
  - Filter appointments by date and status.
- **Dashboard & Analytics:**
  - Real-time statistics displaying total patients, today's appointments, pending requests, and confirmed visits.

---

## 🛠 Tech Stack & Dependencies

### Backend Dependencies (`clinicflow-backend`)
Navigate to the backend directory and install all required packages:
```bash
cd clinicflow-backend
npm install express pg bcryptjs jsonwebtoken cors dotenv zod
npm install --save-dev nodemon

```

| Package | Version | Purpose |
| --- | --- | --- |
| **express** | `^4.19.2` | Fast REST API framework |
| **pg** | `^8.11.3` | Non-blocking PostgreSQL client |
| **bcryptjs** | `^2.4.3` | Password encryption and hashing |
| **jsonwebtoken** | `^9.0.2` | JWT implementation for RBAC auth |
| **cors** | `^2.8.5` | Cross-Origin Resource Sharing middleware |
| **dotenv** | `^16.4.5` | Environment variable management |
| **zod** | `^3.22.4` | Request payload schema validation |
| **nodemon** *(Dev)* | `^3.1.0` | Live-reloading dev server |

### Frontend Dependencies (`clinicflow-frontend`)

Navigate to the frontend directory and install dependencies:

```bash
cd clinicflow-frontend
npm install next@latest react react-dom axios lucide-react

```

| Package | Version | Purpose |
| --- | --- | --- |
| **next** | `16.4.3` | React framework with App Router & Turbopack |
| **react** / **react-dom** | `^18` / `^19` | UI component rendering library |
| **axios** | `^1.6.8` | Promise-based API HTTP client |
| **lucide-react** | `^3.30.0` | Dashboard iconography |

---

## 📐 Architecture & Database Schema

The database consists of three main tables with `UUID` primary keys, custom ENUM types, and optimized database indexes.

```
 +------------------+          +------------------+          +----------------------+
 |      USERS       |          |     PATIENTS     |          |     APPOINTMENTS     |
 +------------------+          +------------------+          +----------------------+
 | id (UUID) [PK]   |          | id (UUID) [PK]   |          | id (UUID) [PK]       |
 | email (VARCHAR)  |          | full_name        |          | patient_id [FK] -----+---> (Patients.id)
 | password_hash    |          | cin (UNIQUE)     |          | appointment_date     |
 | role (user_role) |          | phone            |          | status (app_status)  |
 | created_at       |          | birth_date       |          | reason               |
 | updated_at       |          | address          |          | notes                |
 +------------------+          +------------------+          | created_by [FK] -----+---> (Users.id)
          ^                                                  +----------------------+
          |                                                             |
          +-------------------------------------------------------------+

```

### Database Relations & Constraints:

* **`users` -> `appointments` (1 to N):** Tracks which staff member or admin created each appointment (`created_by`). Set to `ON DELETE SET NULL` to retain scheduling logs if a user account is removed.
* **`patients` -> `appointments` (1 to N):** One patient can have multiple historical and upcoming appointments. Cascades on deletion (`ON DELETE CASCADE`).
* **Indexes:** Added on `patients(full_name)`, `patients(cin)`, `appointments(appointment_date)`, `appointments(status)`, and `appointments(patient_id)` to ensure performant searches and filters.

---

## 📁 Project Structure

```text
clinic-app/
├── clinicflow-backend/       # Express API
│   ├── src/
│   │   ├── config/           # Database setup (pg pool)
│   │   ├── controllers/      # Route logic & responses
│   │   ├── middleware/       # Auth, role check, Zod validation, error handling
│   │   ├── migrations/       # Seed script (seed.js)
│   │   ├── routes/           # API Endpoints
│   │   └── server.js         # Entry point
│   ├── Dockerfile
│   └── package.json
├── clinicflow-frontend/      # Next.js Application
│   ├── src/
│   │   ├── app/              # Routes (login, dashboard, patients, appointments)
│   │   ├── components/       # Reusable UI components
│   │   └── services/         # API client setup
│   ├── Dockerfile
│   └── package.json
├── migrations/
│   └── 001_init.sql          # SQL schema initialization
├── docker-compose.yml        # Container orchestration
└── README.md

```

---

## ⚙️ Environment Variables

### Backend (`clinicflow-backend/.env`)

```env
PORT=5000
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password123
DB_NAME=clinicflow
JWT_SECRET=super_secret_jwt_key_123!

```

### Frontend (`clinicflow-frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api

```

---

## 🚀 Installation & Setup (Docker Compose)

### 1. Clone the Repository

```bash
git clone [https://github.com/your-username/clinicflow.git](https://github.com/your-username/clinicflow.git)
cd clinic-app

```

### 2. Build and Start Containers

Run the unified Docker Compose stack:

```bash
docker-compose up --build

```

This starts:

* **PostgreSQL Database** on port `5432`
* **Express Backend API** on port `5000`
* **Next.js Frontend** on port `3000`

---

## 🗄 Database Initialization & Seeding

After your containers are up and healthy, initialize the schema and populate the test data.

### Step 1: Run SQL Migration Schema

Execute `001_init.sql` against the running PostgreSQL container.

**PowerShell (Windows):**

```powershell
Get-Content migrations/001_init.sql | docker exec -i clinicflow_postgres psql -U postgres -d clinicflow

```

**Bash (Linux / macOS):**

```bash
docker exec -i clinicflow_postgres psql -U postgres -d clinicflow < migrations/001_init.sql

```

### Step 2: Seed Test Data

Run the database seeder to populate test users, patients, and appointments:

```bash
docker exec -it clinicflow_backend node src/migrations/seed.js

```

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT | Public |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Private |

### Patients

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| `GET` | `/api/patients?search=&page=&limit=` | Get paginated patient list | Staff / Admin |
| `GET` | `/api/patients/:id` | Get patient details & appointment history | Staff / Admin |
| `POST` | `/api/patients` | Create new patient record (Zod validated) | Staff / Admin |
| `PUT` | `/api/patients/:id` | Update patient record (Zod validated) | Staff / Admin |
| `DELETE` | `/api/patients/:id` | Delete patient record | **Admin Only** |

### Appointments

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| `GET` | `/api/appointments?date=&status=` | Get filtered appointments | Staff / Admin |
| `POST` | `/api/appointments` | Book new appointment (Enforces 30-min rule) | Staff / Admin |
| `PATCH` | `/api/appointments/:id/status` | Update appointment status | Staff / Admin |

---

## ⏱ Business Rules

### 30-Minute Conflict Prevention

To prevent overlapping consultations, the application enforces that **a single patient cannot have two `confirmed` appointments within 30 minutes of each other**.

#### Backend SQL Validation Logic:

```sql
SELECT id FROM appointments 
WHERE patient_id = $1 
  AND status = 'confirmed' 
  AND id != $2 -- Exclude self during status updates
  AND appointment_date >= ($3::timestamptz - INTERVAL '30 minutes')
  AND appointment_date <= ($3::timestamptz + INTERVAL '30 minutes');

```

If a record is found during creation or status change to `confirmed`, the API blocks the request and responds with an HTTP `400 Bad Request`.

---

## 🔑 Demo Credentials

After running the seed script, log in at `http://localhost:3000`:

| Role | Email | Password |
| --- | --- | --- |
| **Admin** | `admin@clinicflow.com` | `password123` |
| **Staff** | `staff1@clinicflow.com` | `password123` |
| **Staff** | `staff2@clinicflow.com` | `password123` |

```

```