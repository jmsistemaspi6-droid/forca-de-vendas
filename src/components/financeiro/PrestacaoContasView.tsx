import React, { useState, useMemo, useRef } from 'react';
import { useSales } from '../../context/SalesContext';
import {
  Receipt,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  FileCheck,
  Building2,
  Calendar,
  DollarSign,
  User,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Camera,
  X,
  CreditCard,
  Send,
  Download,
  Search,
  Filter,
} from 'lucide-react';
import { SalespersonExpense, FinancialTitle } from '../../types';
import { ReceivablePaymentModal } from '../retaguarda/ReceivablePaymentModal';

export const PrestacaoContasView: React.FC = () => {
  const {
    currentUser,
    seller,
    financialTitles,
    expenses,
    accountabilitySessions,
    addExpense,
    deleteExpense,
    closeAccountabilitySession,
    showToast,
  } = useSales();

  const [activeTab, setActiveTab] = useState<'recebimentos' | 'despesas' | 'resumo'>('recebimentos');
  const [selectedTitleForPayment, setSelectedTitleForPayment] = useState<FinancialTitle | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [filterRecebimento, setFilterRecebimento] = useState<'todos' | 'hoje' | 'parciais'>('todos');
  const [observacoesFechamento, setObservacoesFechamento] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedSessionForPrint, setSelectedSessionForPrint] = useState<any>(null);

  // Form states para nova despesa
  const [tipoDespesa, setTipoDespesa] = useState<SalespersonExpense['tipo']>('Combustível');
  const [valorDespesa, setValorDespesa] = useState('');
  const [origemDespesa, setOrigemDespesa] = useState<SalespersonExpense['origemPagamento']>('Dinheiro do Caixa (Vendas)');
  const [descricaoDespesa, setDescricaoDespesa] = useState('');
  const [comprovanteBase64, setComprovanteBase64] = useState<string | undefined>(undefined);

  const hojeStr = new Date().toISOString().split('T')[0];
  const vendedorId = currentUser?.id || 'user-001';
  const vendedorNome = currentUser?.nome || seller.nome || 'Lucas Mendonça';

  // 1. Títulos vinculados ao vendedor (ou todos se não houver vendedor específico)
  const titulosDoVendedor = useMemo(() => {
    return financialTitles.filter((t) => {
      if (!t.vendedorId) return true;
      return t.vendedorId === vendedorId || (t.vendedorNome && t.vendedorNome.toLowerCase().includes(vendedorNome.toLowerCase()));
    });
  }, [financialTitles, vendedorId, vendedorNome]);

  // 2. Recebimentos coletados (baixados pelo vendedor)
  const recebimentosRealizados = useMemo(() => {
    const list: Array<{
      tituloId: string;
      clienteNome: string;
      clienteCnpj?: string;
      numeroDocumento: string;
      valorRecebido: number;
      valorOriginal: number;
      saldoRestante: number;
      formaRecebimento: string;
      dataRecebimento: string;
      reciboNumero?: string;
      status: string;
      responsavel?: string;
    }> = [];

    titulosDoVendedor.forEach((t) => {
      if (Array.isArray(t.historicoBaixas) && t.historicoBaixas.length > 0) {
        t.historicoBaixas.forEach((bx) => {
          list.push({
            tituloId: t.id,
            clienteNome: t.clienteNome,
            clienteCnpj: t.clienteCnpj,
            numeroDocumento: t.numeroDocumento,
            valorRecebido: bx.valorRecebido,
            valorOriginal: t.valorOriginal || t.valor,
            saldoRestante: t.saldoRestante ?? 0,
            formaRecebimento: bx.formaRecebimento,
            dataRecebimento: bx.dataRecebimento,
            reciboNumero: bx.reciboNumero,
            status: t.status,
            responsavel: bx.responsavel,
          });
        });
      }
    });

    return list;
  }, [titulosDoVendedor]);

  // 3. Despesas do vendedor corrente
  const despesasDoVendedor = useMemo(() => {
    return expenses.filter((d) => (d.vendedorId ? d.vendedorId === vendedorId : true));
  }, [expenses, vendedorId]);

  // Cálculos do Dashboard Superior
  const totalRecebidoHoje = useMemo(() => {
    return recebimentosRealizados.reduce((acc, r) => acc + (r.valorRecebido || 0), 0);
  }, [recebimentosRealizados]);

  const totalDespesas = useMemo(() => {
    return despesasDoVendedor.reduce((acc, d) => acc + (d.valor || 0), 0);
  }, [despesasDoVendedor]);

  // Saldo "A Prestar" = Recebimentos - Despesas
  const saldoAPrestar = Math.max(0, totalRecebidoHoje - totalDespesas);

  // Manipulação de imagem do comprovante
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setComprovanteBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSalvarDespesa = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(valorDespesa);
    if (isNaN(val) || val <= 0) {
      showToast('Valor Inválido', 'Informe um valor maior que zero para a despesa.', 'error');
      return;
    }

    addExpense({
      vendedorId,
      vendedorNome,
      tipo: tipoDespesa,
      valor: val,
      origemPagamento: origemDespesa,
      descricao: descricaoDespesa || undefined,
      comprovanteUrl: comprovanteBase64,
      data: hojeStr,
    });

    // Reset Form
    setValorDespesa('');
    setDescricaoDespesa('');
    setComprovanteBase64(undefined);
    setIsExpenseModalOpen(false);
  };

  const handleFecharPrestacao = () => {
    if (recebimentosRealizados.length === 0 && despesasDoVendedor.length === 0) {
      showToast('Sem Movimento', 'Não há recebimentos nem despesas ativas para fechar.', 'warning');
      return;
    }

    const sessao = closeAccountabilitySession({
      vendedorId,
      vendedorNome,
      observacoes: observacoesFechamento,
    });

    setSelectedSessionForPrint(sessao);
    setIsPrintModalOpen(true);
    setActiveTab('resumo');
  };

  return (
    <div className="space-y-4 pb-20">
      {/* 🌟 1. CABEÇALHO DO MÓDULO & CARDS DE INDICADORES (Recebido Hoje, Despesas, A Prestar) 🌟 */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800 flex items-center gap-2">
                Prestação de Contas
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                  Força de Vendas
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Vendedor: <span className="font-bold text-slate-700">{vendedorNome}</span> • Data: {new Date().toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-sm shadow-rose-600/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Lançar Despesa</span>
            </button>
          </div>
        </div>

        {/* 3 CARDS GRANDES DE TOTALIZAÇÃO */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 1: Recebido Hoje */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-[11px] font-bold uppercase tracking-wider">Recebido Hoje</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-emerald-700 font-mono">
                R$ {totalRecebidoHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-emerald-600/90 font-medium">
                {recebimentosRealizados.length} recebimento(s)
              </span>
            </div>
          </div>

          {/* Card 2: Despesas */}
          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-rose-800">
              <span className="text-[11px] font-bold uppercase tracking-wider">Despesas / Abatimentos</span>
              <Trash2 className="w-4 h-4 text-rose-600" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-rose-700 font-mono">
                R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-rose-600/90 font-medium">
                {despesasDoVendedor.length} despesa(s) lançada(s)
              </span>
            </div>
          </div>

          {/* Card 3: A Prestar (Saldo Líquido) */}
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-blue-900">
              <span className="text-[11px] font-black uppercase tracking-wider">A Prestar (Saldo Líquido)</span>
              <FileCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-blue-800 font-mono">
                R$ {saldoAPrestar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-blue-600 font-bold">
                Valor líquido a acertar no caixa
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 2. NAVEGAÇÃO POR ABAS: Recebimentos | Despesas | Resumo p/ Entregar 🌟 */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('recebimentos')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'recebimentos'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Recebimentos ({recebimentosRealizados.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('despesas')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'despesas'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>Despesas ({despesasDoVendedor.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('resumo')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'resumo'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Resumo p/ Entregar</span>
        </button>
      </div>

      {/* 🌟 3. CONTEÚDO DAS ABAS 🌟 */}

      {/* ABA 1: RECEBIMENTOS */}
      {activeTab === 'recebimentos' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Títulos e Cobranças em Aberto (Cobrança em Rota)
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">
                Clique para dar baixa parcial ou total
              </span>
            </div>

            {titulosDoVendedor.filter((t) => t.status !== 'pago').length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl text-slate-400 text-xs">
                Nenhum título pendente em aberto para este vendedor.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {titulosDoVendedor
                  .filter((t) => t.status !== 'pago')
                  .map((t) => {
                    const saldo = t.saldoRestante ?? t.valorOriginal ?? t.valor ?? 0;
                    const isVencido = t.status === 'vencido' || t.dataVencimento < hojeStr;

                    return (
                      <div
                        key={t.id}
                        className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 shadow-xs flex flex-col justify-between gap-3 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-xs font-black text-slate-800 block truncate">
                              {t.clienteNome}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Doc: <span className="font-mono font-bold text-slate-600">{t.numeroDocumento}</span> • Venc: {new Date(t.dataVencimento).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                              isVencido
                                ? 'bg-rose-100 text-rose-700'
                                : t.status === 'parcial'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {isVencido ? 'Vencido' : t.status === 'parcial' ? '⚡ Parcial' : 'Em Aberto'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">
                              Saldo a Receber
                            </span>
                            <span className="text-base font-black text-slate-900 font-mono">
                              R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedTitleForPayment(t)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all active:scale-95"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Receber</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Histórico de Recebimentos Efetuados nesta Jornada */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Recebimentos Efetuados nesta Sessão ({recebimentosRealizados.length})
            </h2>

            {recebimentosRealizados.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                Nenhum valor recebido até o momento.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recebimentosRealizados.map((r, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{r.clienteNome}</div>
                      <div className="text-[11px] text-slate-400">
                        Doc: {r.numeroDocumento} • Forma: <span className="font-semibold text-slate-700">{r.formaRecebimento}</span>
                        {r.reciboNumero && ` • Recibo #${r.reciboNumero}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-emerald-600 font-mono text-sm">
                        + R$ {r.valorRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] text-slate-400">{r.dataRecebimento}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 2: DESPESAS */}
      {activeTab === 'despesas' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Despesas e Custos de Viagem
                </h2>
                <p className="text-xs text-slate-500">
                  Lançamentos abatem automaticamente do saldo a prestar.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(true)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Despesa</span>
              </button>
            </div>

            {despesasDoVendedor.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl text-slate-400 text-xs">
                Nenhuma despesa registrada hoje. Clique em "Nova Despesa" para incluir alimentação, combustível, pedágio, etc.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {despesasDoVendedor.map((d) => (
                  <div key={d.id} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-bold">
                        {d.tipo.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          <span>{d.tipo}</span>
                          <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">
                            {d.origemPagamento}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {d.descricao || 'Sem descrição adicional'} • {d.criadoEm}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right font-mono">
                        <div className="font-bold text-rose-600 text-sm">
                          - R$ {d.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        {d.comprovanteUrl && (
                          <span className="text-[10px] text-blue-600 font-semibold flex items-center justify-end gap-1">
                            <Camera className="w-3 h-3" /> Foto anexada
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteExpense(d.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Excluir despesa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 3: RESUMO P/ ENTREGAR */}
      {activeTab === 'resumo' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
            <div className="text-center space-y-1">
              <span className="text-[11px] uppercase font-bold tracking-widest text-slate-400">
                Extrato de Fechamento de Turno
              </span>
              <h2 className="text-xl font-black text-slate-800">
                Resumo da Prestação de Contas
              </h2>
              <p className="text-xs text-slate-500">
                Confira os valores antes de fechar e transmitir para a retaguarda.
              </p>
            </div>

            {/* Balanço Geral */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span>(+) Total de Recebimentos em Rota:</span>
                <span className="font-bold text-emerald-600 text-sm">
                  R$ {totalRecebidoHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span>(-) Despesas & Abatimentos Comprovados:</span>
                <span className="font-bold text-rose-600 text-sm">
                  R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-slate-900 font-bold text-sm">
                <span>(=) SALDO LÍQUIDO A ENTREGAR NO CAIXA:</span>
                <span className="text-lg text-blue-700 font-black">
                  R$ {saldoAPrestar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Observações do Fechamento / Recado para o Financeiro:
              </label>
              <textarea
                value={observacoesFechamento}
                onChange={(e) => setObservacoesFechamento(e.target.value)}
                placeholder="Ex: Deixado comprovante físico de combustível na pasta; acerto feito em dinheiro e PIX..."
                rows={2}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleFecharPrestacao}
                className="w-full sm:flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-95"
              >
                <FileCheck className="w-4 h-4" />
                <span>Fechar Prestação & Transmitir</span>
              </button>

              {accountabilitySessions.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSessionForPrint(accountabilitySessions[0]);
                    setIsPrintModalOpen(true);
                  }}
                  className="w-full sm:w-auto px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Última Prestação (Meia Folha)</span>
                </button>
              )}
            </div>
          </div>

          {/* Histórico de Prestações Fechadas pelo Vendedor */}
          {accountabilitySessions.length > 0 && (
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Prestações Anteriores Transmitidas
              </h3>

              <div className="space-y-2">
                {accountabilitySessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-black text-slate-800 flex items-center gap-2">
                        <span>{sess.numeroControle}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sess.status === 'aprovada_retaguarda'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sess.status === 'rejeitada'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {sess.status === 'aprovada_retaguarda'
                            ? '✓ Aprovada pela Retaguarda'
                            : sess.status === 'rejeitada'
                            ? '✕ Rejeitada'
                            : 'Pendente de Auditoria'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Fechado em: {sess.dataFechamento} • Saldo: R$ {sess.saldoEntregar.toFixed(2)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSessionForPrint(sess);
                        setIsPrintModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center gap-1 shadow-2xs self-end sm:self-center"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimir Meia Folha</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🌟 MODAL: LANÇAR NOVA DESPESA 🌟 */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <Trash2 className="w-4 h-4" />
                </div>
                <h3 className="font-black text-slate-800 text-sm">Lançar Despesa de Rota</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarDespesa} className="space-y-3.5">
              {/* Tipo de Despesa */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Tipo de Despesa
                </label>
                <select
                  value={tipoDespesa}
                  onChange={(e) => setTipoDespesa(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-500"
                >
                  <option value="Combustível">Combustível / Abastecimento</option>
                  <option value="Alimentação">Alimentação / Refeição</option>
                  <option value="Pedágio">Pedágio</option>
                  <option value="Hospedagem">Hospedagem</option>
                  <option value="Manutenção Veículo">Manutenção Veículo</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              {/* Valor */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Valor da Despesa (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0,00"
                  value={valorDespesa}
                  onChange={(e) => setValorDespesa(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Origem do Pagamento */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Origem do Pagamento
                </label>
                <select
                  value={origemDespesa}
                  onChange={(e) => setOrigemDespesa(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="Dinheiro do Caixa (Vendas)">Dinheiro do Caixa (Vendas - Abate do Acerto)</option>
                  <option value="Cartão Corporativo">Cartão Corporativo</option>
                  <option value="Recursos Próprios (Reembolso)">Recursos Próprios (Solicitar Reembolso)</option>
                </select>
              </div>

              {/* Descrição */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Descrição / Detalhes
                </label>
                <input
                  type="text"
                  placeholder="Ex: Gasolina 30L Posto Shell KM 120"
                  value={descricaoDespesa}
                  onChange={(e) => setDescricaoDespesa(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Anexar Comprovante / Foto */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Foto do Comprovante / Cupom Fiscal
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 p-2.5 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs text-slate-600 hover:bg-slate-100 transition-colors">
                    <Camera className="w-4 h-4 text-slate-400" />
                    <span>{comprovanteBase64 ? 'Foto Selecionada' : 'Tirar Foto ou Carregar Arquivo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {comprovanteBase64 && (
                    <button
                      type="button"
                      onClick={() => setComprovanteBase64(undefined)}
                      className="p-2 text-rose-600 bg-rose-50 rounded-xl"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
                >
                  Confirmar Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🌟 MODAL: BAIXA DE TÍTULO RECEBÍVEL (PARCIAL / TOTAL) 🌟 */}
      {selectedTitleForPayment && (
        <ReceivablePaymentModal
          isOpen={!!selectedTitleForPayment}
          title={selectedTitleForPayment}
          onClose={() => setSelectedTitleForPayment(null)}
        />
      )}

      {/* 🌟 MODAL: IMPRESSÃO MEIA FOLHA CARBONADA 🌟 */}
      {isPrintModalOpen && selectedSessionForPrint && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-slate-800 text-sm">
                  Comprovante de Prestação (Meia Folha A4)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Layout da Meia Folha / Visualização */}
            <div className="bg-amber-50/50 p-4 border border-amber-200/80 rounded-2xl font-mono text-[11px] text-slate-800 space-y-2">
              <div className="text-center font-bold border-b border-dashed border-slate-300 pb-2">
                <div>JM SISTEMAS - PRESTAÇÃO DE CONTAS</div>
                <div>CONTROLE: {selectedSessionForPrint.numeroControle}</div>
                <div>VENDEDOR: {selectedSessionForPrint.vendedorNome}</div>
                <div>DATA/HORA: {selectedSessionForPrint.dataFechamento}</div>
              </div>

              <div>
                <div className="font-bold uppercase text-[10px] text-slate-500">1. RECEBIMENTOS EM ROTA:</div>
                {selectedSessionForPrint.recebimentos?.length === 0 ? (
                  <div>Nenhum recebimento registrado.</div>
                ) : (
                  selectedSessionForPrint.recebimentos?.map((r: any, idx: number) => (
                    <div key={idx} className="flex justify-between">
                      <span className="truncate max-w-[200px]">{r.clienteNome.slice(0, 18)} (Doc {r.numeroDocumento})</span>
                      <span>R$ {r.valorRecebido.toFixed(2)}</span>
                    </div>
                  ))
                )}
                <div className="flex justify-between font-bold pt-1 border-t border-dashed border-slate-300">
                  <span>TOTAL RECEBIDO:</span>
                  <span>R$ {selectedSessionForPrint.totalRecebido.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-1">
                <div className="font-bold uppercase text-[10px] text-slate-500">2. DESPESAS COMPROVADAS:</div>
                {selectedSessionForPrint.despesas?.length === 0 ? (
                  <div>Nenhuma despesa lançada.</div>
                ) : (
                  selectedSessionForPrint.despesas?.map((d: any, idx: number) => (
                    <div key={idx} className="flex justify-between">
                      <span className="truncate max-w-[200px]">{d.tipo}: {d.descricao || ''}</span>
                      <span>- R$ {d.valor.toFixed(2)}</span>
                    </div>
                  ))
                )}
                <div className="flex justify-between font-bold pt-1 border-t border-dashed border-slate-300">
                  <span>TOTAL DESPESAS:</span>
                  <span>- R$ {selectedSessionForPrint.totalDespesas.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-2 border-t-2 border-slate-400 flex justify-between text-xs font-black">
                <span>SALDO LÍQUIDO A ENTREGAR:</span>
                <span className="text-blue-700">R$ {selectedSessionForPrint.saldoEntregar.toFixed(2)}</span>
              </div>

              <div className="pt-4 text-center border-t border-dashed border-slate-300 space-y-4">
                <div>
                  <div className="border-b border-slate-400 w-48 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-500">Assinatura do Vendedor</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 w-48 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-500">Assinatura do Caixa / Financeiro</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Meia Folha A4</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
