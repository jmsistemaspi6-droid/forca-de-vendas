import React, { useState, useMemo } from 'react';
import { useSales } from '../context/SalesContext';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Building2,
  Calendar,
  CreditCard,
  User,
  ArrowDownLeft,
} from 'lucide-react';
import { FinancialTitle } from '../types';
import { ReceivablePaymentModal } from './retaguarda/ReceivablePaymentModal';
import { PrestacaoContasView } from './financeiro/PrestacaoContasView';
import { Receipt } from 'lucide-react';

interface FinancialViewProps {
  onNavigate?: (tab: string) => void;
  fetchFinanceiro?: () => void;
  fetchClientes?: () => void;
}

export const FinancialView: React.FC<FinancialViewProps> = ({
  onNavigate,
  fetchFinanceiro,
  fetchClientes,
}) => {
  const {
    financialTitles,
    setActiveTab,
    showToast,
    settleReceivableTitle,
  } = useSales();

  const [financialSection, setFinancialSection] = useState<'receber' | 'prestacao'>('receber');

  const [statusFilter, setStatusFilter] = useState<
    'todos' | 'vencidos' | 'a_vencer' | 'recebidos'
  >('todos');

  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [selectedTitleForPayment, setSelectedTitleForPayment] =
    useState<FinancialTitle | null>(null);

  const hoje = new Date().toISOString().split('T')[0];

  // Cálculos dos 3 Cards de Resumo
  const totalAReceber = useMemo(() => {
    return financialTitles
      .filter((t) => t.status !== 'pago' && t.status !== 'cancelado')
      .reduce((acc, t) => acc + (t.saldoRestante ?? t.valorOriginal ?? t.valor ?? 0), 0);
  }, [financialTitles]);

  const totalVencidos = useMemo(() => {
    return financialTitles
      .filter(
        (t) =>
          t.status !== 'pago' &&
          t.status !== 'cancelado' &&
          (t.status === 'vencido' || t.dataVencimento < hoje)
      )
      .reduce((acc, t) => acc + (t.saldoRestante ?? t.valorOriginal ?? t.valor ?? 0), 0);
  }, [financialTitles, hoje]);

  const totalHoje = useMemo(() => {
    return financialTitles
      .filter(
        (t) =>
          t.status !== 'pago' &&
          t.status !== 'cancelado' &&
          t.dataVencimento === hoje
      )
      .reduce((acc, t) => acc + (t.saldoRestante ?? t.valorOriginal ?? t.valor ?? 0), 0);
  }, [financialTitles, hoje]);

  // Agrupamento por Cliente com Filtro Aplicado
  const groupedClients = useMemo(() => {
    const map = new Map<
      string,
      {
        clienteId: string;
        clienteNome: string;
        clienteCnpj?: string;
        titulos: FinancialTitle[];
        totalAReceber: number;
        hasVencido: boolean;
        hasHoje: boolean;
        hasAVencer: boolean;
        allPago: boolean;
      }
    >();

    financialTitles.forEach((t) => {
      const key = t.clienteId || t.clienteNome;
      if (!map.has(key)) {
        map.set(key, {
          clienteId: t.clienteId,
          clienteNome: t.clienteNome,
          clienteCnpj: t.clienteCnpj,
          titulos: [],
          totalAReceber: 0,
          hasVencido: false,
          hasHoje: false,
          hasAVencer: false,
          allPago: true,
        });
      }

      const clientData = map.get(key)!;
      clientData.titulos.push(t);

      const isOverdue =
        t.status !== 'pago' &&
        t.status !== 'cancelado' &&
        (t.status === 'vencido' || t.dataVencimento < hoje);
      const isToday =
        t.status !== 'pago' &&
        t.status !== 'cancelado' &&
        t.dataVencimento === hoje;
      const isFuture =
        t.status !== 'pago' &&
        t.status !== 'cancelado' &&
        t.dataVencimento > hoje;

      if (isOverdue) clientData.hasVencido = true;
      if (isToday) clientData.hasHoje = true;
      if (isFuture) clientData.hasAVencer = true;

      if (t.status !== 'pago') {
        clientData.allPago = false;
        clientData.totalAReceber +=
          t.saldoRestante ?? t.valorOriginal ?? t.valor ?? 0;
      }
    });

    // Filtro por Chips
    return Array.from(map.values()).filter((c) => {
      if (statusFilter === 'todos') return true;
      if (statusFilter === 'vencidos') return c.hasVencido;
      if (statusFilter === 'a_vencer') return c.hasAVencer || c.hasHoje;
      if (statusFilter === 'recebidos') return c.allPago;
      return true;
    });
  }, [financialTitles, statusFilter, hoje]);

  // Enviar Lembrete / 2ª Via por WhatsApp
  const handleSendWhatsApp = (title: FinancialTitle) => {
    const valorPendente = (
      title.saldoRestante ??
      title.valorOriginal ??
      title.valor ??
      0
    ).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

    const text =
      `*LEMBRETE FINANCEIRO - JM SISTEMAS*\n\n` +
      `Olá, *${title.clienteNome}*!\n\n` +
      `Segue a identificação do seu título/boleto para pagamento:\n` +
      `📄 *Documento:* ${title.numeroDocumento} (Parcela ${title.parcela})\n` +
      `📅 *Vencimento:* ${title.dataVencimento}\n` +
      `💰 *Valor:* R$ ${valorPendente}\n` +
      (title.linhaDigitavel
        ? `💳 *Linha Digitável:* ${title.linhaDigitavel}\n`
        : '') +
      (title.chavePix ? `🔑 *Chave PIX:* ${title.chavePix}\n` : '') +
      `\nCaso já tenha efetuado o pagamento, por favor desconsidere este aviso.`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    showToast(
      'WhatsApp Aberto',
      'Mensagem com dados da fatura preparada para envio.',
      'success'
    );
  };

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('dashboard');
    }
    setActiveTab('dashboard');
  };

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8 min-h-screen bg-[#F8FAFC] pb-24 text-slate-800">
      {/* 1. Header: < Voltar | Título Financeiro */}
      <div className="bg-white border-b border-slate-200 px-5 py-4 sticky top-0 z-20 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-tight">
              Financeiro
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Contas a receber & cobrança
            </p>
          </div>
        </div>

        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          {financialTitles.length} títulos
        </span>
      </div>

      <div className="p-4 sm:p-6 space-y-5 max-w-4xl mx-auto">
        {/* Toggle Principal: Contas a Receber vs Prestação de Contas */}
        <div className="flex bg-slate-200/80 p-1.5 rounded-2xl gap-1 shadow-inner">
          <button
            type="button"
            onClick={() => setFinancialSection('receber')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              financialSection === 'receber'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Contas a Receber</span>
          </button>

          <button
            type="button"
            onClick={() => setFinancialSection('prestacao')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              financialSection === 'prestacao'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4 text-amber-600" />
            <span>Prestação de Contas</span>
          </button>
        </div>

        {financialSection === 'prestacao' ? (
          <PrestacaoContasView />
        ) : (
          <>
            {/* 2. 3 Cards de Resumo: Total a Receber (verde), Vencidos (vermelho), Hoje (azul) - grid-cols-3 */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          {/* Total a Receber (Verde) */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-emerald-100 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wide">
              A Receber
            </span>
            <p className="text-sm sm:text-lg font-black text-emerald-600 mt-1">
              R${' '}
              {totalAReceber.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <span className="text-[9px] sm:text-[10px] text-slate-400 mt-1">
              Saldo em aberto
            </span>
          </div>

          {/* Vencidos (Vermelho) */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-rose-100 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-rose-700 uppercase tracking-wide">
              Vencidos
            </span>
            <p className="text-sm sm:text-lg font-black text-rose-600 mt-1">
              R${' '}
              {totalVencidos.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <span className="text-[9px] sm:text-[10px] text-rose-400 mt-1">
              Atrasados
            </span>
          </div>

          {/* Hoje (Azul) */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-blue-100 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-blue-700 uppercase tracking-wide">
              Hoje
            </span>
            <p className="text-sm sm:text-lg font-black text-blue-600 mt-1">
              R${' '}
              {totalHoje.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <span className="text-[9px] sm:text-[10px] text-blue-400 mt-1">
              Vencendo hoje
            </span>
          </div>
        </div>

        {/* 3. Filtros: Chips "Todos | Vencidos | A vencer | Recebidos" */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'vencidos', label: 'Vencidos' },
            { id: 'a_vencer', label: 'A vencer' },
            { id: 'recebidos', label: 'Recebidos' },
          ].map((chip) => {
            const isActive = statusFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setStatusFilter(chip.id as any)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* 4. Lista: Cards por cliente com avatar, nome, valor total, badge VENCIDO/HOJE/A VENCER */}
        <div className="space-y-3">
          {groupedClients.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 space-y-2">
              <Building2 className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-bold text-sm text-slate-700">
                Nenhum título encontrado com este filtro
              </p>
              <p className="text-xs text-slate-400">
                Alterne o filtro acima para visualizar outros títulos da carteira.
              </p>
            </div>
          ) : (
            groupedClients.map((client) => {
              const isExpanded = expandedClientId === (client.clienteId || client.clienteNome);

              // Determina badge do cliente
              let badgeLabel = 'A VENCER';
              let badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';

              if (client.hasVencido) {
                badgeLabel = 'VENCIDO';
                badgeClass = 'bg-rose-100 text-rose-800 border-rose-200';
              } else if (client.hasHoje) {
                badgeLabel = 'HOJE';
                badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
              } else if (client.allPago) {
                badgeLabel = 'RECEBIDO';
                badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
              }

              // Iniciais do cliente
              const initials = client.clienteNome
                .split(' ')
                .slice(0, 2)
                .map((w) => w[0])
                .join('')
                .toUpperCase();

              return (
                <div
                  key={client.clienteId || client.clienteNome}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300"
                >
                  {/* Cabeçalho do Card do Cliente */}
                  <div
                    onClick={() =>
                      setExpandedClientId(
                        isExpanded ? null : client.clienteId || client.clienteNome
                      )
                    }
                    className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none active:bg-slate-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center font-black text-blue-700 text-xs shrink-0">
                        {initials || <Building2 className="w-5 h-5" />}
                      </div>

                      {/* Nome e CNPJ */}
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-slate-900 truncate">
                          {client.clienteNome}
                        </h3>
                        <p className="text-[11px] text-slate-400 truncate">
                          {client.clienteCnpj || `${client.titulos.length} parcelas`}
                        </p>
                      </div>
                    </div>

                    {/* Valor e Badge */}
                    <div className="flex items-center gap-3 shrink-0 text-right">
                      <div>
                        <span
                          className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full border ${badgeClass}`}
                        >
                          {badgeLabel}
                        </span>
                        <p className="text-sm font-black text-slate-900 mt-1">
                          R${' '}
                          {client.totalAReceber.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>

                      <div className="text-slate-400">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 5. Ao expandir cliente, mostre parcelas com botões WhatsApp e Baixar */}
                  {isExpanded && (
                    <div className="bg-slate-50 border-t border-slate-100 p-3 sm:p-4 space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
                        <span>Parcelas ({client.titulos.length})</span>
                        <span>Ações Rápidas</span>
                      </div>

                      {client.titulos.map((title) => {
                        const isOverdue =
                          title.status !== 'pago' &&
                          title.status !== 'cancelado' &&
                          (title.status === 'vencido' || title.dataVencimento < hoje);
                        const isToday =
                          title.status !== 'pago' &&
                          title.status !== 'cancelado' &&
                          title.dataVencimento === hoje;
                        const isPaid = title.status === 'pago';

                        let statusColor = 'bg-amber-100 text-amber-800';
                        let statusText = `Vence ${title.dataVencimento}`;

                        if (isPaid) {
                          statusColor = 'bg-emerald-100 text-emerald-800';
                          statusText = 'Pago';
                        } else if (isOverdue) {
                          statusColor = 'bg-rose-100 text-rose-800';
                          statusText = `Vencido (${title.dataVencimento})`;
                        } else if (isToday) {
                          statusColor = 'bg-blue-100 text-blue-800';
                          statusText = 'Vence Hoje';
                        }

                        const valorExibido =
                          title.saldoRestante ??
                          title.valorOriginal ??
                          title.valor ??
                          0;

                        return (
                          <div
                            key={title.id}
                            className="bg-white rounded-xl p-3 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                          >
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-bold text-xs text-slate-800">
                                  {title.numeroDocumento}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                  Parc. {title.parcela}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${statusColor}`}
                                >
                                  {statusText}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-slate-900 mt-1">
                                R${' '}
                                {valorExibido.toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </p>
                            </div>

                            {/* Botões WhatsApp e Baixar */}
                            <div className="flex items-center gap-2 self-end sm:self-center">
                              {/* Botão WhatsApp */}
                              <button
                                type="button"
                                onClick={() => handleSendWhatsApp(title)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                                title="Enviar lembrete e código de barras via WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                              </button>

                              {/* Botão Baixar */}
                              {!isPaid ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedTitleForPayment(title)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                                  title="Registrar recebimento/baixa do título"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Baixar</span>
                                </button>
                              ) : (
                                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-lg">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Liquidado</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
          </>
        )}
      </div>

      {/* Modal Completo de Baixa / Pagamento */}
      {selectedTitleForPayment && (
        <ReceivablePaymentModal
          title={selectedTitleForPayment}
          isOpen={!!selectedTitleForPayment}
          onClose={() => setSelectedTitleForPayment(null)}
        />
      )}
    </div>
  );
};
