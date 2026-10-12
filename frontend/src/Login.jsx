import { useState } from 'react'
import { loginUser } from './services/api'
import './Login.css'

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogin(event) {
    event.preventDefault()

    if (!email || !password) {
      setIsSuccess(false)
      setMessage('Please enter your email and password.')
      return
    }

    setIsLoading(true)
    setMessage('')

    const result = await loginUser(email, password)
    setIsLoading(false)

    if (result.success && result.user) {
      setIsSuccess(true)
      setMessage(`Login successful! Welcome ${result.user.name} (${result.user.role}).`)
      if (onLoginSuccess) {
        onLoginSuccess(result.user)
      }
    } else {
      setIsSuccess(false)
      setMessage(result.message || 'Invalid email or password.')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Welcome Back</h1>
        <p>Student Attendance and Performance Monitoring System</p>

        <form onSubmit={handleLogin}>
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isLoading}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isLoading}
            required
          />

          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Login'}
          </button>

          {message && (
            <div
              className={`login-message ${isSuccess ? 'login-message-success' : 'login-message-error'}`}
              role="status"
            >
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default Login