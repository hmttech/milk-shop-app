import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import AppWithAuth from './components/AppWithAuth.jsx';
import Login from './components/Auth/Login.jsx';
import './styles/main.css';

function AppWrapper() {
  const { user, loading, configError } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    );
  }

  if (configError) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        padding: '2rem',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <div style={{ marginBottom: '1rem', fontSize: '1.5rem', color: '#d32f2f' }}>
          ⚙️ Configuration Required
        </div>
        <div style={{ marginBottom: '1rem', color: '#666', lineHeight: '1.5' }}>
          {configError}
        </div>
        <div style={{ 
          marginBottom: '2rem', 
          padding: '1rem', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '4px',
          textAlign: 'left',
          fontFamily: 'monospace',
          fontSize: '0.9rem'
        }}>
          <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Create a .env file with:</div>
          <div>VITE_SUPABASE_URL=your_supabase_project_url</div>
          <div>VITE_SUPABASE_ANON_KEY=your_supabase_anon_key</div>
        </div>
        <div style={{ fontSize: '0.9rem', color: '#666' }}>
          See README.md for setup instructions or contact your administrator.
        </div>
        <button 
          onClick={() => window.location.reload()} 
          style={{ 
            marginTop: '1rem',
            padding: '0.5rem 1rem', 
            backgroundColor: '#1976d2', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reload Page
        </button>
      </div>
    );
  }

  return user ? <AppWithAuth /> : <Login />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <AppWrapper />
    </AuthProvider>
  </React.StrictMode>
);
