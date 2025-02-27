import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Verifica se já está logado
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Credenciais de teste
    const adminEmail = 'admin@daibeer.com';
    const adminSenha = 'admin123';

    if (email === adminEmail && senha === adminSenha) {
      localStorage.setItem('isLoggedIn', 'true');
      setErro('');
      navigate('/dashboard');
    } else {
      // Login falhou
      setErro('Email ou senha incorretos');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Login - DAI BEER</h2>
        {erro && <div className="erro-mensagem">{erro}</div>}
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Digite seu email"
            required
          />
        </div>
        <div className="form-group">
          <label>Senha:</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Digite sua senha"
            required
          />
        </div>
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}

export default Login; 