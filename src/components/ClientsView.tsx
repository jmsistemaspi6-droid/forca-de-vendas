import React, { useState } from 'react';
import { useSales } from '../context/SalesContext';
import { Client, ClientTier, ClientStatus } from '../types';
import {
  Users,
  Search,
  PlusCircle,
  Phone,
  MessageCircle,
  MapPin,
  Building2,
  Calendar,
  CreditCard,
  ShoppingCart,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  Edit3
} from 'lucide-react';
import { ClientDetailModal } from './ClientDetailModal';
import { NewClientModal } from './NewClientModal';
import { EditClientModal } from './EditClientModal';
import { VoiceSearchButton } from './common/VoiceSearchButton';

export const ClientsView: React.FC = () => {
  const {
    clients,
    selectedClientId,
    setSelectedClientId,
    startNewOrderForClient,
    setActiveTab
  } = useSales();

  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const filteredClients = clients.filter((c) => {
    const sTerm = (search || '').toLowerCase();
    const nomeFantasia = String(c.nomeFantasia || '').toLowerCase();
    const razaoSocial = String(c.razaoSocial || '').toLowerCase();
    const doc = String(c.cnpjCpf || '');
    const cidade = String(c.endereco?.cidade || (c as any).cidade || '').toLowerCase();
    const contato = String(c.contatoPrincipal || '').toLowerCase();

    const matchesSearch =
      !sTerm ||
      nomeFantasia.includes(sTerm) ||
      razaoSocial.includes(sTerm) ||
      doc.includes(search) ||
      cidade.includes(sTerm) ||
      contato.includes(sTerm);

    const matchesTier = tierFilter === 'all' || c.pontuacaoABC === tierFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'inativo_30' ? c.diasSemComprar >= 30 : c.status === statusFilter);

    return matchesSearch && matchesTier && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight">Carteira de Clientes</h2>
          <p className="text-xs text-slate-400">
            Gerencie limites de crédito, histórico de pedidos e positividade da sua rota
          </p>
        </div>

        <button
          onClick={() => setShowNewClientModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-700/20 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Cadastrar Cliente</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por Fantasia, Razão Social, CNPJ, Cidade ou Contato..."
              className="w-full bg-slate-800 text-xs text-slate-200 rounded-xl pl-10 pr-10 py-2.5 border border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <VoiceSearchButton
                size="sm"
                onTranscript={(t) => setSearch(t)}
                placeholderHint="Fale o nome do cliente ou cidade..."
              />
            </div>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'ativo', label: 'Ativos' },
              { id: 'inativo_30', label: 'Sem Compras (+30d)' },
              { id: 'bloqueado', label: 'Bloqueados' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                }`}
              >
                {tab.label}
              </button>
            ))}

            {/* Curva ABC Selector */}
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-2"
            >
              <option value="all">Todas as Curvas (A, B, C)</option>
              <option value="A">Curva A (Alto Volume)</option>
              <option value="B">Curva B (Médio)</option>
              <option value="C">Curva C (Pequeno)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
          <span>{filteredClients.length} de {clients.length} clientes na carteira</span>
          <button
            onClick={() => setShowNewClientModal(true)}
            className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Cadastrar Novo Cliente</span>
          </button>
        </div>
      </div>

      {/* Grid of Client Cards or Empty Search State */}
      {filteredClients.length === 0 ? (
        <div className="bg-slate-900 rounded-2xl p-8 border border-dashed border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">
              {search ? `Nenhum cliente encontrado para "${search}"` : 'Nenhum cliente com estes filtros'}
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Deseja cadastrar um novo cliente na sua carteira com preenchimento ágil via Receita Federal e CEP?
            </p>
          </div>
          <button
            onClick={() => setShowNewClientModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-700/20 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Cadastrar {search ? `"${search}"` : 'Novo Cliente'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
          const availableCredit = Math.max(0, client.limiteCredito - client.creditoUtilizado);
          const creditPercent = (client.creditoUtilizado / client.limiteCredito) * 100;
          const isInactive = client.diasSemComprar >= 30;
          const isBlocked = client.status === 'bloqueado';

          return (
            <div
              key={client.id}
              className={`bg-slate-900 rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between space-y-4 hover:border-slate-600 ${
                isBlocked
                  ? 'border-rose-900/60 bg-rose-950/10'
                  : isInactive
                  ? 'border-amber-900/50 bg-amber-950/10'
                  : 'border-slate-800'
              }`}
            >
              <div className="space-y-2">
                {/* Header with Curva ABC badge and Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        Curva {client.pontuacaoABC}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        client.status === 'ativo' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {client.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-white mt-1 leading-snug line-clamp-1">
                      {client.nomeFantasia}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-1">{client.razaoSocial}</p>
                  </div>
                </div>

                {/* Address & CNPJ */}
                <div className="text-xs text-slate-400 space-y-0.5 pt-1">
                  <p className="font-mono text-[11px] text-slate-400">CNPJ: {client.cnpjCpf}</p>
                  <p className="flex items-center gap-1 text-[11px] text-slate-300">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{client.endereco.bairro}, {client.endereco.cidade} - {client.endereco.uf}</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Contato: <strong className="text-slate-300">{client.contatoPrincipal}</strong>
                  </p>
                </div>

                {/* Credit Limit Gauge */}
                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span>Crédito Disponível:</span>
                    <span className="font-bold text-emerald-400">
                      R$ {availableCredit.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${creditPercent > 80 ? 'bg-rose-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(100, creditPercent)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Limite: R$ {client.limiteCredito.toLocaleString('pt-BR')}</span>
                    <span className={isInactive ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
                      {client.diasSemComprar === 0 ? 'Comprou recentemente' : `${client.diasSemComprar}d sem comprar`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Action Buttons */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1">
                  <a
                    href={`https://wa.me/55${client.whatsapp}?text=Ol%C3%A1%20${encodeURIComponent(client.contatoPrincipal)}%2C%20tudo%20bem%3F`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900/80 transition-colors"
                    title="Chamar no WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>

                  <a
                    href={`tel:${client.telefone}`}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Ligar"
                  >
                    <Phone className="w-4 h-4 text-blue-400" />
                  </a>

                  <button
                    onClick={() => setEditingClient(client)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition-colors"
                    title="Editar dados cadastrais do cliente"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedClientId(client.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    Ficha 360º
                  </button>

                  <button
                    onClick={() => startNewOrderForClient(client)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1"
                  >
                    <ShoppingCart className="w-3 h-3" />
                    <span>Vender</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Modal da Ficha 360 do Cliente */}
      {selectedClientId && (
        <ClientDetailModal
          clientId={selectedClientId}
          onClose={() => setSelectedClientId(null)}
        />
      )}

      {/* Modal de Novo Cliente */}
      {showNewClientModal && (
        <NewClientModal
          onClose={() => setShowNewClientModal(false)}
          initialSearch={search}
        />
      )}

      {/* Modal de Edição de Cliente */}
      {editingClient && (
        <EditClientModal
          client={editingClient}
          onClose={() => setEditingClient(null)}
        />
      )}

    </div>
  );
};
