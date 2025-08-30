import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import AppWithAuth from './components/AppWithAuth.jsx';
import App from './components/App.jsx';
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
    // Fallback to local mode when Supabase is not configured
    return <App />;
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