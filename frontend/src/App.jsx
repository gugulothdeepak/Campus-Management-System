import { useState, useEffect } from 'react'
import Login from './Login'
import AdminDashboard from './components/AdminDashboard'
import FacultyDashboard from './components/FacultyDashboard'
import StudentDashboard from './components/StudentDashboard'
import { getStoredUser, logoutUser } from './services/api'
import './App.css'

function App() {
  const [currentUser, setCurrentUser] = useState(() => getStoredUser())

  function handleLogout() {
    logoutUser()
    setCurrentUser(null)
  }

  return (
    <div className="app-root">
      {!currentUser ? (
        <Login onLoginSuccess={(user) => setCurrentUser(user)} />
      ) : currentUser.role === 'ADMIN' ? (
        <AdminDashboard user={currentUser} onLogout={handleLogout} />
      ) : currentUser.role === 'FACULTY' ? (
        <FacultyDashboard user={currentUser} onLogout={handleLogout} />
      ) : currentUser.role === 'STUDENT' ? (
        <StudentDashboard user={currentUser} onLogout={handleLogout} />
      ) : (
        <div className="login-page">
          <div className="login-card" style={{ maxWidth: '480px' }}>
            <h1>Authentication Verified</h1>
            <p>Connected to MERN Fullstack Backend</p>

            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px',
                textAlign: 'left',
                fontSize: '14px',
                lineHeight: '1.8',
              }}
            >
              <div><strong>Name:</strong> {currentUser.name}</div>
              <div><strong>Email:</strong> {currentUser.email}</div>
              <div><strong>Role:</strong> <span style={{ color: '#173b70', fontWeight: 'bold' }}>{currentUser.role}</span></div>
              <div><strong>Department:</strong> {currentUser.department || 'N/A'}</div>
              <div><strong>Status:</strong> <span style={{ color: '#059669', fontWeight: 'bold' }}>Active Session</span></div>
            </div>

            <button type="button" onClick={handleLogout} style={{ marginTop: '0' }}>
              Sign Out / Switch Role
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App