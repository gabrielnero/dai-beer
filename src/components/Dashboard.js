import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Dashboard.css';

function Dashboard() {
  return (
    <div className="dashboard-container">
      <h2>Painel de Controle</h2>
      <div className="dashboard-menu">
        <Link to="/pedidos" className="menu-item">
          <div className="menu-card">
            <h3>Pedidos</h3>
            <p>Gerenciar pedidos de barris</p>
          </div>
        </Link>
        <Link to="/clientes" className="menu-item">
          <div className="menu-card">
            <h3>Clientes</h3>
            <p>Cadastro de clientes</p>
          </div>
        </Link>
        <Link to="/novo-pedido" className="menu-item">
          <div className="menu-card">
            <h3>Novo Pedido</h3>
            <p>Registrar novo pedido</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default Dashboard; 