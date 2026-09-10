import React, { useState } from 'react';
import {
  Building2,
  Smartphone,
  Search,
  Bell,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Wifi,
  WifiOff,
  FileSpreadsheet,
  PlusCircle,
  TrendingUp,
  User,
  LogOut,
  KeyRound,
  ShieldCheck,
  Users2,
  ChevronDown,
  HardDriveDownload,
  Database,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { VoiceSearchButton } from '../common/VoiceSearchButton';
import { BrandLogo } from '../common/BrandLogo';

interface RetaguardaHeaderProps {
  onOpenImportXml?: () => void;
  onOpenNewPayable?: () => void;
}

export const RetaguardaHeader: React.FC<RetaguardaHeaderProps> = ({
  onOpenImportXml,
  onOpenNewPayable,
}) => {
  const {
    appMode,
    setAppMode,
    retaguardaTab,
    setRetaguardaTab,
    payableTitles,
    financialTitles,
    stockEntries,
    syncStatus,
    toggleOnlineMode,
    syncPendingOrders,
    globalSearch,
    setGlobalSearch,
    currentUser,
    setIsLoginModalOpen,
    isGlobalAdminSession,
    setIsCadastroEmpresaOpen,
    issuer,
    logout,
    generateFullSystemBackup,
  } = useSales();

  const isSuperAdmin = isGlobalAdminSession || currentUser?.isGlobalAdmin || currentUser?.email === 'novo@jmsistemaspi.com';

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Financial summary of the day/month
  const hojeStr = new Date().toISOString().split('T')[0];

  const totalPagarHoje = payableTitles
    .filter((t) => (t.status === 'a_vencer' || t.status === 'parcial' || t.status === 'vencido') && t.dataVencimento <= hojeStr)
    .reduce((sum, t) => sum + (t.saldoRestante ?? t.valorOriginal), 0);

  const totalReceberHoje = financialTitles
    .filter((t) => (t.status === 'a_vencer' || t.status === 'parcial' || t.status === 'vencido') && t.dataVencimento <= hojeStr)
    .reduce((sum, t) => sum + (t.saldoRestante ?? t.valor), 0);

  const totalRecebidoMes = financialTitles
    .reduce((sum, t) => sum + (t.valorRecebido || 0), 0);

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
      {/* Top Banner / Switcher */}
      <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-950/60 text-xs">
        {/* Mode switcher */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-800 border border-slate-700">
            <button
              id="btn-mode-retaguarda"
              onClick={() => setAppMode('retaguarda')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all ${
                appMode === 'retaguarda'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>🏢 Retaguarda ERP</span>
            </button>
            <button
              id="btn-mode-mobile"
              onClick={() => setAppMode('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all ${
                appMode === 'mobile'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>📱 Força de Vendas Mobile</span>
            </button>
          </div>

          <span className="hidden md:inline-flex items-center gap-1 text-slate-400 pl-2 border-l border-slate-800 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Matriz Operacional Distribuidora
          </span>
        </div>

        {/* Financial Quick Ticker */}
        <div className="hidden lg:flex items-center gap-5 text-xs">
          <div className="flex items-center gap-1.5 text-rose-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span className="text-slate-400">A Pagar (Venc. / Hoje):</span>
            <span className="font-bold">
              R$ {totalPagarHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-400">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span className="text-slate-400">A Receber (Venc. / Hoje):</span>
            <span className="font-bold">
              R$ {totalReceberHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-blue-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-slate-400">Recebido no Mês:</span>
            <span className="font-bold">
              R$ {totalRecebidoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Sync & Online status & User */}
        <div className="flex items-center gap-2">
          <button
            id="btn-retaguarda-toggle-online"
            onClick={toggleOnlineMode}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
              syncStatus.isOnline
                ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-400 hover:bg-emerald-900/50'
                : 'bg-amber-950/60 border-amber-800/80 text-amber-400 hover:bg-amber-900/50'
            }`}
            title={syncStatus.isOnline ? 'Conexão ativa com o banco central' : 'Trabalhando offline localmente'}
          >
            {syncStatus.isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{syncStatus.isOnline ? 'Online' : 'Offline'}</span>
          </button>

          <button
            id="btn-retaguarda-sync"
            onClick={syncPendingOrders}
            disabled={syncStatus.sincronizando}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors disabled:opacity-50"
            title="Sincronizar dados entre Vendas Mobile e Retaguarda"
          >
            <RefreshCw className={`w-3 h-3 ${syncStatus.sincronizando ? 'animate-spin text-blue-400' : ''}`} />
            <span className="hidden sm:inline">Sincronizar</span>
          </button>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BrandLogo size="md" />
          <div className="hidden sm:block border-l border-slate-700 pl-3">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-100 leading-none">
                Retaguarda ERP & Backoffice
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/60 text-blue-300 border border-blue-700/50">
                PRO V2
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Compras (XML NF-e), Contas a Pagar, Contas a Receber & Relatórios
            </p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-retaguarda-search"
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Pesquisar NF-e, fornecedor, cliente, vendedor, título..."
              className="w-full pl-9 pr-10 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
              <VoiceSearchButton
                size="sm"
                onTranscript={(t) => setGlobalSearch(t)}
                placeholderHint="Fale o nome do fornecedor, cliente ou produto..."
              />
            </div>
          </div>
        </div>

        {/* Action Buttons & User Menu */}
        <div className="flex items-center gap-2.5">
          {/* Quick Full Backup Button */}
          <button
            id="btn-quick-desktop-backup"
            onClick={() => generateFullSystemBackup()}
            title="Salvar backup completo de todos os dados no computador"
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <HardDriveDownload className="w-4 h-4 text-blue-200" />
            <span className="hidden sm:inline">Salvar Backup</span>
          </button>

          {onOpenImportXml && (
            <button
              id="btn-quick-import-xml"
              onClick={onOpenImportXml}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Importar XML NF-e</span>
            </button>
          )}

          {onOpenNewPayable && (
            <button
              id="btn-quick-new-payable"
              onClick={onOpenNewPayable}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-rose-400" />
              <span>Lançar Despesa</span>
            </button>
          )}

          {/* Quick Sair Button */}
          <button
            onClick={logout}
            id="btn-retaguarda-header-quick-logout"
            title="Sair do sistema"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/60 text-rose-300 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>

          {/* User Account Menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold ring-1 ring-slate-600 overflow-hidden">
                {currentUser?.fotoUrl ? (
                  <img src={currentUser.fotoUrl} alt={currentUser.nome} className="w-full h-full object-cover" />
                ) : (
                  <span>👑</span>
                )}
              </div>
              <div className="text-left hidden xl:block">
                <p className="text-xs font-bold text-slate-100 leading-tight">
                  {currentUser?.nome?.split(' ')[0] || 'Usuário Master'}
                </p>
                <p className="text-[10px] text-amber-400 font-medium">
                  {currentUser?.role === 'ADMIN_MASTER' ? '👑 Master Admin' : '📱 Vendedor'}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in">
                <div className="p-2 border-b border-slate-800 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
                      {currentUser?.role === 'ADMIN_MASTER' ? '👑' : '📱'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-100 truncate">{currentUser?.nome}</p>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{currentUser?.email}</p>
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {currentUser?.role === 'ADMIN_MASTER' ? 'Acesso Total a Todos os Módulos' : 'Vendedor Campo'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  {isSuperAdmin && (
                    <button
                      onClick={() => {
                        setIsCadastroEmpresaOpen(true);
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-amber-200 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/40 transition-colors font-bold"
                    >
                      <Building2 className="w-4 h-4 text-amber-400" />
                      <span>Painel Multi-Empresas</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setRetaguardaTab('usuarios_vendedores');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Users2 className="w-4 h-4 text-indigo-400" />
                    <span>Gerenciar Equipe de Vendedores</span>
                  </button>

                  <button
                    onClick={() => {
                      setAppMode('mobile');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-emerald-300 hover:bg-emerald-950/40 transition-colors cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>Ir para Força de Vendas Mobile</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsLoginModalOpen(true);
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>Trocar de Conta / Login</span>
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/40 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair do Sistema</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
