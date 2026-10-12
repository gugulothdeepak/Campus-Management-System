import { useState, useEffect } from 'react'
import {
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
} from '../services/api'
import './AdminDashboard.css'

function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)

  // Data states
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    totalClasses: 0,
    totalSubjects: 0,
    systemAttendanceAvg: '0%',
  })
  const [students, setStudents] = useState([])
  const [faculty, setFaculty] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [attendanceReport, setAttendanceReport] = useState([])
  const [performanceReport, setPerformanceReport] = useState([])

  // Search & Filters
  const [studentSearch, setStudentSearch] = useState('')
  const [facultySearch, setFacultySearch] = useState('')
  const [shortageFilter, setShortageFilter] = useState(false)
  const [performanceSubjectFilter, setPerformanceSubjectFilter] = useState('All')

  // Modals
  const [studentModalOpen, setStudentModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    rollNo: '',
    department: 'Computer Science & Engineering',
    semester: 'B.Tech CSE - 3rd Year (Sem 5)',
    section: 'A',
    password: '',
  })

  const [facultyModalOpen, setFacultyModalOpen] = useState(false)
  const [editingFaculty, setEditingFaculty] = useState(null)
  const [facultyForm, setFacultyForm] = useState({
    name: '',
    email: '',
    department: 'Computer Science & Engineering',
    designation: 'Assistant Professor',
    assignedClasses: 'B.Tech CSE - 3rd Year (Sem 5)',
    assignedSubjects: 'CS-501',
    password: '',
  })

  const [classModalOpen, setClassModalOpen] = useState(false)
  const [classForm, setClassForm] = useState({
    name: '',
    department: 'Computer Science & Engineering',
    semester: 'Sem 5',
    section: 'A',
    academicYear: '2026-2027',
  })

  const [subjectModalOpen, setSubjectModalOpen] = useState(false)
  const [subjectForm, setSubjectForm] = useState({
    code: '',
    name: '',
    department: 'Computer Science & Engineering',
    semester: 'Sem 5',
    credits: 4,
    facultyName: '',
  })

  const navItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: '📊' },
    { id: 'students', label: 'Manage Students', icon: '👨‍🎓' },
    { id: 'faculty', label: 'Manage Faculty', icon: '👨‍🏫' },
    { id: 'classes', label: 'Manage Classes & Subjects', icon: '📚' },
    { id: 'attendance', label: 'Attendance Reports', icon: '📋' },
    { id: 'performance', label: 'Performance Reports', icon: '📈' },
  ]

  // Toast helper
  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Load stats
  async function fetchStats() {
    const res = await getAdminStats()
    if (res.success && res.data) {
      setStats(res.data)
    }
  }

  // Load students
  async function fetchStudents() {
    setLoading(true)
    const res = await getAdminStudents({ search: studentSearch })
    if (res.success && res.data) {
      setStudents(res.data)
    }
    setLoading(false)
  }

  // Load faculty
  async function fetchFaculty() {
    setLoading(true)
    const res = await getAdminFaculty({ search: facultySearch })
    if (res.success && res.data) {
      setFaculty(res.data)
    }
    setLoading(false)
  }

  // Load classes & subjects
  async function fetchClassesAndSubjects() {
    const cRes = await getAdminClasses()
    if (cRes.success && cRes.data) setClasses(cRes.data)
    const sRes = await getAdminSubjects()
    if (sRes.success && sRes.data) setSubjects(sRes.data)
  }

  // Load attendance report
  async function fetchAttendanceReport() {
    setLoading(true)
    const res = await getAdminAttendanceReport(shortageFilter)
    if (res.success && res.data) {
      setAttendanceReport(res.data)
    }
    setLoading(false)
  }

  // Load performance report
  async function fetchPerformanceReport() {
    setLoading(true)
    const res = await getAdminPerformanceReport(performanceSubjectFilter)
    if (res.success && res.data) {
      setPerformanceReport(res.data)
    }
    setLoading(false)
  }

  // Initial & Tab load
  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    if (activeTab === 'overview') fetchStats()
    if (activeTab === 'students') fetchStudents()
    if (activeTab === 'faculty') fetchFaculty()
    if (activeTab === 'classes') fetchClassesAndSubjects()
    if (activeTab === 'attendance') fetchAttendanceReport()
    if (activeTab === 'performance') fetchPerformanceReport()
  }, [activeTab, shortageFilter, performanceSubjectFilter])

  // --- Student Handlers ---
  function openAddStudentModal() {
    setEditingStudent(null)
    setStudentForm({
      name: '',
      email: '',
      rollNo: '',
      department: 'Computer Science & Engineering',
      semester: 'B.Tech CSE - 3rd Year (Sem 5)',
      section: 'A',
      password: '',
    })
    setStudentModalOpen(true)
  }

  function openEditStudentModal(st) {
    setEditingStudent(st)
    setStudentForm({
      name: st.name,
      email: st.email,
      rollNo: st.rollNo,
      department: st.department || 'Computer Science & Engineering',
      semester: st.semester || 'B.Tech CSE - 3rd Year (Sem 5)',
      section: st.section || 'A',
      password: '',
    })
    setStudentModalOpen(true)
  }

  async function handleStudentSubmit(e) {
    e.preventDefault()
    if (!studentForm.name || !studentForm.email || !studentForm.rollNo) {
      showToast('Name, Email, and Roll Number are required.', 'error')
      return
    }

    if (editingStudent) {
      const res = await updateStudent(editingStudent._id, studentForm)
      if (res.success) {
        showToast(res.message || 'Student updated successfully.')
        setStudentModalOpen(false)
        fetchStudents()
        fetchStats()
      } else {
        showToast(res.message || 'Failed to update student.', 'error')
      }
    } else {
      const res = await createStudent(studentForm)
      if (res.success) {
        showToast(res.message || 'Student created successfully.')
        setStudentModalOpen(false)
        fetchStudents()
        fetchStats()
      } else {
        showToast(res.message || 'Failed to create student.', 'error')
      }
    }
  }

  async function handleDeleteStudent(id, name) {
    if (!window.confirm(`Are you sure you want to delete student "${name}"? This action removes their records permanently.`)) {
      return
    }
    const res = await deleteStudent(id)
    if (res.success) {
      showToast(res.message || 'Student deleted.')
      fetchStudents()
      fetchStats()
    } else {
      showToast(res.message || 'Failed to delete student.', 'error')
    }
  }

  // --- Faculty Handlers ---
  function openAddFacultyModal() {
    setEditingFaculty(null)
    setFacultyForm({
      name: '',
      email: '',
      department: 'Computer Science & Engineering',
      designation: 'Assistant Professor',
      assignedClasses: 'B.Tech CSE - 3rd Year (Sem 5)',
      assignedSubjects: 'CS-501',
      password: '',
    })
    setFacultyModalOpen(true)
  }

  function openEditFacultyModal(fac) {
    setEditingFaculty(fac)
    setFacultyForm({
      name: fac.name,
      email: fac.email,
      department: fac.department || 'Computer Science & Engineering',
      designation: fac.designation || 'Assistant Professor',
      assignedClasses: Array.isArray(fac.assignedClasses) ? fac.assignedClasses.join(', ') : (fac.assignedClasses || ''),
      assignedSubjects: Array.isArray(fac.assignedSubjects) ? fac.assignedSubjects.join(', ') : (fac.assignedSubjects || ''),
      password: '',
    })
    setFacultyModalOpen(true)
  }

  async function handleFacultySubmit(e) {
    e.preventDefault()
    if (!facultyForm.name || !facultyForm.email) {
      showToast('Name and Email are required.', 'error')
      return
    }

    const payload = {
      ...facultyForm,
      assignedClasses: facultyForm.assignedClasses.split(',').map((s) => s.trim()).filter(Boolean),
      assignedSubjects: facultyForm.assignedSubjects.split(',').map((s) => s.trim()).filter(Boolean),
    }

    if (editingFaculty) {
      const res = await updateFaculty(editingFaculty._id, payload)
      if (res.success) {
        showToast(res.message || 'Faculty member updated.')
        setFacultyModalOpen(false)
        fetchFaculty()
        fetchStats()
      } else {
        showToast(res.message || 'Failed to update faculty.', 'error')
      }
    } else {
      const res = await createFaculty(payload)
      if (res.success) {
        showToast(res.message || 'Faculty member registered.')
        setFacultyModalOpen(false)
        fetchFaculty()
        fetchStats()
      } else {
        showToast(res.message || 'Failed to add faculty.', 'error')
      }
    }
  }

  async function handleDeleteFaculty(id, name) {
    if (!window.confirm(`Are you sure you want to remove faculty member "${name}"?`)) return
    const res = await deleteFaculty(id)
    if (res.success) {
      showToast(res.message || 'Faculty removed.')
      fetchFaculty()
      fetchStats()
    } else {
      showToast(res.message || 'Failed to remove faculty.', 'error')
    }
  }

  // --- Classes & Subjects Handlers ---
  async function handleCreateClass(e) {
    e.preventDefault()
    if (!classForm.name) return
    const res = await createClass(classForm)
    if (res.success) {
      showToast(res.message || 'Class added.')
      setClassModalOpen(false)
      setClassForm({ name: '', department: 'Computer Science & Engineering', semester: 'Sem 5', section: 'A', academicYear: '2026-2027' })
      fetchClassesAndSubjects()
      fetchStats()
    } else {
      showToast(res.message || 'Failed to add class.', 'error')
    }
  }

  async function handleDeleteClass(id) {
    if (!window.confirm('Delete this class?')) return
    const res = await deleteClass(id)
    if (res.success) {
      showToast('Class deleted.')
      fetchClassesAndSubjects()
      fetchStats()
    }
  }

  async function handleCreateSubject(e) {
    e.preventDefault()
    if (!subjectForm.code || !subjectForm.name) return
    const res = await createSubject(subjectForm)
    if (res.success) {
      showToast(res.message || 'Subject added.')
      setSubjectModalOpen(false)
      setSubjectForm({ code: '', name: '', department: 'Computer Science & Engineering', semester: 'Sem 5', credits: 4, facultyName: '' })
      fetchClassesAndSubjects()
      fetchStats()
    } else {
      showToast(res.message || 'Failed to add subject.', 'error')
    }
  }

  async function handleDeleteSubject(id) {
    if (!window.confirm('Delete this course subject?')) return
    const res = await deleteSubject(id)
    if (res.success) {
      showToast('Subject deleted.')
      fetchClassesAndSubjects()
      fetchStats()
    }
  }

  // --- CSV Export Helper ---
  function exportAttendanceCSV() {
    if (!attendanceReport || attendanceReport.length === 0) {
      showToast('No attendance records to export.', 'error')
      return
    }

    const headers = ['Roll No,Student Name,Email,Department,Classes Held,Attended,Missed,Attendance %,Status']
    const rows = attendanceReport.map((r) =>
      `"${r.rollNo}","${r.name}","${r.email}","${r.department}",${r.totalHeld},${r.totalAttended},${r.missed},${r.percentage}%,"${r.status}"`
    )
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Attendance_Report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Attendance report CSV downloaded successfully.')
  }

  function exportPerformanceCSV() {
    if (!performanceReport || performanceReport.length === 0) {
      showToast('No performance marks to export.', 'error')
      return
    }

    const headers = ['Roll No,Student Name,Subject Code,Subject Name,Mid-Term 1 (30),Mid-Term 2 (30),Assignment (20),Total (80),Grade']
    const rows = performanceReport.map((m) =>
      `"${m.rollNo}","${m.studentName}","${m.subjectCode}","${m.subjectName}",${m.mid1},${m.mid2},${m.assignment},${m.total},"${m.grade}"`
    )
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Performance_Marks_Report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Performance report CSV downloaded successfully.')
  }

  return (
    <div className="admin-erp-root">
      {/* Top ERP Navbar */}
      <header className="erp-navbar">
        <div className="erp-navbar-brand">
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            ☰
          </button>
          <div className="brand-badge">ERP</div>
          <div className="brand-text">
            <h2>Student Attendance &amp; Performance System</h2>
            <span className="brand-subtitle">Administrator Portal • MERN Fullstack</span>
          </div>
        </div>

        <div className="erp-navbar-user">
          <div className="user-profile-badge">
            <div className="user-avatar">
              {(user?.name || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.name || 'Admin User'}</span>
              <span className="user-role-tag">{user?.role || 'ADMIN'}</span>
            </div>
          </div>
          <button type="button" className="btn-logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Main ERP Layout */}
      <div className="erp-layout">
        {/* Sidebar */}
        <aside className={`erp-sidebar ${mobileMenuOpen ? 'erp-sidebar-open' : ''}`}>
          <div className="sidebar-section-title">MAIN NAVIGATION</div>
          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.id)
                  setMobileMenuOpen(false)
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="system-pill">Academic Year 2026-27</div>
            <div className="system-version">MERN Fullstack • DB Connected</div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="erp-content">
          {/* Toast Notification */}
          {toast && (
            <div className={`toast-banner toast-${toast.type}`} role="alert">
              <span>{toast.message}</span>
              <button
                type="button"
                onClick={() => setToast(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Section 1: Dashboard Overview */}
          {activeTab === 'overview' && (
            <div className="dashboard-section">
              <div className="section-header">
                <div>
                  <h1 className="section-title">Dashboard Overview</h1>
                  <p className="section-desc">
                    Live database statistics for students, faculty, classes, and overall attendance.
                  </p>
                </div>
                <div className="current-date-chip">Academic Session Active</div>
              </div>

              {/* KPI Summary Cards */}
              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-icon kpi-blue">👨‍🎓</div>
                  <div className="kpi-info">
                    <span className="kpi-label">Total Students</span>
                    <span className="kpi-value">{stats.totalStudents}</span>
                    <span className="kpi-meta">Enrolled in college database</span>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-icon kpi-green">👨‍🏫</div>
                  <div className="kpi-info">
                    <span className="kpi-label">Total Faculty</span>
                    <span className="kpi-value">{stats.totalFaculty}</span>
                    <span className="kpi-meta">Active teaching professors</span>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-icon kpi-purple">📚</div>
                  <div className="kpi-info">
                    <span className="kpi-label">Classes &amp; Subjects</span>
                    <span className="kpi-value">{stats.totalClasses + stats.totalSubjects}</span>
                    <span className="kpi-meta">{stats.totalClasses} classes, {stats.totalSubjects} courses</span>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-icon kpi-amber">📊</div>
                  <div className="kpi-info">
                    <span className="kpi-label">System Attendance Avg</span>
                    <span className="kpi-value">{stats.systemAttendanceAvg}</span>
                    <span className="kpi-meta">Institutional target &ge; 75%</span>
                  </div>
                </div>
              </div>

              {/* Quick Navigation Shortcuts */}
              <div className="overview-card">
                <h3 className="card-title">Quick Administration Actions</h3>
                <div className="shortcuts-grid">
                  <button type="button" className="shortcut-btn" onClick={() => setActiveTab('students')}>
                    <span className="shortcut-icon">👨‍🎓</span>
                    <span className="shortcut-title">Manage Students</span>
                    <span className="shortcut-desc">Add new admissions, edit details &amp; manage roster</span>
                  </button>

                  <button type="button" className="shortcut-btn" onClick={() => setActiveTab('faculty')}>
                    <span className="shortcut-icon">👨‍🏫</span>
                    <span className="shortcut-title">Manage Faculty</span>
                    <span className="shortcut-desc">Assign subjects, manage professors &amp; departments</span>
                  </button>

                  <button type="button" className="shortcut-btn" onClick={() => setActiveTab('classes')}>
                    <span className="shortcut-icon">📚</span>
                    <span className="shortcut-title">Manage Classes &amp; Subjects</span>
                    <span className="shortcut-desc">Configure semesters, course codes &amp; academic curriculum</span>
                  </button>

                  <button type="button" className="shortcut-btn" onClick={() => setActiveTab('attendance')}>
                    <span className="shortcut-icon">📋</span>
                    <span className="shortcut-title">Attendance Reports</span>
                    <span className="shortcut-desc">Review shortage alerts (&lt; 75%) &amp; export CSV data</span>
                  </button>

                  <button type="button" className="shortcut-btn" onClick={() => setActiveTab('performance')}>
                    <span className="shortcut-icon">📈</span>
                    <span className="shortcut-title">Performance Reports</span>
                    <span className="shortcut-desc">Inspect Mid-terms, assignment marks &amp; GPA performance</span>
                  </button>
                </div>
              </div>

              {/* System ERP Info */}
              <div className="overview-card">
                <h3 className="card-title">College ERP Architecture</h3>
                <div className="system-info-grid">
                  <div className="info-item">
                    <span className="info-label">Architecture:</span>
                    <span className="info-value highlight">MERN Fullstack (Express + MongoDB)</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Backend Service:</span>
                    <span className="info-value">Node.js Express API (Port 5000)</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Security &amp; Auth:</span>
                    <span className="info-value">BCrypt Passwords + JWT Token Protection</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Active Session:</span>
                    <span className="info-value highlight">{user?.name} (ADMIN)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Manage Students */}
          {activeTab === 'students' && (
            <div className="dashboard-section">
              <div className="section-header">
                <div>
                  <h1 className="section-title">Manage Students</h1>
                  <p className="section-desc">
                    Add new admissions, edit profile details, and delete student records directly from the database.
                  </p>
                </div>
                <button type="button" className="btn-primary" onClick={openAddStudentModal}>
                  + Add New Student
                </button>
              </div>

              <div className="data-card">
                <div className="table-toolbar">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by student name, roll number, or email..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchStudents()}
                  />
                  <button type="button" className="btn-secondary" onClick={fetchStudents}>
                    Search
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Roll Number</th>
                        <th>Student Name</th>
                        <th>Email</th>
                        <th>Department</th>
                        <th>Class / Semester</th>
                        <th>Section</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}>
                            {loading ? 'Loading students...' : 'No student records found.'}
                          </td>
                        </tr>
                      ) : (
                        students.map((st) => (
                          <tr key={st._id}>
                            <td>
                              <span className="roll-badge">{st.rollNo}</span>
                            </td>
                            <td>
                              <div className="user-cell">
                                <div className="user-cell-avatar">
                                  {st.name.charAt(0)}
                                </div>
                                <strong>{st.name}</strong>
                              </div>
                            </td>
                            <td>{st.email}</td>
                            <td>{st.department}</td>
                            <td>{st.semester}</td>
                            <td>{st.section}</td>
                            <td style={{ textAlign: 'center' }}>
                              <div className="action-buttons" style={{ justifyContent: 'center' }}>
                                <button
                                  type="button"
                                  className="btn-edit"
                                  onClick={() => openEditStudentModal(st)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn-delete"
                                  onClick={() => handleDeleteStudent(st._id, st.name)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Manage Faculty */}
          {activeTab === 'faculty' && (
            <div className="dashboard-section">
              <div className="section-header">
                <div>
                  <h1 className="section-title">Manage Faculty</h1>
                  <p className="section-desc">
                    Register faculty members, update assignments, and manage professors.
                  </p>
                </div>
                <button type="button" className="btn-primary" onClick={openAddFacultyModal}>
                  + Add Faculty Member
                </button>
              </div>

              <div className="data-card">
                <div className="table-toolbar">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search faculty by name or email..."
                    value={facultySearch}
                    onChange={(e) => setFacultySearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchFaculty()}
                  />
                  <button type="button" className="btn-secondary" onClick={fetchFaculty}>
                    Search
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Faculty Name</th>
                        <th>Email</th>
                        <th>Department</th>
                        <th>Designation</th>
                        <th>Assigned Subjects</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {faculty.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '32px' }}>
                            {loading ? 'Loading faculty...' : 'No faculty records found.'}
                          </td>
                        </tr>
                      ) : (
                        faculty.map((fac) => (
                          <tr key={fac._id}>
                            <td>
                              <div className="user-cell">
                                <div className="user-cell-avatar">
                                  {fac.name.charAt(0)}
                                </div>
                                <div>
                                  <strong>{fac.name}</strong>
                                </div>
                              </div>
                            </td>
                            <td>{fac.email}</td>
                            <td>{fac.department}</td>
                            <td>{fac.designation || 'Professor'}</td>
                            <td>
                              {fac.assignedSubjects && fac.assignedSubjects.length > 0 ? (
                                fac.assignedSubjects.map((sub) => (
                                  <span key={sub} className="tag-pill">
                                    {sub}
                                  </span>
                                ))
                              ) : (
                                <span style={{ color: '#94a3b8' }}>None</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div className="action-buttons" style={{ justifyContent: 'center' }}>
                                <button
                                  type="button"
                                  className="btn-edit"
                                  onClick={() => openEditFacultyModal(fac)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn-delete"
                                  onClick={() => handleDeleteFaculty(fac._id, fac.name)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Manage Classes and Subjects */}
          {activeTab === 'classes' && (
            <div className="dashboard-section">
              <div className="section-header">
                <div>
                  <h1 className="section-title">Manage Classes &amp; Course Subjects</h1>
                  <p className="section-desc">
                    Configure institutional classes, curriculum courses, credit weights, and faculty assignments.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setClassModalOpen(true)}
                  >
                    + Add Class Section
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setSubjectModalOpen(true)}
                  >
                    + Add Course Subject
                  </button>
                </div>
              </div>

              {/* Classes Table */}
              <div className="data-card" style={{ marginBottom: '32px' }}>
                <div className="table-toolbar">
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#173b70' }}>Registered Classes &amp; Sections</h3>
                </div>
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Class / Program Name</th>
                        <th>Department</th>
                        <th>Semester</th>
                        <th>Section</th>
                        <th>Academic Year</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classes.map((cls) => (
                        <tr key={cls._id}>
                          <td><strong>{cls.name}</strong></td>
                          <td>{cls.department}</td>
                          <td>{cls.semester}</td>
                          <td>{cls.section}</td>
                          <td>{cls.academicYear}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn-delete"
                              onClick={() => handleDeleteClass(cls._id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Subjects Table */}
              <div className="data-card">
                <div className="table-toolbar">
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#173b70' }}>Curriculum Course Subjects</h3>
                </div>
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Subject Code</th>
                        <th>Course Title</th>
                        <th>Department</th>
                        <th>Credits</th>
                        <th>Assigned Instructor</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((sbj) => (
                        <tr key={sbj._id}>
                          <td><span className="roll-badge">{sbj.code}</span></td>
                          <td><strong>{sbj.name}</strong></td>
                          <td>{sbj.department}</td>
                          <td>{sbj.credits} Credits</td>
                          <td>{sbj.facultyName || 'Unassigned'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn-delete"
                              onClick={() => handleDeleteSubject(sbj._id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Attendance Reports */}
          {activeTab === 'attendance' && (
            <div className="dashboard-section">
              <div className="section-header">
                <div>
                  <h1 className="section-title">Attendance Reports &amp; Eligibility Audit</h1>
                  <p className="section-desc">
                    Institutional aggregate attendance statistics with automatic shortage detection (&lt; 75%).
                  </p>
                </div>
                <button type="button" className="btn-secondary" onClick={exportAttendanceCSV}>
                  📥 Export Report (CSV)
                </button>
              </div>

              <div className="data-card">
                <div className="table-toolbar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                      <input
                        type="checkbox"
                        checked={shortageFilter}
                        onChange={(e) => setShortageFilter(e.target.checked)}
                        style={{ marginRight: '6px' }}
                      />
                      Show Attendance Shortage Only (&lt; 75%)
                    </label>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#64748b' }}>
                    Total Enrolled: {attendanceReport.length}
                  </span>
                </div>

                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Roll Number</th>
                        <th>Student Name</th>
                        <th>Department</th>
                        <th>Classes Held</th>
                        <th>Classes Attended</th>
                        <th>Missed</th>
                        <th>Attendance %</th>
                        <th>Examination Eligibility</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceReport.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '32px' }}>
                            {loading ? 'Compiling report...' : 'No student records match filter criteria.'}
                          </td>
                        </tr>
                      ) : (
                        attendanceReport.map((row) => (
                          <tr key={row.studentId}>
                            <td><span className="roll-badge">{row.rollNo}</span></td>
                            <td><strong>{row.name}</strong></td>
                            <td>{row.department}</td>
                            <td>{row.totalHeld}</td>
                            <td><strong style={{ color: '#059669' }}>{row.totalAttended}</strong></td>
                            <td>{row.missed}</td>
                            <td>
                              <strong>{row.percentage}%</strong>
                            </td>
                            <td>
                              <span className={row.percentage >= 75 ? 'badge-eligible' : 'badge-shortage'}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Section 6: Performance Reports */}
          {activeTab === 'performance' && (
            <div className="dashboard-section">
              <div className="section-header">
                <div>
                  <h1 className="section-title">Academic Performance &amp; Examination Reports</h1>
                  <p className="section-desc">
                    Internal assessments, Mid-Term 1, Mid-Term 2, continuous assignments, and grades.
                  </p>
                </div>
                <button type="button" className="btn-secondary" onClick={exportPerformanceCSV}>
                  📥 Export Report (CSV)
                </button>
              </div>

              <div className="data-card">
                <div className="table-toolbar">
                  <select
                    className="filter-select"
                    value={performanceSubjectFilter}
                    onChange={(e) => setPerformanceSubjectFilter(e.target.value)}
                  >
                    <option value="All">All Subjects</option>
                    {subjects.map((s) => (
                      <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                    ))}
                  </select>
                  <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#64748b' }}>
                    Total Score Records: {performanceReport.length}
                  </span>
                </div>

                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Roll Number</th>
                        <th>Student Name</th>
                        <th>Subject Code</th>
                        <th>Course Title</th>
                        <th>Mid-1 (30)</th>
                        <th>Mid-2 (30)</th>
                        <th>Assignment (20)</th>
                        <th>Total Score (80)</th>
                        <th>Projected Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceReport.length === 0 ? (
                        <tr>
                          <td colSpan="9" style={{ textAlign: 'center', padding: '32px' }}>
                            {loading ? 'Compiling marks...' : 'No marks recorded for this filter.'}
                          </td>
                        </tr>
                      ) : (
                        performanceReport.map((m) => (
                          <tr key={m._id}>
                            <td><span className="roll-badge">{m.rollNo}</span></td>
                            <td><strong>{m.studentName}</strong></td>
                            <td><strong>{m.subjectCode}</strong></td>
                            <td>{m.subjectName}</td>
                            <td>{m.mid1} / 30</td>
                            <td>{m.mid2} / 30</td>
                            <td>{m.assignment} / 20</td>
                            <td>
                              <strong style={{ color: '#173b70' }}>{m.total} / 80</strong>
                            </td>
                            <td>
                              <span className="badge-eligible" style={{ fontSize: '12px', fontWeight: 'bold' }}>
                                {m.grade}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: Add / Edit Student */}
      {studentModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>{editingStudent ? 'Edit Student Record' : 'Register New Student'}</h3>
              <button type="button" className="btn-close" onClick={() => setStudentModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleStudentSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Student Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={studentForm.name}
                      onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>College Roll Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 24CS011"
                      value={studentForm.rollNo}
                      onChange={(e) => setStudentForm({ ...studentForm, rollNo: e.target.value })}
                    />
                  </div>
                  <div className="form-group form-group-full">
                    <label>Official Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. ramesh@college.edu"
                      value={studentForm.email}
                      onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Academic Department</label>
                    <select
                      value={studentForm.department}
                      onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                    >
                      <option value="Computer Science & Engineering">Computer Science &amp; Engineering</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Electronics & Communication">Electronics &amp; Communication</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Class &amp; Semester</label>
                    <input
                      type="text"
                      placeholder="e.g. B.Tech CSE - 3rd Year (Sem 5)"
                      value={studentForm.semester}
                      onChange={(e) => setStudentForm({ ...studentForm, semester: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Section</label>
                    <input
                      type="text"
                      placeholder="e.g. A"
                      value={studentForm.section}
                      onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{editingStudent ? 'New Password (Optional)' : 'Password'}</label>
                    <input
                      type="password"
                      placeholder={editingStudent ? 'Leave blank to keep unchanged' : 'Default: Student@123'}
                      value={studentForm.password}
                      onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setStudentModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingStudent ? 'Save Changes' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Faculty */}
      {facultyModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>{editingFaculty ? 'Edit Faculty Profile' : 'Register New Faculty'}</h3>
              <button type="button" className="btn-close" onClick={() => setFacultyModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleFacultySubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group form-group-full">
                    <label>Faculty Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Kavita Sharma"
                      value={facultyForm.name}
                      onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group form-group-full">
                    <label>Faculty Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. kavita@college.edu"
                      value={facultyForm.email}
                      onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <select
                      value={facultyForm.department}
                      onChange={(e) => setFacultyForm({ ...facultyForm, department: e.target.value })}
                    >
                      <option value="Computer Science & Engineering">Computer Science &amp; Engineering</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Electronics & Communication">Electronics &amp; Communication</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Designation</label>
                    <input
                      type="text"
                      placeholder="e.g. Associate Professor"
                      value={facultyForm.designation}
                      onChange={(e) => setFacultyForm({ ...facultyForm, designation: e.target.value })}
                    />
                  </div>
                  <div className="form-group form-group-full">
                    <label>Assigned Subjects (comma-separated codes)</label>
                    <input
                      type="text"
                      placeholder="e.g. CS-501, CS-504"
                      value={facultyForm.assignedSubjects}
                      onChange={(e) => setFacultyForm({ ...facultyForm, assignedSubjects: e.target.value })}
                    />
                  </div>
                  <div className="form-group form-group-full">
                    <label>{editingFaculty ? 'New Password (Optional)' : 'Password'}</label>
                    <input
                      type="password"
                      placeholder={editingFaculty ? 'Leave blank to keep unchanged' : 'Default: Faculty@123'}
                      value={facultyForm.password}
                      onChange={(e) => setFacultyForm({ ...facultyForm, password: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setFacultyModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingFaculty ? 'Save Changes' : 'Register Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Class */}
      {classModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Create Class Section</h3>
              <button type="button" className="btn-close" onClick={() => setClassModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateClass}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group form-group-full">
                    <label>Class Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. B.Tech IT - 3rd Year (Sem 5)"
                      value={classForm.name}
                      onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <input
                      type="text"
                      value={classForm.department}
                      onChange={(e) => setClassForm({ ...classForm, department: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Semester</label>
                    <input
                      type="text"
                      value={classForm.semester}
                      onChange={(e) => setClassForm({ ...classForm, semester: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Section</label>
                    <input
                      type="text"
                      value={classForm.section}
                      onChange={(e) => setClassForm({ ...classForm, section: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Academic Year</label>
                    <input
                      type="text"
                      value={classForm.academicYear}
                      onChange={(e) => setClassForm({ ...classForm, academicYear: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setClassModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">Add Class</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Subject */}
      {subjectModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Add Course Subject</h3>
              <button type="button" className="btn-close" onClick={() => setSubjectModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateSubject}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Subject Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CS-505"
                      value={subjectForm.code}
                      onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Credits</label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={subjectForm.credits}
                      onChange={(e) => setSubjectForm({ ...subjectForm, credits: e.target.value })}
                    />
                  </div>
                  <div className="form-group form-group-full">
                    <label>Course Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Artificial Intelligence"
                      value={subjectForm.name}
                      onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group form-group-full">
                    <label>Assigned Faculty Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Prof. Rajesh Sharma"
                      value={subjectForm.facultyName}
                      onChange={(e) => setSubjectForm({ ...subjectForm, facultyName: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setSubjectModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">Add Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
