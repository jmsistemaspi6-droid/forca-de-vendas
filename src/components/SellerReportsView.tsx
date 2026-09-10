import React, { useState } from 'react';
import { useSales } from '../context/SalesContext';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  DollarSign,
  Award,
  Users,
  CreditCard,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  PieChart,
  ShoppingBag,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

export const SellerReportsView: React.FC = () => {
  const { seller, orders, clients, showToast } = useSales();
  const [period, setPeriod] = useState<'hoje' | '7dias' | 'mes' | 'ano'>('mes');

  // Hoje no formato ISO
  const todayStr = new Date().toISOString().split('T')[0];

  // Filtra pedidos válidos pelo período selecionado
  const filteredOrders = orders.filter((o) => {
    if (o.status === 'cancelado') return false;
    const orderDate = (o.dataCriacao || '').split('T')[0];

    if (period === 'hoje') {
      return orderDate === todayStr;
    }
    if (period === '7dias') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return new Date(orderDate) >= d;
    }
    if (period === 'mes') {
      const currentMonth = new Date().toISOString().slice(0, 7);
      return orderDate.startsWith(currentMonth);
    }
    return true;
  });

  // Métricas do Período
  const totalFaturadoPeriodo = filteredOrders.reduce((sum, o) => sum + (o.valorTotalLiquido || 0), 0);
  const totalComissaoPeriodo = filteredOrders.reduce((sum, o) => sum + (o.comissaoTotalReais || 0), 0);
  const totalPedidosPeriodo = filteredOrders.length;
  const ticketMedio = totalPedidosPeriodo > 0 ? totalFaturadoPeriodo / totalPedidosPeriodo : 0;

  // Vendas de Hoje
  const ordersHoje = orders.filter((o) => (o.dataCriacao || '').split('T')[0] === todayStr && o.status !== 'cancelado');
  const totalHoje = ordersHoje.reduce((sum, o) => sum + (o.valorTotalLiquido || 0), 0);
  const comissaoHoje = ordersHoje.reduce((sum, o) => sum + (o.comissaoTotalReais || 0), 0);

  // Meta Mensal
  const metaAtingidaPct = seller.metaMensal > 0 ? Math.min(100, Math.round((seller.realizadoMes / seller.metaMensal) * 100)) : 0;

  // Vendas por Forma de Pagamento
  const paymentStats: Record<string, { total: number; count: number }> = {};
  filteredOrders.forEach((o) => {
    const f = o.formaPagamento || 'Boleto Bancário';
    if (!paymentStats[f]) paymentStats[f] = { total: 0, count: 0 };
    paymentStats[f].total += o.valorTotalLiquido;
    paymentStats[f].count += 1;
  });

  // Top Clientes no Período
  const clientStats: Record<string, { nome: string; total: number; count: number }> = {};
  filteredOrders.forEach((o) => {
    const cid = o.clienteId;
    const nome = o.cliente.nomeFantasia || o.cliente.razaoSocial;
    if (!clientStats[cid]) clientStats[cid] = { nome, total: 0, count: 0 };
    clientStats[cid].total += o.valorTotalLiquido;
    clientStats[cid].count += 1;
  });
  const topClients = Object.values(clientStats).sort((a, b) => b.total - a.total).slice(0, 5);

  // Exportar Relatório CSV
  const handleExportCsv = () => {
    try {
      const headers = ['NUMERO_PEDIDO', 'DATA', 'CLIENTE', 'VALOR_TOTAL', 'COMISSAO_REAIS', 'FORMA_PAGTO', 'STATUS'];
      const rows = filteredOrders.map((o) => [
        `"${o.numeroPedido}"`,
        `"${o.dataCriacao}"`,
        `"${o.cliente.nomeFantasia || o.cliente.razaoSocial}"`,
        `"${o.valorTotalLiquido.toFixed(2)}"`,
        `"${o.comissaoTotalReais.toFixed(2)}"`,
        `"${o.formaPagamento}"`,
        `"${o.status}"`,
      ]);

      const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio_vendedor_${seller.nome.replace(/\s+/g, '_')}_${period}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('Relatório Exportado', 'Arquivo CSV do período gerado com sucesso.', 'success');
    } catch (e: any) {
      showToast('Erro', e.message || 'Falha ao exportar relatório.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-950/60 font-black">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Relatórios Comerciais do Vendedor
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                {seller.nome}
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Acompanhe seu desempenho diário, cálculo de comissões e atingimento de metas
            </p>
          </div>
        </div>

        {/* Export & Period selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
            {[
              { id: 'hoje', label: 'Hoje' },
              { id: '7dias', label: '7 Dias' },
              { id: 'mes', label: 'Mês Atual' },
              { id: 'ano', label: 'Ano' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPeriod(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  period === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vendas Diárias (Hoje) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Vendas Diárias (Hoje)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-white">
            R$ {totalHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <span>{ordersHoje.length} pedidos hoje</span>
            <span className="text-emerald-400 font-bold font-mono">+ R$ {comissaoHoje.toFixed(2)} comissão</span>
          </div>
        </div>

        {/* Faturamento do Período */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Faturado</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-emerald-400">
            R$ {totalFaturadoPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <span>{totalPedidosPeriodo} pedidos emitidos</span>
            <span className="text-slate-300 font-medium">Ticket: R$ {ticketMedio.toFixed(0)}</span>
          </div>
        </div>

        {/* Comissão Estimada */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Comissão no Período</span>
            <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-purple-300">
            R$ {totalComissaoPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <span>Média ~ {((totalComissaoPeriodo / (totalFaturadoPeriodo || 1)) * 100).toFixed(1)}%</span>
            <span className="text-purple-400 font-bold">Líquido</span>
          </div>
        </div>

        {/* Atingimento da Meta Mensal */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Atingimento de Meta</span>
            <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-black font-mono text-amber-400">{metaAtingidaPct}%</p>
            <span className="text-[10px] text-slate-400 font-mono">
              Meta: R$ {(seller.metaMensal / 1000).toFixed(0)}k
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${metaAtingidaPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Two Columns: Payment Breakdown and Top Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Formas de Pagamento */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <CreditCard className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Vendas por Forma de Pagamento
            </h2>
          </div>

          <div className="space-y-2.5">
            {Object.keys(paymentStats).length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Nenhum pedido faturado no período.</p>
            ) : (
              Object.entries(paymentStats).map(([method, data]) => {
                const pct = totalFaturadoPeriodo > 0 ? Math.round((data.total / totalFaturadoPeriodo) * 100) : 0;

                return (
                  <div key={method} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{method}</span>
                      <span className="font-mono font-bold text-emerald-400">
                        R$ {data.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{data.count} pedido(s)</span>
                      <span className="font-mono">{pct}% do total</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Clientes no Período */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Users className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Top 5 Clientes que Mais Compraram no Período
            </h2>
          </div>

          <div className="space-y-2.5">
            {topClients.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Nenhuma venda registrada no período selecionado.</p>
            ) : (
              topClients.map((client, index) => {
                const sharePct = totalFaturadoPeriodo > 0 ? Math.round((client.total / totalFaturadoPeriodo) * 100) : 0;

                return (
                  <div
                    key={client.nome}
                    className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 font-mono">
                        #{index + 1}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">{client.nome}</h4>
                        <p className="text-[10px] text-slate-400">{client.count} pedido(s) faturados</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold font-mono text-emerald-400">
                        R$ {client.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">{sharePct}% da receita</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
