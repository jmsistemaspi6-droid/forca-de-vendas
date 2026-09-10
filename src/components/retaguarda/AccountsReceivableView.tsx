import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowDownLeft,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  User,
  Smartphone,
  Share2,
  Receipt,
  Eye,
  CreditCard,
  MessageCircle,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  SlidersHorizontal,
  Layers,
  PieChart,
  Percent,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { FinancialTitle, FinancialStatus } from '../../types';
import { ReceivablePaymentModal } from './ReceivablePaymentModal';
import { VoiceSearchButton } from '../common/VoiceSearchButton';

export const AccountsReceivableView: React.FC = () => {
  const { financialTitles, addReceivableTitle, clients } = useSales();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | FinancialStatus>('todos');
  const [selectedTitleForPayment, setSelectedTitleForPayment] = useState<FinancialTitle | null>(null);
  const [isNewReceivableModalOpen, setIsNewReceivableModalOpen] = useState(false);
  const [expandedTitleId, setExpandedTitleId] = useState<string | null>(null);

  // Top scrollbar synchronization refs and state
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [tableScrollWidth, setTableScrollWidth] = useState(1400);
  const [scrollProgress, setScrollProgress] = useState(0);

  // New manual title form state
  const [clienteId, setClienteId] = useState('');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [valor, setValor] = useState('');
  const [dataVencimento, setDataVencimento] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );
  const [formaPagamento, setFormaPagamento] = useState('Boleto Bancário 15 Dias');
  const [observacoes, setObservacoes] = useState('');

  const hoje = new Date().toISOString().split('T')[0];

  // Calculated Stats
  const totalSaldoRestante = financialTitles
    .filter((t) => t.status !== 'pago')
    .reduce((acc, t) => acc + (t.saldoRestante ?? t.valorOriginal ?? t.valor ?? 0), 0);

  const totalVencido = financialTitles
    .filter((t) => t.status === 'vencido' || (t.status !== 'pago' && t.dataVencimento < hoje))
    .reduce((acc, t) => acc + (t.saldoRestante ?? t.valorOriginal ?? t.valor ?? 0), 0);

  // Total de recebimentos parciais já lançados em títulos em andamento
  const titulosComBaixasParciais = financialTitles.filter(
    (t) => (t.status === 'parcial' || (t.valorRecebido > 0 && t.status !== 'pago'))
  );
  const totalRecebidoParcialmente = titulosComBaixasParciais.reduce(
    (acc, t) => acc + (t.valorRecebido || 0),
    0
  );

  const totalRecebidoGeral = financialTitles.reduce(
    (acc, t) => acc + (t.valorRecebido || 0),
    0
  );

  // Filtered titles
  const filteredTitles = financialTitles.filter((title) => {
    const sTerm = (searchTerm || '').toLowerCase();
    const pedidoId = String(title.pedidoOrigemId || (title as any).pedidoId || '').toLowerCase();
    const clienteNome = String(title.clienteNome || '').toLowerCase();
    const numeroDoc = String(title.numeroDocumento || '').toLowerCase();

    const matchesSearch =
      !sTerm ||
      clienteNome.includes(sTerm) ||
      numeroDoc.includes(sTerm) ||
      pedidoId.includes(sTerm);

    const matchesStatus =
      statusFilter === 'todos' ? true : title.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Synchronize scroll width between table and top scrollbar
  useEffect(() => {
    const updateDimensions = () => {
      if (tableScrollRef.current) {
        const sw = tableScrollRef.current.scrollWidth;
        setTableScrollWidth(sw);
      }
    };

    updateDimensions();
    const timer = setTimeout(updateDimensions, 100);
    window.addEventListener('resize', updateDimensions);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateDimensions);
    };
  }, [filteredTitles, expandedTitleId]);

  const updateScrollProgress = () => {
    if (tableScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tableScrollRef.current;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll > 0) {
        setScrollProgress(Math.round((scrollLeft / maxScroll) * 100));
      } else {
        setScrollProgress(0);
      }
    }
  };

  const handleTopScroll = () => {
    if (topScrollRef.current && tableScrollRef.current) {
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
      updateScrollProgress();
    }
  };

  const handleTableScroll = () => {
    if (topScrollRef.current && tableScrollRef.current) {
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
      updateScrollProgress();
    }
  };

  const scrollTableBy = (delta: number) => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    }
  };

  const scrollToEdge = (edge: 'start' | 'end') => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTo({
        left: edge === 'start' ? 0 : tableScrollRef.current.scrollWidth,
        behavior: 'smooth',
      });
    }
  };

  const handleCreateReceivable = (e: React.FormEvent) => {
    e.preventDefault();
    const cliente = clients.find((c) => c.id === clienteId);
    if (!cliente || !valor || !dataVencimento) {
      alert('Selecione um cliente e informe o valor e vencimento.');
      return;
    }

    const valorNum = parseFloat(valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      alert('Informe um valor válido.');
      return;
    }

    const novoTitulo: FinancialTitle = {
      id: `REC-${Date.now()}`,
      clienteId: cliente.id,
      clienteNome: cliente.razaoSocial,
      clienteCnpj: cliente.cnpjCpf,
      numeroDocumento: numeroDocumento || `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      parcela: '1/1',
      valorOriginal: valorNum,
      valor: valorNum,
      saldoRestante: valorNum,
      valorRecebido: 0,
      dataVencimento,
      dataEmissao: hoje,
      status: dataVencimento < hoje ? 'vencido' : 'a_vencer',
      diasAtraso: 0,
      formaCobranca: formaPagamento,
      formaPagamento,
      observacoes: observacoes || undefined,
      historicoBaixas: [],
    };

    addReceivableTitle(novoTitulo);
    alert('✅ Título de Contas a Receber cadastrado com sucesso!');
    setIsNewReceivableModalOpen(false);

    // Reset
    setClienteId('');
    setNumeroDocumento('');
    setValor('');
    setObservacoes('');
  };

  const handleWhatsAppReminder = (title: FinancialTitle) => {
    const saldo = title.saldoRestante ?? title.valorOriginal ?? title.valor ?? 0;
    const msg = `Olá *${title.clienteNome}*, tudo bem? Entramos em contato da Distrimax Distribuidora referente ao título no valor restante de *R$ ${saldo.toFixed(2)}* com vencimento em *${new Date(title.dataVencimento).toLocaleDateString('pt-BR')}*. Qualquer dúvida sobre boleto ou chave PIX, estamos à disposição!`;
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-5">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Saldo Restante a Receber */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Restante a Receber (Saldo Devedor)
            </span>
            <div className="text-xl font-bold text-amber-400 mt-1 font-mono">
              R$ {totalSaldoRestante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Total pendente em aberto
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-950/60 border border-amber-800/80 flex items-center justify-center text-amber-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* 2. Recebimentos Parciais Lançados */}
        <div className="p-4 rounded-xl bg-slate-900 border border-blue-900/60 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
              Recebimentos Parciais Lançados
            </span>
            <div className="text-xl font-bold text-blue-400 mt-1 font-mono">
              R$ {totalRecebidoParcialmente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-blue-300/80 mt-0.5 block">
              {titulosComBaixasParciais.length} {titulosComBaixasParciais.length === 1 ? 'título amortizado' : 'títulos amortizados'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-950/80 border border-blue-800 flex items-center justify-center text-blue-400">
            <PieChart className="w-5 h-5" />
          </div>
        </div>

        {/* 3. Total Quitado / Recebido Geral */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Total Já Recebido no Caixa
            </span>
            <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">
              R$ {totalRecebidoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-emerald-400/80 mt-0.5 block">
              Baixas integrais + parciais efetivadas
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* 4. Inadimplência / Vencidos */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
              Inadimplência / Vencidos
            </span>
            <div className="text-xl font-bold text-rose-400 mt-1 font-mono">
              R$ {totalVencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-rose-400/80 mt-0.5 block">
              Títulos vencidos a cobrar
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-950/80 border border-rose-800 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Status Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="w-full lg:w-72 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cliente, pedido, documento..."
            className="w-full pl-9 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
            <VoiceSearchButton
              size="sm"
              onTranscript={(t) => setSearchTerm(t)}
              placeholderHint="Fale o nome do cliente ou documento..."
            />
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'parcial', label: '⚡ Recebidos Parciais' },
            { id: 'a_vencer', label: 'A Vencer' },
            { id: 'vencido', label: 'Vencidos' },
            { id: 'pago', label: 'Quitados 100%' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Add Manual Title Button */}
        <button
          id="btn-open-new-receivable"
          onClick={() => setIsNewReceivableModalOpen(true)}
          className="w-full lg:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Lançar Título Manual</span>
        </button>
      </div>

      {/* Receivables Table Container with TOP Horizontal Scrollbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {/* Table Title & Top Scroll Navigation Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              Contas a Receber ({filteredTitles.length} títulos)
            </h3>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Acompanhamento de baixas, amortizações parciais e saldo restante
            </span>
          </div>

          {/* Top Scroll Quick Controls */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1.5 shadow-sm">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1 mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
              Rolagem Lateral ({scrollProgress}%):
            </span>

            <button
              type="button"
              onClick={() => scrollToEdge('start')}
              title="Ir para o início (Cliente)"
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold transition-colors"
            >
              ⏮ Início
            </button>

            <button
              type="button"
              onClick={() => scrollTableBy(-250)}
              title="Rolar para a esquerda"
              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors flex items-center justify-center"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => scrollTableBy(250)}
              title="Rolar para a direita"
              className="p-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors flex items-center justify-center"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => scrollToEdge('end')}
              title="Ir para as Ações e Baixas (Lado Direito)"
              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition-colors shadow-sm"
            >
              Ver Ações ⏭
            </button>
          </div>
        </div>

        {/* 🌟 BARRA DE ROLAGEM HORIZONTAL SINCRONIZADA NO TOPO DA TABELA 🌟 */}
        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase text-emerald-400 shrink-0 flex items-center gap-1">
            <span>↔ Arraste a barra para navegar:</span>
          </span>
          <div
            ref={topScrollRef}
            onScroll={handleTopScroll}
            className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-emerald-600 scrollbar-track-slate-800 h-4 rounded"
          >
            {/* Dummy div to match the table scroll width */}
            <div style={{ width: `${tableScrollWidth}px`, height: '1px' }} />
          </div>
        </div>

        {/* Main Table Scroll Container */}
        <div
          ref={tableScrollRef}
          onScroll={handleTableScroll}
          className="overflow-x-auto"
        >
          <table className="w-full text-left text-xs min-w-[1050px]">
            <thead className="bg-slate-950/80 text-slate-300 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5 w-10 text-center">Extrato</th>
                <th className="p-3.5">Cliente / Sacado</th>
                <th className="p-3.5">Origem / Documento</th>
                <th className="p-3.5">Vencimento</th>
                <th className="p-3.5 text-right">Valor Total Original</th>
                <th className="p-3.5 text-right bg-emerald-950/20 text-emerald-300">Já Recebido (Baixas)</th>
                <th className="p-3.5 text-right bg-amber-950/20 text-amber-300">Restante que Falta</th>
                <th className="p-3.5 text-center">Status / Quitação</th>
                <th className="p-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTitles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Nenhum título a receber encontrado para este filtro.
                  </td>
                </tr>
              ) : (
                filteredTitles.map((title) => {
                  const valorOriginal = title.valorOriginal ?? title.valor ?? 0;
                  const valorRecebido = title.valorRecebido || 0;
                  const saldoRestante = title.saldoRestante ?? Math.max(0, valorOriginal - valorRecebido);
                  const isVencido = title.status === 'vencido' || (title.status !== 'pago' && title.dataVencimento < hoje);
                  const isExpanded = expandedTitleId === title.id;
                  const totalBaixas = title.historicoBaixas?.length || 0;

                  // Percentual pago
                  const pctPago = valorOriginal > 0 ? Math.min(100, (valorRecebido / valorOriginal) * 100) : (title.status === 'pago' ? 100 : 0);

                  return (
                    <React.Fragment key={title.id}>
                      <tr className={`hover:bg-slate-800/40 transition-colors ${
                        isExpanded ? 'bg-slate-800/50' : ''
                      } ${title.status === 'parcial' ? 'bg-blue-950/10' : ''}`}>
                        {/* Botão de Expandir Histórico */}
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => setExpandedTitleId(isExpanded ? null : title.id)}
                            title={isExpanded ? 'Recolher detalhes' : 'Ver histórico de baixas e parcelas'}
                            className={`p-1 rounded-lg transition-colors ${
                              isExpanded
                                ? 'bg-emerald-600 text-white'
                                : totalBaixas > 0
                                ? 'bg-blue-900/60 hover:bg-blue-800 text-blue-300'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                            }`}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>

                        {/* Cliente */}
                        <td className="p-3.5">
                          <div className="font-bold text-slate-100 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate max-w-[220px]" title={title.clienteNome}>
                              {title.clienteNome}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {title.clienteCnpj || 'CNPJ não informado'} • {title.formaPagamento}
                          </div>
                        </td>

                        {/* Origem / Documento */}
                        <td className="p-3.5">
                          {title.pedidoOrigemId || (title as any).pedidoId ? (
                            <div className="flex items-center gap-1 text-slate-200 font-semibold">
                              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Pedido #{(title.pedidoOrigemId || (title as any).pedidoId).slice(-6)}</span>
                            </div>
                          ) : (
                            <div className="text-slate-200 font-semibold font-mono">
                              {title.numeroDocumento || title.id}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {title.parcela ? `Parcela ${title.parcela}` : (title as any).numeroParcela ? `Parcela ${(title as any).numeroParcela}` : 'À Vista'}
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
                          <div className="text-[10px] mt-0.5">
                            {title.status === 'pago' ? (
                              <span className="text-emerald-400">Quitado</span>
                            ) : isVencido ? (
                              <span className="text-rose-400 font-bold">Vencido ({title.diasAtraso || 1}d)</span>
                            ) : title.dataVencimento === hoje ? (
                              <span className="text-amber-400 font-bold">Vence Hoje</span>
                            ) : (
                              <span className="text-slate-400">Em dia</span>
                            )}
                          </div>
                        </td>

                        {/* Valor Original Total */}
                        <td className="p-3.5 text-right font-mono font-medium text-slate-300">
                          R$ {valorOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>

                        {/* JÁ RECEBIDO (BAIXAS LANÇADAS) */}
                        <td className="p-3.5 text-right bg-emerald-950/10 font-mono">
                          <div className="font-bold text-emerald-400 text-sm">
                            R$ {valorRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-emerald-300/80 flex items-center justify-end gap-1 mt-0.5">
                            {totalBaixas > 0 ? (
                              <span className="inline-flex items-center gap-0.5 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800 text-[9px] font-semibold">
                                {totalBaixas} {totalBaixas === 1 ? 'baixa efetuada' : 'baixas efetuadas'}
                              </span>
                            ) : (
                              <span className="text-slate-400">Nenhuma baixa</span>
                            )}
                          </div>
                        </td>

                        {/* RESTANTE QUE FALTA (SALDO DEVEDOR) */}
                        <td className="p-3.5 text-right bg-amber-950/10 font-mono">
                          <div className={`font-bold text-sm ${
                            saldoRestante <= 0
                              ? 'text-slate-400'
                              : isVencido
                              ? 'text-rose-400'
                              : 'text-amber-400'
                          }`}>
                            R$ {saldoRestante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>

                          {/* Mini barra de progresso visual de quitação */}
                          <div className="w-28 ml-auto mt-1">
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                              <div
                                style={{ width: `${pctPago}%` }}
                                className="bg-emerald-500 h-full rounded-full transition-all"
                              />
                            </div>
                            <div className="text-[9px] text-slate-400 mt-0.5 text-right">
                              {pctPago.toFixed(0)}% pago ({Math.max(0, 100 - pctPago).toFixed(0)}% falta)
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-3.5 text-center">
                          {title.status === 'pago' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 shadow-sm">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Liquidado 100%
                            </span>
                          ) : title.status === 'parcial' || (valorRecebido > 0 && saldoRestante > 0) ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-700 shadow-sm">
                              <Clock className="w-3 h-3 text-blue-400" />
                              Recebido Parcial ({pctPago.toFixed(0)}%)
                            </span>
                          ) : isVencido ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-700 shadow-sm">
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                              Inadimplente
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                              A Receber
                            </span>
                          )}
                        </td>

                        {/* Ações */}
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              id={`btn-receive-title-${title.id}`}
                              onClick={() => setSelectedTitleForPayment(title)}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                                title.status === 'pago'
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-emerald-950/50'
                              }`}
                            >
                              {title.status === 'pago' ? (
                                <>
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Recibo</span>
                                </>
                              ) : (
                                <>
                                  <DollarSign className="w-3.5 h-3.5" />
                                  <span>{title.status === 'parcial' ? 'Nova Baixa / Quitar' : 'Baixar / Receber'}</span>
                                </>
                              )}
                            </button>

                            {isVencido && (
                              <button
                                onClick={() => handleWhatsAppReminder(title)}
                                title="Enviar lembrete amigável via WhatsApp"
                                className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-950/60 border border-emerald-800/60 transition-colors"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* 📋 GAVETA EXPANSÍVEL: DETALHAMENTO DE TODAS AS BAIXAS PARCIAIS DO TÍTULO 📋 */}
                      {isExpanded && (
                        <tr className="bg-slate-950/90 border-b border-slate-800 animate-fadeIn">
                          <td colSpan={9} className="p-4">
                            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                                <div className="flex items-center gap-2">
                                  <Receipt className="w-4 h-4 text-emerald-400" />
                                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                                    Extrato de Amortizações & Baixas do Título: {title.numeroDocumento || title.id}
                                  </h4>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-mono">
                                  <span className="text-slate-400">
                                    Valor Total: <strong className="text-slate-200">R$ {valorOriginal.toFixed(2)}</strong>
                                  </span>
                                  <span className="text-emerald-400">
                                    Total Já Amortizado: <strong className="text-emerald-300">R$ {valorRecebido.toFixed(2)}</strong>
                                  </span>
                                  <span className="text-amber-400">
                                    Falta Receber: <strong className="text-amber-300">R$ {saldoRestante.toFixed(2)}</strong>
                                  </span>
                                </div>
                              </div>

                              {(!title.historicoBaixas || title.historicoBaixas.length === 0) ? (
                                <div className="p-3 text-center text-slate-400 text-xs bg-slate-950/60 rounded-lg border border-slate-800/80">
                                  Nenhum recebimento parcial ou total lançado ainda para este título.
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                    {title.historicoBaixas.map((baixa, idx) => {
                                      const valorBaixa = baixa.valorRecebido ?? baixa.valorPago ?? 0;
                                      const dataBaixa = baixa.dataRecebimento || baixa.data || 'Data não registrada';
                                      const meio = baixa.formaRecebimento || baixa.formaPagamento || 'Recebimento';

                                      return (
                                        <div
                                          key={baixa.id || idx}
                                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between text-xs space-y-1.5 shadow-sm hover:border-slate-700 transition-colors"
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-200 flex items-center gap-1.5">
                                              <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-mono flex items-center justify-center border border-emerald-800">
                                                #{idx + 1}
                                              </span>
                                              {meio}
                                            </span>
                                            <span className="font-mono font-bold text-emerald-400 text-sm">
                                              + R$ {valorBaixa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                          </div>

                                          <div className="text-[11px] text-slate-400 flex items-center justify-between">
                                            <span>{dataBaixa}</span>
                                            {baixa.reciboNumero && (
                                              <span className="text-emerald-400 font-mono font-semibold">
                                                {baixa.reciboNumero}
                                              </span>
                                            )}
                                          </div>

                                          {(baixa.valorJurosMulta > 0 || baixa.valorDesconto > 0) && (
                                            <div className="text-[10px] text-slate-400 flex gap-2 pt-1 border-t border-slate-800/80">
                                              {baixa.valorJurosMulta > 0 && (
                                                <span className="text-rose-400">+ Juros: R$ {baixa.valorJurosMulta.toFixed(2)}</span>
                                              )}
                                              {baixa.valorDesconto > 0 && (
                                                <span className="text-emerald-400">- Desconto: R$ {baixa.valorDesconto.toFixed(2)}</span>
                                              )}
                                            </div>
                                          )}

                                          {baixa.responsavel && (
                                            <div className="text-[10px] text-slate-400 pt-0.5">
                                              Resp: <span className="text-slate-300">{baixa.responsavel}</span>
                                            </div>
                                          )}

                                          {baixa.observacoes && (
                                            <div className="text-[10px] text-slate-400 bg-slate-900/80 p-1.5 rounded border border-slate-800 italic">
                                              "{baixa.observacoes}"
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receivable Settlement Modal */}
      <ReceivablePaymentModal
        title={selectedTitleForPayment}
        isOpen={Boolean(selectedTitleForPayment)}
        onClose={() => setSelectedTitleForPayment(null)}
      />

      {/* New Manual Receivable Modal */}
      {isNewReceivableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Lançamento Manual de Título a Receber
              </h3>
              <button
                onClick={() => setIsNewReceivableModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReceivable} className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Cliente / Sacado *
                  </label>
                  <select
                    required
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Selecione o cliente...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.razaoSocial} ({c.nomeFantasia || c.cnpjCpf})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Nº do Documento / Título
                  </label>
                  <input
                    type="text"
                    value={numeroDocumento}
                    onChange={(e) => setNumeroDocumento(e.target.value)}
                    placeholder="Ex: FAT-0982 / REC-441"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Valor a Receber (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Forma de Cobrança
                  </label>
                  <select
                    value={formaPagamento}
                    onChange={(e) => setFormaPagamento(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Boleto Bancário 15 Dias">Boleto Bancário 15 Dias</option>
                    <option value="Boleto Bancário 30 Dias">Boleto Bancário 30 Dias</option>
                    <option value="PIX / Transferência">PIX / Transferência</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Data de Vencimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={dataVencimento}
                    onChange={(e) => setDataVencimento(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Observações
                  </label>
                  <input
                    type="text"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Ex: Título avulso referente a taxa de entrega ou devolução"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewReceivableModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  id="btn-save-new-receivable"
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/60 transition-all"
                >
                  Salvar Título a Receber
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
