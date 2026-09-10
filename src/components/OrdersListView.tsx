import React, { useState } from 'react';
import { useSales } from '../context/SalesContext';
import { Order, OrderStatus } from '../types';
import {
  FileText,
  Search,
  Filter,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Eye,
  Send,
  Share2,
  Calendar,
  DollarSign,
  Printer
} from 'lucide-react';
import { OrderDetailModal } from './OrderDetailModal';
import { OrderPrintModal } from './OrderPrintModal';

export const OrdersListView: React.FC = () => {
  const { orders, transmitOrder, duplicateOrder, setActiveTab, selectedOrderId, setSelectedOrderId } = useSales();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);

  const filteredOrders = orders.filter((o) => {
    const sTerm = (search || '').toLowerCase();
    const numPed = String(o.numeroPedido || '').toLowerCase();
    const nomeFantasia = String(o.cliente?.nomeFantasia || '').toLowerCase();
    const razaoSocial = String(o.cliente?.razaoSocial || '').toLowerCase();
    const doc = String(o.cliente?.cnpjCpf || '');

    const matchesSearch =
      !sTerm ||
      numPed.includes(sTerm) ||
      nomeFantasia.includes(sTerm) ||
      razaoSocial.includes(sTerm) ||
      doc.includes(search);

    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalValue = filteredOrders.reduce((sum, o) => sum + o.valorTotalLiquido, 0);
  const totalCommission = filteredOrders.reduce((sum, o) => sum + o.comissaoTotalReais, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight">Histórico de Pedidos</h2>
          <p className="text-xs text-slate-400">
            Acompanhe a transmissão, aprovação de crédito e faturamento das suas vendas
          </p>
        </div>

        <button
          onClick={() => setActiveTab('novo_pedido')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-700/20 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Novo Pedido</span>
        </button>
      </div>

      {/* Quick Filter & Search Bar */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por número do pedido, cliente, CNPJ..."
              className="w-full bg-slate-800 text-xs text-slate-200 rounded-xl pl-10 pr-4 py-2.5 border border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'transmitido', label: 'Transmitidos' },
              { id: 'pendente_transmissao', label: 'Pendentes' },
              { id: 'aprovado', label: 'Aprovados' },
              { id: 'rascunho', label: 'Rascunhos' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Aggregate Summary */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400">
          <span>{filteredOrders.length} pedido(s) listado(s)</span>
          <div className="flex items-center gap-4">
            <span>
              Total: <strong className="text-white">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            </span>
            <span>
              Comissão Total: <strong className="text-emerald-400">R$ {totalCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Orders List / Cards */}
      {filteredOrders.length === 0 ? (
        <div className="bg-slate-900 rounded-2xl p-12 border border-slate-800 text-center space-y-3">
          <FileText className="w-12 h-12 mx-auto text-slate-600" />
          <h4 className="text-sm font-bold text-slate-300">Nenhum pedido encontrado</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Não encontramos nenhum pedido correspondente aos filtros selecionados.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            let statusBadge = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
            let statusText = 'Transmitido';
            let StatusIcon = CheckCircle2;

            if (order.status === 'aprovado') {
              statusBadge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
              statusText = 'Aprovado no ERP';
            } else if (order.status === 'pendente_transmissao') {
              statusBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
              statusText = 'Pendente Offline';
              StatusIcon = Clock;
            } else if (order.status === 'rascunho') {
              statusBadge = 'bg-slate-700 text-slate-300 border-slate-600';
              statusText = 'Rascunho';
              StatusIcon = Clock;
            }

            return (
              <div
                key={order.id}
                className="bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono font-black text-sm text-blue-400">{order.numeroPedido}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusBadge}`}>
                      <StatusIcon className="w-3 h-3" />
                      <span>{statusText}</span>
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {order.dataCriacao}
                    </span>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-base font-black text-white">
                      R$ {order.valorTotalLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[11px] text-emerald-400 font-semibold block">
                      Comissão: R$ {order.comissaoTotalReais.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-white text-sm">{order.cliente.nomeFantasia}</h4>
                    <p className="text-slate-400">
                      {order.itens.length} produto(s) • Condição: {order.condicaoPagamento} • Frete: {order.tipoFrete}
                    </p>
                    <p className="text-slate-400">
                      Previsão de Entrega: <strong className="text-slate-300">{order.dataPrevisaoEntrega}</strong>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      onClick={() => setOrderToPrint(order)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white font-bold text-xs border border-blue-500/40 flex items-center gap-1 transition-all cursor-pointer"
                      title="Imprimir em Meia Folha / LX-300 / PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimir</span>
                    </button>

                    {order.status === 'pendente_transmissao' && (
                      <button
                        onClick={() => transmitOrder(order.id)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        <span>Transmitir</span>
                      </button>
                    )}

                    <button
                      onClick={() => duplicateOrder(order)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 flex items-center gap-1 transition-colors"
                      title="Recomprar os mesmos itens"
                    >
                      <Copy className="w-3 h-3 text-blue-400" />
                      <span className="hidden sm:inline">Duplicar</span>
                    </button>

                    <button
                      onClick={() => setSelectedOrderId(order.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ver Espelho</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Espelho do Pedido */}
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}

      {/* Modal de Impressão Meia Folha / LX-300 / PDF */}
      {orderToPrint && (
        <OrderPrintModal
          order={orderToPrint}
          isOpen={!!orderToPrint}
          onClose={() => setOrderToPrint(null)}
        />
      )}

    </div>
  );
};
