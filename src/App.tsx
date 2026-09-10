import React, { useState, useEffect } from 'react';
import { SalesProvider, useSales } from './context/SalesContext';
import { Header } from './components/Header';
import { ToastContainer } from './components/ToastContainer';
import { DashboardView } from './components/DashboardView';
import { OrderFormView } from './components/OrderFormView';
import { OrdersListView } from './components/OrdersListView';
import { ClientsView } from './components/ClientsView';
import { CatalogView } from './components/CatalogView';
import { VisitsView } from './components/VisitsView';
import { FinancialView } from './components/FinancialView';
import { ProductConsultationView } from './components/ProductConsultationView';
import { ReactivationView } from './components/ReactivationView';
import { CatalogHighlightsView } from './components/CatalogHighlightsView';
import { SellerReportsView } from './components/SellerReportsView';

// Retaguarda ERP Components
import { RetaguardaHeader } from './components/retaguarda/RetaguardaHeader';
import { RetaguardaSidebar } from './components/retaguarda/RetaguardaSidebar';
import { RetaguardaDashboardView } from './components/retaguarda/RetaguardaDashboardView';
import { StockEntryView } from './components/retaguarda/StockEntryView';
import { AccountsPayableView } from './components/retaguarda/AccountsPayableView';
import { AccountsReceivableView } from './components/retaguarda/AccountsReceivableView';
import { StockManagementView } from './components/retaguarda/StockManagementView';
import { RetaguardaReportsView } from './components/retaguarda/RetaguardaReportsView';
import { SuppliersView } from './components/retaguarda/SuppliersView';
import { IssuerProfileView } from './components/retaguarda/IssuerProfileView';
import { ImportNFeXmlModal } from './components/retaguarda/ImportNFeXmlModal';
import { UsersManagementView } from './components/retaguarda/UsersManagementView';
import { DataMigrationBackupView } from './components/retaguarda/DataMigrationBackupView';
import { Login } from './components/auth/Login';
import { LoginModal } from './components/auth/LoginModal';
import { MasterPasswordModal } from './components/auth/MasterPasswordModal';
import { CadastroNovaEmpresaModal } from './components/auth/CadastroNovaEmpresaModal';

