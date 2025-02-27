import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Pedidos from './components/Pedidos';
import Clientes from './components/Clientes';
import NovoPedido from './components/NovoPedido';
import NovoCliente from './components/NovoCliente';
import Notification from './components/Notification';
import './styles/App.css';
import logo from './assets/logo.png';

function Header({ darkMode, toggleDarkMode }) {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    navigate('/');
  };

  const goToDashboard = () => {
    if (isLoggedIn) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <header className="app-header">
      <div className="header-left" onClick={goToDashboard} style={{ cursor: 'pointer' }}>
        <img src={logo} alt="DAI BEER Logo" className="app-logo" />
        <h1>DAI BEER - Sistema de Gestão</h1>
      </div>
      <div className="header-right">
        <button onClick={toggleDarkMode} className="dark-mode-toggle">
          {darkMode ? '☀️' : '🌙'} Modo Noturno
        </button>
        {isLoggedIn && (
          <button onClick={handleLogout} className="logout-button">
            Sair
          </button>
        )}
      </div>
    </header>
  );
}

function App() {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true'
  );
  const [notification, setNotification] = useState(null);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    document.body.classList.toggle('dark-mode');
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  return (
    <Router>
      <div className={`app ${darkMode ? 'dark-mode' : ''}`}>
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
        <Routes>
          <Route path="/" element={<Login showNotification={showNotification} />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard showNotification={showNotification} />
            </ProtectedRoute>
          } />
          <Route path="/pedidos" element={
            <ProtectedRoute>
              <Pedidos showNotification={showNotification} />
            </ProtectedRoute>
          } />
          <Route path="/clientes" element={
            <ProtectedRoute>
              <Clientes showNotification={showNotification} />
            </ProtectedRoute>
          } />
          <Route path="/novo-pedido" element={
            <ProtectedRoute>
              <NovoPedido showNotification={showNotification} />
            </ProtectedRoute>
          } />
          <Route path="/novo-cliente" element={
            <ProtectedRoute>
              <NovoCliente showNotification={showNotification} />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

// Componente para proteger rotas
function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  return isLoggedIn ? children : null;
}

export default App;