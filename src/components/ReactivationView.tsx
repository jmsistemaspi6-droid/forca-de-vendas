import React, { useState } from 'react';
import { useSales } from '../context/SalesContext';
import { Client } from '../types';
import {
  Flame,
  Search,
  MessageCircle,
  Calendar,
  PlusCircle,
  TrendingDown,
  Clock,
  Building2,
  Phone,
  ArrowRight,
  Filter,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { VoiceSearchButton } from './common/VoiceSearchButton';
import { ClientDetailModal } from './ClientDetailModal';

export const ReactivationView: React.FC = () => {
  const { clients, selectedClientId, setSelectedClientId, startNewOrderForClient, setActiveTab, showToast } = useSales();
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'A' | 'B' | 'C'>('all');
  const [inactivityThreshold, setInactivityThreshold] = useState<number>(30); // 30, 60, 90 days

  // Clientes considerados em risco ou inativos
  const inactiveClients = clients.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      c.nomeFantasia.toLowerCase().includes(term) ||
      c.razaoSocial.toLowerCase().includes(term) ||
      c.cnpjCpf.includes(term) ||
      c.endereco.cidade.toLowerCase().includes(term);

    const matchesTier = tierFilter === 'all' || c.pontuacaoABC === tierFilter;
    const matchesDays = c.diasSemComprar >= inactivityThreshold || c.status === 'inativo';

    return matchesSearch && matchesTier && matchesDays;
  });

  // Cálculos de Oportunidade
  const totalInativos = inactiveClients.length;
  const potencialEstimado = inactiveClients.reduce((acc, c) => acc + (c.valorUltimaCompra || 1500), 0);
  const curvaAInativos = inactiveClients.filter((c) => c.pontuacaoABC === 'A').length;

  const handleOpenWhatsApp = (c: Client) => {
    const fone = c.whatsapp || c.telefone;
    if (!fone) {
      showToast('Sem Telefone', 'Cliente não possui WhatsApp ou telefone cadastrado.', 'warning');
      return;
    }
    const cleanPhone = fone.replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Olá, ${c.contatoPrincipal || c.nomeFantasia}! Sou da distribuidora. Notei que faz algum tempo desde o nosso último pedido e temos condições especiais de faturamento e lançamentos exclusivos para você hoje. Podemos conversar rapidinho?`
    );
    window.open(`https://wa.me/55${cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 p-5 rounded-2xl border border-amber-800/40 backdrop-blur-sm shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-950/60 font-black">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Oportunidades de Reativação
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-amber-900/60 text-amber-300 border border-amber-700/50">
                Radar Comercial
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Recupere clientes da sua carteira sem compras recentes e turbine sua meta de faturamento
            </p>
          </div>
        </div>

        {/* Resumo de Potencial Adormecido */}
        <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-2.5 rounded-xl border border-amber-900/40 text-xs">
          <div className="text-center px-2">
            <span className="block text-[10px] text-slate-400 uppercase font-semibold">Clientes Parados</span>
            <span className="font-bold text-amber-400 font-mono text-sm">{totalInativos}</span>
          </div>
          <div className="w-[1px] h-6 bg-slate-800" />
          <div className="text-center px-2">
            <span className="block text-[10px] text-slate-400 uppercase font-semibold">Top Curva A</span>
            <span className="font-bold text-rose-400 font-mono text-sm">{curvaAInativos}</span>
          </div>
          <div className="w-[1px] h-6 bg-slate-800" />
          <div className="text-center px-2">
            <span className="block text-[10px] text-slate-400 uppercase font-semibold">Potencial Estimado</span>
            <span className="font-bold text-emerald-400 font-mono text-sm">
              R$ {potencialEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-6 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por razão social, nome fantasia, cidade ou CNPJ..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-20 py-2.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-[11px] text-slate-400 hover:text-slate-200 px-1.5 py-0.5"
              >
                Limpar
              </button>
            )}
            <VoiceSearchButton size="sm" onTranscript={(t) => setSearchTerm(t)} />
          </div>
        </div>

        <div className="md:col-span-3">
          <select
            value={inactivityThreshold}
            onChange={(e) => setInactivityThreshold(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-all"
          >
            <option value={15}>Sem compras há mais de 15 dias</option>
            <option value={30}>Sem compras há mais de 30 dias (Padrão)</option>
            <option value={60}>Sem compras há mais de 60 dias (Crítico)</option>
            <option value={90}>Sem compras há mais de 90 dias (Perdido)</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as any)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-all"
          >
            <option value="all">Todas as Curvas ABC</option>
            <option value="A">⭐ Curva A (Maior Volume Histórico)</option>
            <option value="B">Curva B (Médio Volume)</option>
            <option value="C">Curva C (Pequeno Volume)</option>
          </select>
        </div>
      </div>

      {/* Inactive Clients List */}
      {inactiveClients.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-100">Excelente! Nenhum cliente inativo neste filtro</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Todos os clientes da sua carteira estão comprando com frequência regular ou dentro do prazo selecionado.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {inactiveClients.map((client) => {
            const isTierA = client.pontuacaoABC === 'A';
            const isCriticallyLate = client.diasSemComprar >= 60;

            return (
              <div
                key={client.id}
                className={`bg-slate-900 border rounded-2xl p-4 transition-all hover:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isTierA
                    ? 'border-amber-600/40 hover:border-amber-500 bg-gradient-to-r from-amber-950/15 via-slate-900 to-slate-900'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Client Info */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        client.pontuacaoABC === 'A'
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : client.pontuacaoABC === 'B'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      CURVA {client.pontuacaoABC}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 font-mono ${
                        isCriticallyLate
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                          : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {client.diasSemComprar} dias sem comprar
                    </span>

                    <span className="text-[11px] text-slate-400 font-mono">
                      Doc: {client.cnpjCpf}
                    </span>
                  </div>

                  <h3
                    onClick={() => setSelectedClientId(client.id)}
                    className="text-sm font-bold text-slate-100 hover:text-amber-400 cursor-pointer transition-colors"
                  >
                    {client.nomeFantasia || client.razaoSocial}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                    <span>{client.endereco.cidade}/{client.endereco.uf}</span>
                    <span>•</span>
                    <span>Contato: <strong className="text-slate-300">{client.contatoPrincipal || 'Gerente de Compras'}</strong></span>
                    <span>•</span>
                    <span>
                      Última compra: <strong className="text-slate-300">{client.dataUltimaCompra || 'Há mais de 30 dias'}</strong> (R$ {(client.valorUltimaCompra || 0).toFixed(2)})
                    </span>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => handleOpenWhatsApp(client)}
                    className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                    title="Chamar cliente no WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      startNewOrderForClient(client);
                      setActiveTab('novo_pedido');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-950/50 transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Reativar Pedido</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Detalhes do Cliente */}
      {selectedClientId && (
        <ClientDetailModal
          clientId={selectedClientId}
          isOpen={Boolean(selectedClientId)}
          onClose={() => setSelectedClientId(null)}
        />
      )}
    </div>
  );
};
