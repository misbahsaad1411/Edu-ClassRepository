# EDU ClassRepo

**East Delta University Note Sharing Platform**

A CRUD web application for students to share and download course materials with admin moderation.

---

## 📁 Project Structure

```
Edu ClassRepo Project/
├── src/                      # Backend source code
│   ├── config/              # Configuration files
│   │   ├── database.js      # PostgreSQL connection
│   │   ├── multer.js        # File upload configuration
│   │   └── constants.js     # App constants
│   ├── controllers/         # Business logic (CRUD)
│   │   ├── authController.js
│   │   ├── courseController.js
│   │   ├── enrollmentController.js
│   │   └── fileController.js
│   ├── middleware/          # Express middleware
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── routes/              # API routes
│   │   ├── authRoutes.js
│   │   ├── courseRoutes.js
│   │   ├── enrollmentRoutes.js
│   │   └── fileRoutes.js
│   └── utils/
│       └── validation.js
├── public/                  # Frontend assets
│   ├── index.html          # Login page
│   ├── dashboard.html      # Main dashboard
│   ├── my-courses.html     # Student courses
│   ├── course.html         # Course files
│   ├── admin.html          # Admin panel
│   ├── settings.html       # Settings
│   ├── app.js              # Frontend client
│   ├── style.css           # Styles
│   └── login.css
├── uploads/                # File storage
├── server.js               # Entry point
├── package.json
├── database.sql
├── .gitignore
└── README.md
```

---

## 🛠 Backend Architecture (CRUD)

### Controllers
- **authController**: Register, login
- **courseController**: CRUD courses (admin)
- **enrollmentController**: Manage enrollments
- **fileController**: Upload, approve, delete files

### API Routes
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/courses`
- `POST /api/courses` (Admin)
- `PUT /api/courses/:id` (Admin)
- `DELETE /api/courses/:id` (Admin)
- `GET /api/enrollments`
- `POST /api/enrollments`
- `DELETE /api/enrollments/:courseId`
- `GET /api/files/:courseId`
- `POST /api/files`
- `PUT /api/files/:id/approve` (Admin)
- `DELETE /api/files/:id`

---

## ⚙️ Setup

### Prerequisites
- Node.js (v14+)
- PostgreSQL (v12+)

### Installation
```bash
npm install
psql -U postgres -f database.sql
npm start
```

Server runs at `http://localhost:3000`

---

## 🔒 Features

- JWT authentication
- Role-based access control (Student/Admin)
- Email domain validation
- Password hashing with bcrypt
- File upload with moderation
- CORS protection
- Centralized error handling

---

## 📦 Dependencies

```json
{
  "express": "^4.18.2",
  "pg": "^8.11.3",
  "bcrypt": "^5.1.1",
  "jsonwebtoken": "^9.0.2",
  "multer": "^1.4.5-lts.1",
  "cors": "^2.8.5"
}
```

---

## 📝 Environment

Create `.env` file:
```
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=edu_classrepo
DB_USER=postgres
DB_PASSWORD=server123
JWT_SECRET=edu_classrepo_secret_2024
```

---

## 📄 License

ISC
           ┌───────────┼───────────┐           │
           ▼           ▼           ▼           ▼
    ┌────────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐
    │my-courses  │ │settings  │ │course    │ │admin.html  │
    │.html       │ │.html     │ │.html     │ │(Approvals) │
    │(Enrolled)  │ │(Account) │ │(Files)   │ └────────────┘
    └────────────┘ └──────────┘ └──────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                           API ROUTES                                     │
└─────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────┐
  │                         server.js                                    │
  │                    http://localhost:3000                             │
  └─────────────────────────────────────────────────────────────────────┘
                                   │
       ┌───────────────────────────┼───────────────────────────┐
       ▼                           ▼                           ▼
  /api/auth                   /api/courses              /api/files
       │                           │                           │
       ├─ POST /register           ├─ GET /                    ├─ GET /:courseId
       │  → Create account         │  → List all courses       │  → Get course files
       │                           │                           │
       └─ POST /login              ├─ GET /:id                 ├─ POST /
          → Get JWT token          │  → Single course          │  → Upload file
                                   │                           │
                                   ├─ POST /                   ├─ PUT /:id/approve
                                   │  → Create (Admin)         │  → Approve (Admin)
                                   │                           │
                                   └─ DELETE /:id              ├─ PUT /:id/rename
                                      → Delete (Admin)         │  → Rename (Admin)
                                                               │
                                                               └─ DELETE /:id
                                                                  → Delete file

  /api/enrollments
       │
       ├─ GET /                    ─→ Get user's enrolled courses
       ├─ POST /                   ─→ Enroll in course
       └─ DELETE /:courseId        ─→ Unenroll from course


