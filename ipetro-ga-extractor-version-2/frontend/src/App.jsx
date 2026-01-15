import { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import FileUpload from './components/FileUpload';
import { logout, getCurrentUser } from './services/api';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(true); // Toggle between login/register

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await getCurrentUser();
          setUser(userData);
        } catch (error) {
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="App">
      <header>
        <h1>Table Extraction App</h1>
        {user && (
          <div className="user-info">
            <span>Welcome, {user.username}!</span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        )}
      </header>

      <main>
        {!user ? (
          <div className="auth-container">
            {showLogin ? (
              <LoginForm 
                onLoginSuccess={handleLoginSuccess}
                onSwitchToRegister={() => setShowLogin(false)}
              />
            ) : (
              <RegisterForm 
                onRegisterSuccess={handleLoginSuccess}
                onSwitchToLogin={() => setShowLogin(true)}
              />
            )}
          </div>
        ) : (
          <FileUpload />
        )}
      </main>
    </div>
  );
}

export default App;