import React, { useState } from 'react';
import { useSales } from '../context/SalesContext';
import { Visit } from '../types';
import {
  X,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Camera,
  ShoppingCart,
  MessageCircle,
  FileText,
  Building2,
  DollarSign
} from 'lucide-react';

interface VisitCheckInModalProps {
  visitId: string;
  onClose: () => void;
}

export const VisitCheckInModal: React.FC<VisitCheckInModalProps> = ({ visitId, onClose }) => {
  const { visits, completeVisit, clients, startNewOrderForClient, showToast } = useSales();

  const visit = visits.find((v) => v.id === visitId);
  if (!visit) return null;

  const [notes, setNotes] = useState(visit.notasVisita || '');
  const [outcome, setOutcome] = useState<'venda' | 'nao_venda' | 'acompanhamento'>('venda');
  const [reasonNotSold, setReasonNotSold] = useState('Estoque do cliente ainda suficiente');

  const client = clients.find((c) => c.id === visit.clienteId);

  const handleFinishVisit = () => {
    completeVisit(
      visit.id,
      notes,
      outcome === 'nao_venda' ? reasonNotSold : undefined,
      visit.pedidoGeradoId,
      visit.pedidoGeradoValor
    );
    onClose();
  };

  const handleCreateOrderNow = () => {
    if (client) {
      startNewOrderForClient(client);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">{visit.clienteFantasia}</h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/40">
                  Ordem {visit.ordemRota}
                </span>
              </div>
              <p className="text-xs text-slate-400">Check-in registrado às {visit.checkInHora || '10:00'}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* Cliente Resumo */}
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 space-y-1">
            <p className="text-slate-300">📍 {visit.clienteEndereco}</p>
            <p className="text-slate-400">Telefone/WhatsApp: {visit.clienteTelefone}</p>
          </div>

          {/* Resultado da Visita */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-300">
              Desfecho do Atendimento no Cliente:
            </label>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'venda', label: 'Venda Realizada', icon: ShoppingCart, color: 'text-emerald-400' },
                { id: 'nao_venda', label: 'Não Venda', icon: AlertCircle, color: 'text-amber-400' },
                { id: 'acompanhamento', label: 'Visita Institucional', icon: CheckCircle2, color: 'text-blue-400' },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = outcome === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setOutcome(item.id as any)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${item.color}`} />
                    <span className="text-xs">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Motivo de Não Venda se aplicável */}
          {outcome === 'nao_venda' && (
            <div className="space-y-1.5 p-3.5 bg-amber-950/20 rounded-xl border border-amber-900/50">
              <label className="block font-bold text-amber-300">Motivo Principal de Não Venda:</label>
              <select
                value={reasonNotSold}
                onChange={(e) => setReasonNotSold(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2"
              >
                <option value="Estoque do cliente ainda suficiente">Estoque do cliente ainda alto / suficiente</option>
                <option value="Preço do concorrente mais agressivo">Preço do concorrente mais agressivo</option>
                <option value="Proprietário / Comprador ausente">Proprietário / Comprador ausente</option>
                <option value="Cliente com restrição financeira / crédito">Cliente sem crédito / título em aberto</option>
                <option value="Falta do produto desejado no mix">Falta do produto desejado no mix</option>
                <option value="Estabelecimento fechado temporariamente">Estabelecimento fechado</option>
              </select>
            </div>
          )}

          {/* Se Venda - Ação Rápida */}
          {outcome === 'venda' && (
            <div className="p-3.5 bg-emerald-950/20 rounded-xl border border-emerald-900/50 flex items-center justify-between gap-3">
              <div>
                <h5 className="font-bold text-emerald-300 text-xs">Emitir Pedido Vinculado</h5>
                <p className="text-[11px] text-emerald-400/80">Abra o catálogo com os preços da tabela deste cliente.</p>
              </div>
              <button
                type="button"
                onClick={handleCreateOrderNow}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors shrink-0"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Abrir Carrinho</span>
              </button>
            </div>
          )}

          {/* Notas da Visita / PDV */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              Anotações da Negociação / Observações do Ponto de Venda (PDV):
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Cliente elogiou a entrega anterior, pediu para trazer amostras de cafés na próxima visita..."
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={handleFinishVisit}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-700/20 flex items-center gap-1.5 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Concluir Check-out da Visita</span>
          </button>
        </div>

      </div>
    </div>
  );
};
