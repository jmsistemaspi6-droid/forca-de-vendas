import React, { useState } from 'react';
import {
  ArrowUpRight,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  DollarSign,
  Building,
  CreditCard,
  FileText,
  Tag,
  Copy,
  ChevronDown,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { PayableTitle, PayableStatus } from '../../types';
import { PayablePaymentModal } from './PayablePaymentModal';
import { AddPayableExpenseModal } from './AddPayableExpenseModal';
import { VoiceSearchButton } from '../common/VoiceSearchButton';

export const AccountsPayableView: React.FC = () => {
  const { payableTitles } = useSales();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | PayableStatus>('todos');
  const [selectedTitleForPayment, setSelectedTitleForPayment] = useState<PayableTitle | null>(null);
  const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState(false);

  // Calculations
  const hoje = new Date().toISOString().split('T')[0];

  const totalAberto = payableTitles
    .filter((t) => t.status !== 'pago')
    .reduce((acc, t) => acc + (t.saldoRestante ?? t.valorOriginal), 0);

  const totalVencido = payableTitles
    .filter((t) => t.status === 'vencido' || (t.status === 'a_vencer' && t.dataVencimento < hoje))
    .reduce((acc, t) => acc + (t.saldoRestante ?? t.valorOriginal), 0);

  const totalVenceHoje = payableTitles
    .filter((t) => t.status !== 'pago' && t.dataVencimento === hoje)
    .reduce((acc, t) => acc + (t.saldoRestante ?? t.valorOriginal), 0);

  const totalPagoMes = payableTitles
    .reduce((acc, t) => acc + (t.valorPago || 0), 0);

  // Filtered titles
  const filteredTitles = payableTitles.filter((title) => {
    const sTerm = (searchTerm || '').toLowerCase();
    const fornecedorNome = (title.fornecedorNome || '').toLowerCase();
    const numeroDoc = (title.numeroDocumento || '').toLowerCase();
    const categoria = (title.categoria || '').toLowerCase();

    const matchesSearch =
      !sTerm ||
      fornecedorNome.includes(sTerm) ||
      numeroDoc.includes(sTerm) ||
      categoria.includes(sTerm);

    const matchesStatus =
      statusFilter === 'todos' ? true : title.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`📋 ${label} copiado para a área de transferência!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total em Aberto (A Pagar)
            </span>
            <div className="text-xl font-bold text-slate-100 mt-1 font-mono">
              R$ {totalAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Compromissos futuros e vigentes
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
              Vencidos (Atenção)
            </span>
            <div className="text-xl font-bold text-rose-400 mt-1 font-mono">
              R$ {totalVencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-rose-400/80 mt-0.5 block">
              Necessitam de regularização urgente
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-950/80 border border-rose-800 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Vence Hoje
            </span>
            <div className="text-xl font-bold text-amber-400 mt-1 font-mono">
              R$ {totalVenceHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-amber-400/80 mt-0.5 block">
              Programação de pagamentos do dia
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-950/80 border border-amber-800 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Total Pago no Mês
            </span>
            <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">
              R$ {totalPagoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-emerald-400/80 mt-0.5 block">
              Títulos já liquidados
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Status Filters & Add Button */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="w-full lg:w-72 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Fornecedor, doc, categoria..."
            className="w-full pl-9 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-rose-500"
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
            <VoiceSearchButton
              size="sm"
              onTranscript={(t) => setSearchTerm(t)}
              placeholderHint="Fale o nome do fornecedor ou despesa..."
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'a_vencer', label: 'A Vencer' },
            { id: 'vencido', label: 'Vencidos' },
            { id: 'parcial', label: 'Parciais' },
            { id: 'pago', label: 'Pagos' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === tab.id
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Add Expense Button */}
        <button
          id="btn-open-new-expense"
          onClick={() => setIsNewExpenseModalOpen(true)}
          className="w-full lg:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-950/50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Lançar Despesa / Título</span>
        </button>
      </div>

      {/* Payables Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-rose-400" />
            Títulos a Pagar ({filteredTitles.length})
          </h3>
          <span className="text-[11px] text-slate-400">
            Suporte a baixas totais e parciais
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-300 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Fornecedor / Favorecido</th>
                <th className="p-3.5">Documento / Categoria</th>
                <th className="p-3.5">Vencimento</th>
                <th className="p-3.5 text-right">Valor Original</th>
                <th className="p-3.5 text-right">Saldo a Pagar</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTitles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Nenhum título a pagar encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredTitles.map((title) => {
                  const saldo = title.saldoRestante ?? title.valorOriginal;
                  const isVencido = title.status === 'vencido' || (title.status !== 'pago' && title.dataVencimento < hoje);

                  return (
                    <tr key={title.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Fornecedor */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-100 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-rose-400" />
                          <span>{title.fornecedorNome}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {title.fornecedorCnpj}
                        </div>
                      </td>

                      {/* Documento / Categoria */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-200">
                          {title.numeroDocumento} {title.numeroParcela ? `(Parc. ${title.numeroParcela})` : ''}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Tag className="w-3 h-3 text-slate-500" />
                          {title.categoria}
                        </div>
                      </td>

                      {/* Vencimento */}
                      <td className="p-3.5">
                        <div className={`font-semibold flex items-center gap-1 ${
                          isVencido ? 'text-rose-400' : 'text-slate-300'
                        }`}>
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(title.dataVencimento).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {isVencido ? (
                            <span className="text-rose-400 font-bold">Vencido</span>
                          ) : title.dataVencimento === hoje ? (
                            <span className="text-amber-400 font-bold">Vence Hoje</span>
                          ) : (
                            'Em dia'
                          )}
                        </div>
                      </td>

                      {/* Valor Original */}
                      <td className="p-3.5 text-right font-mono text-slate-400">
                        R$ {(title.valorOriginal ?? (title as any).valor ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Saldo a Pagar */}
                      <td className="p-3.5 text-right font-mono font-bold text-rose-400">
                        R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        {title.status === 'pago' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Quitado
                          </span>
                        ) : title.status === 'parcial' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950/80 text-blue-300 border border-blue-800">
                            <Clock className="w-3 h-3" />
                            Pago Parcial
                          </span>
                        ) : isVencido ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800">
                            <AlertTriangle className="w-3 h-3" />
                            Vencido
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            A Vencer
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {title.status !== 'pago' && (
                            <button
                              id={`btn-pay-title-${title.id}`}
                              onClick={() => setSelectedTitleForPayment(title)}
                              className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold transition-colors"
                            >
                              Baixar Título
                            </button>
                          )}

                          {title.chavePix && (
                            <button
                              onClick={() => copyToClipboard(title.chavePix!, 'Chave PIX')}
                              title="Copiar Chave PIX"
                              className="p-1 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Settlement Modal */}
      <PayablePaymentModal
        title={selectedTitleForPayment}
        isOpen={Boolean(selectedTitleForPayment)}
        onClose={() => setSelectedTitleForPayment(null)}
      />

      {/* New Expense Modal */}
      <AddPayableExpenseModal
        isOpen={isNewExpenseModalOpen}
        onClose={() => setIsNewExpenseModalOpen(false)}
      />
    </div>
  );
};
