import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password)
        if (error) {
          setError(error.message)
        } else {
          setMessage('Check your email for the confirmation link!')
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) {
          setError(error.message)
        }
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#f0f0f0'
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img 
            src="/icons/govinda-dughdalay.png" 
            alt="Govinda Dughdalay Logo"
            style={{ 
              width: '80px', 
              height: '80px', 
              objectFit: 'contain',
              marginBottom: '1rem'
            }}
          />
          <h1 style={{ margin: '0.5rem 0', fontSize: '1.5rem', color: '#11bb66' }}>
            Govinda Dughdalay
          </h1>
          <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>
            Milk Shop Manager
          </p>
        </div>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.2rem' }}>
          {isSignUp ? 'Create Account' : 'Sign In'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          {error && (
            <div style={{ 
              background: '#fee', 
              color: '#c00', 
              padding: '0.5rem', 
              borderRadius: '4px', 
              marginBottom: '1rem' 
            }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{ 
              background: '#efe', 
              color: '#060', 
              padding: '0.5rem', 
              borderRadius: '4px', 
              marginBottom: '1rem' 
            }}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="primary"
            style={{ width: '100%', marginBottom: '1rem' }}
          >
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>

          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#0066cc', 
              cursor: 'pointer',
              width: '100%'
            }}
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </form>
        
        <div style={{ 
          textAlign: 'center', 
          marginTop: '2rem', 
          fontSize: '0.8rem', 
          color: '#999' 
        }}>
          © <span>{new Date().getFullYear()}</span> Govinda Dughdalay | Powered by HMT Technologies
        </div>
      </div>
    </div>
  )
}

export default Login