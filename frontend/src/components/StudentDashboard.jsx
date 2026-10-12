import { useState, useEffect } from 'react'
import { getStudentDashboard } from '../services/api'
import './StudentDashboard.css'

function StudentDashboard({ user, onLogout }) {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dashboardData, setDashboardData] = useState(null)
  const [error, setError] = useState(null)

  async function loadDashboard(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    const res = await getStudentDashboard()
    if (res.success && res.data) {
      setDashboardData(res.data)
    } else {
      setError(res.message || 'Failed to load student portal data.')
    }

    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const studentProfile = dashboardData?.profile || {
    name: user?.name || 'Deepak Kumar',
    email: user?.email || 'student@college.edu',
    rollNo: user?.rollNo || '24CS001',
    department: user?.department || 'Computer Science & Engineering',
    semester: user?.semester || 'B.Tech CSE - 3rd Year (Semester 5)',
    section: user?.section || 'Section A',
    academicYear: '2026-2027',
  }

  const overall = dashboardData?.overall || {
    totalAttended: 0,
    totalHeld: 0,
    missedClasses: 0,
    overallPercentage: 0,
    isEligible: true,
  }

  const subjectAttendance = dashboardData?.subjectAttendance || []
  const academicMarks = dashboardData?.academicMarks || []

  return (
    <div className="student-erp-root">
      {/* Top ERP Navbar */}
      <header className="erp-navbar">
        <div className="erp-navbar-brand">
          <div className="brand-badge">ERP</div>
          <div className="brand-text">
            <h2>Student Attendance &amp; Performance System</h2>
            <span className="brand-subtitle">Student Portal • MERN Fullstack</span>
          </div>
        </div>

        <div className="erp-navbar-user">
          <div className="user-profile-badge">
            <div className="user-avatar">
              {(studentProfile.name || 'S').charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{studentProfile.name}</span>
              <span className="user-role-tag">STUDENT</span>
            </div>
          </div>
          <button type="button" className="btn-logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Main Student Portal Content */}
      <main className="student-content">
        <div className="student-container">
          {/* Header Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '6px 14px', fontSize: '13px' }}
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : '🔄 Refresh Dashboard'}
            </button>
          </div>

          {error && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          {/* Student Profile Card */}
          <div className="student-profile-card">
            <div className="profile-main-info">
              <div className="student-large-avatar">
                {studentProfile.name.charAt(0).toUpperCase()}
              </div>
              <div className="profile-text">
                <h1>{studentProfile.name}</h1>
                <p className="profile-sub">
                  Roll No: <strong>{studentProfile.rollNo}</strong> • {studentProfile.semester}
                </p>
                <div className="profile-tags">
                  <span className="tag-item">{studentProfile.department}</span>
                  <span className="tag-item">Section {studentProfile.section}</span>
                  <span className="tag-item">Academic Year {studentProfile.academicYear}</span>
                </div>
              </div>
            </div>

            <div className="profile-email-badge">
              <span className="email-label">Student ID / Email</span>
              <span className="email-val">{studentProfile.email}</span>
            </div>
          </div>

          {/* Attendance KPI Summary Grid */}
          <div className="attendance-kpi-grid">
            <div className={`attendance-kpi-card ${overall.isEligible ? 'highlight-card' : ''}`} style={!overall.isEligible ? { borderLeft: '4px solid #dc2626' } : {}}>
              <div className="kpi-header">
                <span className="kpi-title">Overall Attendance</span>
                <span
                  className="criteria-badge"
                  style={
                    overall.isEligible
                      ? {}
                      : { backgroundColor: '#fee2e2', color: '#b91c1c', borderColor: '#fca5a5' }
                  }
                >
                  {overall.isEligible ? 'Requirement Met (≥ 75%)' : 'Shortage Warning (< 75%)'}
                </span>
              </div>
              <div className="kpi-main-stat">
                <span
                  className="percentage-number"
                  style={!overall.isEligible ? { color: '#dc2626' } : {}}
                >
                  {overall.overallPercentage}%
                </span>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${overall.overallPercentage}%`,
                      backgroundColor: overall.isEligible ? '#059669' : '#dc2626',
                    }}
                  />
                </div>
              </div>
              <p className="kpi-subtext">
                Status:{' '}
                <strong style={{ color: overall.isEligible ? '#059669' : '#dc2626' }}>
                  {overall.isEligible
                    ? 'Good Standing (Eligible for Examinations)'
                    : 'Attendance Shortage Alert'}
                </strong>
              </p>
            </div>

            <div className="attendance-kpi-card">
              <span className="kpi-title">Classes Attended</span>
              <span className="kpi-number green-stat">{overall.totalAttended}</span>
              <span className="kpi-subtext">Verified present in lectures</span>
            </div>

            <div className="attendance-kpi-card">
              <span className="kpi-title">Total Classes Held</span>
              <span className="kpi-number blue-stat">{overall.totalHeld}</span>
              <span className="kpi-subtext">Recorded across courses</span>
            </div>

            <div className="attendance-kpi-card">
              <span className="kpi-title">Classes Missed</span>
              <span className="kpi-number amber-stat">{overall.missedClasses}</span>
              <span className="kpi-subtext">Marked absent in session</span>
            </div>
          </div>

          {/* Subject-Wise Attendance Breakdown Table */}
          <div className="data-card">
            <div className="data-card-header">
              <h2>Subject-Wise Attendance Breakdown</h2>
              <span className="header-meta">Current Semester (Database Records)</span>
            </div>

            <div className="table-responsive">
              <table className="student-data-table">
                <thead>
                  <tr>
                    <th>Subject Code</th>
                    <th>Course Name</th>
                    <th>Instructor</th>
                    <th>Attended / Total</th>
                    <th>Attendance %</th>
                    <th>Eligibility Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectAttendance.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '32px' }}>
                        {loading ? 'Loading attendance records...' : 'No subject attendance records found.'}
                      </td>
                    </tr>
                  ) : (
                    subjectAttendance.map((subj) => (
                      <tr key={subj.code}>
                        <td>
                          <strong className="code-pill">{subj.code}</strong>
                        </td>
                        <td>
                          <strong>{subj.name}</strong>
                        </td>
                        <td className="cell-muted">{subj.faculty}</td>
                        <td>
                          {subj.attended} / {subj.total}
                        </td>
                        <td>
                          <div className="percent-cell">
                            <span className="percent-val">{subj.percentage}%</span>
                            <div className="mini-bar-bg">
                              <div
                                className="mini-bar-fill"
                                style={{
                                  width: `${subj.percentage}%`,
                                  backgroundColor: subj.percentage >= 75 ? '#059669' : '#dc2626',
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${subj.percentage >= 75 ? 'eligible' : 'shortage'}`}
                            style={
                              subj.percentage < 75
                                ? { backgroundColor: '#fee2e2', color: '#b91c1c' }
                                : {}
                            }
                          >
                            {subj.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Academic Performance Snapshot */}
          <div className="data-card">
            <div className="data-card-header">
              <h2>Academic Performance Monitoring (Internal Assessments)</h2>
              <span className="header-meta">Mid-Semester &amp; Continuous Evaluation</span>
            </div>

            <div className="table-responsive">
              <table className="student-data-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Mid-Term 1 (30)</th>
                    <th>Mid-Term 2 (30)</th>
                    <th>Assignments (20)</th>
                    <th>Total Score (80)</th>
                    <th>Projected Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {academicMarks.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '32px' }}>
                        No internal evaluation marks recorded for your profile yet.
                      </td>
                    </tr>
                  ) : (
                    academicMarks.map((item) => {
                      const totalScore = item.total || (item.mid1 + item.mid2 + item.assignment)
                      return (
                        <tr key={item._id || item.subjectCode}>
                          <td>
                            <strong>{item.subjectName || item.subjectCode}</strong>
                          </td>
                          <td>{item.mid1} / 30</td>
                          <td>{item.mid2} / 30</td>
                          <td>{item.assignment} / 20</td>
                          <td>
                            <strong style={{ color: '#173b70' }}>{totalScore} / 80</strong>
                          </td>
                          <td>
                            <span className="grade-badge">{item.grade}</span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default StudentDashboard
