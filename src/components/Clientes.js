import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Clientes.css';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

function Clientes({ showNotification }) {
  const navigate = useNavigate();
  const [pesquisa, setPesquisa] = useState('');
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    const carregarClientes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'clientes'));
        const clientesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setClientes(clientesData);
      } catch (error) {
        showNotification('Erro ao carregar clientes', 'error');
      }
    };
    carregarClientes();
  }, []);

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
    cliente.telefone.includes(pesquisa)
  );

  const excluirCliente = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await deleteDoc(doc(db, 'clientes', id));
        setClientes(clientes.filter(cliente => cliente.id !== id));
        showNotification('Cliente excluído com sucesso!');
      } catch (error) {
        showNotification('Erro ao excluir cliente', 'error');
      }
    }
  };

  return (
    <div className="clientes-container">
      <div className="clientes-header">
        <h2>Cadastro de Clientes</h2>
        <button 
          className="botao-novo"
          onClick={() => navigate('/novo-cliente')}
        >
          Novo Cliente
        </button>
      </div>

      <div className="pesquisa-container">
        <input
          type="text"
          placeholder="Pesquisar clientes..."
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          className="campo-pesquisa"
        />
      </div>
      
      <div className="lista-clientes">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Telefone</th>
              <th>Endereço</th>
              <th>Bairro</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {clientesFiltrados.map((cliente) => (
              <tr key={cliente.id}>
                <td>{cliente.nome}</td>
                <td>{cliente.telefone}</td>
                <td>{cliente.endereco}</td>
                <td>{cliente.bairro}</td>
                <td>
                  <button className="botao-editar">Editar</button>
                  <button 
                    className="botao-excluir"
                    onClick={() => excluirCliente(cliente.id)}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Clientes; 