import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Users,
  Package,
  MapPin,
  ArrowUpRight,
  ArrowDownLeft,
  BarChart3,
  FileSpreadsheet,
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    appMode,
    setAppMode,
    activeTab,
    setActiveTab,
    retaguardaTab,
    setRetaguardaTab,
    draftOrder,
    currentUser,
    userType,
    showToast,
    isCadastroEmpresaOpen,
    setIsCadastroEmpresaOpen,
    isRetaguardaUnlocked,
    setIsMasterUnlockModalOpen,
  } = useSales();

  const [isQuickImportOpen, setIsQuickImportOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const tipo =
    localStorage.getItem('tipo') ||
    (currentUser?.role === 'ADMIN_MASTER' ? 'MASTER' : userType || 'VENDEDOR');

  // Proteção de rota Desktop / Retaguarda: Acesso somente com Senha Master validada
  useEffect(() => {
    if (currentUser && appMode === 'retaguarda' && !isRetaguardaUnlocked) {
      setAppMode('mobile');
      setIsMasterUnlockModalOpen(true);
      showToast(
        'Acesso Restrito à Retaguarda',
        'Digite a senha master para acessar a Retaguarda ERP.',
        'warning'
      );
    }
  }, [appMode, isRetaguardaUnlocked, currentUser, setAppMode, setIsMasterUnlockModalOpen, showToast]);

  // Se não houver usuário autenticado, exibe a tela limpa de Login do Força de Vendas
  if (!currentUser) {
    return (
      <>
        <Login />
        <CadastroNovaEmpresaModal
          isOpen={isCadastroEmpresaOpen}
          onClose={() => setIsCadastroEmpresaOpen(false)}
        />
        <ToastContainer />
      </>
    );
  }

  // Render Mobile Views
  const renderMobileView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'novo_pedido':
        return <OrderFormView />;
      case 'visitas':
        return <VisitsView />;
      case 'pedidos':
        return <OrdersListView />;
      case 'produtos_consulta':
        return <ProductConsultationView />;
      case 'clientes':
        return <ClientsView />;
      case 'reativacao':
        return <ReactivationView />;
      case 'destaques_catalogo':
        return <CatalogHighlightsView />;
      case 'relatorios_vendedor':
        return <SellerReportsView />;
      case 'catalogo':
        return <CatalogView />;
      case 'financeiro':
        return <FinancialView />;
      default:
        return <DashboardView />;
    }
  };

  // Render Retaguarda ERP Views (Protegida)
  const renderRetaguardaView = () => {
    if (tipo !== 'MASTER') {
      return <DashboardView />;
    }

    switch (retaguardaTab) {
      case 'dashboard':
        return <RetaguardaDashboardView />;
      case 'entradas_xml':
        return <StockEntryView />;
      case 'contas_pagar':
        return <AccountsPayableView />;
      case 'contas_receber':
        return <AccountsReceivableView />;
      case 'estoque_precos':
        return <StockManagementView />;
      case 'relatorios':
        return <RetaguardaReportsView />;
      case 'fornecedores':
        return <SuppliersView />;
      case 'usuarios_vendedores':
        return <UsersManagementView />;
      case 'emitente':
        return <IssuerProfileView />;
      case 'pedidos_vendas':
        return <OrdersListView />;
      case 'migracao_backup':
        return <DataMigrationBackupView />;
      default:
        return <RetaguardaDashboardView />;
    }
  };

  const mobileNavItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'visitas', label: 'Roteiro', icon: MapPin },
    { id: 'novo_pedido', label: '+ Pedido', icon: PlusCircle, isHighlight: true, badge: draftOrder.itens.length || undefined },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'produtos_consulta', label: 'Consulta', icon: Package },
    { id: 'pedidos', label: 'Pedidos', icon: FileText },
  ];

  const retaguardaMobileNavItems = [
    { id: 'dashboard', label: 'Painel ERP', icon: LayoutDashboard },
    { id: 'entradas_xml', label: 'XML Entrada', icon: FileSpreadsheet },
    { id: 'contas_pagar', label: 'A Pagar', icon: ArrowUpRight },
    { id: 'contas_receber', label: 'A Receber', icon: ArrowDownLeft },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
  ];

  return (
    <div
      className={`min-h-screen flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white ${
        appMode === 'retaguarda' ? 'bg-slate-950 text-slate-100' : 'bg-[#F8FAFC] text-slate-800'
      }`}
    >
      {/* 1. MODO DESKTOP / RETAGUARDA (Apenas para MASTER com sidebar lateral escuro) */}
      {appMode === 'retaguarda' ? (
        <>
          <RetaguardaHeader onOpenImportXml={() => setIsQuickImportOpen(true)} />
          <div className="flex-1 flex overflow-hidden">
            <RetaguardaSidebar />
            <main className="flex-1 overflow-y-auto max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-28 md:pb-8">
              {renderRetaguardaView()}
            </main>
          </div>

          {/* Bottom Navigation Bar for Retaguarda Mobile if needed */}
          <nav className="md:hidden fixed bottom-4 left-3 right-3 max-w-md mx-auto z-40 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 shadow-2xl rounded-2xl px-2 py-2 flex items-center justify-around">
            {retaguardaMobileNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = retaguardaTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setRetaguardaTab(item.id as any)}
                  className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors relative ${
                    isActive ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] mt-0.5">{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-blue-400" />
                  )}
                </button>
              );
            })}
          </nav>
        </>
      ) : (
        /* 2. MODO FORÇA DE VENDAS / APP (100% SEM SIDEBAR LATERAL) */
        <div className="flex-1 flex flex-col w-full min-h-screen">
          {/* Se estiver em sub-páginas (Pedidos, Clientes, Financeiro, etc.), mostra barra superior mobile com botão de Voltar */}
          {activeTab !== 'dashboard' && (
            <Header onOpenMobileDrawer={() => setIsMobileDrawerOpen(false)} />
          )}

          {/* Conteúdo do App - Sem nenhum Sidebar lateral */}
          <main
            className={`flex-1 w-full mx-auto ${
              activeTab === 'dashboard'
                ? 'p-0 w-full'
                : activeTab === 'novo_pedido'
                ? 'max-w-7xl p-0 sm:p-6 lg:p-8 pb-6 sm:pb-8'
                : 'max-w-7xl p-3 sm:p-6 lg:p-8 pb-6 sm:pb-8'
            }`}
          >
            {renderMobileView()}
          </main>
        </div>
      )}

      {/* Quick Import Modal */}
      <ImportNFeXmlModal
        isOpen={isQuickImportOpen}
        onClose={() => setIsQuickImportOpen(false)}
      />

      {/* Authentication & Master Password Modals */}
      <LoginModal />
      <MasterPasswordModal />
      <CadastroNovaEmpresaModal
        isOpen={isCadastroEmpresaOpen}
        onClose={() => setIsCadastroEmpresaOpen(false)}
      />

      {/* Notifications / Feedback System */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <SalesProvider>
      <MainLayout />
    </SalesProvider>
  );
}
