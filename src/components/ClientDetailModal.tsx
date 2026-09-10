import React, { useState } from 'react';
import { useSales } from '../context/SalesContext';
import { Client } from '../types';
import {
  X,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Building2,
  Calendar,
  CreditCard,
  ShoppingCart,
  Clock,
  Navigation,
  FileText,
  DollarSign,
  AlertTriangle,
  Plus,
  Edit3
} from 'lucide-react';
import { EditClientModal } from './EditClientModal';

interface ClientDetailModalProps {
  clientId: string;
  onClose: () => void;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({ clientId, onClose }) => {
  const { clients, orders, financialTitles, startNewOrderForClient, addVisit, showToast } = useSales();
  const [isEditing, setIsEditing] = useState(false);

  const client = clients.find((c) => c.id === clientId);
  if (!client) return null;

  const clientOrders = orders.filter((o) => o.clienteId === clientId);
  const clientTitles = financialTitles.filter((t) => t.clienteId === clientId);
  const availableCredit = Math.max(0, client.limiteCredito - client.creditoUtilizado);

  const handleOpenGoogleMaps = () => {
    const query = `${client.endereco.rua}, ${client.endereco.numero} - ${client.endereco.bairro}, ${client.endereco.cidade} - ${client.endereco.uf}`;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
  };

  const handleScheduleVisit = () => {
    addVisit({
      clienteId: client.id,
      clienteNome: client.razaoSocial,
      clienteFantasia: client.nomeFantasia,
      clienteEndereco: `${client.endereco.rua}, ${client.endereco.numero} - ${client.endereco.bairro}`,
      clienteCidade: `${client.endereco.cidade} - ${client.endereco.uf}`,
      clienteTelefone: client.telefone,
      clienteWhatsapp: client.whatsapp,
      dataAgendada: '2026-08-29',
      horario: '14:00',
      ordemRota: 5,
      status: 'agendada',
      tipoVisita: 'rotina',
      notasVisita: 'Visita agendada pela ficha de cliente.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">{client.nomeFantasia}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  client.status === 'ativo' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {client.status}
                </span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700">
                  Curva {client.pontuacaoABC}
                </span>
              </div>
              <p className="text-xs text-slate-400">{client.razaoSocial}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs">
          
          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                startNewOrderForClient(client);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-700/20 transition-all hover:scale-105"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Emitir Novo Pedido</span>
            </button>

            <a
              href={`https://wa.me/55${client.whatsapp}?text=Ol%C3%A1%20${encodeURIComponent(client.contatoPrincipal)}%2C%20tudo%20bem%3F`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-400 font-semibold border border-emerald-800 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>

            <a
              href={`tel:${client.telefone}`}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-blue-400" />
              <span>Ligar</span>
            </a>

            <button
              onClick={handleOpenGoogleMaps}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-amber-400" />
              <span>Traçar Rota GPS</span>
            </button>

            <button
              onClick={handleScheduleVisit}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              <span>Agendar Visita</span>
            </button>

            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 transition-all hover:scale-105 ml-auto"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar Cadastro</span>
            </button>
          </div>

          {/* Cards Grid: Dados Cadastrais & Limite */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Dados Cadastrais & Contato */}
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Informações Cadastrais</span>
              <div className="space-y-1.5 text-slate-300">
                <p><strong className="text-slate-400">CNPJ:</strong> <span className="font-mono">{client.cnpjCpf}</span></p>
                <p><strong className="text-slate-400">Inscrição Estadual:</strong> <span className="font-mono">{client.inscricaoEstadual || 'Isento'}</span></p>
                <p><strong className="text-slate-400">Contato Principal:</strong> {client.contatoPrincipal} ({client.cargoContato || 'Comprador'})</p>
                <p><strong className="text-slate-400">E-mail:</strong> {client.email}</p>
                <p className="flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span>{client.endereco.rua}, {client.endereco.numero} {client.endereco.complemento || ''} - {client.endereco.bairro}, {client.endereco.cidade}/{client.endereco.uf} • CEP {client.endereco.cep}</span>
                </p>
              </div>
            </div>

            {/* Limite de Crédito & Perfil Comercial */}
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Posição Financeira & Crédito</span>
              
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>Limite Concedido:</span>
                  <span className="font-bold text-white">R$ {client.limiteCredito.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Crédito em Utilização:</span>
                  <span className="font-bold text-amber-400">R$ {client.creditoUtilizado.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Saldo Disponível:</span>
                  <span className="font-extrabold text-emerald-400">R$ {availableCredit.toLocaleString('pt-BR')}</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full"
                    style={{ width: `${Math.min(100, (client.creditoUtilizado / client.limiteCredito) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700/60 space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tabela de Preço Vinculada:</span>
                  <span className="font-bold uppercase text-white">{client.tabelaPrecoPadrao}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Prazo Habitual:</span>
                  <span className="font-bold text-white">{client.condicaoPagamentoPadrao}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Dias sem Comprar:</span>
                  <span className={`font-bold ${client.diasSemComprar >= 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {client.diasSemComprar} dias
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Observações / Notas do Vendedor */}
          {client.observacoes && (
            <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Observações Comerciais & Recebimento:</span>
              <p className="text-slate-300 mt-1 leading-relaxed">{client.observacoes}</p>
            </div>
          )}

          {/* Histórico de Pedidos deste Cliente */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Histórico de Pedidos ({clientOrders.length})
            </h4>

            {clientOrders.length === 0 ? (
              <p className="text-slate-500 py-3 text-center">Nenhum pedido registrado para este cliente ainda.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {clientOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3 bg-slate-800/70 rounded-xl border border-slate-700/50 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-400">{ord.numeroPedido}</span>
                        <span className="text-slate-400">{ord.dataCriacao}</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">{ord.itens.length} itens • {ord.condicaoPagamento}</p>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-white text-sm">
                        R$ {ord.valorTotalLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="block text-[10px] uppercase font-bold text-emerald-400">{ord.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Títulos Financeiros em Aberto */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Títulos & Boletos da Carteira ({clientTitles.length})
            </h4>

            {clientTitles.length === 0 ? (
              <p className="text-emerald-400/80 py-2">✓ Cliente sem títulos vencidos ou pendentes de quitação.</p>
            ) : (
              <div className="space-y-2">
                {clientTitles.map((t) => (
                  <div
                    key={t.id}
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      t.status === 'vencido'
                        ? 'bg-rose-950/30 border-rose-900/60 text-rose-200'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">{t.numeroDocumento}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-900/60">
                          Parcela {t.parcela}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">Vencimento: {t.dataVencimento}</p>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-white text-sm">
                        R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className={`block text-[10px] font-extrabold uppercase ${
                        t.status === 'vencido' ? 'text-rose-400' : 'text-amber-400'
                      }`}>
                        {t.status === 'vencido' ? `Vencido (${t.diasAtraso} dias)` : 'A Vencer'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-slate-700 hover:border-amber-500/40 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            <span>Editar Dados do Cliente</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>

      {/* Modal de Edição */}
      {isEditing && (
        <EditClientModal
          client={client}
          onClose={() => setIsEditing(false)}
        />
      )}
    </div>
  );
};
