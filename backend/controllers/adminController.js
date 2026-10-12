import bcrypt from 'bcryptjs';
import { storage } from '../data/dbStorage.js';

// GET /api/admin/stats
export async function getDashboardStats(req, res) {
  try {
    const students = storage.getUsersByRole('STUDENT');
    const faculty = storage.getUsersByRole('FACULTY');
    const classes = storage.getAllClasses();
    const subjects = storage.getAllSubjects();
    const attendanceSessions = storage.getAllAttendance();

    // Compute institution-wide average attendance
    let totalPresent = 0;
    let totalRecorded = 0;
    for (const session of attendanceSessions) {
      totalPresent += session.presentCount || 0;
      totalRecorded += session.totalStudents || 0;
    }

    const avgAttendance =
      totalRecorded > 0 ? ((totalPresent / totalRecorded) * 100).toFixed(1) : '85.0';

    res.json({
      success: true,
      data: {
        totalStudents: students.length,
        totalFaculty: faculty.length,
        totalClasses: classes.length,
        totalSubjects: subjects.length,
        systemAttendanceAvg: `${avgAttendance}%`,
      },
    });
  } catch (error) {
    console.error('[adminController:getDashboardStats] Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats.' });
  }
}

// --- STUDENT MANAGEMENT ---

// GET /api/admin/students
export async function getStudents(req, res) {
  try {
    const { search, department, semester } = req.query;
    let students = storage.getUsersByRole('STUDENT');

    if (search) {
      const q = search.toLowerCase();
      students = students.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.rollNo && s.rollNo.toLowerCase().includes(q))
      );
    }

    if (department && department !== 'All') {
      students = students.filter((s) => s.department === department);
    }

    if (semester && semester !== 'All') {
      students = students.filter((s) => s.semester === semester);
    }

    // Strip passwords
    const safeList = students.map((s) => {
      const copy = { ...s };
      delete copy.password;
      return copy;
    });

    res.json({ success: true, count: safeList.length, data: safeList });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch students list.' });
  }
}

// POST /api/admin/students
export async function createStudent(req, res) {
  try {
    const { name, email, password, rollNo, department, semester, section } = req.body;

    if (!name || !email || !rollNo) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and roll number are required fields.',
      });
    }

    if (storage.findUserByEmail(email)) {
      return res.status(409).json({
        success: false,
        message: `A user with email "${email}" already exists.`,
      });
    }

    const students = storage.getUsersByRole('STUDENT');
    if (students.some((s) => s.rollNo?.toLowerCase() === rollNo.toLowerCase())) {
      return res.status(409).json({
        success: false,
        message: `A student with roll number "${rollNo}" already exists.`,
      });
    }

    const rawPassword = password || 'Student@123';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const newStudent = storage.createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: 'STUDENT',
      rollNo: rollNo.trim().toUpperCase(),
      department: department || 'Computer Science & Engineering',
      semester: semester || 'B.Tech CSE - 3rd Year (Sem 5)',
      section: section || 'A',
      academicYear: '2026-2027',
    });

    const safeCopy = { ...newStudent };
    delete safeCopy.password;

    res.status(201).json({
      success: true,
      message: `Student "${name}" successfully registered.`,
      data: safeCopy,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to register student.' });
  }
}

