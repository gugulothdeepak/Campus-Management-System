# Student Attendance and Performance Monitoring System (MERN Fullstack)

An enterprise-grade College ERP web application built using the **MERN Fullstack** (MongoDB, Express.js, React, Node.js) for attendance tracking, role-based administration, internal assessment grading, and student performance monitoring.

---

## 🌟 Architecture & Features

### 1. Role-Based Login & Security
- **Multi-Role Authentication**: Seamless login for **Administrators**, **Faculty Members**, and **Students**.
- **Security**: Password hashing using **BCrypt** and secure session handling via **JSON Web Tokens (JWT)**.
- **Role-Based Access Control (RBAC)**: Protected routes ensuring Students cannot access Faculty/Admin management endpoints.
- **Error Feedback**: Intuitive error alerts for invalid credentials, unregistered emails, and session expirations.

### 2. Administrator Dashboard
- **Live ERP Metrics**: Dynamic counters for total enrolled students, faculty members, classes, subjects, and institutional attendance average.
- **Student Management (Full CRUD)**: Add new admissions, view roster, search by name/roll number, update profiles, and delete student records.
- **Faculty Management (Full CRUD)**: Register professors, assign departments & course subjects, update designations, and remove faculty.
- **Classes & Course Curriculum**: Configure class sections, semester mappings, course codes, and credit weights.
- **Attendance Audit Reports**: System-wide attendance percentages with automatic **Shortage Warning Filter (< 75%)** and one-click **CSV Export**.
- **Performance Reports**: Monitor Mid-Term 1, Mid-Term 2, continuous assessment scores, class averages, and **CSV Export**.

### 3. Faculty Dashboard
- **Authorized Class & Subject Selector**: Filtered dynamically to only classes and courses assigned to the logged-in instructor.
- **Interactive Attendance Register**: Toggle individual students between **Present** and **Absent**, bulk mark buttons ("Mark All Present", "Mark All Absent"), and add student remarks.
- **Duplicate Attendance Prevention**: Automatically detects if an attendance session for the selected class, subject, and date already exists in the database.
- **Attendance History & Editing**: View previously saved attendance sessions and edit existing records with live database updates.
- **Internal Assessment Grading**: Enter and update **Mid-Term 1 (30)**, **Mid-Term 2 (30)**, and **Assignment (20)** scores with auto-calculated projected grades (A+, A, B+, B, etc.).

### 4. Student Portal
- **Authenticated Profile**: Displays registered name, roll number, department, semester, section, and email.
- **Real-Time Attendance Analytics**: Computes total classes held, lectures attended, classes missed, and overall attendance percentage.
- **Eligibility Indicator**: Visual status badge and progress bar indicating examination eligibility (≥ 75%) or shortage warning (< 75%).
- **Subject-Wise Breakdown**: Detailed table showing attended/total classes, percentage, and eligibility for every course.
- **Academic Performance Snapshot**: Displays internal assessment scores, assignment marks, and overall projected grades.
- **Instant Refresh**: One-click refresh button that pulls latest updates immediately when faculty marks attendance or grades exams.
- **Privacy Isolation**: Students can strictly access only their personal attendance and performance data.

---

## 🔑 Demo Login Credentials

| Role | Email | Password | Access / Scope |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@college.edu` | `Admin@123` | Full ERP management, CRUD, system reports |
| **Faculty (HoD CSE)** | `faculty@college.edu` | `Faculty@123` | CS-501 & CS-504, 3rd Year Sem 5, Marks & Attendance |
| **Faculty (Asst. Prof)**| `anita@college.edu` | `Faculty@123` | CS-502 (Operating Systems), Attendance |
| **Student (Roll 24CS001)**| `student@college.edu` | `Student@123` | Deepak Kumar, Sem 5, Individual Analytics |
| **Student (Roll 24CS002)**| `priya@college.edu` | `Student@123` | Priya Sharma, Sem 5, Individual Analytics |

*(Quick-login buttons are also available on the login page for instant testing)*

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **MongoDB** (Local MongoDB daemon or MongoDB Atlas connection string)
  > *Note: If a local MongoDB daemon is not running, the backend automatically operates with an embedded persistent database engine (`backend/data/db.json`), ensuring 100% zero-configuration availability right out of the box!*

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies (already installed)
npm install

# Start the Express server
npm start
# (or 'npm run dev' with file watching)
```
The backend will launch on **`http://localhost:5000`**.

### 3. Frontend Setup
```bash
# In a separate terminal, navigate to frontend
cd frontend

# Start the Vite development server
npm run dev
```
The frontend will launch on **`http://localhost:5173`**.

---

## 📡 API Endpoints Summary

### Authentication (`/api/auth`)
- `GET  /api/auth/health` - Backend health and database status
- `POST /api/auth/login` - User authentication (returns JWT token and profile)
- `GET  /api/auth/me` - Current user profile
- `POST /api/auth/logout` - User logout

### Administrator (`/api/admin`)
- `GET    /api/admin/stats` - Institutional KPI statistics
- `GET    /api/admin/students` - Query students with search & filter
- `POST   /api/admin/students` - Create new student
- `PUT    /api/admin/students/:id` - Update student profile
- `DELETE /api/admin/students/:id` - Delete student record
- `GET    /api/admin/faculty` - Query faculty roster
- `POST   /api/admin/faculty` - Register faculty member
- `PUT    /api/admin/faculty/:id` - Update faculty member
- `DELETE /api/admin/faculty/:id` - Delete faculty member
- `GET    /api/admin/classes` - Retrieve classes & sections
- `POST   /api/admin/classes` - Create new class
- `DELETE /api/admin/classes/:id` - Delete class
- `GET    /api/admin/subjects` - Retrieve curriculum subjects
- `POST   /api/admin/subjects` - Add course subject
- `DELETE /api/admin/subjects/:id` - Delete subject
- `GET    /api/admin/attendance-report` - Aggregate attendance report (shortage filter)
- `GET    /api/admin/performance-report` - Internal marks performance report

### Faculty (`/api/faculty`)
- `GET  /api/faculty/assigned` - Authorized classes and subjects
- `GET  /api/faculty/students` - Enrolled students for selected class
- `GET  /api/faculty/attendance` - Check/retrieve attendance for date & subject
- `POST /api/faculty/attendance` - Permanently save / update attendance
- `GET  /api/faculty/attendance-history` - Audit trail of submitted sessions
- `POST /api/faculty/marks` - Save student internal assessment marks

### Student (`/api/student`)
- `GET  /api/student/dashboard` - Individual attendance calculation, subject breakdown, and marks
