import React from 'react';
import { useSales, ActiveTab } from '../context/SalesContext';
import { BrandLogo } from './common/BrandLogo';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Users,
  PackageSearch,
  MapPin,
  Flame,
  Sparkles,
  BarChart3,
  BadgeDollarSign,
  ChevronRight,
  X,
  Building2,
  Phone,
  ShieldCheck,
  Search,
  LogOut,
  Lock,
} from 'lucide-react';

interface NavItem {
  id: ActiveTab;
  label: string;
  subLabel?: string;
  icon: React.ElementType;
  badge?: number | string;
  badgeColor?: string;
  highlight?: boolean;
}

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onCloseMobile }) => {
  const { activeTab, setActiveTab, orders, visits, draftOrder, financialTitles, clients, products, setAppMode, logout } = useSales();

  const pendingVisits = visits.filter((v) => v.status === 'agendada' || v.status === 'em_andamento').length;
  const pendingOrders = orders.filter((o) => o.status === 'pendente_transmissao' || o.status === 'rascunho').length;
  const overdueTitles = financialTitles.filter((t) => t.status === 'vencido').length;
  const draftItemsCount = draftOrder.itens.length;
  const inactiveClientsCount = clients.filter((c) => c.diasSemComprar >= 30).length;

  // Os 8 Menus Solicitados para o App de Força de Vendas
  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Cockpit do Vendedor',
      subLabel: 'Visão geral & Metas',
      icon: LayoutDashboard,
    },
    {
      id: 'novo_pedido',
      label: 'Pedido de Vendas',
      subLabel: 'Emissão & Carrinho',
      icon: PlusCircle,
      badge: draftItemsCount > 0 ? `${draftItemsCount} itens` : undefined,
      badgeColor: 'bg-emerald-500 text-emerald-950 font-black shadow-sm',
      highlight: true,
    },
    {
      id: 'visitas',
      label: 'Roteiro de Visitas de Hoje',
      subLabel: 'Check-in e rota comercial',
      icon: MapPin,
      badge: pendingVisits > 0 ? `${pendingVisits} hoje` : undefined,
      badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
    },
    {
      id: 'pedidos',
      label: 'Últimos Pedidos Emitidos',
      subLabel: 'Histórico & 2ª via',
      icon: FileText,
      badge: pendingOrders > 0 ? `${pendingOrders} pendentes` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    },
    {
      id: 'produtos_consulta',
      label: 'Produtos (Consulta)',
      subLabel: 'Tabelas de preço & estoque',
      icon: PackageSearch,
    },
    {
      id: 'clientes',
      label: 'Clientes',
      subLabel: 'Cadastro rápido & carteira',
      icon: Users,
    },
    {
      id: 'reativacao',
      label: 'Oportunidades de Reativação',
      subLabel: 'Clientes sem compras 30d+',
      icon: Flame,
      badge: inactiveClientsCount > 0 ? `${inactiveClientsCount}` : undefined,
      badgeColor: 'bg-orange-500/20 text-orange-300 border border-orange-500/40',
    },
    {
      id: 'destaques_catalogo',
      label: 'Destaques do Catálogo',
      subLabel: 'Promoções & mais vendidos',
      icon: Sparkles,
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40',
    },
    {
      id: 'relatorios_vendedor',
      label: 'Relatórios dos Vendedores',
      subLabel: 'Vendas diárias & comissões',
      icon: BarChart3,
    },
    {
      id: 'financeiro',
      label: 'Títulos & Cobrança',
      subLabel: 'Contas a receber & recibos',
      icon: BadgeDollarSign,
      badge: overdueTitles > 0 ? `${overdueTitles} atrasos` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
    },
  ];

  const handleSelectTab = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full select-none">
      {/* Drawer Header on Mobile */}
      <div className="lg:hidden p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <BrandLogo size="sm" />
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
        <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">
          Menu de Força de Vendas
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`sidebar-nav-${item.id}`}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 font-bold'
                  : item.highlight
                  ? 'bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40 border border-emerald-800/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                    isActive
                      ? 'bg-blue-700/80 text-white'
                      : item.highlight
                      ? 'bg-emerald-900/50 text-emerald-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-left truncate">
                  <span className="block truncate leading-tight">{item.label}</span>
                  {item.subLabel && (
                    <span
                      className={`block text-[10px] font-normal truncate ${
                        isActive ? 'text-blue-200' : 'text-slate-500'
                      }`}
                    >
                      {item.subLabel}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-1">
                {item.badge && (
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                      item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer System Mode Card */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-2 mt-auto">
        <button
          id="btn-sidebar-open-retaguarda"
          onClick={() => {
            setAppMode('retaguarda');
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-950/60 transition-all cursor-pointer"
        >
          <span>🏢</span>
          <span>Acessar Retaguarda ERP</span>
          <Lock className="w-3.5 h-3.5 text-amber-300 opacity-90 shrink-0" />
        </button>

        {/* Sair do Aplicativo */}
        <button
          id="btn-sidebar-logout"
          onClick={() => {
            if (onCloseMobile) onCloseMobile();
            logout();
          }}
          className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/60 text-rose-300 text-xs font-semibold transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sair do Aplicativo</span>
        </button>

        <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] text-slate-300 font-semibold">Operação Offline Ativa</span>
          </div>
          <span className="text-[9px] text-slate-400 font-mono">v1.0.4 PROD</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Left Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Left Slide-in) */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-fadeIn"
          />

          {/* Drawer Panel */}
          <div className="relative w-4/5 max-w-xs bg-slate-900 border-r border-slate-800 h-full flex flex-col z-10 shadow-2xl animate-slideRight">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
