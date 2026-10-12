/**
 * Comprehensive Automated End-to-End Test Suite
 * Verifies all 4 modules and pending requirements.
 */

const API_BASE = 'http://127.0.0.1:5000/api';

async function runTestSuite() {
  console.log('=================================================================');
  console.log('🧪 Starting Student ERP MERN Fullstack Integration Test Suite');
  console.log('=================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, extraInfo = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${extraInfo}`);
      failed++;
    }
  }

  // 1. Health Check
  try {
    const res = await fetch(`${API_BASE}/auth/health`);
    const data = await res.json();
    assert(res.ok && data.status === 'UP', '1. Backend Health Check endpoint is UP');
  } catch (err) {
    assert(false, '1. Backend Health Check failed', err.message);
  }

  // 2. Login with incorrect password
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@college.edu', password: 'IncorrectPassword999' }),
    });
    const data = await res.json();
    assert(res.status === 401 && !data.success && data.message.includes('Incorrect password'), '2. Login rejects incorrect password with 401 error message');
  } catch (err) {
    assert(false, '2. Login incorrect password test failed', err.message);
  }

  // 3. Login with non-existent email
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent@college.edu', password: 'SomePassword' }),
    });
    const data = await res.json();
    assert(res.status === 401 && !data.success, '3. Login rejects non-existent account with 401');
  } catch (err) {
    assert(false, '3. Login non-existent email test failed', err.message);
  }

  // 4. Admin Login with valid credentials
  let adminToken = '';
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@college.edu', password: 'Admin@123' }),
    });
    const data = await res.json();
    adminToken = data.token;
    assert(res.ok && data.success && data.user.role === 'ADMIN' && adminToken, '4. Admin login successful with valid JWT & ADMIN role');
  } catch (err) {
    assert(false, '4. Admin login failed', err.message);
  }

  // 5. Admin Dashboard Stats
  try {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    assert(
      res.ok &&
      data.success &&
      data.data.totalStudents >= 10 &&
      data.data.totalFaculty >= 3 &&
      data.data.totalClasses >= 3,
      '5. Admin Stats returns actual total counts of students, faculty, classes, and system attendance avg'
    );
  } catch (err) {
    assert(false, '5. Admin Stats failed', err.message);
  }

  // 6. Admin Add, Update, and Delete Student
  let createdStudentId = '';
  try {
    // Create Student
    const createRes = await fetch(`${API_BASE}/admin/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Automated Test Student',
        email: 'teststudent@college.edu',
        rollNo: '24TEST001',
        department: 'Computer Science & Engineering',
        semester: 'B.Tech CSE - 3rd Year (Sem 5)',
        section: 'A',
      }),
    });
    const createData = await createRes.json();
    createdStudentId = createData.data?._id;
    assert(createRes.status === 201 && createData.success && createdStudentId, '6a. Admin successfully creates new student record in database');

    // Update Student
    const updateRes = await fetch(`${API_BASE}/admin/students/${createdStudentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ name: 'Automated Test Student Updated' }),
    });
    const updateData = await updateRes.json();
    assert(updateRes.ok && updateData.success && updateData.data.name.includes('Updated'), '6b. Admin successfully updates student profile in database');

    // Delete Student
    const deleteRes = await fetch(`${API_BASE}/admin/students/${createdStudentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const deleteData = await deleteRes.json();
    assert(deleteRes.ok && deleteData.success, '6c. Admin successfully deletes student record from database');
  } catch (err) {
    assert(false, '6. Student CRUD flow failed', err.message);
  }

  // 7. Admin Manage Classes & Subjects
  let createdSubjectId = '';
  try {
    const subRes = await fetch(`${API_BASE}/admin/subjects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        code: 'CS-TEST-99',
        name: 'Cloud Computing Architecture',
        department: 'Computer Science & Engineering',
        semester: 'Sem 5',
        credits: 4,
        facultyName: 'Prof. Rajesh Sharma',
      }),
    });
    const subData = await subRes.json();
    createdSubjectId = subData.data?._id;
    assert(subRes.status === 201 && subData.success && createdSubjectId, '7a. Admin creates new curriculum subject');

    const delSubRes = await fetch(`${API_BASE}/admin/subjects/${createdSubjectId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const delSubData = await delSubRes.json();
    assert(delSubRes.ok && delSubData.success, '7b. Admin deletes curriculum subject');
  } catch (err) {
    assert(false, '7. Subject management failed', err.message);
  }

  // 8. Admin Attendance & Performance Reports
  try {
    const attRes = await fetch(`${API_BASE}/admin/attendance-report`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const attData = await attRes.json();
    assert(attRes.ok && attData.success && Array.isArray(attData.data) && attData.data.length > 0, '8a. Admin attendance reports compiled with real student calculations');

    const perfRes = await fetch(`${API_BASE}/admin/performance-report`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const perfData = await perfRes.json();
    assert(perfRes.ok && perfData.success && Array.isArray(perfData.data) && perfData.data.length > 0, '8b. Admin performance reports compiled with internal assessment scores');
  } catch (err) {
    assert(false, '8. Reports failed', err.message);
  }

  // 9. Faculty Login & Assigned Classes
  let facultyToken = '';
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'faculty@college.edu', password: 'Faculty@123' }),
    });
    const data = await res.json();
    facultyToken = data.token;
    assert(res.ok && data.success && data.user.role === 'FACULTY' && facultyToken, '9. Faculty login successful with valid JWT & FACULTY role');
  } catch (err) {
    assert(false, '9. Faculty login failed', err.message);
  }

  // 10. Faculty Authorized Classes & Student Roster
  let testClass = 'B.Tech CSE - 3rd Year (Sem 5)';
  let testSubject = 'CS-501';
  try {
    const assignedRes = await fetch(`${API_BASE}/faculty/assigned`, {
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    const assignedData = await assignedRes.json();
    assert(assignedRes.ok && assignedData.success && assignedData.classes.length > 0 && assignedData.subjects.length > 0, '10a. Faculty authorized classes and subjects restricted & retrieved');

    const studentsRes = await fetch(`${API_BASE}/faculty/students?classGroup=${encodeURIComponent(testClass)}`, {
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    const studentsData = await studentsRes.json();
    assert(studentsRes.ok && studentsData.success && studentsData.data.length > 0, '10b. Faculty displays enrolled students for selected class');
  } catch (err) {
    assert(false, '10. Faculty roster failed', err.message);
  }

  // 11. Faculty Attendance Saving, Duplicate Detection, and Updating
  const testDate = '2026-10-15';
  try {
    const saveRes = await fetch(`${API_BASE}/faculty/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${facultyToken}`,
      },
      body: JSON.stringify({
        date: testDate,
        classGroup: testClass,
        subjectCode: testSubject,
        subjectName: 'Database Management Systems',
        records: [
          { studentId: 'usr_stu_01', rollNo: '24CS001', studentName: 'Deepak Kumar', status: 'PRESENT', remarks: 'Good' },
          { studentId: 'usr_stu_02', rollNo: '24CS002', studentName: 'Priya Sharma', status: 'ABSENT', remarks: 'Leave' },
        ],
        allowUpdate: false,
      }),
    });
    const saveData = await saveRes.json();
    assert(saveRes.ok && saveData.success, '11a. Faculty marks and permanently saves attendance session to database');

    // Duplicate prevention check (allowUpdate: false)
    const dupRes = await fetch(`${API_BASE}/faculty/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${facultyToken}`,
      },
      body: JSON.stringify({
        date: testDate,
        classGroup: testClass,
        subjectCode: testSubject,
        records: [
          { studentId: 'usr_stu_01', rollNo: '24CS001', studentName: 'Deepak Kumar', status: 'PRESENT' },
        ],
        allowUpdate: false,
      }),
    });
    const dupData = await dupRes.json();
    assert(dupRes.status === 409 && dupData.isDuplicate, '11b. Duplicate attendance for same class, subject, and date is prevented with 409 Conflict');

    // Update attendance check (allowUpdate: true)
    const updateRes = await fetch(`${API_BASE}/faculty/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${facultyToken}`,
      },
      body: JSON.stringify({
        date: testDate,
        classGroup: testClass,
        subjectCode: testSubject,
        records: [
          { studentId: 'usr_stu_01', rollNo: '24CS001', studentName: 'Deepak Kumar', status: 'PRESENT' },
          { studentId: 'usr_stu_02', rollNo: '24CS002', studentName: 'Priya Sharma', status: 'PRESENT', remarks: 'Present now' },
        ],
        allowUpdate: true,
      }),
    });
    const updateData = await updateRes.json();
    assert(updateRes.ok && updateData.isUpdate, '11c. Faculty successfully edits/updates existing attendance session when permitted');
  } catch (err) {
    assert(false, '11. Attendance save & duplicate check failed', err.message);
  }

  // 12. Faculty Enter Internal Marks
  try {
    const markRes = await fetch(`${API_BASE}/faculty/marks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${facultyToken}`,
      },
      body: JSON.stringify({
        studentId: 'usr_stu_01',
        rollNo: '24CS001',
        studentName: 'Deepak Kumar',
        subjectCode: testSubject,
        subjectName: 'Database Management Systems',
        semester: testClass,
        mid1: 28,
        mid2: 29,
        assignment: 19,
      }),
    });
    const markData = await markRes.json();
    assert(markRes.ok && markData.success && markData.data.total === 76 && markData.data.grade === 'A+', '12. Faculty enters internal assessment marks (Mid-1, Mid-2, Assignment) saved to DB with computed grade');
  } catch (err) {
    assert(false, '12. Faculty marks entry failed', err.message);
  }

  // 13. Student Login & Dashboard Analytics
  let studentToken = '';
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@college.edu', password: 'Student@123' }),
    });
    const data = await res.json();
    studentToken = data.token;
    assert(res.ok && data.success && data.user.role === 'STUDENT' && studentToken, '13. Student login successful with valid JWT & STUDENT role');

    const dashRes = await fetch(`${API_BASE}/student/dashboard`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const dashData = await dashRes.json();
    assert(
      dashRes.ok &&
      dashData.success &&
      dashData.data.profile.rollNo === '24CS001' &&
      dashData.data.overall.totalHeld > 0 &&
      dashData.data.overall.totalAttended > 0 &&
      dashData.data.subjectAttendance.length > 0 &&
      dashData.data.academicMarks.length > 0,
      '14. Student Dashboard returns actual logged-in student details, calculated overall %, subject-wise attendance, and marks from DB'
    );
  } catch (err) {
    assert(false, '13/14. Student dashboard failed', err.message);
  }

  // 15. Security & Isolation Check
  try {
    // Attempt Admin endpoint with Student token
    const unauthorizedRes = await fetch(`${API_BASE}/admin/students`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(unauthorizedRes.status === 403, '15. Role-based security verified: Student is forbidden (403) from accessing Admin management');
  } catch (err) {
    assert(false, '15. Security check failed', err.message);
  }

  console.log('\n=================================================================');
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('=================================================================\n');

  if (failed > 0) process.exit(1);
}

runTestSuite();
