/**
 * Centralized API service for communicating with the MERN Express backend.
 * Uses Vite proxy (/api -> http://localhost:5000) during development.
 */

const API_BASE = '/api';

// Helper to get stored JWT token
export function getStoredToken() {
  return localStorage.getItem('token');
}

// Helper for authorized request headers
function getHeaders(customHeaders = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// --- Health Check ---
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE}/auth/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    return { status: 'DOWN', error: error.message };
  }
}

// --- Auth Endpoints ---
export async function loginUser(email, password) {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        message: data.message || 'Login failed. Please verify your credentials.',
      };
    }

    // Persist token and user in localStorage
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  } catch (error) {
    return {
      success: false,
      message: 'Could not connect to the backend server. Please verify the Node.js Express server is running on port 5000.',
    };
  }
}

export function logoutUser() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getStoredUser() {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

// --- Admin APIs ---

export async function getAdminStats() {
  try {
    const res = await fetch(`${API_BASE}/admin/stats`, { headers: getHeaders() });
    return await res.json();
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function getAdminStudents(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/admin/students${query ? `?${query}` : ''}`, {
      headers: getHeaders(),
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function createStudent(studentData) {
  try {
    const res = await fetch(`${API_BASE}/admin/students`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(studentData),
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function updateStudent(id, studentData) {
  try {
    const res = await fetch(`${API_BASE}/admin/students/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(studentData),
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function deleteStudent(id) {
  try {
    const res = await fetch(`${API_BASE}/admin/students/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function getAdminFaculty(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/admin/faculty${query ? `?${query}` : ''}`, {
      headers: getHeaders(),
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function createFaculty(facultyData) {
  try {
    const res = await fetch(`${API_BASE}/admin/faculty`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(facultyData),
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function updateFaculty(id, facultyData) {
  try {
    const res = await fetch(`${API_BASE}/admin/faculty/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(facultyData),
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function deleteFaculty(id) {
  try {
    const res = await fetch(`${API_BASE}/admin/faculty/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function getAdminClasses() {
  try {
    const res = await fetch(`${API_BASE}/admin/classes`, { headers: getHeaders() });
    return await res.json();
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function createClass(classData) {
  try {
    const res = await fetch(`${API_BASE}/admin/classes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(classData),
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function deleteClass(id) {
  try {
    const res = await fetch(`${API_BASE}/admin/classes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function getAdminSubjects() {
  try {
    const res = await fetch(`${API_BASE}/admin/subjects`, { headers: getHeaders() });
    return await res.json();
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function createSubject(subjectData) {
  try {
    const res = await fetch(`${API_BASE}/admin/subjects`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(subjectData),
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function deleteSubject(id) {
  try {
    const res = await fetch(`${API_BASE}/admin/subjects/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function getAdminAttendanceReport(shortageOnly = false) {
  try {
    const res = await fetch(
      `${API_BASE}/admin/attendance-report?shortageOnly=${shortageOnly}`,
      { headers: getHeaders() }
    );
    return await res.json();
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function getAdminPerformanceReport(subjectCode = 'All') {
  try {
    const res = await fetch(
      `${API_BASE}/admin/performance-report?subjectCode=${subjectCode}`,
      { headers: getHeaders() }
    );
    return await res.json();
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// --- Faculty APIs ---

export async function getFacultyAssigned() {
  try {
    const res = await fetch(`${API_BASE}/faculty/assigned`, { headers: getHeaders() });
    return await res.json();
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function getFacultyStudents(classGroup) {
  try {
    const res = await fetch(
      `${API_BASE}/faculty/students${classGroup ? `?classGroup=${encodeURIComponent(classGroup)}` : ''}`,
      { headers: getHeaders() }
    );
    return await res.json();
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function checkAttendanceSession(date, classGroup, subjectCode) {
  try {
    const url = `${API_BASE}/faculty/attendance?date=${encodeURIComponent(date)}&classGroup=${encodeURIComponent(classGroup)}&subjectCode=${encodeURIComponent(subjectCode)}`;
    const res = await fetch(url, { headers: getHeaders() });
    return await res.json();
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function saveAttendance(sessionData) {
  try {
    const res = await fetch(`${API_BASE}/faculty/attendance`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(sessionData),
    });
    const data = await res.json();
    return {
      status: res.status,
      ...data,
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function getFacultyAttendanceHistory() {
  try {
    const res = await fetch(`${API_BASE}/faculty/attendance-history`, { headers: getHeaders() });
    return await res.json();
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function updateAttendanceLog(id, updateData) {
  try {
    const res = await fetch(`${API_BASE}/faculty/attendance/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updateData),
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function deleteAttendanceLog(id) {
  try {
    const res = await fetch(`${API_BASE}/faculty/attendance/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function saveStudentMarks(marksData) {
  try {
    const res = await fetch(`${API_BASE}/faculty/marks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(marksData),
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// --- Student APIs ---

export async function getStudentDashboard() {
  try {
    const res = await fetch(`${API_BASE}/student/dashboard`, { headers: getHeaders() });
    return await res.json();
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export default {
  checkBackendHealth,
  loginUser,
  logoutUser,
  getStoredUser,
  getAdminStats,
  getAdminStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getAdminFaculty,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  getAdminClasses,
  createClass,
  deleteClass,
  getAdminSubjects,
  createSubject,
  deleteSubject,
  getAdminAttendanceReport,
  getAdminPerformanceReport,
  getFacultyAssigned,
  getFacultyStudents,
  checkAttendanceSession,
  saveAttendance,
  getFacultyAttendanceHistory,
  updateAttendanceLog,
  deleteAttendanceLog,
  saveStudentMarks,
  getStudentDashboard,
};
