import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSeedData } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db.json');

class StorageEngine {
  constructor() {
    this.data = {
      users: [],
      classes: [],
      subjects: [],
      attendanceSessions: [],
      marks: [],
    };
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
        console.log('[StorageEngine] Loaded existing persistent data from db.json');
      } else {
        console.log('[StorageEngine] Initializing fresh database with seeded college ERP data...');
        const seed = await getSeedData();
        this.data = seed;
        this.save();
        console.log('[StorageEngine] Seeded data successfully written to db.json');
      }
    } catch (err) {
      console.error('[StorageEngine] Error reading/initializing db.json, generating seeds in-memory:', err);
      const seed = await getSeedData();
      this.data = seed;
    }

    this.initialized = true;
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[StorageEngine] Failed to save db.json:', err);
    }
  }

  // --- Users ---
  findUserByEmail(email) {
    if (!email) return null;
    return this.data.users.find(
      (u) => u.email.trim().toLowerCase() === email.trim().toLowerCase()
    );
  }

  findUserById(id) {
    return this.data.users.find((u) => u._id === id);
  }

  getUsersByRole(role) {
    if (!role) return this.data.users;
    return this.data.users.filter((u) => u.role === role);
  }

  createUser(userData) {
    const _id = userData._id || `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newUser = {
      _id,
      createdAt: new Date().toISOString(),
      ...userData,
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  updateUser(id, updates) {
    const idx = this.data.users.findIndex((u) => u._id === id);
    if (idx === -1) return null;

    // Do not overwrite password if not provided
    if (!updates.password) {
      delete updates.password;
    }

    this.data.users[idx] = {
      ...this.data.users[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.users[idx];
  }

  deleteUser(id) {
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter((u) => u._id !== id);
    if (this.data.users.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Classes ---
  getAllClasses() {
    return this.data.classes;
  }

  createClass(classData) {
    const _id = classData._id || `cls_${Date.now()}`;
    const newClass = {
      _id,
      ...classData,
      createdAt: new Date().toISOString(),
    };
    this.data.classes.push(newClass);
    this.save();
    return newClass;
  }

  deleteClass(id) {
    const initialLen = this.data.classes.length;
    this.data.classes = this.data.classes.filter((c) => c._id !== id);
    if (this.data.classes.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Subjects ---
  getAllSubjects() {
    return this.data.subjects;
  }

  createSubject(subjectData) {
    const _id = subjectData._id || `sbj_${Date.now()}`;
    const newSubject = {
      _id,
      ...subjectData,
      createdAt: new Date().toISOString(),
    };
    this.data.subjects.push(newSubject);
    this.save();
    return newSubject;
  }

  updateSubject(id, updates) {
    const idx = this.data.subjects.findIndex((s) => s._id === id);
    if (idx === -1) return null;
    this.data.subjects[idx] = {
      ...this.data.subjects[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.subjects[idx];
  }

  deleteSubject(id) {
    const initialLen = this.data.subjects.length;
    this.data.subjects = this.data.subjects.filter((s) => s._id !== id);
    if (this.data.subjects.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Attendance ---
  getAllAttendance() {
    return this.data.attendanceSessions;
  }

  findAttendanceSession(date, classGroup, subjectCode) {
    return this.data.attendanceSessions.find(
      (a) => a.date === date && a.classGroup === classGroup && a.subjectCode === subjectCode
    );
  }

  saveAttendanceSession(sessionData) {
    const existingIndex = this.data.attendanceSessions.findIndex(
      (a) =>
        a.date === sessionData.date &&
        a.classGroup === sessionData.classGroup &&
        a.subjectCode === sessionData.subjectCode
    );

    if (existingIndex >= 0) {
      // Overwrite/update existing
      const updated = {
        ...this.data.attendanceSessions[existingIndex],
        ...sessionData,
        updatedAt: new Date().toISOString(),
      };
      this.data.attendanceSessions[existingIndex] = updated;
      this.save();
      return { session: updated, isUpdate: true };
    } else {
      const _id = sessionData._id || `att_${Date.now()}`;
      const newSession = {
        _id,
        ...sessionData,
        createdAt: new Date().toISOString(),
      };
      this.data.attendanceSessions.push(newSession);
      this.save();
      return { session: newSession, isUpdate: false };
    }
  }

  updateAttendanceById(id, sessionData) {
    const idx = this.data.attendanceSessions.findIndex((a) => a._id === id);
    if (idx === -1) return null;

    const totalStudents = sessionData.records
      ? sessionData.records.length
      : this.data.attendanceSessions[idx].totalStudents;
    const presentCount = sessionData.records
      ? sessionData.records.filter((r) => r.status === 'PRESENT').length
      : this.data.attendanceSessions[idx].presentCount;
    const absentCount = totalStudents - presentCount;
    const percentage =
      totalStudents > 0 ? Number(((presentCount / totalStudents) * 100).toFixed(1)) : 0;

    const updated = {
      ...this.data.attendanceSessions[idx],
      ...sessionData,
      totalStudents,
      presentCount,
      absentCount,
      percentage,
      updatedAt: new Date().toISOString(),
    };
    this.data.attendanceSessions[idx] = updated;
    this.save();
    return updated;
  }

  deleteAttendanceById(id) {
    const initialLen = this.data.attendanceSessions.length;
    this.data.attendanceSessions = this.data.attendanceSessions.filter((a) => a._id !== id);
    if (this.data.attendanceSessions.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  getStudentAttendance(studentId, rollNo) {
    // Return all sessions with this student's attendance record
    const history = [];
    for (const session of this.data.attendanceSessions) {
      const rec = session.records.find(
        (r) => r.studentId === studentId || (rollNo && r.rollNo === rollNo)
      );
      if (rec) {
        history.push({
          date: session.date,
          classGroup: session.classGroup,
          subjectCode: session.subjectCode,
          subjectName: session.subjectName,
          facultyName: session.facultyName,
          status: rec.status,
          remarks: rec.remarks,
        });
      }
    }
    return history;
  }

  // --- Marks ---
  getAllMarks() {
    return this.data.marks;
  }

  getStudentMarks(studentId, rollNo) {
    return this.data.marks.filter(
      (m) => m.studentId === studentId || (rollNo && m.rollNo === rollNo)
    );
  }

  saveOrUpdateMark(markData) {
    const existingIndex = this.data.marks.findIndex(
      (m) =>
        (m.studentId === markData.studentId || (markData.rollNo && m.rollNo === markData.rollNo)) &&
        m.subjectCode === markData.subjectCode
    );

    const mid1 = Number(markData.mid1) || 0;
    const mid2 = Number(markData.mid2) || 0;
    const assignment = Number(markData.assignment) || 0;
    const total = mid1 + mid2 + assignment;

    // Grade calculation (out of 80)
    let grade = 'F';
    const pct = (total / 80) * 100;
    if (pct >= 85) grade = 'A+';
    else if (pct >= 75) grade = 'A';
    else if (pct >= 65) grade = 'B+';
    else if (pct >= 55) grade = 'B';
    else if (pct >= 45) grade = 'C';
    else if (pct >= 35) grade = 'D';

    const computed = {
      ...markData,
      mid1,
      mid2,
      assignment,
      total,
      grade,
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      this.data.marks[existingIndex] = {
        ...this.data.marks[existingIndex],
        ...computed,
      };
      this.save();
      return this.data.marks[existingIndex];
    } else {
      const _id = markData._id || `mrk_${Date.now()}`;
      const newMark = {
        _id,
        createdAt: new Date().toISOString(),
        ...computed,
      };
      this.data.marks.push(newMark);
      this.save();
      return newMark;
    }
  }
}

export const storage = new StorageEngine();