┌─────────────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA                                  │
└─────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
  │    users     │       │   courses    │       │    files     │
  ├──────────────┤       ├──────────────┤       ├──────────────┤
  │ id (PK)      │       │ id (PK)      │       │ id (PK)      │
  │ student_id   │       │ code         │       │ course_id(FK)│──┐
  │ name         │       │ title        │       │ file_name    │  │
  │ email        │       │ department   │       │ file_path    │  │
  │ password     │       │ instructor   │       │ file_size    │  │
  │ department   │       │ created_at   │       │ uploaded_by  │──┼──┐
  │ role         │       └──────────────┘       │ status       │  │  │
  │ created_at   │              │               │ created_at   │  │  │
  └──────────────┘              │               └──────────────┘  │  │
         │                      │                      │          │  │
         │               ┌──────┴──────┐               │          │  │
         │               │             │               │          │  │
         ▼               ▼             ▼               ▼          │  │
  ┌──────────────────────────────────────────────────────────┐    │  │
  │                    enrollments                            │    │  │
  ├──────────────────────────────────────────────────────────┤    │  │
  │ id (PK)                                                   │    │  │
  │ user_id (FK) ─────────────────────────────────────────────┼────┘  │
  │ course_id (FK) ───────────────────────────────────────────┼───────┘
  │ enrolled_at                                               │
  └──────────────────────────────────────────────────────────┘
```

---

## ⚙️ Setup Instructions

### 1. Prerequisites
- **Node.js** (v16+)
- **PostgreSQL** (v13+)

### 2. Create Database
```sql
-- In pgAdmin or psql:
CREATE DATABASE edu_classrepo;
```

### 3. Run Database Schema
```sql
-- Connect to edu_classrepo, then run:
\i database.sql
```

### 4. Configure Database Connection
Edit `server.js` lines 35-41:
```javascript
const pool = new Pool({
    host: '127.0.0.1',
    port: 5432,
    database: 'edu_classrepo',
    user: 'postgres',
    password: 'YOUR_PASSWORD'  // ← Change this
});
```

### 5. Install & Run
```bash
npm install
npm start
```

### 6. Open Browser
```
http://localhost:3000
```

---

## 🔐 Default Admin Account

| Field    | Value                    |
|----------|--------------------------|
| Email    | admin@eastdelta.edu.bd   |
| Password | admin123                 |

---

## 📊 API Reference

### Authentication
| Method | Endpoint           | Body                                    | Description      |
|--------|--------------------|-----------------------------------------|------------------|
| POST   | /api/auth/register | name, student_id, email, password, dept | Create account   |
| POST   | /api/auth/login    | email, password, userType               | Login, get token |

### Courses
| Method | Endpoint         | Auth | Description          |
|--------|------------------|------|----------------------|
| GET    | /api/courses     | No   | List all courses     |
| GET    | /api/courses/:id | No   | Get single course    |
| POST   | /api/courses     | Admin| Create course        |
| DELETE | /api/courses/:id | Admin| Delete course        |

### Enrollments
| Method | Endpoint                  | Auth | Description     |
|--------|---------------------------|------|-----------------|
| GET    | /api/enrollments          | Yes  | My enrollments  |
| POST   | /api/enrollments          | Yes  | Enroll          |
| DELETE | /api/enrollments/:courseId| Yes  | Unenroll        |

### Files
| Method | Endpoint               | Auth | Description           |
|--------|------------------------|------|-----------------------|
| GET    | /api/files/:courseId   | No   | Course files          |
| GET    | /api/files/pending/all | Admin| Pending files         |
| POST   | /api/files             | Yes  | Upload (multipart)    |
| PUT    | /api/files/:id/approve | Admin| Approve file          |
| PUT    | /api/files/:id/rename  | Admin| Rename file           |
| DELETE | /api/files/:id/reject  | Admin| Reject (delete)       |
| DELETE | /api/files/:id         | Yes  | Delete own file       |

---

## 📦 Departments

| Code | Department                          |
|------|-------------------------------------|
| CSE  | Computer Science & Engineering      |
| EEE  | Electrical & Electronic Engineering |
| BBA  | Business Administration             |
| ENG  | English                             |
| ECO  | Economics                           |
| GED  | General Education                   |

---

## ⚠️ Known Issues & Limitations

### Not Production Ready - Needs:

| Issue | Current | Required for Production |
|-------|---------|------------------------|
| **Secrets** | Hardcoded in server.js | Use `.env` file |
| **HTTPS** | HTTP only | SSL certificate |
| **Rate Limiting** | None | Add express-rate-limit |
| **Input Validation** | Basic | Add express-validator |
| **Password Reset** | Forms exist, no backend | Implement email service |
| **Process Manager** | None | Use PM2 |
| **Logging** | Console only | Add winston/morgan |

### Quick Fixes Before Deployment:

1. **Create `.env` file:**
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=edu_classrepo
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key_here
```

2. **Install dotenv:**
```bash
npm install dotenv
```

3. **Update server.js:**
```javascript
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

const JWT_SECRET = process.env.JWT_SECRET;
```

---

## 🚀 Deployment Checklist

- [ ] Move credentials to environment variables
- [ ] Set up SSL/HTTPS
- [ ] Add rate limiting
- [ ] Configure production database
- [ ] Set up file backup for uploads/
- [ ] Use PM2 for process management
- [ ] Set up error logging
- [ ] Implement forgot password email
- [ ] Add input validation

---

## 📝 License

ISC License - Free to use and modify.
