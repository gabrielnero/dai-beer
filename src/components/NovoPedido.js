import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/NovoPedido.css';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

function NovoPedido({ showNotification }) {
  const navigate = useNavigate();
  const [pesquisaCliente, setPesquisaCliente] = useState('');
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [clientes, setClientes] = useState([]);
  
  // Atualizar carregamento de clientes para usar Firebase
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
  }, [showNotification]);

  const [pedido, setPedido] = useState({
    cliente: null,
    valor: '',
    metodoPagamento: '',
    tipoPedido: 'barril',
    quantidade: 1,
    tamanhoBarril: '30L',
    dataEntrega: '',
    statusPagamento: 'pendente',
    statusBarril: 'nao_entregue',
    enderecoEntrega: '',
    usarEnderecoCliente: true,
    observacoes: ''
  });

  useEffect(() => {
    if (pesquisaCliente.length >= 2) {
      const filtrados = clientes.filter(cliente =>
        cliente.nome.toLowerCase().includes(pesquisaCliente.toLowerCase()) ||
        cliente.telefone.includes(pesquisaCliente)
      );
      setClientesFiltrados(filtrados);
    } else {
      setClientesFiltrados([]);
    }
  }, [pesquisaCliente, clientes]);

  const selecionarCliente = (cliente) => {
    setClienteSelecionado(cliente);
    setPedido({ 
      ...pedido, 
      cliente,
      enderecoEntrega: cliente.endereco
    });
    setPesquisaCliente('');
    setClientesFiltrados([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pedido.cliente) {
      showNotification('Por favor, selecione um cliente', 'error');
      return;
    }

    try {
      // Criar novo pedido com ID único e data de criação
      const novoPedido = {
        ...pedido,
        dataCriacao: new Date().toISOString(),
      };

      // Salvar no Firebase
      await addDoc(collection(db, 'pedidos'), novoPedido);
      
      showNotification('Pedido criado com sucesso!');
      navigate('/pedidos');
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      showNotification('Erro ao criar pedido', 'error');
    }
  };

  // Função para gerar opções de quantidade baseado no tipo
  const getOpcoesQuantidade = () => {
    if (pedido.tipoPedido === 'litros') {
      const opcoes = [];
      for (let i = 1; i <= 20; i++) {
        opcoes.push(
          <option key={i} value={i}>{i} {i === 1 ? 'Litro' : 'Litros'}</option>
        );
      }
      return opcoes;
    }
    return null;
  };

  return (
    <div className="novo-pedido-container">
      <h2>Novo Pedido</h2>
      <form onSubmit={handleSubmit} className="pedido-form">
        <div className="form-group">
          <label>Cliente:</label>
          <div className="pesquisa-cliente">
            <input
              type="text"
              value={pesquisaCliente}
              onChange={(e) => setPesquisaCliente(e.target.value)}
              placeholder="Pesquisar cliente..."
              disabled={clienteSelecionado}
            />
            {clientesFiltrados.length > 0 && (
              <div className="resultados-pesquisa">
                {clientesFiltrados.map(cliente => (
                  <div
                    key={cliente.id}
                    className="resultado-item"
                    onClick={() => selecionarCliente(cliente)}
                  >
                    <span>{cliente.nome}</span>
                    <span>{cliente.telefone}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {clienteSelecionado && (
            <div className="cliente-selecionado">
              <p>Cliente: {clienteSelecionado.nome}</p>
              <p>Telefone: {clienteSelecionado.telefone}</p>
              <button
                type="button"
                onClick={() => {
                  setClienteSelecionado(null);
                  setPedido({ ...pedido, cliente: null });
                }}
                className="botao-remover"
              >
                Remover
              </button>
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Tipo:</label>
            <select
              value={pedido.tipoPedido}
              onChange={(e) => {
                setPedido({
                  ...pedido,
                  tipoPedido: e.target.value,
                  quantidade: 1,
                  tamanhoBarril: e.target.value === 'barril' ? '30L' : '',
                  statusBarril: e.target.value === 'barril' ? 'nao_entregue' : undefined,
                  enderecoEntrega: e.target.value === 'barril' ? pedido.enderecoEntrega : undefined,
                  usarEnderecoCliente: e.target.value === 'barril' ? true : undefined
                });
              }}
              required
            >
              <option value="barril">Barril</option>
              <option value="litros">Litros</option>
            </select>
          </div>

          <div className="form-group">
            <label>Quantidade:</label>
            {pedido.tipoPedido === 'barril' ? (
              <select
                value={pedido.tamanhoBarril}
                onChange={(e) => setPedido({
                  ...pedido,
                  tamanhoBarril: e.target.value
                })}
                required
              >
                <option value="20L">Barril 20L</option>
                <option value="30L">Barril 30L</option>
                <option value="50L">Barril 50L</option>
              </select>
            ) : (
              <select
                value={pedido.quantidade}
                onChange={(e) => setPedido({
                  ...pedido,
                  quantidade: parseInt(e.target.value)
                })}
                required
              >
                {getOpcoesQuantidade()}
              </select>
            )}
          </div>
        </div>

        {pedido.tipoPedido === 'barril' && clienteSelecionado && (
          <div className="form-row">
            <div className="form-group">
              <label>Endereço de Entrega:</label>
              <div className="endereco-opcoes">
                <label className="radio-label">
                  <input
                    type="radio"
                    checked={pedido.usarEnderecoCliente}
                    onChange={() => setPedido({
                      ...pedido,
                      usarEnderecoCliente: true,
                      enderecoEntrega: clienteSelecionado.endereco
                    })}
                  />
                  Usar endereço cadastrado
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    checked={!pedido.usarEnderecoCliente}
                    onChange={() => setPedido({
                      ...pedido,
                      usarEnderecoCliente: false
                    })}
                  />
                  Usar outro endereço
                </label>
              </div>
              {pedido.usarEnderecoCliente ? (
                <div className="endereco-cliente">
                  <p><strong>Endereço:</strong> {clienteSelecionado.endereco}</p>
                  <p><strong>Bairro:</strong> {clienteSelecionado.bairro}</p>
                </div>
              ) : (
                <input
                  type="text"
                  value={pedido.enderecoEntrega}
                  onChange={(e) => setPedido({
                    ...pedido,
                    enderecoEntrega: e.target.value.toUpperCase()
                  })}
                  placeholder="Digite o endereço de entrega"
                  required
                />
              )}
            </div>
          </div>
        )}

        {pedido.tipoPedido === 'barril' && (
          <div className="form-row">
            <div className="form-group">
              <label>Status do Barril:</label>
              <select
                value={pedido.statusBarril}
                onChange={(e) => setPedido({
                  ...pedido,
                  statusBarril: e.target.value
                })}
                required
              >
                <option value="nao_entregue">Não Entregue</option>
                <option value="entregue">Entregue</option>
                <option value="devolvido">Devolvido</option>
              </select>
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Valor:</label>
            <input
              type="number"
              value={pedido.valor}
              onChange={(e) => setPedido({
                ...pedido,
                valor: e.target.value
              })}
              required
            />
          </div>

          <div className="form-group">
            <label>Data de Entrega:</label>
            <input
              type="date"
              value={pedido.dataEntrega}
              onChange={(e) => setPedido({
                ...pedido,
                dataEntrega: e.target.value
              })}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Status do Pagamento:</label>
            <select
              value={pedido.statusPagamento}
              onChange={(e) => setPedido({
                ...pedido,
                statusPagamento: e.target.value
              })}
              required
            >
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Método de Pagamento:</label>
          <select
            value={pedido.metodoPagamento}
            onChange={(e) => setPedido({
              ...pedido,
              metodoPagamento: e.target.value
            })}
            required
          >
            <option value="">Selecione...</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="pix">PIX</option>
            <option value="cartao">Cartão</option>
          </select>
        </div>

        <div className="form-group">
          <label>Observações:</label>
          <textarea
            value={pedido.observacoes}
            onChange={(e) => setPedido({
              ...pedido,
              observacoes: e.target.value
            })}
          />
        </div>

        <div className="form-buttons">
          <button type="submit">Salvar Pedido</button>
          <button type="button" onClick={() => navigate('/pedidos')}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}

export default NovoPedido; 