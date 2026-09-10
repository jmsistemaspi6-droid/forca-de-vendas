import React, { useState } from 'react';
import { useSales } from '../context/SalesContext';
import {
  ShoppingCart,
  Users,
  BarChart3,
  FileText,
  Wallet,
  X,
  KeyRound,
  LogOut,
} from 'lucide-react';
import logoImg from '../assets/images/jm_sistemas_logo_1788176773631.jpg';
import { AdminAccess } from './AdminAccess';

interface DashboardViewProps {
  onNavigate?: (route: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const {
    setActiveTab,
    setAppMode,
    verifyMasterPassword,
    showToast,
    userType,
    currentUser,
    logout,
  } = useSales();

  const tipo =
    localStorage.getItem('tipo') ||
    (currentUser?.role === 'ADMIN_MASTER' ? 'MASTER' : userType || 'VENDEDOR');

  const handleNavigate = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    }
    setActiveTab(tab as any);
  };

  const abrirDesktop = () => {
    setAppMode('retaguarda');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* 1. HEADER: Logo JM Sistemas + Força de Vendas */}
      <header className="relative flex flex-col items-center py-6 bg-white border-b border-slate-100 px-4">
        <button
          type="button"
          onClick={logout}
          className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
          title="Sair do aplicativo"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sair</span>
        </button>

        <img
          src={logoImg || "/logo-jm-sistemas.png"}
          className="h-12 object-contain"
          alt="JM Sistemas"
        />
        <span className="text-[11px] text-slate-400 uppercase tracking-widest mt-2 font-semibold">
          Força de Vendas
        </span>
      </header>

      {/* 2. CONTEÚDO PRINCIPAL: 5 Cards Gigantes 140px */}
      <div className="flex-1 bg-[#F8FAFC] p-6">
        <div className="max-w-md mx-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Card 1: Pedidos */}
            <button
              type="button"
              onClick={() => handleNavigate('pedidos')}
              className="h-[140px] bg-white rounded-[28px] shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 active:scale-[0.98] transition-all cursor-pointer hover:shadow-md"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#DBEAFE] flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-[#3B82F6]" />
              </div>
              <span className="font-bold text-slate-800">Pedidos</span>
            </button>

            {/* Card 2: Clientes */}
            <button
              type="button"
              onClick={() => handleNavigate('clientes')}
              className="h-[140px] bg-white rounded-[28px] shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 active:scale-[0.98] transition-all cursor-pointer hover:shadow-md"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#D1FAE5] flex items-center justify-center">
                <Users className="w-8 h-8 text-[#10B981]" />
              </div>
              <span className="font-bold text-slate-800">Clientes</span>
            </button>

            {/* Card 3: Dashboard */}
            <button
              type="button"
              onClick={() => handleNavigate('relatorios_vendedor')}
              className="h-[140px] bg-white rounded-[28px] shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 active:scale-[0.98] transition-all cursor-pointer hover:shadow-md"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#EDE9FE] flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-[#8B5CF6]" />
              </div>
              <span className="font-bold text-slate-800">Dashboard</span>
            </button>

            {/* Card 4: Relatórios */}
            <button
              type="button"
              onClick={() => handleNavigate('relatorios_vendedor')}
              className="h-[140px] bg-white rounded-[28px] shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 active:scale-[0.98] transition-all cursor-pointer hover:shadow-md"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#FEF3C7] flex items-center justify-center">
                <FileText className="w-8 h-8 text-[#F59E0B]" />
              </div>
              <span className="font-bold text-slate-800">Relatórios</span>
            </button>

            {/* Card 5: Financeiro (Centralizado com 2 colunas) */}
            <button
              type="button"
              onClick={() => handleNavigate('financeiro')}
              className="col-span-2 mx-auto w-full h-[140px] bg-white rounded-[28px] shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer hover:shadow-md"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#D1FAE5] flex items-center justify-center">
                <Wallet className="w-8 h-8 text-[#059669]" />
              </div>
              <span className="font-bold text-slate-800">Financeiro</span>
              <span className="text-[11px] text-slate-400">Contas a receber</span>
            </button>
          </div>

          {/* 3. OPÇÃO EXTRA: Visível APENAS para MASTER */}
          {tipo === 'MASTER' && (
            <AdminAccess onOpenDesktop={abrirDesktop} />
          )}

          {/* 4. OPÇÃO DE SAIR DO APLICATIVO */}
          <div className="pt-2">
            <button
              type="button"
              onClick={logout}
              className="w-full h-14 bg-white border border-rose-200 hover:bg-rose-50/70 text-rose-600 rounded-[20px] font-bold text-sm flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
            >
              <LogOut className="w-5 h-5 text-rose-500" />
              <span>Sair do Aplicativo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
