import { storage } from '../data/dbStorage.js';

// GET /api/student/dashboard
export async function getStudentDashboard(req, res) {
  try {
    const studentId = req.user._id || req.user.id;
    const student = storage.findUserById(studentId);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    // Restrict student from seeing other users' data: fetch only current student's attendance & marks
    const allSubjects = storage.getAllSubjects();
    const allSessions = storage.getAllAttendance();
    const studentMarks = storage.getStudentMarks(studentId, student.rollNo);

    // Subject-wise attendance calculation
    const subjectAttendanceMap = {};

    for (const sub of allSubjects) {
      subjectAttendanceMap[sub.code] = {
        code: sub.code,
        name: sub.name,
        faculty: sub.facultyName || 'Department Faculty',
        attended: 0,
        total: 0,
        percentage: 0,
        status: 'Eligible',
      };
    }

    // Scan all recorded attendance sessions
    for (const session of allSessions) {
      const code = session.subjectCode;
      if (!subjectAttendanceMap[code]) {
        subjectAttendanceMap[code] = {
          code,
          name: session.subjectName || code,
          faculty: session.facultyName || 'Faculty',
          attended: 0,
          total: 0,
          percentage: 0,
          status: 'Eligible',
        };
      }

      const rec = session.records.find(
        (r) => r.studentId === studentId || (student.rollNo && r.rollNo === student.rollNo)
      );

      if (rec) {
        subjectAttendanceMap[code].total += 1;
        if (rec.status === 'PRESENT') {
          subjectAttendanceMap[code].attended += 1;
        }
      }
    }

    const subjectAttendanceList = Object.values(subjectAttendanceMap).map((sub) => {
      const pct =
        sub.total > 0 ? Number(((sub.attended / sub.total) * 100).toFixed(1)) : 100.0;
      return {
        ...sub,
        percentage: pct,
        status: pct >= 75.0 ? 'Eligible' : 'Attendance Shortage (< 75%)',
      };
    });

    // Overall summary metrics
    const totalAttended = subjectAttendanceList.reduce((acc, curr) => acc + curr.attended, 0);
    const totalHeld = subjectAttendanceList.reduce((acc, curr) => acc + curr.total, 0);
    const overallPercentage =
      totalHeld > 0 ? Number(((totalAttended / totalHeld) * 100).toFixed(1)) : 100.0;
    const missedClasses = totalHeld - totalAttended;

    // Student profile sanitized
    const profile = {
      id: student._id,
      name: student.name,
      email: student.email,
      rollNo: student.rollNo || '24CS001',
      department: student.department || 'Computer Science & Engineering',
      semester: student.semester || 'B.Tech CSE - 3rd Year (Sem 5)',
      section: student.section || 'A',
      academicYear: student.academicYear || '2026-2027',
    };

    res.json({
      success: true,
      data: {
        profile,
        overall: {
          totalAttended,
          totalHeld,
          missedClasses,
          overallPercentage,
          isEligible: overallPercentage >= 75.0,
        },
        subjectAttendance: subjectAttendanceList,
        academicMarks: studentMarks,
      },
    });
  } catch (error) {
    console.error('[studentController:getStudentDashboard] Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve student portal data.' });
  }
}
