import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Pedidos.css';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

function Pedidos({ showNotification }) {
  const [pedidos, setPedidos] = useState([]);
  const [pedidoEmEdicao, setPedidoEmEdicao] = useState(null);

  useEffect(() => {
    const carregarPedidos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'pedidos'));
        const pedidosData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPedidos(pedidosData);
      } catch (error) {
        showNotification('Erro ao carregar pedidos', 'error');
      }
    };
    carregarPedidos();
  }, [showNotification]);

  const atualizarPedido = async (pedidoAtualizado) => {
    try {
      const pedidoRef = doc(db, 'pedidos', pedidoAtualizado.id);
      await updateDoc(pedidoRef, pedidoAtualizado);
      setPedidos(pedidos.map(p => 
        p.id === pedidoAtualizado.id ? pedidoAtualizado : p
      ));
      setPedidoEmEdicao(null);
      showNotification('Pedido atualizado com sucesso!');
    } catch (error) {
      showNotification('Erro ao atualizar pedido', 'error');
    }
  };

  const excluirPedido = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este pedido?')) {
      try {
        await deleteDoc(doc(db, 'pedidos', id));
        setPedidos(pedidos.filter(pedido => pedido.id !== id));
        showNotification('Pedido excluído com sucesso!');
      } catch (error) {
        showNotification('Erro ao excluir pedido', 'error');
      }
    }
  };

  const EditarPedidoModal = ({ pedido, onSave, onClose }) => {
    const [pedidoEditado, setPedidoEditado] = useState(pedido);

    const handleSubmit = (e) => {
      e.preventDefault();
      onSave(pedidoEditado);
      onClose();
    };

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>Editar Pedido</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Valor:</label>
              <input
                type="number"
                value={pedidoEditado.valor}
                onChange={(e) => setPedidoEditado({
                  ...pedidoEditado,
                  valor: e.target.value
                })}
              />
            </div>

            <div className="form-group">
              <label>Status do Pagamento:</label>
              <select
                value={pedidoEditado.statusPagamento}
                onChange={(e) => setPedidoEditado({
                  ...pedidoEditado,
                  statusPagamento: e.target.value
                })}
              >
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
              </select>
            </div>

            {pedidoEditado.tipoPedido === 'barril' && (
              <div className="form-group">
                <label>Status do Barril:</label>
                <select
                  value={pedidoEditado.statusBarril}
                  onChange={(e) => setPedidoEditado({
                    ...pedidoEditado,
                    statusBarril: e.target.value
                  })}
                >
                  <option value="nao_entregue">Não Entregue</option>
                  <option value="entregue">Entregue</option>
                  <option value="devolvido">Devolvido</option>
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Observações:</label>
              <textarea
                value={pedidoEditado.observacoes}
                onChange={(e) => setPedidoEditado({
                  ...pedidoEditado,
                  observacoes: e.target.value
                })}
              />
            </div>

            <div className="modal-buttons">
              <button type="submit">Salvar</button>
              <button type="button" onClick={onClose}>Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const getStatusPagamentoClass = (status) => {
    switch (status) {
      case 'pago':
        return 'status-pago';
      case 'pendente':
        return 'status-pendente';
      default:
        return '';
    }
  };

  const getStatusBarrilClass = (status) => {
    switch (status) {
      case 'devolvido':
        return 'status-devolvido';
      case 'entregue':
        return 'status-entregue';
      case 'nao_entregue':
        return 'status-nao-entregue';
      default:
        return '';
    }
  };

  return (
    <div className="pedidos-container">
      <h2>Gestão de Pedidos</h2>
      <Link to="/novo-pedido" className="botao-novo">
        Novo Pedido
      </Link>
      
      <div className="lista-pedidos">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Telefone</th>
              <th>Quantidade</th>
              <th>Valor</th>
              {pedidos.some(p => p.tipoPedido === 'barril') && (
                <th>Endereço de Entrega</th>
              )}
              <th>Status Pagamento</th>
              {pedidos.some(p => p.tipoPedido === 'barril') && (
                <th>Status Barril</th>
              )}
              <th>Data Entrega</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((pedido) => (
              <tr key={pedido.id}>
                <td>{pedido.cliente.nome}</td>
                <td>{pedido.cliente.telefone}</td>
                <td>
                  {pedido.tipoPedido === 'barril' 
                    ? pedido.tamanhoBarril 
                    : `${pedido.quantidade} ${pedido.quantidade === 1 ? 'Litro' : 'Litros'}`
                  }
                </td>
                <td>R$ {pedido.valor}</td>
                {pedidos.some(p => p.tipoPedido === 'barril') && (
                  <td>
                    {pedido.tipoPedido === 'barril' ? pedido.enderecoEntrega : '-'}
                  </td>
                )}
                <td>
                  <span className={`status-badge ${getStatusPagamentoClass(pedido.statusPagamento)}`}>
                    {pedido.statusPagamento === 'pago' ? 'Pago' : 'Pendente'}
                  </span>
                </td>
                {pedidos.some(p => p.tipoPedido === 'barril') && (
                  <td>
                    {pedido.tipoPedido === 'barril' ? (
                      <span className={`status-badge ${getStatusBarrilClass(pedido.statusBarril)}`}>
                        {pedido.statusBarril === 'nao_entregue' ? 'Não Entregue' : 
                         pedido.statusBarril === 'entregue' ? 'Entregue' : 'Devolvido'}
                      </span>
                    ) : (
                      <span className="status-badge status-entregue">Entrega Imediata</span>
                    )}
                  </td>
                )}
                <td>{new Date(pedido.dataEntrega).toLocaleDateString()}</td>
                <td>
                  <button className="botao-editar" onClick={() => setPedidoEmEdicao(pedido)}>
                    Editar
                  </button>
                  <button 
                    className="botao-excluir"
                    onClick={() => excluirPedido(pedido.id)}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {pedidoEmEdicao && (
        <EditarPedidoModal
          pedido={pedidoEmEdicao}
          onSave={atualizarPedido}
          onClose={() => setPedidoEmEdicao(null)}
        />
      )}
    </div>
  );
}

export default Pedidos; 