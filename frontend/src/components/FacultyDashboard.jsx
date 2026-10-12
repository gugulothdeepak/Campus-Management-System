import { useState, useEffect } from 'react'
import {
  getFacultyAssigned,
  getFacultyStudents,
  checkAttendanceSession,
  saveAttendance,
  getFacultyAttendanceHistory,
  updateAttendanceLog,
  deleteAttendanceLog,
  saveStudentMarks,
} from '../services/api'
import './FacultyDashboard.css'

function FacultyDashboard({ user, onLogout }) {
  const [activeNav, setActiveNav] = useState('attendance') // 'attendance' | 'marks' | 'history' | 'edit-log'

  // Authorized classes and subjects from backend
  const [assignedClasses, setAssignedClasses] = useState([])
  const [assignedSubjects, setAssignedSubjects] = useState([])

  // Selection states
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubjectCode, setSelectedSubjectCode] = useState('')
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10))

  // Roster and Attendance states
  const [students, setStudents] = useState([])
  const [existingSession, setExistingSession] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveBanner, setSaveBanner] = useState(null)
  const [alertError, setAlertError] = useState(null)

  // Attendance History
  const [historyList, setHistoryList] = useState([])

  // Editing specific attendance log state
  const [editingSession, setEditingSession] = useState(null)
  const [editingRecords, setEditingRecords] = useState([])
  const [editingDate, setEditingDate] = useState('')
  const [isUpdatingLog, setIsUpdatingLog] = useState(false)

  // Marks Entry state
  const [marksState, setMarksState] = useState({})
  const [marksSavedNotice, setMarksSavedNotice] = useState(null)

  // Fetch faculty assignments on mount
  useEffect(() => {
    async function loadAssignments() {
      const res = await getFacultyAssigned()
      if (res.success) {
        setAssignedClasses(res.classes || [])
        setAssignedSubjects(res.subjects || [])

        if (res.classes && res.classes.length > 0) {
          setSelectedClass(res.classes[0].name)
        }
        if (res.subjects && res.subjects.length > 0) {
          setSelectedSubjectCode(res.subjects[0].code)
        }
      }
    }
    loadAssignments()
  }, [])

  // When selectedClass changes, fetch real students enrolled in that class
  useEffect(() => {
    if (!selectedClass) return

    async function loadStudents() {
      const res = await getFacultyStudents(selectedClass)
      if (res.success && res.data) {
        // Initialize default roster with PRESENT
        const roster = res.data.map((st) => ({
          studentId: st.id,
          rollNo: st.rollNo,
          name: st.name,
          status: 'PRESENT',
          remarks: '',
        }))
        setStudents(roster)
      }
    }
    loadStudents()
  }, [selectedClass])

  // Check if attendance already exists for selectedDate + selectedClass + selectedSubjectCode
  useEffect(() => {
    if (!selectedClass || !selectedSubjectCode || !selectedDate) return

    async function checkExisting() {
      setAlertError(null)
      const res = await checkAttendanceSession(selectedDate, selectedClass, selectedSubjectCode)

      if (res.success && res.exists && res.data) {
        setExistingSession(res.data)
        // Populate existing student statuses from saved session
        if (res.data.records && res.data.records.length > 0) {
          setStudents((prev) =>
            prev.map((student) => {
              const matched = res.data.records.find(
                (r) => r.studentId === student.studentId || r.rollNo === student.rollNo
              )
              if (matched) {
                return {
                  ...student,
                  status: matched.status,
                  remarks: matched.remarks || '',
                }
              }
              return student
            })
          )
        }
      } else {
        setExistingSession(null)
      }
    }

    checkExisting()
  }, [selectedDate, selectedClass, selectedSubjectCode])

  // Computed metrics for daily attendance
  const totalStudents = students.length
  const presentCount = students.filter((s) => s.status === 'PRESENT').length
  const absentCount = students.filter((s) => s.status === 'ABSENT').length
  const attendanceRate = totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(1) : '0'

  // Computed metrics for editing session
  const editTotal = editingRecords.length
  const editPresent = editingRecords.filter((r) => r.status === 'PRESENT').length
  const editAbsent = editTotal - editPresent
  const editRate = editTotal > 0 ? ((editPresent / editTotal) * 100).toFixed(1) : '0'

  // Current subject object
  const currentSubject = assignedSubjects.find((s) => s.code === selectedSubjectCode)

  // Status toggle handler
  function handleStatusChange(studentId, newStatus) {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status: newStatus } : s))
    )
    setSaveBanner(null)
  }

  function handleRemarksChange(studentId, newRemarks) {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, remarks: newRemarks } : s))
    )
  }

  function handleMarkAll(status) {
    setStudents((prev) => prev.map((s) => ({ ...s, status })))
    setSaveBanner(null)
  }

  // Save Attendance to Database permanently
  async function handleSaveAttendance() {
    if (!selectedClass || !selectedSubjectCode || !selectedDate) {
      setAlertError('Please select valid Class, Subject, and Date.')
      return
    }

    if (students.length === 0) {
      setAlertError('No students listed in this class roster.')
      return
    }

    setIsSaving(true)
    setAlertError(null)

    const payload = {
      date: selectedDate,
      classGroup: selectedClass,
      subjectCode: selectedSubjectCode,
      subjectName: currentSubject?.name || selectedSubjectCode,
      records: students.map((s) => ({
        studentId: s.studentId,
        rollNo: s.rollNo,
        studentName: s.name,
        status: s.status,
        remarks: s.remarks,
      })),
      allowUpdate: true,
    }

    const res = await saveAttendance(payload)
    setIsSaving(false)

    if (res.success && res.data) {
      setSaveBanner({
        date: selectedDate,
        subject: currentSubject?.name || selectedSubjectCode,
        classGroup: selectedClass,
        total: totalStudents,
        present: presentCount,
        absent: absentCount,
        rate: attendanceRate,
        isUpdate: res.isUpdate,
        timestamp: new Date().toLocaleTimeString(),
      })
      setExistingSession(res.data)
      loadHistory()
    } else {
      setAlertError(res.message || 'Failed to save attendance.')
    }
  }

  // Load History
  async function loadHistory() {
    const res = await getFacultyAttendanceHistory()
    if (res.success && res.data) {
      setHistoryList(res.data)
    }
  }

  useEffect(() => {
    if (activeNav === 'history') {
      loadHistory()
    }
  }, [activeNav])

  // --- Handlers for Editing Attendance Log from History ---
  function handleStartEdit(session) {
    setEditingSession(session)
    setEditingDate(session.date)
    setEditingRecords(
      (session.records || []).map((r) => ({
        studentId: r.studentId || r.id,
        rollNo: r.rollNo,
        studentName: r.studentName || r.name,
        status: r.status,
        remarks: r.remarks || '',
      }))
    )
    setActiveNav('edit-log')
  }

  function handleCancelEdit() {
    setEditingSession(null)
    setEditingRecords([])
    setActiveNav('history')
  }

  function handleEditStatusChange(studentId, newStatus) {
    setEditingRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status: newStatus } : r))
    )
  }

  function handleEditRemarksChange(studentId, newRemarks) {
    setEditingRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, remarks: newRemarks } : r))
    )
  }

  function handleEditMarkAll(status) {
    setEditingRecords((prev) => prev.map((r) => ({ ...r, status })))
  }

  async function handleSaveEditedLog() {
    if (!editingSession) return

    setIsUpdatingLog(true)
    let res = await updateAttendanceLog(editingSession._id, {
      date: editingDate,
      records: editingRecords,
      classGroup: editingSession.classGroup,
      subjectCode: editingSession.subjectCode,
      subjectName: editingSession.subjectName,
    })

    // Resilient fallback in case server was started before route update
    if (!res || !res.success) {
      res = await saveAttendance({
        date: editingDate,
        records: editingRecords,
        classGroup: editingSession.classGroup,
        subjectCode: editingSession.subjectCode,
        subjectName: editingSession.subjectName,
        allowUpdate: true,
      })
    }

    setIsUpdatingLog(false)

    if (res && res.success) {
      setSaveBanner({
        date: editingDate,
        subject: editingSession.subjectName,
        classGroup: editingSession.classGroup,
        total: editTotal,
        present: editPresent,
        absent: editAbsent,
        rate: editRate,
        isUpdate: true,
        timestamp: new Date().toLocaleTimeString(),
      })
      await loadHistory()
      setActiveNav('history')
      setEditingSession(null)
    } else {
      setAlertError((res && res.message) || 'Failed to update attendance log.')
    }
  }

  async function handleDeleteLog(id, date, subjectCode) {
    if (!window.confirm(`Are you sure you want to delete the attendance log for ${subjectCode} on ${date}?`)) {
      return
    }

    const res = await deleteAttendanceLog(id)
    if (res.success) {
      await loadHistory()
    } else {
      alert(res.message || 'Failed to delete attendance log.')
    }
  }

  // Save single student's internal mark
  async function handleSaveSingleMark(st) {
    const stMarks = marksState[st.studentId] || {}
    const mid1 = Number(stMarks.mid1) || 0
    const mid2 = Number(stMarks.mid2) || 0
    const assignment = Number(stMarks.assignment) || 0

    const res = await saveStudentMarks({
      studentId: st.studentId,
      rollNo: st.rollNo,
      studentName: st.name,
      subjectCode: selectedSubjectCode,
      subjectName: currentSubject?.name || selectedSubjectCode,
      semester: selectedClass,
      mid1,
      mid2,
      assignment,
    })

    if (res.success) {
      setMarksSavedNotice(`Marks saved for ${st.name} (${st.rollNo})! Total: ${mid1 + mid2 + assignment} / 80`)
      setTimeout(() => setMarksSavedNotice(null), 4000)
    }
  }

  return (
    <div className="faculty-erp-root">
      {/* Top ERP Navbar */}
      <header className="erp-navbar">
        <div className="erp-navbar-brand">
          <div className="brand-badge">ERP</div>
          <div className="brand-text">
            <h2>Student Attendance &amp; Performance System</h2>
            <span className="brand-subtitle">Faculty Portal • MERN Fullstack</span>
          </div>
        </div>

        <div className="erp-navbar-user">
          <div className="user-profile-badge">
            <div className="user-avatar">
              {(user?.name || 'F').charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.name || 'Faculty Member'}</span>
              <span className="user-role-tag">{user?.role || 'FACULTY'}</span>
            </div>
          </div>
          <button type="button" className="btn-logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Main Faculty Content */}
      <main className="faculty-content">
        <div className="faculty-container">
          {/* Header Banner */}
          <div className="faculty-welcome-card">
            <div className="welcome-info">
              <h1>Faculty Attendance Register &amp; Marks Portal</h1>
              <p>
                Instructor: <strong>{user?.name}</strong> • Department of{' '}
                <strong>{user?.department || 'Computer Science & Engineering'}</strong>
              </p>
            </div>
            <div className="notice-pill">Academic Year 2026-27</div>
          </div>

          {/* Navigation Tabs */}
          <div className="faculty-nav-tabs">
            <button
              type="button"
              className={`faculty-nav-tab ${activeNav === 'attendance' ? 'active' : ''}`}
              onClick={() => setActiveNav('attendance')}
            >
              📋 Mark Daily Attendance
            </button>
            <button
              type="button"
              className={`faculty-nav-tab ${activeNav === 'history' ? 'active' : ''}`}
              onClick={() => setActiveNav('history')}
            >
              📅 Attendance History
            </button>
            {editingSession && (
              <button
                type="button"
                className={`faculty-nav-tab ${activeNav === 'edit-log' ? 'active' : ''}`}
                onClick={() => setActiveNav('edit-log')}
                style={{ color: '#173b70', fontWeight: 'bold' }}
              >
                ✏️ Edit Log ({editingSession.subjectCode} - {editingDate})
              </button>
            )}
            <button
              type="button"
              className={`faculty-nav-tab ${activeNav === 'marks' ? 'active' : ''}`}
              onClick={() => setActiveNav('marks')}
            >
              📝 Enter Internal Marks
            </button>
          </div>

          {/* TAB 1: MARK ATTENDANCE */}
          {activeNav === 'attendance' && (
            <div>
              {/* Controls Bar: Class, Subject, Date */}
              <div className="attendance-controls-card">
                <div className="control-group">
                  <label htmlFor="classSelect">Class / Section</label>
                  <select
                    id="classSelect"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                  >
                    {assignedClasses.length > 0 ? (
                      assignedClasses.map((cls) => (
                        <option key={cls._id || cls.name} value={cls.name}>
                          {cls.name}
                        </option>
                      ))
                    ) : (
                      <option value="B.Tech CSE - 3rd Year (Sem 5)">B.Tech CSE - 3rd Year (Sem 5)</option>
                    )}
                  </select>
                </div>

                <div className="control-group">
                  <label htmlFor="subjectSelect">Assigned Subject</label>
                  <select
                    id="subjectSelect"
                    value={selectedSubjectCode}
                    onChange={(e) => setSelectedSubjectCode(e.target.value)}
                  >
                    {assignedSubjects.length > 0 ? (
                      assignedSubjects.map((sbj) => (
                        <option key={sbj.code} value={sbj.code}>
                          {sbj.code} - {sbj.name}
                        </option>
                      ))
                    ) : (
                      <option value="CS-501">CS-501 - Database Management Systems</option>
                    )}
                  </select>
                </div>

                <div className="control-group">
                  <label htmlFor="attendanceDate">Attendance Date</label>
                  <input
                    id="attendanceDate"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Duplicate / Existing Attendance Alert Banner */}
              {existingSession && (
                <div className="existing-session-banner">
                  <span>ℹ️</span>
                  <div>
                    <strong>Existing Session Found in Database:</strong> Attendance for{' '}
                    <strong>{selectedSubjectCode}</strong> on <strong>{selectedDate}</strong> was already saved.
                    Current roster displays the saved records. Any modifications made will update the existing database record.
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {alertError && (
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
                  {alertError}
                </div>
              )}

              {/* Summary KPIs & Bulk Action Buttons */}
              <div className="roster-header-bar">
                <div className="stats-pills">
                  <span className="stat-pill total">Total Students: {totalStudents}</span>
                  <span className="stat-pill present">Present: {presentCount}</span>
                  <span className="stat-pill absent">Absent: {absentCount}</span>
                  <span className="stat-pill rate">Rate: {attendanceRate}%</span>
                </div>

                <div className="bulk-actions">
                  <button
                    type="button"
                    className="btn-bulk present"
                    onClick={() => handleMarkAll('PRESENT')}
                  >
                    Mark All Present
                  </button>
                  <button
                    type="button"
                    className="btn-bulk absent"
                    onClick={() => handleMarkAll('ABSENT')}
                  >
                    Mark All Absent
                  </button>
                </div>
              </div>

              {/* Success Banner if Saved */}
              {saveBanner && (
                <div className="save-confirmation-card" role="status">
                  <div className="confirmation-header">
                    <span className="check-icon">✓</span>
                    <div>
                      <h3>
                        {saveBanner.isUpdate
                          ? 'Attendance Session Updated in MongoDB'
                          : 'Attendance Recorded Permanently in Database'}
                      </h3>
                      <p>
                        Recorded for <strong>{saveBanner.subject}</strong> on <strong>{saveBanner.date}</strong> at{' '}
                        {saveBanner.timestamp}.
                      </p>
                    </div>
                  </div>
                  <div className="confirmation-meta">
                    <span>Class: {saveBanner.classGroup}</span>
                    <span>Present: {saveBanner.present} / {saveBanner.total}</span>
                    <span>Absent: {saveBanner.absent}</span>
                    <span>Attendance Rate: {saveBanner.rate}%</span>
                    <span className="db-status-tag">Status: Persisted in Database</span>
                  </div>
                </div>
              )}

              {/* Student Roster Table */}
              <div className="roster-table-card">
                <div className="table-header">
                  <h2>Student Roster &amp; Daily Attendance Sheet</h2>
                  <span className="roster-count">{totalStudents} Students Listed</span>
                </div>

                <div className="table-responsive">
                  <table className="attendance-table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>#</th>
                        <th style={{ width: '130px' }}>Roll Number</th>
                        <th>Student Name</th>
                        <th style={{ width: '220px', textAlign: 'center' }}>Attendance Status</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '32px' }}>
                            Loading students for {selectedClass}...
                          </td>
                        </tr>
                      ) : (
                        students.map((student, index) => (
                          <tr
                            key={student.studentId || student.rollNo}
                            className={student.status === 'ABSENT' ? 'row-absent' : ''}
                          >
                            <td className="cell-muted">{index + 1}</td>
                            <td>
                              <strong className="roll-number">{student.rollNo}</strong>
                            </td>
                            <td>
                              <div className="student-name-cell">
                                <span className="student-initial">
                                  {student.name.charAt(0)}
                                </span>
                                <span>{student.name}</span>
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div className="status-toggle-group">
                                <button
                                  type="button"
                                  className={`toggle-btn btn-present ${student.status === 'PRESENT' ? 'selected' : ''}`}
                                  onClick={() => handleStatusChange(student.studentId, 'PRESENT')}
                                >
                                  Present
                                </button>
                                <button
                                  type="button"
                                  className={`toggle-btn btn-absent ${student.status === 'ABSENT' ? 'selected' : ''}`}
                                  onClick={() => handleStatusChange(student.studentId, 'ABSENT')}
                                >
                                  Absent
                                </button>
                              </div>
                            </td>
                            <td>
                              <input
                                type="text"
                                className="remarks-input"
                                placeholder="Optional remarks..."
                                value={student.remarks}
                                onChange={(e) => handleRemarksChange(student.studentId, e.target.value)}
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Save Bar */}
                <div className="table-footer-bar">
                  <div className="footer-stats">
                    Ready to save attendance for <strong>{selectedDate}</strong> ({selectedClass})
                  </div>
                  <button
                    type="button"
                    className="btn-save-attendance"
                    disabled={isSaving}
                    onClick={handleSaveAttendance}
                  >
                    {isSaving
                      ? 'Saving to Database...'
                      : existingSession
                      ? 'Update Saved Attendance'
                      : 'Save Daily Attendance'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ATTENDANCE HISTORY (WITH EDIT TAB/BUTTON) */}
          {activeNav === 'history' && (
            <div>
              <div className="section-header">
                <div>
                  <h2 style={{ fontSize: '20px', color: '#173b70', margin: '0 0 4px' }}>
                    Attendance History &amp; Saved Session Logs
                  </h2>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                    View and edit previously recorded attendance sessions stored in the database.
                  </p>
                </div>
              </div>

              {saveBanner && (
                <div className="save-confirmation-card" style={{ marginBottom: '20px' }}>
                  <div className="confirmation-header">
                    <span className="check-icon">✓</span>
                    <div>
                      <h3>Attendance Session Log Updated</h3>
                      <p>Updated for {saveBanner.subject} ({saveBanner.classGroup}) on {saveBanner.date}.</p>
                    </div>
                  </div>
                </div>
              )}

              {historyList.length === 0 ? (
                <div style={{ backgroundColor: 'white', padding: '48px 20px', textAlign: 'center', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '36px', display: 'block', marginBottom: '8px' }}>📋</span>
                  <h3 style={{ margin: '0 0 6px', color: '#173b70' }}>No Attendance Logs Recorded</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                    Go to the "Mark Daily Attendance" tab to submit your first session.
                  </p>
                </div>
              ) : (
                <div className="history-grid">
                  {historyList.map((h) => (
                    <div key={h._id} className="history-card">
                      <div className="history-card-header">
                        <span className="history-subject">{h.subjectName} ({h.subjectCode})</span>
                        <span className="history-date">📅 {h.date}</span>
                      </div>
                      <div className="history-meta">
                        <strong>Class:</strong> {h.classGroup}
                      </div>
                      <div className="history-stats">
                        <span style={{ color: '#059669', fontWeight: 700 }}>Present: {h.presentCount}</span>
                        <span style={{ color: '#dc2626', fontWeight: 700 }}>Absent: {h.absentCount}</span>
                        <span style={{ color: '#1d4ed8', fontWeight: 700 }}>Rate: {h.percentage}%</span>
                      </div>
                      <div className="history-card-actions">
                        <button
                          type="button"
                          className="btn-edit-log"
                          onClick={() => handleStartEdit(h)}
                        >
                          ✏️ Edit Attendance Log
                        </button>
                        <button
                          type="button"
                          className="btn-delete-log"
                          onClick={() => handleDeleteLog(h._id, h.date, h.subjectCode)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EDIT ATTENDANCE LOG VIEW */}
          {activeNav === 'edit-log' && editingSession && (
            <div>
              <div className="edit-log-banner">
                <div className="edit-log-info">
                  <h3>Editing Attendance Log: {editingSession.subjectName} ({editingSession.subjectCode})</h3>
                  <p>
                    Class: <strong>{editingSession.classGroup}</strong> • Instructor: <strong>{editingSession.facultyName || user?.name}</strong>
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#173b70' }}>Date:</label>
                  <input
                    type="date"
                    value={editingDate}
                    onChange={(e) => setEditingDate(e.target.value)}
                    style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '13px' }}
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Roster Controls */}
              <div className="roster-header-bar">
                <div className="stats-pills">
                  <span className="stat-pill total">Total: {editTotal}</span>
                  <span className="stat-pill present">Present: {editPresent}</span>
                  <span className="stat-pill absent">Absent: {editAbsent}</span>
                  <span className="stat-pill rate">Rate: {editRate}%</span>
                </div>

                <div className="bulk-actions">
                  <button
                    type="button"
                    className="btn-bulk present"
                    onClick={() => handleEditMarkAll('PRESENT')}
                  >
                    Mark All Present
                  </button>
                  <button
                    type="button"
                    className="btn-bulk absent"
                    onClick={() => handleEditMarkAll('ABSENT')}
                  >
                    Mark All Absent
                  </button>
                </div>
              </div>

              {/* Editable Attendance Table */}
              <div className="roster-table-card">
                <div className="table-header">
                  <h2>Update Student Attendance Records</h2>
                  <span className="roster-count">{editTotal} Students in Log</span>
                </div>

                <div className="table-responsive">
                  <table className="attendance-table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>#</th>
                        <th style={{ width: '130px' }}>Roll Number</th>
                        <th>Student Name</th>
                        <th style={{ width: '220px', textAlign: 'center' }}>Attendance Status</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editingRecords.map((r, index) => (
                        <tr
                          key={r.studentId || r.rollNo}
                          className={r.status === 'ABSENT' ? 'row-absent' : ''}
                        >
                          <td className="cell-muted">{index + 1}</td>
                          <td>
                            <strong className="roll-number">{r.rollNo}</strong>
                          </td>
                          <td>
                            <div className="student-name-cell">
                              <span className="student-initial">
                                {(r.studentName || 'S').charAt(0)}
                              </span>
                              <span>{r.studentName}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="status-toggle-group">
                              <button
                                type="button"
                                className={`toggle-btn btn-present ${r.status === 'PRESENT' ? 'selected' : ''}`}
                                onClick={() => handleEditStatusChange(r.studentId, 'PRESENT')}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                className={`toggle-btn btn-absent ${r.status === 'ABSENT' ? 'selected' : ''}`}
                                onClick={() => handleEditStatusChange(r.studentId, 'ABSENT')}
                              >
                                Absent
                              </button>
                            </div>
                          </td>
                          <td>
                            <input
                              type="text"
                              className="remarks-input"
                              placeholder="Optional remarks..."
                              value={r.remarks || ''}
                              onChange={(e) => handleEditRemarksChange(r.studentId, e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer Save Changes Bar */}
                <div className="table-footer-bar">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleCancelEdit}
                  >
                    ← Back to History
                  </button>
                  <button
                    type="button"
                    className="btn-save-attendance"
                    disabled={isUpdatingLog}
                    onClick={handleSaveEditedLog}
                  >
                    {isUpdatingLog ? 'Saving to Database...' : '💾 Update Attendance Log in Database'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ENTER INTERNAL MARKS */}
          {activeNav === 'marks' && (
            <div>
              <div className="attendance-controls-card">
                <div className="control-group">
                  <label>Class / Section</label>
                  <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                    {assignedClasses.map((cls) => (
                      <option key={cls._id || cls.name} value={cls.name}>{cls.name}</option>
                    ))}
                  </select>
                </div>

                <div className="control-group">
                  <label>Subject</label>
                  <select value={selectedSubjectCode} onChange={(e) => setSelectedSubjectCode(e.target.value)}>
                    {assignedSubjects.map((sbj) => (
                      <option key={sbj.code} value={sbj.code}>{sbj.code} - {sbj.name}</option>
                    ))}
                  </select>
                </div>

                <div className="control-group" style={{ justifyContent: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    Mid-1 (Max 30) • Mid-2 (Max 30) • Assignment (Max 20)
                  </span>
                </div>
              </div>

              {marksSavedNotice && (
                <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
                  ✓ {marksSavedNotice}
                </div>
              )}

              <div className="roster-table-card">
                <div className="table-header">
                  <h2>Enter Student Internal Assessment Scores</h2>
                  <span className="roster-count">{students.length} Students</span>
                </div>

                <div className="table-responsive">
                  <table className="attendance-table">
                    <thead>
                      <tr>
                        <th>Roll Number</th>
                        <th>Student Name</th>
                        <th style={{ textAlign: 'center' }}>Mid-Term 1 (30)</th>
                        <th style={{ textAlign: 'center' }}>Mid-Term 2 (30)</th>
                        <th style={{ textAlign: 'center' }}>Assignment (20)</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((st) => {
                        const cur = marksState[st.studentId] || { mid1: '', mid2: '', assignment: '' }
                        return (
                          <tr key={st.studentId}>
                            <td><strong className="roll-number">{st.rollNo}</strong></td>
                            <td>{st.name}</td>
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="number"
                                min="0"
                                max="30"
                                className="marks-input-sm"
                                placeholder="0-30"
                                value={cur.mid1}
                                onChange={(e) =>
                                  setMarksState({
                                    ...marksState,
                                    [st.studentId]: { ...cur, mid1: e.target.value },
                                  })
                                }
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="number"
                                min="0"
                                max="30"
                                className="marks-input-sm"
                                placeholder="0-30"
                                value={cur.mid2}
                                onChange={(e) =>
                                  setMarksState({
                                    ...marksState,
                                    [st.studentId]: { ...cur, mid2: e.target.value },
                                  })
                                }
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="number"
                                min="0"
                                max="20"
                                className="marks-input-sm"
                                placeholder="0-20"
                                value={cur.assignment}
                                onChange={(e) =>
                                  setMarksState({
                                    ...marksState,
                                    [st.studentId]: { ...cur, assignment: e.target.value },
                                  })
                                }
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className="btn-edit"
                                onClick={() => handleSaveSingleMark(st)}
                              >
                                Save Marks
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default FacultyDashboard
