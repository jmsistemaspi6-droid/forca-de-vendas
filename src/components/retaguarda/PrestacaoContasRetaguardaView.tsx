import React, { useState, useMemo } from 'react';
import { useSales } from '../../context/SalesContext';
import {
  Receipt,
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
  Search,
  Filter,
  Eye,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { AccountabilitySession } from '../../types';

export const PrestacaoContasRetaguardaView: React.FC = () => {
  const {
    accountabilitySessions,
    approveAccountabilitySession,
    rejectAccountabilitySession,
    currentUser,
    users,
    showToast,
  } = useSales();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'fechada_vendedor' | 'aprovada_retaguarda' | 'rejeitada'>('todos');
  const [selectedSession, setSelectedSession] = useState<AccountabilitySession | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedVendedorFilter, setSelectedVendedorFilter] = useState<string>('todos');

  // Vendedores únicos da lista de prestações
  const vendedoresList = useMemo(() => {
    const set = new Set<string>();
    accountabilitySessions.forEach((s) => set.add(s.vendedorNome));
    return Array.from(set);
  }, [accountabilitySessions]);

  // Prestações filtradas
  const filteredSessions = useMemo(() => {
    return accountabilitySessions.filter((s) => {
      const matchSearch =
        !searchTerm ||
        s.numeroControle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.vendedorNome.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'todos' ? true : s.status === statusFilter;

      const matchVendedor =
        selectedVendedorFilter === 'todos' ? true : s.vendedorNome === selectedVendedorFilter;

      return matchSearch && matchStatus && matchVendedor;
    });
  }, [accountabilitySessions, searchTerm, statusFilter, selectedVendedorFilter]);

  // Estatísticas do Topo
  const totalPendenteAprovacao = useMemo(() => {
    return accountabilitySessions
      .filter((s) => s.status === 'fechada_vendedor')
      .reduce((acc, s) => acc + s.saldoEntregar, 0);
  }, [accountabilitySessions]);

  const totalAprovado = useMemo(() => {
    return accountabilitySessions
      .filter((s) => s.status === 'aprovada_retaguarda')
      .reduce((acc, s) => acc + s.saldoEntregar, 0);
  }, [accountabilitySessions]);

  const countPendentes = accountabilitySessions.filter((s) => s.status === 'fechada_vendedor').length;

  const handleAprovar = (s: AccountabilitySession) => {
    approveAccountabilitySession(s.id, currentUser?.nome || 'Gestor Financeiro');
    if (selectedSession && selectedSession.id === s.id) {
      setSelectedSession({
        ...selectedSession,
        status: 'aprovada_retaguarda',
        aprovadoPor: currentUser?.nome || 'Gestor Financeiro',
        aprovadoEm: new Date().toLocaleString('pt-BR'),
      });
    }
  };

  const handleRejeitar = (s: AccountabilitySession) => {
    const motivo = prompt('Informe o motivo da devolução da prestação de contas:') || 'Inconsistência nos valores ou comprovantes.';
    rejectAccountabilitySession(s.id, motivo);
    if (selectedSession && selectedSession.id === s.id) {
      setSelectedSession({
        ...selectedSession,
        status: 'rejeitada',
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* 🌟 1. CABEÇALHO & CARDS DE AUDITORIA 🌟 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Pendente de Auditoria */}
        <div className="p-4 rounded-xl bg-slate-900 border border-amber-900/60 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Pendentes de Auditoria ({countPendentes})
            </span>
            <div className="text-xl font-bold text-amber-400 mt-1 font-mono">
              R$ {totalPendenteAprovacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Aguardando conferência do caixa
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-950/80 border border-amber-800 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Prestações Aprovadas */}
        <div className="p-4 rounded-xl bg-slate-900 border border-emerald-900/60 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Prestações Homologadas & Baixadas
            </span>
            <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">
              R$ {totalAprovado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Valores conferidos e baixados no ERP
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Total de Prestações */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
              Total de Sessões Registradas
            </span>
            <div className="text-xl font-bold text-blue-400 mt-1 font-mono">
              {accountabilitySessions.length} sessões
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Controle financeiro da equipe externa
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-950/80 border border-blue-800 flex items-center justify-center text-blue-400">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 🌟 2. BARRA DE CONTROLE: BUSCA E FILTROS 🌟 */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="w-full lg:w-72 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nº Controle, Vendedor..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Filtro por Vendedor */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <span className="text-xs text-slate-400 shrink-0">Vendedor:</span>
          <select
            value={selectedVendedorFilter}
            onChange={(e) => setSelectedVendedorFilter(e.target.value)}
            className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-semibold focus:outline-none focus:border-amber-500"
          >
            <option value="todos">Todos os Vendedores</option>
            {vendedoresList.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Status */}
        <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
          {[
            { id: 'todos', label: 'Todas' },
            { id: 'fechada_vendedor', label: '⚡ Pendentes' },
            { id: 'aprovada_retaguarda', label: '✓ Aprovadas' },
            { id: 'rejeitada', label: '✕ Rejeitadas' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === tab.id
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 🌟 3. TABELA DE AUDITORIA DE PRESTAÇÕES DE CONTAS 🌟 */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-400" />
            <span>Auditoria e Homologação de Prestações de Contas</span>
          </h3>
          <span className="text-xs text-slate-400">
            {filteredSessions.length} registro(s) encontrado(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[900px]">
            <thead className="bg-slate-950/80 text-slate-300 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Nº Controle</th>
                <th className="p-3.5">Vendedor / Responsável</th>
                <th className="p-3.5">Data Fechamento</th>
                <th className="p-3.5 text-right text-emerald-400">Total Recebido</th>
                <th className="p-3.5 text-right text-rose-400">Despesas Abatidas</th>
                <th className="p-3.5 text-right text-amber-400 font-bold">Saldo a Entregar</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Nenhuma prestação de contas encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => {
                  const isPendente = session.status === 'fechada_vendedor';
                  const isAprovada = session.status === 'aprovada_retaguarda';

                  return (
                    <tr key={session.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Nº Controle */}
                      <td className="p-3.5 font-mono font-bold text-slate-100">
                        {session.numeroControle}
                      </td>

                      {/* Vendedor */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-200">{session.vendedorNome}</div>
                        <div className="text-[10px] text-slate-400">
                          {session.recebimentos?.length || 0} título(s) • {session.despesas?.length || 0} despesa(s)
                        </div>
                      </td>

                      {/* Data Fechamento */}
                      <td className="p-3.5 text-slate-300">
                        {session.dataFechamento}
                      </td>

                      {/* Total Recebido */}
                      <td className="p-3.5 text-right font-mono text-emerald-400 font-bold">
                        R$ {session.totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Despesas */}
                      <td className="p-3.5 text-right font-mono text-rose-400 font-bold">
                        - R$ {session.totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Saldo a Entregar */}
                      <td className="p-3.5 text-right font-mono text-amber-400 font-black text-sm">
                        R$ {session.saldoEntregar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            isAprovada
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                              : session.status === 'rejeitada'
                              ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                              : 'bg-amber-950/80 text-amber-300 border-amber-800 animate-pulse'
                          }`}
                        >
                          {isAprovada
                            ? '✓ Aprovada'
                            : session.status === 'rejeitada'
                            ? '✕ Devolvida'
                            : '⚡ Pendente Auditoria'}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Visualizar / Detalhar */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSession(session);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                            title="Ver Extrato & Comprovantes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Imprimir Meia Folha */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSession(session);
                              setIsPrintModalOpen(true);
                            }}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg transition-colors"
                            title="Imprimir Meia Folha Carbonada"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Aprovar Direto */}
                          {isPendente && (
                            <button
                              type="button"
                              onClick={() => handleAprovar(session)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                              title="Aprovar e Baixar no Contas a Receber"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Aprovar</span>
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

      {/* 🌟 MODAL: DETALHES E AUDITORIA DA PRESTAÇÃO 🌟 */}
      {isDetailModalOpen && selectedSession && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-800 max-h-[90vh] overflow-y-auto text-xs text-slate-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-400" />
                  <h3 className="font-black text-slate-100 text-base">
                    Auditoria de Prestação: {selectedSession.numeroControle}
                  </h3>
                </div>
                <p className="text-slate-400 mt-0.5">
                  Vendedor: <span className="font-bold text-slate-200">{selectedSession.vendedorNome}</span> • Fechado em: {selectedSession.dataFechamento}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumo Financeiro da Sessão */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center font-mono">
              <div>
                <span className="text-[10px] text-emerald-400 uppercase font-bold">Total Recebido</span>
                <div className="text-base font-bold text-emerald-400">
                  R$ {selectedSession.totalRecebido.toFixed(2)}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-rose-400 uppercase font-bold">Despesas</span>
                <div className="text-base font-bold text-rose-400">
                  - R$ {selectedSession.totalDespesas.toFixed(2)}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-amber-400 uppercase font-bold">Saldo a Entregar</span>
                <div className="text-base font-bold text-amber-400">
                  R$ {selectedSession.saldoEntregar.toFixed(2)}
                </div>
              </div>
            </div>

            {/* 1. Recebimentos */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-200 uppercase text-[11px] tracking-wider">
                1. Recebimentos do Vendedor em Rota ({selectedSession.recebimentos?.length || 0})
              </h4>
              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 divide-y divide-slate-800/80">
                {selectedSession.recebimentos?.map((r, idx) => (
                  <div key={idx} className="py-2 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-200">{r.clienteNome}</div>
                      <div className="text-[10px] text-slate-400">
                        Doc: {r.numeroDocumento} • Forma: {r.forma} • Tipo: {r.tipo}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-emerald-400">
                      R$ {r.valorRecebido.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Despesas & Comprovantes */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-200 uppercase text-[11px] tracking-wider">
                2. Despesas & Comprovantes de Viagem ({selectedSession.despesas?.length || 0})
              </h4>
              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 divide-y divide-slate-800/80">
                {selectedSession.despesas?.length === 0 ? (
                  <div className="text-slate-500 py-2">Nenhuma despesa lançada nesta sessão.</div>
                ) : (
                  selectedSession.despesas?.map((d, idx) => (
                    <div key={idx} className="py-2 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-200">{d.tipo}</div>
                        <div className="text-[10px] text-slate-400">
                          {d.descricao || 'Sem descrição'} • {d.origemPagamento}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {d.comprovanteUrl && (
                          <a
                            href={d.comprovanteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-0.5 bg-blue-900/60 text-blue-300 rounded border border-blue-700 text-[10px] font-bold"
                          >
                            Ver Foto
                          </a>
                        )}
                        <span className="font-mono font-bold text-rose-400">
                          - R$ {d.valor.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Observações */}
            {selectedSession.observacoes && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Observações:
                </span>
                <p className="text-slate-300 italic">{selectedSession.observacoes}</p>
              </div>
            )}

            {/* Status & Auditoria */}
            {selectedSession.aprovadoPor && (
              <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-800/60 text-emerald-300 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Auditado e aprovado por <strong>{selectedSession.aprovadoPor}</strong> em {selectedSession.aprovadoEm}.
                </span>
              </div>
            )}

            {/* Botões do Rodapé */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setIsPrintModalOpen(true);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Meia Folha</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedSession.status === 'fechada_vendedor' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleRejeitar(selectedSession)}
                      className="px-4 py-2 bg-rose-900/60 hover:bg-rose-900 text-rose-300 border border-rose-700 rounded-xl text-xs font-bold transition-colors"
                    >
                      Devolver / Rejeitar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAprovar(selectedSession)}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950 transition-all"
                    >
                      Aprovar & Homologar Baixas
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 MODAL: IMPRESSÃO MEIA FOLHA CARBONADA 🌟 */}
      {isPrintModalOpen && selectedSession && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
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
                <div>CONTROLE: {selectedSession.numeroControle}</div>
                <div>VENDEDOR: {selectedSession.vendedorNome}</div>
                <div>DATA/HORA: {selectedSession.dataFechamento}</div>
              </div>

              <div>
                <div className="font-bold uppercase text-[10px] text-slate-500">1. RECEBIMENTOS EM ROTA:</div>
                {selectedSession.recebimentos?.length === 0 ? (
                  <div>Nenhum recebimento registrado.</div>
                ) : (
                  selectedSession.recebimentos?.map((r, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="truncate max-w-[200px]">{r.clienteNome.slice(0, 18)} (Doc {r.numeroDocumento})</span>
                      <span>R$ {r.valorRecebido.toFixed(2)}</span>
                    </div>
                  ))
                )}
                <div className="flex justify-between font-bold pt-1 border-t border-dashed border-slate-300">
                  <span>TOTAL RECEBIDO:</span>
                  <span>R$ {selectedSession.totalRecebido.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-1">
                <div className="font-bold uppercase text-[10px] text-slate-500">2. DESPESAS COMPROVADAS:</div>
                {selectedSession.despesas?.length === 0 ? (
                  <div>Nenhuma despesa lançada.</div>
                ) : (
                  selectedSession.despesas?.map((d, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="truncate max-w-[200px]">{d.tipo}: {d.descricao || ''}</span>
                      <span>- R$ {d.valor.toFixed(2)}</span>
                    </div>
                  ))
                )}
                <div className="flex justify-between font-bold pt-1 border-t border-dashed border-slate-300">
                  <span>TOTAL DESPESAS:</span>
                  <span>- R$ {selectedSession.totalDespesas.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-2 border-t-2 border-slate-400 flex justify-between text-xs font-black">
                <span>SALDO LÍQUIDO A ENTREGAR:</span>
                <span className="text-blue-700">R$ {selectedSession.saldoEntregar.toFixed(2)}</span>
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
