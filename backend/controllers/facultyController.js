import { storage } from '../data/dbStorage.js';

// GET /api/faculty/assigned-classes-subjects
// Returns classes and subjects authorized for the logged-in faculty
export async function getAssignedClassesAndSubjects(req, res) {
  try {
    const faculty = storage.findUserById(req.user._id || req.user.id);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty record not found.' });
    }

    const allClasses = storage.getAllClasses();
    const allSubjects = storage.getAllSubjects();

    // If faculty has explicit assignments, filter; else provide department matching
    let authorizedClasses = allClasses;
    let authorizedSubjects = allSubjects;

    if (faculty.assignedClasses && faculty.assignedClasses.length > 0) {
      authorizedClasses = allClasses.filter((c) => faculty.assignedClasses.includes(c.name));
      // Fallback if none matched
      if (authorizedClasses.length === 0) authorizedClasses = allClasses;
    }

    if (faculty.assignedSubjects && faculty.assignedSubjects.length > 0) {
      authorizedSubjects = allSubjects.filter(
        (s) =>
          faculty.assignedSubjects.includes(s.code) ||
          s.facultyId === faculty._id ||
          s.facultyName === faculty.name
      );
      if (authorizedSubjects.length === 0) authorizedSubjects = allSubjects;
    }

    res.json({
      success: true,
      facultyName: faculty.name,
      department: faculty.department,
      classes: authorizedClasses,
      subjects: authorizedSubjects,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch assigned classes.' });
  }
}

// GET /api/faculty/students-by-class
// Fetch students enrolled in a specific class
export async function getStudentsByClass(req, res) {
  try {
    const { classGroup } = req.query;
    let students = storage.getUsersByRole('STUDENT');

    if (classGroup) {
      students = students.filter(
        (s) => !s.semester || s.semester === classGroup || classGroup.includes(s.semester)
      );
    }

    const formatted = students.map((s) => ({
      id: s._id,
      rollNo: s.rollNo,
      name: s.name,
      email: s.email,
      department: s.department,
    }));

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch student roster.' });
  }
}

// GET /api/faculty/attendance
// Check or retrieve existing attendance for a specific date, classGroup, and subjectCode
export async function getAttendanceSession(req, res) {
  try {
    const { date, classGroup, subjectCode } = req.query;

    if (!date || !classGroup || !subjectCode) {
      return res.status(400).json({
        success: false,
        message: 'Query parameters date, classGroup, and subjectCode are required.',
      });
    }

    const session = storage.findAttendanceSession(date, classGroup, subjectCode);

    if (!session) {
      return res.json({
        success: true,
        exists: false,
        message: 'No previous attendance recorded for this date and subject.',
        data: null,
      });
    }

    res.json({
      success: true,
      exists: true,
      message: 'Found existing attendance session.',
      data: session,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to check attendance session.' });
  }
}

// POST /api/faculty/attendance
// Save or update attendance session permanently
export async function saveAttendance(req, res) {
  try {
    const {
      date,
      classGroup,
      subjectCode,
      subjectName,
      records,
      allowUpdate,
    } = req.body;

    if (!date || !classGroup || !subjectCode || !records || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid attendance date, classGroup, subjectCode, and records.',
      });
    }

    // Check duplicate
    const existing = storage.findAttendanceSession(date, classGroup, subjectCode);
    if (existing && !allowUpdate) {
      return res.status(409).json({
        success: false,
        isDuplicate: true,
        message: `Attendance for "${subjectCode}" on ${date} is already recorded in the database! Set allowUpdate to true to overwrite.`,
      });
    }

    const faculty = storage.findUserById(req.user._id || req.user.id);
    const facultyName = faculty ? faculty.name : req.user.name || 'Faculty';

    const totalStudents = records.length;
    const presentCount = records.filter((r) => r.status === 'PRESENT').length;
    const absentCount = totalStudents - presentCount;
    const percentage =
      totalStudents > 0 ? Number(((presentCount / totalStudents) * 100).toFixed(1)) : 0;

    const sessionData = {
      date,
      classGroup,
      subjectCode,
      subjectName: subjectName || subjectCode,
      facultyId: req.user._id || req.user.id,
      facultyName,
      records: records.map((r) => ({
        studentId: r.studentId || r.id,
        rollNo: r.rollNo,
        studentName: r.name || r.studentName,
        status: r.status === 'ABSENT' ? 'ABSENT' : 'PRESENT',
        remarks: r.remarks || '',
      })),
      totalStudents,
      presentCount,
      absentCount,
      percentage,
    };

    const result = storage.saveAttendanceSession(sessionData);

    res.status(200).json({
      success: true,
      isUpdate: result.isUpdate,
      message: result.isUpdate
        ? `Attendance for ${subjectCode} on ${date} updated successfully in database.`
        : `Attendance for ${subjectCode} on ${date} saved permanently to database.`,
      data: result.session,
    });
  } catch (error) {
    console.error('[facultyController:saveAttendance] Error:', error);
    res.status(500).json({ success: false, message: 'Failed to save attendance.' });
  }
}

// GET /api/faculty/attendance-history
export async function getAttendanceHistory(req, res) {
  try {
    const facultyId = req.user._id || req.user.id;
    const all = storage.getAllAttendance();
    const history = all.filter((a) => a.facultyId === facultyId || a.facultyName === req.user.name);

    res.json({
      success: true,
      count: history.length,
      data: history.sort((a, b) => new Date(b.date) - new Date(a.date)),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve history.' });
  }
}

// POST /api/faculty/marks
export async function saveStudentMarks(req, res) {
  try {
    const { studentId, rollNo, studentName, subjectCode, subjectName, semester, mid1, mid2, assignment } =
      req.body;

    if (!studentId || !subjectCode) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and Subject Code are required.',
      });
    }

    const saved = storage.saveOrUpdateMark({
      studentId,
      rollNo,
      studentName,
      subjectCode,
      subjectName,
      semester: semester || 'Sem 5',
      mid1: Number(mid1) || 0,
      mid2: Number(mid2) || 0,
      assignment: Number(assignment) || 0,
    });

    res.json({
      success: true,
      message: `Performance marks saved for ${studentName || rollNo} (${subjectCode}).`,
      data: saved,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to save marks.' });
  }
}

// PUT /api/faculty/attendance/:id
// Edit existing attendance session log
export async function updateAttendanceLog(req, res) {
  try {
    const { id } = req.params;
    const { records, date, classGroup, subjectCode, subjectName } = req.body;

    const payload = {};
    if (records && Array.isArray(records)) {
      payload.records = records.map((r) => ({
        studentId: r.studentId || r.id,
        rollNo: r.rollNo,
        studentName: r.name || r.studentName,
        status: r.status === 'ABSENT' ? 'ABSENT' : 'PRESENT',
        remarks: r.remarks || '',
      }));
    }
    if (date) payload.date = date;
    if (classGroup) payload.classGroup = classGroup;
    if (subjectCode) payload.subjectCode = subjectCode;
    if (subjectName) payload.subjectName = subjectName;

    const updated = storage.updateAttendanceById(id, payload);

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Attendance session log not found.' });
    }

    res.json({
      success: true,
      message: 'Attendance log updated successfully in database.',
      data: updated,
    });
  } catch (error) {
    console.error('[facultyController:updateAttendanceLog] Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update attendance log.' });
  }
}

// DELETE /api/faculty/attendance/:id
// Delete attendance log
export async function deleteAttendanceLog(req, res) {
  try {
    const { id } = req.params;
    const deleted = storage.deleteAttendanceById(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Attendance log not found.' });
    }

    res.json({
      success: true,
      message: 'Attendance log deleted successfully from database.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete attendance log.' });
  }
}
