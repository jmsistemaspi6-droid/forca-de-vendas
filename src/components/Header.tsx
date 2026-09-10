import React, { useState } from 'react';
import { useSales } from '../context/SalesContext';
import {
  TrendingUp,
  Wifi,
  WifiOff,
  RefreshCw,
  PlusCircle,
  Search,
  ShoppingCart,
  Bell,
  CheckCircle2,
  Calendar,
  Layers,
  KeyRound,
  LogOut,
  Users2,
  ShieldCheck,
  ChevronDown,
  ArrowLeft,
  Menu,
  X,
  FileText,
  Package,
  MapPin,
  DollarSign,
  BarChart3,
  Sparkles,
  Lock,
} from 'lucide-react';
import { VoiceSearchButton } from './common/VoiceSearchButton';
import { BrandLogo } from './common/BrandLogo';

interface HeaderProps {
  onOpenMobileDrawer?: () => void;
}

export const Header: React.FC<HeaderProps> = () => {
  const {
    seller,
    syncStatus,
    toggleOnlineMode,
    syncPendingOrders,
    draftOrder,
    activeTab,
    setActiveTab,
    globalSearch,
    setGlobalSearch,
    visits,
    financialTitles,
    showToast,
    appMode,
    setAppMode,
    currentUser,
    setIsLoginModalOpen,
    isGlobalAdminSession,
    setIsCadastroEmpresaOpen,
    logout,
  } = useSales();

  const isSuperAdmin = isGlobalAdminSession || currentUser?.isGlobalAdmin || currentUser?.email === 'novo@jmsistemaspi.com';

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  const pendingVisitsToday = visits.filter(v => v.status === 'agendada' || v.status === 'em_andamento').length;
  const overdueTitles = financialTitles.filter(t => t.status === 'vencido');
  const cartItemsCount = draftOrder.itens.reduce((sum, it) => sum + it.quantidade, 0);

  const goalPercentage = Math.min(100, Math.round((seller.realizadoMes / seller.metaMensal) * 100));

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        
        {/* Brand & Seller Quick Info */}
        <div className="flex items-center gap-3">
          {/* Back to Home Button for Mobile Sales App */}
          <button
            type="button"
            id="btn-back-to-home"
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer active:scale-95"
            title="Voltar para a tela inicial"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Início</span>
          </button>

          {/* Menu de Navegação Rápida (Mobile) */}
          <button
            type="button"
            id="btn-mobile-quick-menu"
            onClick={() => setShowMobileNav(!showMobileNav)}
            className="md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95"
            title="Menu de navegação rápida do aplicativo"
          >
            <Menu className="w-4 h-4 text-blue-400" />
            <span className="text-xs">Módulos</span>
          </button>

          <div 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center gap-2.5 cursor-pointer select-none group"
            id="brand-logo-button"
          >
            <BrandLogo size="md" />
          </div>

          {/* Switch to Retaguarda ERP Button */}
          <button
            id="btn-switch-to-retaguarda-header"
            onClick={() => setAppMode('retaguarda')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-300 hover:text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            title="Acessar o módulo Retaguarda ERP (Requer Senha Master)"
          >
            <span className="text-base leading-none">🏢</span>
            <span className="hidden sm:inline">Acessar Retaguarda ERP</span>
            <span className="sm:hidden">ERP</span>
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          </button>

          {/* Quick Meta Goal Progress Pill (Desktop) */}
          <div className="hidden xl:flex items-center gap-3 bg-slate-800/80 px-3.5 py-1.5 rounded-full border border-slate-700/60 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Meta Mês:</span>
              <span className="font-semibold text-white">R$ {(seller.realizadoMes / 1000).toFixed(1)}k / {(seller.metaMensal / 1000).toFixed(0)}k</span>
            </div>
            <div className="w-16 bg-slate-700 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${goalPercentage}%` }}
              />
            </div>
            <span className="font-bold text-emerald-400">{goalPercentage}%</span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-2">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              id="global-search-input"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Buscar cliente, produto SKU, pedido..."
              className="w-full bg-slate-800/90 text-sm text-slate-200 placeholder-slate-400 rounded-xl pl-10 pr-16 py-2 border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {globalSearch && (
                <button 
                  onClick={() => setGlobalSearch('')}
                  className="text-xs text-slate-400 hover:text-white px-1.5 py-0.5"
                >
                  Limpar
                </button>
              )}
              <VoiceSearchButton
                size="sm"
                onTranscript={(t) => setGlobalSearch(t)}
                placeholderHint="Fale o que deseja buscar..."
              />
            </div>
          </div>
        </div>

        {/* Actions & Status Bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Online/Offline Toggle Button */}
          <button
            onClick={toggleOnlineMode}
            id="toggle-offline-mode-btn"
            title={syncStatus.isOnline ? 'Online - Clique para simular modo Offline' : 'Offline - Clique para voltar ao modo Online'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              syncStatus.isOnline
                ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/50'
                : 'bg-amber-950/60 text-amber-300 border-amber-700 hover:bg-amber-900/60 animate-pulse'
            }`}
          >
            {syncStatus.isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Offline</span>
              </>
            )}
          </button>

          {/* Sync Button */}
          <button
            onClick={syncPendingOrders}
            disabled={syncStatus.sincronizando}
            id="sync-orders-header-btn"
            title={`Última sincronização: ${syncStatus.ultimaSincronizacao}. ${syncStatus.pendentesQtd} pedido(s) pendente(s).`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50 relative"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${syncStatus.sincronizando ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sincronizar</span>
            {syncStatus.pendentesQtd > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full ring-2 ring-slate-900">
                {syncStatus.pendentesQtd}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              id="notifications-toggle-btn"
              className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {(pendingVisitsToday > 0 || overdueTitles.length > 0) && (
                <span className="absolute 1 top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-slate-900" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-700 mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Central de Avisos</h4>
                  <span className="text-[10px] text-blue-400 font-medium">{pendingVisitsToday + overdueTitles.length} alertas</span>
                </div>
                
                <div className="space-y-2 text-xs">
                  {pendingVisitsToday > 0 && (
                    <div 
                      onClick={() => { setActiveTab('visitas'); setShowNotifications(false); }}
                      className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg cursor-pointer flex items-start gap-2 text-slate-200 transition-colors"
                    >
                      <Calendar className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Roteiro do Dia</p>
                        <p className="text-[11px] text-slate-400">Você tem {pendingVisitsToday} visitas agendadas para hoje.</p>
                      </div>
                    </div>
                  )}

                  {overdueTitles.length > 0 && (
                    <div 
                      onClick={() => { setActiveTab('financeiro'); setShowNotifications(false); }}
                      className="p-2 bg-rose-950/40 hover:bg-rose-950/60 border border-rose-900/50 rounded-lg cursor-pointer flex items-start gap-2 text-rose-200 transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-rose-300">Inadimplência na Carteira</p>
                        <p className="text-[11px] text-rose-300/80">{overdueTitles.length} título(s) vencido(s) aguardando cobrança.</p>
                      </div>
                    </div>
                  )}

                  <div className="p-2 bg-slate-700/30 rounded-lg text-slate-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-medium text-[11px]">Tabelas de Preço Atualizadas</p>
                      <p className="text-[10px] text-slate-400">Base comercial sincronizada com o ERP.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

            {/* Active Draft Cart Button */}
          <button
            onClick={() => setActiveTab('novo_pedido')}
            id="header-cart-btn"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-700/20 transition-colors relative"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden md:inline">Pedido em Andamento</span>
            {cartItemsCount > 0 && (
              <span className="bg-white text-blue-700 font-extrabold text-[11px] px-1.5 py-0.2 rounded-full">
                {cartItemsCount}
              </span>
            )}
          </button>

          {/* Quick Sair / Logout Button */}
          <button
            onClick={logout}
            id="btn-header-quick-logout"
            title="Sair do aplicativo"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/60 text-rose-300 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>

          {/* Seller Avatar and Account Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 pl-2 border-l border-slate-700 cursor-pointer"
            >
              <img
                src={currentUser?.fotoUrl || seller.fotoUrl}
                alt={currentUser?.nome || seller.nome}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-blue-500/40"
              />
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-200 leading-tight">
                  {(currentUser?.nome || seller.nome).split(' ')[0]}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {currentUser?.codigoVendedor || seller.codigoVendedor}
                </p>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in">
                <div className="p-2 border-b border-slate-700 mb-2">
                  <p className="text-xs font-bold text-slate-100">{currentUser?.nome || seller.nome}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{currentUser?.email || seller.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    {currentUser?.role === 'ADMIN_MASTER' ? '👑 Master Admin' : '📱 Vendedor Campo'}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  {isSuperAdmin && (
                    <button
                      onClick={() => {
                        setIsCadastroEmpresaOpen(true);
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-amber-200 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/40 transition-colors font-bold"
                    >
                      <span>🏢</span>
                      <span>Painel Multi-Empresas</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsLoginModalOpen(true);
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-700 transition-colors"
                  >
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>Trocar de Conta / Login</span>
                  </button>

                  <button
                    onClick={() => {
                      setAppMode('retaguarda');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-400" />
                      <span>Acessar Retaguarda ERP</span>
                    </div>
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/40 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair da Conta</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Drawer / Menu de Navegação Móvel Limpa */}
      {showMobileNav && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-start animate-in fade-in duration-200">
          <div className="bg-slate-900 border-b border-slate-700 shadow-2xl p-4 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BrandLogo size="sm" />
                <span className="font-extrabold text-sm text-white">Navegação do Aplicativo</span>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileNav(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('dashboard');
                  setShowMobileNav(false);
                }}
                className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                    : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span className="text-base">📊</span>
                <span className="font-bold">Painel Geral</span>
                <span className="text-[10px] text-slate-400">Resumo e metas diárias</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('novo_pedido');
                  setShowMobileNav(false);
                }}
                className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all ${
                  activeTab === 'novo_pedido'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                    : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span className="text-base">➕</span>
                <span className="font-bold">Novo Pedido</span>
                <span className="text-[10px] text-slate-400">Iniciar nova venda</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('pedidos');
                  setShowMobileNav(false);
                }}
                className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all ${
                  activeTab === 'pedidos'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                    : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span className="text-base">📋</span>
                <span className="font-bold">Meus Pedidos</span>
                <span className="text-[10px] text-slate-400">Histórico de vendas</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('clientes');
                  setShowMobileNav(false);
                }}
                className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all ${
                  activeTab === 'clientes'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                    : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span className="text-base">👥</span>
                <span className="font-bold">Clientes</span>
                <span className="text-[10px] text-slate-400">Carteira e limites</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('produtos');
                  setShowMobileNav(false);
                }}
                className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all ${
                  activeTab === 'produtos'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                    : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span className="text-base">📦</span>
                <span className="font-bold">Produtos</span>
                <span className="text-[10px] text-slate-400">Estoque e preços</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('visitas');
                  setShowMobileNav(false);
                }}
                className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all ${
                  activeTab === 'visitas'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                    : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span className="text-base">📍</span>
                <span className="font-bold">Roteiro Visitas</span>
                <span className="text-[10px] text-slate-400">Check-in de rotas</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('financeiro');
                  setShowMobileNav(false);
                }}
                className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all ${
                  activeTab === 'financeiro'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                    : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span className="text-base">💵</span>
                <span className="font-bold">Contas a Receber</span>
                <span className="text-[10px] text-slate-400">Cobranças e parcelas</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('relatorios');
                  setShowMobileNav(false);
                }}
                className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all ${
                  activeTab === 'relatorios'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                    : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span className="text-base">📈</span>
                <span className="font-bold">Relatórios</span>
                <span className="text-[10px] text-slate-400">Desempenho vendedor</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
              <span>{seller.nome}</span>
              <span className="text-emerald-400 font-bold">Meta: {goalPercentage}%</span>
            </div>
          </div>
          <div className="flex-1" onClick={() => setShowMobileNav(false)} />
        </div>
      )}
    </header>
  );
};
