import React from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownLeft,
  Boxes,
  BarChart3,
  Building,
  ShoppingCart,
  Receipt,
  Smartphone,
  ShieldCheck,
  Users2,
  KeyRound,
  Database,
  LogOut,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { RetaguardaTab } from '../../types';

export const RetaguardaSidebar: React.FC = () => {
  const {
    retaguardaTab,
    setRetaguardaTab,
    setAppMode,
    payableTitles,
    financialTitles,
    accountabilitySessions,
    stockEntries,
    orders,
    logout,
  } = useSales();

  // Badges
  const payablesVencidosCount = payableTitles.filter((t) => t.status === 'vencido').length;
  const receivablesVencidosCount = financialTitles.filter((t) => t.status === 'vencido').length;
  const prestacoesPendentesCount = accountabilitySessions.filter((s) => s.status === 'fechada_vendedor').length;
  const pedidosHojeCount = orders.filter((o) => o.dataCriacao.includes(new Date().toISOString().split('T')[0])).length;

  const navItems: Array<{
    id: RetaguardaTab;
    label: string;
    description: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }> = [
    {
      id: 'dashboard',
      label: 'Painel Geral ERP',
      description: 'Visão 360º de faturamento e finanças',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'entradas_xml',
      label: 'Entrada de Mercadorias',
      description: 'Importação de XML NF-e & Estoque',
      icon: <FileSpreadsheet className="w-5 h-5 text-emerald-400" />,
      badge: stockEntries.length,
      badgeColor: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50',
    },
    {
      id: 'contas_pagar',
      label: 'Contas a Pagar',
      description: 'Despesas, fornecedores & baixas',
      icon: <ArrowUpRight className="w-5 h-5 text-rose-400" />,
      badge: payablesVencidosCount > 0 ? payablesVencidosCount : undefined,
      badgeColor: 'bg-rose-900/80 text-rose-200 border-rose-700',
    },
    {
      id: 'contas_receber',
      label: 'Contas a Receber',
      description: 'Recebimentos do mobile & baixas parciais',
      icon: <ArrowDownLeft className="w-5 h-5 text-emerald-400" />,
      badge: receivablesVencidosCount > 0 ? receivablesVencidosCount : undefined,
      badgeColor: 'bg-amber-900/80 text-amber-200 border-amber-700',
    },
    {
      id: 'prestacao_contas',
      label: 'Prestação de Contas',
      description: 'Auditoria de despesas & acerto dos vendedores',
      icon: <Receipt className="w-5 h-5 text-amber-400" />,
      badge: prestacoesPendentesCount > 0 ? prestacoesPendentesCount : undefined,
      badgeColor: 'bg-amber-900/90 text-amber-300 border-amber-700',
    },
    {
      id: 'estoque_precos',
      label: 'Estoque & Tabela de Preços',
      description: 'Saldos, custos, margens e reposição',
      icon: <Boxes className="w-5 h-5 text-blue-400" />,
    },
    {
      id: 'emitente',
      label: 'Cadastro do Emitente',
      description: 'Empresa emissora & validação fiscal',
      icon: <ShieldCheck className="w-5 h-5 text-cyan-400" />,
    },
    {
      id: 'relatorios',
      label: 'Relatórios Gerenciais & DRE',
      description: 'Vendas, Fluxo de Caixa, Curva ABC',
      icon: <BarChart3 className="w-5 h-5 text-purple-400" />,
    },
    {
      id: 'fornecedores',
      label: 'Cadastro de Fornecedores',
      description: 'Histórico de compras e consultas',
      icon: <Building className="w-5 h-5 text-slate-300" />,
    },
    {
      id: 'usuarios_vendedores',
      label: 'Equipe & Vendedores',
      description: 'Logins, senhas e comissões da equipe',
      icon: <Users2 className="w-5 h-5 text-indigo-400" />,
    },
    {
      id: 'pedidos_vendas',
      label: 'Pedidos de Venda',
      description: 'Auditoria dos pedidos do app móvel',
      icon: <ShoppingCart className="w-5 h-5 text-amber-400" />,
      badge: pedidosHojeCount > 0 ? pedidosHojeCount : undefined,
      badgeColor: 'bg-blue-900/60 text-blue-300 border-blue-700/50',
    },
    {
      id: 'migracao_backup',
      label: 'Migração & Backups',
      description: 'Carga Clipper, JSON e exportações CSV',
      icon: <Database className="w-5 h-5 text-indigo-400" />,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-screen">
      {/* Navigation list */}
      <div className="p-3 space-y-1 flex-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Módulos da Retaguarda
        </div>

        {navItems.map((item) => {
          const isActive = retaguardaTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-retaguarda-${item.id}`}
              onClick={() => setRetaguardaTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`${isActive ? 'text-blue-400' : 'text-slate-400'}`}>
                  {item.icon}
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold truncate leading-tight">
                    {item.label}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {item.description}
                  </div>
                </div>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full border shrink-0 ${
                    item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Switch to Mobile Sales Force in Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-2">
        <button
          id="btn-switch-to-mobile-sidebar"
          onClick={() => setAppMode('mobile')}
          className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-semibold shadow-md shadow-emerald-950/50 transition-all cursor-pointer"
        >
          <Smartphone className="w-4 h-4" />
          <span>Abrir Força de Vendas Mobile</span>
        </button>

        <button
          id="btn-retaguarda-logout"
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/60 text-rose-300 text-xs font-semibold transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sair do Sistema</span>
        </button>

        <p className="text-[10px] text-center text-slate-400 pt-1">
          Sincronizado com vendedores em campo
        </p>
      </div>
    </aside>
  );
};
