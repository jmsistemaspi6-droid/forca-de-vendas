import React, { useState } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownLeft,
  Boxes,
  Users,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { ImportNFeXmlModal } from './ImportNFeXmlModal';
import { PayablePaymentModal } from './PayablePaymentModal';
import { ReceivablePaymentModal } from './ReceivablePaymentModal';
import { PayableTitle, FinancialTitle } from '../../types';

export const RetaguardaDashboardView: React.FC = () => {
  const {
    orders,
    products,
    payableTitles,
    financialTitles,
    stockEntries,
    setRetaguardaTab,
  } = useSales();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<PayableTitle | null>(null);
  const [selectedReceivable, setSelectedReceivable] = useState<FinancialTitle | null>(null);

  const hoje = new Date().toISOString().split('T')[0];

  // Financials
  const totalReceberAberto = financialTitles
    .filter((t) => t.status !== 'pago')
    .reduce((sum, t) => sum + (t.saldoRestante ?? t.valor ?? t.valorOriginal ?? 0), 0);

  const totalReceberVencido = financialTitles
    .filter((t) => t.status === 'vencido' || (t.status !== 'pago' && t.dataVencimento < hoje))
    .reduce((sum, t) => sum + (t.saldoRestante ?? t.valor ?? t.valorOriginal ?? 0), 0);

  const totalPagarAberto = payableTitles
    .filter((t) => t.status !== 'pago')
    .reduce((sum, t) => sum + (t.saldoRestante ?? t.valorOriginal ?? 0), 0);

  const totalPagarVencido = payableTitles
    .filter((t) => t.status === 'vencido' || (t.status !== 'pago' && t.dataVencimento < hoje))
    .reduce((sum, t) => sum + (t.saldoRestante ?? t.valorOriginal ?? 0), 0);

  const totalFaturadoMes = orders.reduce((sum, o) => sum + (o.valorTotalLiquido ?? (o as any).totalLiquido ?? 0), 0);
  const valorEstoqueTotal = products.reduce((sum, p) => sum + ((p.precoCusto || 0) * (p.estoqueAtual || 0)), 0);

  const payablesVencendo = payableTitles
    .filter((t) => t.status !== 'pago')
    .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))
    .slice(0, 4);

  const receivablesVencendo = financialTitles
    .filter((t) => t.status !== 'pago')
    .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold text-xs">
              Painel Executivo Retaguarda
            </span>
            <span className="text-xs text-slate-400">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-2">
            Visão Geral de Operações & Fluxo Financeiro
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Sincronização contínua com os pedidos enviados pelos vendedores em campo.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            id="btn-dash-import-xml"
            onClick={() => setIsImportModalOpen(true)}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/60 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Importar XML NF-e</span>
          </button>

          <button
            onClick={() => setRetaguardaTab('relatorios')}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span>DRE & Relatórios</span>
          </button>
        </div>
      </div>

      {/* Main 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Contas a Receber */}
        <div
          onClick={() => setRetaguardaTab('contas_receber')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Contas a Receber
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-2">
            R$ {totalReceberAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
            <span>Vencidos (Atraso):</span>
            <span className="font-bold text-rose-400 font-mono">
              R$ {totalReceberVencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Contas a Pagar */}
        <div
          onClick={() => setRetaguardaTab('contas_pagar')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 cursor-pointer transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Contas a Pagar
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-950/80 border border-rose-800 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-rose-400 mt-2">
            R$ {totalPagarAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
            <span>Vencidos:</span>
            <span className="font-bold text-rose-400 font-mono">
              R$ {totalPagarVencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Faturamento do Força de Vendas */}
        <div
          onClick={() => setRetaguardaTab('pedidos_vendas')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 cursor-pointer transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Faturamento Vendas Mobile
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-950/80 border border-blue-800 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-100 mt-2">
            R$ {totalFaturadoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
            <span>Total de Pedidos:</span>
            <span className="font-bold text-blue-400">{orders.length} pedidos</span>
          </div>
        </div>

        {/* Valor do Estoque a Custo */}
        <div
          onClick={() => setRetaguardaTab('estoque_precos')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 cursor-pointer transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Estoque a Preço de Custo
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-800 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-purple-300 mt-2">
            R$ {valorEstoqueTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
            <span>Catálogo:</span>
            <span className="font-bold text-slate-200">{products.length} itens ativos</span>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Next Payables vs Next Receivables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos Pagamentos a Fornecedores */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-rose-400" />
              Contas a Pagar Imediatas
            </h3>
            <button
              onClick={() => setRetaguardaTab('contas_pagar')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>Ver todas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {payablesVencendo.length === 0 ? (
              <p className="py-4 text-center text-slate-400 text-xs">Nenhum título a pagar pendente.</p>
            ) : (
              payablesVencendo.map((p) => {
                const isVencido = p.status === 'vencido' || (p.status !== 'pago' && p.dataVencimento < hoje);
                const saldo = p.saldoRestante ?? p.valorOriginal;

                return (
                  <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-200">{p.fornecedorNome}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>Venc: {new Date(p.dataVencimento).toLocaleDateString('pt-BR')}</span>
                        {isVencido && <span className="text-rose-400 font-bold ml-1">• Vencido</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right font-mono font-bold text-rose-400">
                        R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <button
                        onClick={() => setSelectedPayable(p)}
                        className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-[11px] font-semibold transition-colors"
                      >
                        Pagar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Próximos Recebimentos de Clientes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              Contas a Receber Imediatas
            </h3>
            <button
              onClick={() => setRetaguardaTab('contas_receber')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>Ver todas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {receivablesVencendo.length === 0 ? (
              <p className="py-4 text-center text-slate-400 text-xs">Nenhum título a receber pendente.</p>
            ) : (
              receivablesVencendo.map((r) => {
                const isVencido = r.status === 'vencido' || (r.status !== 'pago' && r.dataVencimento < hoje);
                const saldo = r.saldoRestante ?? r.valor;

                return (
                  <div key={r.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-200">{r.clienteNome}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>Venc: {new Date(r.dataVencimento).toLocaleDateString('pt-BR')}</span>
                        {isVencido && <span className="text-rose-400 font-bold ml-1">• Vencido</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right font-mono font-bold text-emerald-400">
                        R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <button
                        onClick={() => setSelectedReceivable(r)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-[11px] font-semibold transition-colors"
                      >
                        Receber
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Stock Entries XML */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Últimas Entradas de Mercadorias Registradas por XML
          </h3>
          <button
            onClick={() => setRetaguardaTab('entradas_xml')}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <span>Ver histórico completo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {stockEntries.slice(0, 3).map((entry) => {
            const fornecedorNome = entry.fornecedor?.nomeFantasia || entry.fornecedor?.razaoSocial || (entry as any).fornecedorNome || 'Fornecedor';
            const valorTotal = entry.totais?.valorTotalNota ?? (entry as any).valorTotal ?? 0;
            return (
              <div
                key={entry.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">NF-e #{entry.numeroNota}</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    {entry.itens?.length || 0} itens
                  </span>
                </div>
                <p className="text-slate-400 truncate">{fornecedorNome}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                  <span className="text-slate-500">{entry.dataEmissao ? new Date(entry.dataEmissao).toLocaleDateString('pt-BR') : '-'}</span>
                  <span className="font-mono font-bold text-emerald-400">
                    R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <ImportNFeXmlModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      <PayablePaymentModal
        title={selectedPayable}
        isOpen={Boolean(selectedPayable)}
        onClose={() => setSelectedPayable(null)}
      />

      <ReceivablePaymentModal
        title={selectedReceivable}
        isOpen={Boolean(selectedReceivable)}
        onClose={() => setSelectedReceivable(null)}
      />
    </div>
  );
};