// PUT /api/admin/students/:id
export async function updateStudent(req, res) {
  try {
    const { id } = req.params;
    const { name, email, rollNo, department, semester, section, password } = req.body;

    const existing = storage.findUserById(id);
    if (!existing || existing.role !== 'STUDENT') {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (email) updates.email = email.trim().toLowerCase();
    if (rollNo) updates.rollNo = rollNo.trim().toUpperCase();
    if (department) updates.department = department;
    if (semester) updates.semester = semester;
    if (section) updates.section = section;
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    const updated = storage.updateUser(id, updates);
    const safeCopy = { ...updated };
    delete safeCopy.password;

    res.json({
      success: true,
      message: 'Student record updated successfully.',
      data: safeCopy,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update student.' });
  }
}

// DELETE /api/admin/students/:id
export async function deleteStudent(req, res) {
  try {
    const { id } = req.params;
    const existing = storage.findUserById(id);
    if (!existing || existing.role !== 'STUDENT') {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    storage.deleteUser(id);
    res.json({
      success: true,
      message: `Student record "${existing.name}" deleted successfully.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete student.' });
  }
}

// --- FACULTY MANAGEMENT ---

// GET /api/admin/faculty
export async function getFaculty(req, res) {
  try {
    const { search, department } = req.query;
    let faculty = storage.getUsersByRole('FACULTY');

    if (search) {
      const q = search.toLowerCase();
      faculty = faculty.filter(
        (f) => f.name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q)
      );
    }

    if (department && department !== 'All') {
      faculty = faculty.filter((f) => f.department === department);
    }

    const safeList = faculty.map((f) => {
      const copy = { ...f };
      delete copy.password;
      return copy;
    });

    res.json({ success: true, count: safeList.length, data: safeList });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch faculty list.' });
  }
}

// POST /api/admin/faculty
export async function createFaculty(req, res) {
  try {
    const { name, email, password, department, designation, assignedClasses, assignedSubjects } =
      req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required fields.',
      });
    }

    if (storage.findUserByEmail(email)) {
      return res.status(409).json({
        success: false,
        message: `A user with email "${email}" already exists.`,
      });
    }

    const rawPassword = password || 'Faculty@123';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const newFaculty = storage.createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: 'FACULTY',
      department: department || 'Computer Science & Engineering',
      designation: designation || 'Assistant Professor',
      assignedClasses: Array.isArray(assignedClasses) ? assignedClasses : [],
      assignedSubjects: Array.isArray(assignedSubjects) ? assignedSubjects : [],
    });

    const safeCopy = { ...newFaculty };
    delete safeCopy.password;

    res.status(201).json({
      success: true,
      message: `Faculty member "${name}" registered successfully.`,
      data: safeCopy,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create faculty member.' });
  }
}

// PUT /api/admin/faculty/:id
export async function updateFaculty(req, res) {
  try {
    const { id } = req.params;
    const { name, email, department, designation, assignedClasses, assignedSubjects, password } =
      req.body;

    const existing = storage.findUserById(id);
    if (!existing || existing.role !== 'FACULTY') {
      return res.status(404).json({ success: false, message: 'Faculty record not found.' });
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (email) updates.email = email.trim().toLowerCase();
    if (department) updates.department = department;
    if (designation) updates.designation = designation;
    if (assignedClasses) updates.assignedClasses = assignedClasses;
    if (assignedSubjects) updates.assignedSubjects = assignedSubjects;
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    const updated = storage.updateUser(id, updates);
    const safeCopy = { ...updated };
    delete safeCopy.password;

    res.json({
      success: true,
      message: 'Faculty profile updated successfully.',
      data: safeCopy,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update faculty.' });
  }
}

// DELETE /api/admin/faculty/:id
export async function deleteFaculty(req, res) {
  try {
    const { id } = req.params;
    const existing = storage.findUserById(id);
    if (!existing || existing.role !== 'FACULTY') {
      return res.status(404).json({ success: false, message: 'Faculty record not found.' });
    }

    storage.deleteUser(id);
    res.json({
      success: true,
      message: `Faculty member "${existing.name}" removed successfully.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete faculty member.' });
  }
}

// --- CLASSES & SUBJECTS ---

// GET /api/admin/classes
export async function getClasses(req, res) {
  try {
    const classes = storage.getAllClasses();
    res.json({ success: true, count: classes.length, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch classes.' });
  }
}

// POST /api/admin/classes
export async function createClass(req, res) {
  try {
    const { name, department, semester, section, academicYear } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Class name is required.' });
    }

    const newClass = storage.createClass({
      name: name.trim(),
      department: department || 'Computer Science & Engineering',
      semester: semester || 'Sem 5',
      section: section || 'A',
      academicYear: academicYear || '2026-2027',
    });

    res.status(201).json({
      success: true,
      message: `Class "${name}" added successfully.`,
      data: newClass,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create class.' });
  }
}

// DELETE /api/admin/classes/:id
export async function deleteClass(req, res) {
  try {
    const { id } = req.params;
    storage.deleteClass(id);
    res.json({ success: true, message: 'Class deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete class.' });
  }
}

// GET /api/admin/subjects
export async function getSubjects(req, res) {
  try {
    const subjects = storage.getAllSubjects();
    res.json({ success: true, count: subjects.length, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch subjects.' });
  }
}

// POST /api/admin/subjects
export async function createSubject(req, res) {
  try {
    const { code, name, department, semester, credits, facultyId, facultyName } = req.body;
    if (!code || !name) {
      return res.status(400).json({
        success: false,
        message: 'Subject code and course name are required.',
      });
    }

    const newSubject = storage.createSubject({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      department: department || 'Computer Science & Engineering',
      semester: semester || 'Sem 5',
      credits: Number(credits) || 4,
      facultyId: facultyId || null,
      facultyName: facultyName || '',
    });

    res.status(201).json({
      success: true,
      message: `Subject "${newSubject.code} - ${newSubject.name}" created successfully.`,
      data: newSubject,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create subject.' });
  }
}

// PUT /api/admin/subjects/:id
export async function updateSubject(req, res) {
  try {
    const { id } = req.params;
    const updated = storage.updateSubject(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }
    res.json({ success: true, message: 'Subject updated.', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update subject.' });
  }
}

// DELETE /api/admin/subjects/:id
export async function deleteSubject(req, res) {
  try {
    const { id } = req.params;
    storage.deleteSubject(id);
    res.json({ success: true, message: 'Subject removed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete subject.' });
  }
}

// --- REPORTS ---

// GET /api/admin/attendance-report
export async function getAttendanceReport(req, res) {
  try {
    const { shortageOnly } = req.query;
    const students = storage.getUsersByRole('STUDENT');
    const sessions = storage.getAllAttendance();

    // Calculate aggregated attendance per student
    const report = students.map((student) => {
      let totalHeld = 0;
      let totalAttended = 0;

      for (const session of sessions) {
        const record = session.records.find(
          (r) => r.studentId === student._id || r.rollNo === student.rollNo
        );
        if (record) {
          totalHeld++;
          if (record.status === 'PRESENT') {
            totalAttended++;
          }
        }
      }

      const percentage =
        totalHeld > 0 ? Number(((totalAttended / totalHeld) * 100).toFixed(1)) : 100.0;

      const isShortage = percentage < 75.0;

      return {
        studentId: student._id,
        rollNo: student.rollNo,
        name: student.name,
        email: student.email,
        department: student.department,
        semester: student.semester,
        totalHeld,
        totalAttended,
        missed: totalHeld - totalAttended,
        percentage,
        status: isShortage ? 'Shortage (< 75%)' : 'Eligible',
      };
    });

    const filtered = shortageOnly === 'true' ? report.filter((r) => r.percentage < 75.0) : report;

    res.json({
      success: true,
      totalSessionsTracked: sessions.length,
      data: filtered,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to compile attendance report.' });
  }
}

// GET /api/admin/performance-report
export async function getPerformanceReport(req, res) {
  try {
    const { subjectCode } = req.query;
    let marks = storage.getAllMarks();

    if (subjectCode && subjectCode !== 'All') {
      marks = marks.filter((m) => m.subjectCode === subjectCode);
    }

    // Compute metrics
    const classAvg =
      marks.length > 0
        ? (marks.reduce((acc, m) => acc + (m.total || 0), 0) / marks.length).toFixed(1)
        : '0';

    res.json({
      success: true,
      totalRecords: marks.length,
      averageScore: classAvg,
      data: marks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to compile performance report.' });
  }
}
