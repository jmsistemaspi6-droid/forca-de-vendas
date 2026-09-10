import React, { useState } from 'react';
import { useSales } from '../context/SalesContext';
import { Visit } from '../types';
import {
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Phone,
  MessageCircle,
  Calendar,
  Navigation,
  ShoppingCart,
  ChevronRight,
  Route,
  UserCheck
} from 'lucide-react';
import { VisitCheckInModal } from './VisitCheckInModal';

export const VisitsView: React.FC = () => {
  const {
    visits,
    startVisit,
    clients,
    startNewOrderForClient,
    addVisit
  } = useSales();

  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('2026-08-28');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // New Visit modal form states
  const [selectedClientForNewVisit, setSelectedClientForNewVisit] = useState(clients[0]?.id || '');
  const [newVisitTime, setNewVisitTime] = useState('11:00');
  const [newVisitDate, setNewVisitDate] = useState('2026-08-28');
  const [newVisitType, setNewVisitType] = useState<'rotina' | 'cobranca' | 'prospeccao'>('rotina');
  const [newVisitNotes, setNewVisitNotes] = useState('');

  const filteredVisits = visits.filter((v) => v.dataAgendada === dateFilter);
  const completedVisits = filteredVisits.filter((v) => v.status === 'realizada');

  const handleOpenGoogleMaps = (address: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
  };

  const handleCreateVisit = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === selectedClientForNewVisit);
    if (!client) return;

    addVisit({
      clienteId: client.id,
      clienteNome: client.razaoSocial,
      clienteFantasia: client.nomeFantasia,
      clienteEndereco: `${client.endereco.rua}, ${client.endereco.numero} - ${client.endereco.bairro}`,
      clienteCidade: `${client.endereco.cidade} - ${client.endereco.uf}`,
      clienteTelefone: client.telefone,
      clienteWhatsapp: client.whatsapp,
      dataAgendada: newVisitDate,
      horario: newVisitTime,
      ordemRota: filteredVisits.length + 1,
      status: 'agendada',
      tipoVisita: newVisitType,
      notasVisita: newVisitNotes || undefined,
    });

    setShowScheduleModal(false);
    setNewVisitNotes('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight">Roteiro de Visitas em Campo</h2>
          <p className="text-xs text-slate-400">
            Organização sequencial da rota de clientes, registro de check-in e geolocalização
          </p>
        </div>

        <button
          onClick={() => setShowScheduleModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-700/20 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Agendar Nova Visita</span>
        </button>
      </div>

      {/* Rota Progress and Map Indicator */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950/60 rounded-2xl p-5 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Progresso da Rota Diária</h3>
              <p className="text-xs text-slate-400">
                {completedVisits.length} de {filteredVisits.length} clientes atendidos hoje
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-700"
            style={{
              width: `${filteredVisits.length > 0 ? (completedVisits.length / filteredVisits.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Visits List */}
      <div className="space-y-3">
        {filteredVisits.length === 0 ? (
          <div className="bg-slate-900 rounded-2xl p-12 border border-slate-800 text-center space-y-3">
            <Calendar className="w-12 h-12 mx-auto text-slate-600" />
            <h4 className="text-sm font-bold text-slate-300">Nenhuma visita agendada para esta data</h4>
            <p className="text-xs text-slate-400">Clique em "+ Agendar Nova Visita" para planejar seu roteiro.</p>
          </div>
        ) : (
          filteredVisits.map((visit) => {
            const isOngoing = visit.status === 'em_andamento';
            const isDone = visit.status === 'realizada';
            const isPending = visit.status === 'agendada';

            return (
              <div
                key={visit.id}
                className={`bg-slate-900 rounded-2xl p-4 sm:p-5 border transition-all ${
                  isOngoing
                    ? 'border-blue-500 bg-blue-950/20 shadow-lg shadow-blue-950/40'
                    : isDone
                    ? 'border-slate-800 opacity-80'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left: Sequence + Client Info */}
                  <div className="flex items-start gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 mt-0.5 ${
                      isDone
                        ? 'bg-emerald-500 text-slate-950'
                        : isOngoing
                        ? 'bg-blue-600 text-white animate-pulse'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {isDone ? '✓' : `#${visit.ordemRota}`}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-white">{visit.clienteFantasia}</h4>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {visit.horario}
                        </span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          visit.tipoVisita === 'cobranca' ? 'bg-rose-500/20 text-rose-300' : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {visit.tipoVisita}
                        </span>
                        {isOngoing && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/40 animate-pulse">
                            EM ANDAMENTO
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{visit.clienteEndereco} - {visit.clienteCidade}</span>
                      </p>

                      {visit.notasVisita && (
                        <p className="text-xs text-slate-400 bg-slate-800/60 p-2 rounded-lg border border-slate-700/50 mt-1">
                          📝 {visit.notasVisita}
                        </p>
                      )}

                      {visit.motivoNaoVenda && (
                        <p className="text-xs text-amber-400 font-semibold mt-1">
                          ⚠️ Não venda: {visit.motivoNaoVenda}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2 self-end lg:self-center shrink-0">
                    <button
                      onClick={() => handleOpenGoogleMaps(visit.clienteEndereco)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition-colors"
                      title="Navegar no Waze / Maps"
                    >
                      <Navigation className="w-3.5 h-3.5 text-amber-400" />
                      <span>GPS</span>
                    </button>

                    <a
                      href={`https://wa.me/55${visit.clienteWhatsapp}?text=Ol%C3%A1%2C%20estou%20a%20caminho%20da%20sua%20loja%20para%20nossa%20visita.`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 transition-colors"
                      title="Avisar no WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>

                    {isPending && (
                      <button
                        onClick={() => startVisit(visit.id)}
                        className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Fazer Check-in</span>
                      </button>
                    )}

                    {isOngoing && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            const cli = clients.find((c) => c.id === visit.clienteId);
                            if (cli) startNewOrderForClient(cli);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Emitir Pedido</span>
                        </button>

                        <button
                          onClick={() => setSelectedVisitId(visit.id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Finalizar Check-out</span>
                        </button>
                      </div>
                    )}

                    {isDone && (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5 rounded-lg flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Atendimento Concluído</span>
                      </span>
                    )}
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Check-out */}
      {selectedVisitId && (
        <VisitCheckInModal
          visitId={selectedVisitId}
          onClose={() => setSelectedVisitId(null)}
        />
      )}

      {/* Modal de Agendamento de Nova Visita */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-100">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-white">Agendar Visita Comercial</h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVisit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Cliente da Carteira:</label>
                <select
                  value={selectedClientForNewVisit}
                  onChange={(e) => setSelectedClientForNewVisit(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nomeFantasia} ({c.endereco.cidade} - {c.endereco.bairro})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Data:</label>
                  <input
                    type="date"
                    value={newVisitDate}
                    onChange={(e) => setNewVisitDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Horário Previsto:</label>
                  <input
                    type="time"
                    value={newVisitTime}
                    onChange={(e) => setNewVisitTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Objetivo da Visita:</label>
                <select
                  value={newVisitType}
                  onChange={(e) => setNewVisitType(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                >
                  <option value="rotina">Rotina / Reposição de Estoque</option>
                  <option value="cobranca">Cobrança de Título / Alinhamento Financeiro</option>
                  <option value="prospeccao">Apresentação de Novos Produtos / Reativação</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notas Preparatórias:</label>
                <textarea
                  rows={2}
                  value={newVisitNotes}
                  onChange={(e) => setNewVisitNotes(e.target.value)}
                  placeholder="Ex: Levar amostras de café torrado e negociar prazo especial..."
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
