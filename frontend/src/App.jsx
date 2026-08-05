import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShoppingBag, TrendingUp, Plus, ChevronLeft, ChevronRight, 
  PackageCheck, ChevronDown, ChevronUp, DollarSign, Calendar, 
  Package, X 
} from 'lucide-react';
import './App.css';

const API_URL = 'http://localhost:5000/api/orders';

export default function App() {
  const [activeTab, setActiveTab] = useState('orders');

  // Estados de Pedidos
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Estados de Faturamento
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [revenueData, setRevenueData] = useState([]);
  const [revenuePage, setRevenuePage] = useState(1);
  const [loadingRevenue, setLoadingRevenue] = useState(false);

  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState([{ productName: '', quantity: 1, unitPrice: 10 }]);

  // Buscar Pedidos
  const fetchOrders = async (currentPage) => {
    setLoadingOrders(true);
    try {
      const response = await axios.get(`${API_URL}?page=${currentPage}&pageSize=8`);
      setOrders(response.data.items);
      setTotalPages(response.data.totalPages);
      setTotalItems(response.data.totalItems);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Buscar Faturamento
  const fetchRevenue = async () => {
    setLoadingRevenue(true);
    try {
      const response = await axios.get(`${API_URL}/revenue?startDate=${startDate}&endDate=${endDate}`);
      setRevenueData(response.data);
      setRevenuePage(1);
    } catch (error) {
      console.error("Erro ao buscar faturamento:", error);
    } finally {
      setLoadingRevenue(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders(page);
    if (activeTab === 'revenue') fetchRevenue();
  }, [activeTab, page]);

  const toggleExpandOrder = (id) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  const handleAddItem = () => {
    setItems([...items, { productName: '', quantity: 1, unitPrice: 10 }]);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleRemoveItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API_URL, { customerName, items });
      setIsModalOpen(false);
      setCustomerName('');
      setItems([{ productName: '', quantity: 1, unitPrice: 10 }]);
      fetchOrders(1);
    } catch (error) {
      alert('Erro ao criar pedido.');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const calculateModalTotal = () => {
    return items.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);
  };

  const revenuePageSize = 8;
  const totalRevenuePages = Math.ceil(revenueData.length / revenuePageSize) || 1;
  const paginatedRevenue = revenueData.slice((revenuePage - 1) * revenuePageSize, revenuePage * revenuePageSize);

  const totalRevenuePeriod = revenueData.reduce((acc, curr) => acc + curr.totalRevenue, 0);
  const totalOrdersPeriod = revenueData.reduce((acc, curr) => acc + curr.totalOrders, 0);

  return (
    <div className="app-layout">
      {/* NAVBAR */}
      <header className="navbar">
        <div className="navbar-brand">
          <PackageCheck className="brand-icon" size={32} />
          <div>
            <h1>OrdersHub</h1>
            <span className="brand-subtitle">Gestão de Pedidos & Analytics</span>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Criar Pedido
        </button>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="main-content">
        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingBag size={18} /> Pedidos
          </button>
          <button 
            className={`tab-btn ${activeTab === 'revenue' ? 'active' : ''}`}
            onClick={() => setActiveTab('revenue')}
          >
            <TrendingUp size={18} /> Faturamento por Período
          </button>
        </div>

        {/* TAB 1: LISTA DE PEDIDOS */}
        {activeTab === 'orders' && (
          <div className="tab-body">
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-icon blue"><Package size={24} /></div>
                <div>
                  <span className="kpi-label">Total de Pedidos no Banco</span>
                  <p className="kpi-value">{totalItems.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>

            <div className="table-card">
              <div className="table-header-title">
                <h2>Lista de Pedidos Paginada</h2>
              </div>

              {loadingOrders ? (
                <div className="loading-state"><p>Carregando pedidos...</p></div>
              ) : (
                <>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th></th>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Data</th>
                        <th>Qtd. Itens</th>
                        <th>Valor Total</th>
                        <th style={{ textAlign: 'right' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <React.Fragment key={o.id}>
                          <tr className={`table-row ${expandedOrderId === o.id ? 'expanded' : ''}`} onClick={() => toggleExpandOrder(o.id)}>
                            <td className="expand-cell">
                              {expandedOrderId === o.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </td>
                            <td className="font-mono">#{o.id}</td>
                            <td>
                              <div className="customer-cell">
                                <div className="avatar-circle">{o.customerName?.charAt(0).toUpperCase()}</div>
                                <span className="customer-name">{o.customerName}</span>
                              </div>
                            </td>
                            <td>{new Date(o.orderDate).toLocaleDateString('pt-BR')}</td>
                            <td>
                              <span className="item-count-badge">
                                {o.items ? o.items.length : 0} {o.items?.length === 1 ? 'item' : 'itens'}
                              </span>
                            </td>
                            <td className="price-tag">{formatCurrency(o.totalAmount)}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button className="btn-link">
                                {expandedOrderId === o.id ? 'Ocultar Itens' : 'Ver Itens'}
                              </button>
                            </td>
                          </tr>

                          {/* ACCORDION */}
                          {expandedOrderId === o.id && (
                            <tr className="accordion-row">
                              <td colSpan={7}>
                                <div className="expanded-details">
                                  <h4><Package size={16} /> Itens do Pedido #{o.id}</h4>
                                  <table className="items-subtable">
                                    <thead>
                                      <tr>
                                        <th>Produto</th>
                                        <th>Quantidade</th>
                                        <th>Preço Unitário</th>
                                        <th>Subtotal</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {o.items && o.items.map((item) => (
                                        <tr key={item.id}>
                                          <td>{item.productName}</td>
                                          <td>{item.quantity}x</td>
                                          <td>{formatCurrency(item.unitPrice)}</td>
                                          <td className="font-semibold">{formatCurrency(item.quantity * item.unitPrice)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>

                  {/* PAGINAÇÃO */}
                  <div className="pagination-bar">
                    <span className="pagination-info">Mostrando página <strong>{page}</strong> de <strong>{totalPages}</strong></span>
                    <div className="pagination-controls">
                      <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-nav">
                        <ChevronLeft size={18} /> Anterior
                      </button>
                      <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="btn-nav">
                        Próxima <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: FATURAMENTO */}
        {activeTab === 'revenue' && (
          <div className="tab-body">
            <div className="filter-card">
              <div className="filter-header">
                <h3><Calendar size={18} /> Filtrar Período de Faturamento</h3>
              </div>
              <div className="filter-form">
                <div className="input-group">
                  <label>Data Início</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Data Fim</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                <button className="btn-primary" onClick={fetchRevenue}>Filtrar Relatório</button>
              </div>
            </div>

            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-icon green"><DollarSign size={24} /></div>
                <div>
                  <span className="kpi-label">Faturamento Total no Período</span>
                  <p className="kpi-value text-green">{formatCurrency(totalRevenuePeriod)}</p>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon blue"><ShoppingBag size={24} /></div>
                <div>
                  <span className="kpi-label">Total de Pedidos no Período</span>
                  <p className="kpi-value">{totalOrdersPeriod.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>

            <div className="table-card">
              <h2>Faturamento Agregado por Dia</h2>
              {loadingRevenue ? (
                <div className="loading-state"><p>Consultando banco de dados...</p></div>
              ) : (
                <>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Pedidos Realizados</th>
                        <th>Total Faturado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRevenue.map((r, index) => (
                        <tr key={index}>
                          <td className="font-semibold">{new Date(r.date).toLocaleDateString('pt-BR')}</td>
                          <td><span className="badge-gray">{r.totalOrders} pedidos</span></td>
                          <td className="price-tag">{formatCurrency(r.totalRevenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="pagination-bar">
                    <span className="pagination-info">Mostrando página <strong>{revenuePage}</strong> de <strong>{totalRevenuePages}</strong> ({revenueData.length} dias faturados)</span>
                    <div className="pagination-controls">
                      <button disabled={revenuePage <= 1} onClick={() => setRevenuePage(revenuePage - 1)} className="btn-nav">
                        <ChevronLeft size={18} /> Anterior
                      </button>
                      <button disabled={revenuePage >= totalRevenuePages} onClick={() => setRevenuePage(revenuePage + 1)} className="btn-nav">
                        Próxima <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL CRIAR PEDIDO */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <div className="modal-header">
              <h2>Criar Novo Pedido</h2>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateOrder}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nome do Cliente *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: Carlos Andrade"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)} 
                  />
                </div>

                <div className="items-section-header">
                  <h3>Produtos / Itens</h3>
                  <button type="button" className="btn-secondary-sm" onClick={handleAddItem}>
                    <Plus size={14} /> Adicionar Item
                  </button>
                </div>

                <div className="items-list">
                  {items.map((item, index) => (
                    <div key={index} className="item-input-row">
                      <input 
                        type="text" 
                        placeholder="Nome do Produto" 
                        required 
                        value={item.productName} 
                        onChange={(e) => handleItemChange(index, 'productName', e.target.value)} 
                      />
                      <input 
                        type="number" 
                        placeholder="Qtd" 
                        min="1" 
                        required 
                        value={item.quantity} 
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))} 
                      />
                      <input 
                        type="number" 
                        placeholder="Preço R$" 
                        step="0.01" 
                        required 
                        value={item.unitPrice} 
                        onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))} 
                      />
                      <button 
                        type="button" 
                        className="btn-remove" 
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length === 1}
                        title={items.length === 1 ? "Mínimo de 1 item" : "Remover item"}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="modal-total-banner">
                  <span>Valor Total do Pedido:</span>
                  <strong>{formatCurrency(calculateModalTotal())}</strong>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Finalizar Pedido</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}