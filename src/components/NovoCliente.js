import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/NovoCliente.css';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

function NovoCliente({ showNotification }) {
  const navigate = useNavigate();
  const [cliente, setCliente] = useState({
    nome: '',
    telefone: '',
    endereco: '',
    bairro: '',
    observacoes: ''
  });

  // Função para formatar o telefone
  const formatarTelefone = (valor) => {
    // Remove tudo que não é número
    const numero = valor.replace(/\D/g, '');
    
    // Aplica a máscara
    let numeroFormatado = numero;
    if (numero.length <= 11) {
      numeroFormatado = numero.replace(/^(\d{2})(\d{4,5})(\d{4}).*/, '($1)$2-$3');
    }
    
    return numeroFormatado;
  };

  const handleTelefoneChange = (e) => {
    let valor = e.target.value;
    if (!valor.startsWith('(')) {
      valor = '(' + valor;
    }
    valor = formatarTelefone(valor);
    setCliente({ ...cliente, telefone: valor });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const novoCliente = {
      nome: cliente.nome.toUpperCase(),
      telefone: cliente.telefone,
      endereco: cliente.endereco.toUpperCase(),
      bairro: cliente.bairro.toUpperCase(),
      observacoes: cliente.observacoes,
      dataCadastro: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'clientes'), novoCliente);
      showNotification('Cliente cadastrado com sucesso!');
      navigate('/clientes');
    } catch (error) {
      showNotification('Erro ao cadastrar cliente', 'error');
    }
  };

  return (
    <div className="novo-cliente-container">
      <h2>Novo Cliente</h2>
      <form onSubmit={handleSubmit} className="cliente-form">
        <div className="form-group">
          <label>Nome:</label>
          <input
            type="text"
            value={cliente.nome}
            onChange={(e) => setCliente({...cliente, nome: e.target.value})}
            placeholder="Nome completo"
            required
          />
        </div>

        <div className="form-group">
          <label>Telefone:</label>
          <input
            type="tel"
            value={cliente.telefone}
            onChange={handleTelefoneChange}
            placeholder="(11)99999-9999"
            maxLength="14"
            required
          />
        </div>

        <div className="form-group">
          <label>Endereço:</label>
          <input
            type="text"
            value={cliente.endereco}
            onChange={(e) => setCliente({...cliente, endereco: e.target.value})}
            placeholder="Rua, número e complemento"
            required
          />
        </div>

        <div className="form-group">
          <label>Bairro:</label>
          <input
            type="text"
            value={cliente.bairro}
            onChange={(e) => setCliente({...cliente, bairro: e.target.value})}
            placeholder="Bairro"
            required
          />
        </div>

        <div className="form-group">
          <label>Observações:</label>
          <textarea
            value={cliente.observacoes}
            onChange={(e) => setCliente({...cliente, observacoes: e.target.value})}
            placeholder="Observações adicionais"
          />
        </div>

        <div className="form-buttons">
          <button type="submit">Salvar Cliente</button>
          <button type="button" onClick={() => navigate('/clientes')} className="botao-cancelar">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export default NovoCliente; 