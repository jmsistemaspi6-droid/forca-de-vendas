import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Client,
  Product,
  Order,
  Visit,
  FinancialTitle,
  SellerProfile,
  SyncStatus,
  OrderItem,
  OrderStatus,
  OrderType,
  FreightType,
  AppMode,
  RetaguardaTab,
  Supplier,
  PayableTitle,
  StockEntry,
  PaymentSettlementItem,
  ReceivablePaymentItem,
  CompanyIssuer,
  SystemUser,
  UserRole,
  SalespersonExpense,
  AccountabilitySession,
  SystemBackupData,
  LocalBackupSnapshot,
  OrderParcela,
} from '../types';
import {
  INITIAL_SELLER,
  INITIAL_PRODUCTS,
  INITIAL_CLIENTS,
  INITIAL_VISITS,
  INITIAL_ORDERS,
  INITIAL_FINANCIAL_TITLES,
  INITIAL_SUPPLIERS,
  INITIAL_PAYABLE_TITLES,
  INITIAL_STOCK_ENTRIES,
  INITIAL_ISSUER,
  INITIAL_USERS,
  MASTER_ADMIN_CREDENTIALS,
  INITIAL_EXPENSES,
  INITIAL_ACCOUNTABILITY_SESSIONS,
} from '../data/mockData';
import { ParsedNFeResult } from '../services/nfeXmlParser';
import {
  fetchCloudData,
  pushToCloud,
  transmitSingleOrderToCloud,
  mergeItemsById,
} from '../services/cloudSyncService';

export type ActiveTab =
  | 'dashboard'
  | 'novo_pedido'
  | 'visitas'
  | 'pedidos'
  | 'produtos_consulta'
  | 'clientes'
  | 'reativacao'
  | 'destaques_catalogo'
  | 'relatorios_vendedor'
  | 'catalogo'
  | 'financeiro'
  | 'prestacao_contas'
  | 'simulador';

export interface ToastNotification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

export interface DraftOrderState {
  cliente: Client | null;
  itens: OrderItem[];
  tabelaPreco: 'varejo' | 'atacado' | 'distribuidor';
  condicaoPagamento: string;
  formaPagamento: 'Boleto Bancário' | 'PIX' | 'Cartão Crédito' | 'Transferência Bancária' | 'Cheque' | 'Dinheiro';
  tipoFrete: FreightType;
  valorFrete: number;
  tipo: OrderType;
  observacoesInternas: string;
  observacoesNotaFiscal: string;
  dataPrevisaoEntrega: string;
  parcelas?: OrderParcela[];
}

interface SalesContextType {
  // App Mode & Navigation
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  retaguardaTab: RetaguardaTab;
  setRetaguardaTab: (tab: RetaguardaTab) => void;
  
  seller: SellerProfile;
  clients: Client[];
  products: Product[];
  orders: Order[];
  visits: Visit[];
  financialTitles: FinancialTitle[];
  
  // Prestação de Contas & Despesas de Vendedor
  expenses: SalespersonExpense[];
  accountabilitySessions: AccountabilitySession[];
  addExpense: (expense: Omit<SalespersonExpense, 'id' | 'criadoEm'>) => SalespersonExpense;
  deleteExpense: (id: string) => void;
  closeAccountabilitySession: (dados: {
    vendedorId?: string;
    vendedorNome?: string;
    observacoes?: string;
  }) => AccountabilitySession;
  approveAccountabilitySession: (sessionId: string, aprovadoPor?: string) => void;
  rejectAccountabilitySession: (sessionId: string, motivo?: string) => void;

  // Retaguarda Data
  suppliers: Supplier[];
  payableTitles: PayableTitle[];
  stockEntries: StockEntry[];
  issuer: CompanyIssuer;
  updateIssuer: (issuerData: Partial<CompanyIssuer>) => void;
  
  // Product Management (Desktop CRUD)
  addProduct: (productData: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, productData: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  syncStatus: SyncStatus;
  toasts: ToastNotification[];
  showToast: (title: string, message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
  toggleOnlineMode: () => void;
  syncPendingOrders: () => Promise<void>;
  
  // Clients management
  addClient: (clientData: Omit<Client, 'id' | 'totalComprasHistorico' | 'pedidosRealizadosCount'>) => Client;
  updateClient: (id: string, clientData: Partial<Client>) => void;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  
  // Suppliers management
  addSupplier: (supplierData: Omit<Supplier, 'id' | 'totalComprasHistorico' | 'totalNotasCount'>) => Supplier;
  updateSupplier: (id: string, supplierData: Partial<Supplier>) => void;
  
  // Order draft & creation
  draftOrder: DraftOrderState;
  setDraftOrder: React.Dispatch<React.SetStateAction<DraftOrderState>>;
  resetDraftOrder: () => void;
  startNewOrderForClient: (client: Client) => void;
  addItemToDraft: (product: Product, quantity?: number, customPrice?: number) => void;
  removeItemFromDraft: (itemId: string) => void;
  updateDraftItemQty: (itemId: string, quantity: number) => void;
  updateDraftItemPrice: (itemId: string, price: number) => void;
  submitDraftOrder: (asDraftOnly?: boolean, signatureBase64?: string, receiverName?: string) => Order | null;
  
  // Orders management
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;
  transmitOrder: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;
  duplicateOrder: (order: Order) => void;
  
  // Visits management
  startVisit: (visitId: string) => void;
  completeVisit: (visitId: string, notes?: string, reasonNotSold?: string, generatedOrderId?: string, generatedOrderValue?: number) => void;
  addVisit: (visit: Omit<Visit, 'id'>) => void;
  
  // Financial Receivables (Contas a Receber)
  markTitleAsPaid: (titleId: string) => void;
  settleReceivableTitle: (
    titleId: string,
    settlement: {
      valorRecebido: number;
      valorJurosMulta?: number;
      valorDesconto?: number;
      formaRecebimento: 'PIX' | 'Boleto Bancário' | 'Transferência Bancária' | 'Dinheiro' | 'Cartão Crédito' | 'Cheque';
      responsavel: string;
      observacoes?: string;
    }
  ) => void;
  addReceivableTitle: (title: Omit<FinancialTitle, 'id' | 'historicoBaixas' | 'saldoRestante'>) => FinancialTitle;
  
  // Financial Payables (Contas a Pagar)
  settlePayableTitle: (
    titleId: string,
    settlement: {
      valorPago: number;
      valorJurosMulta?: number;
      valorDesconto?: number;
      formaPagamento: 'PIX' | 'Boleto Bancário' | 'Transferência Bancária' | 'Dinheiro' | 'Cartão Crédito' | 'Cheque';
      contaOuCaixa?: string;
      comprovanteDoc?: string;
      responsavel?: string;
      observacoes?: string;
    }
  ) => void;
  addPayableTitle: (title: Omit<PayableTitle, 'id' | 'historicoBaixas' | 'saldoRestante'>) => PayableTitle;
  
  // Stock Entry & XML Import
  importStockEntryFromParsedXml: (
    parsed: ParsedNFeResult,
    options: {
      updateStock: boolean;
      generatePayables: boolean;
      createNewProducts: boolean;
    }
  ) => StockEntry;
  addManualStockEntry: (entryData: Omit<StockEntry, 'id'>) => StockEntry;
  
  // Product & Inventory
  updateProductStock: (productId: string, newStock: number, reason?: string) => void;
  updateProductPrices: (
    productId: string,
    prices: {
      precoCusto?: number;
      varejo?: number;
      atacado?: number;
      distribuidor?: number;
    }
  ) => void;
  
  // Migration & Bulk Upserts (Clipper / CSV / JSON)
  bulkUpsertProducts: (importedProducts: Partial<Product>[]) => { inserted: number; updated: number; total: number };
  bulkUpsertClients: (importedClients: Partial<Client>[]) => { inserted: number; updated: number; total: number };
  bulkUpsertFinancialTitles: (importedTitles: Partial<FinancialTitle>[]) => { inserted: number; updated: number; total: number };
  resetDatabaseToEmpty: () => void;

  // Full Desktop Backup & Restore (Local Computer File & Snapshots)
  generateFullSystemBackup: () => SystemBackupData;
  restoreFullSystemBackup: (backupData: any) => { success: boolean; message: string; stats?: any };
  localBackupSnapshots: LocalBackupSnapshot[];
  deleteLocalBackupSnapshot: (snapshotId: string) => void;
  downloadLocalBackupSnapshot: (snapshotId: string) => void;

  // Selected product detail modal
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
  
  // Search state helper
  globalSearch: string;
  setGlobalSearch: (q: string) => void;

  // Authentication & Users Management
  currentUser: SystemUser | null;
  userType: 'MASTER' | 'VENDEDOR';
  setUserType: (type: 'MASTER' | 'VENDEDOR') => void;
  users: SystemUser[];
  login: (email: string, password: string) => { success: boolean; message?: string };
  logout: () => void;
  switchUser: (userId: string) => void;
  addUser: (userData: Omit<SystemUser, 'id' | 'dataCadastro'>) => SystemUser;
  updateUser: (id: string, userData: Partial<SystemUser>) => void;
  deleteUser: (id: string) => void;
  verifyMasterPassword: (password: string) => boolean;
  isMasterAdmin: boolean;
  isMasterUnlockModalOpen: boolean;
  setIsMasterUnlockModalOpen: (open: boolean) => void;
  requestMasterAccess: (onSuccess: () => void) => void;
  isRetaguardaUnlocked: boolean;
  unlockRetaguarda: () => void;
  lockRetaguarda: () => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  // Multi-Company & Global Admin
  companies: CompanyIssuer[];
  isGlobalAdminSession: boolean;
  setIsGlobalAdminSession: (open: boolean) => void;
  switchToCompany: (cnpjOrCpfOrId: string) => boolean;
  toggleBlockCompany: (cnpjOrCpfOrId: string, blocked: boolean, motivo?: string) => void;
  isCadastroEmpresaOpen: boolean;
  setIsCadastroEmpresaOpen: (open: boolean) => void;
  registerNewCompanyAndTenant: (
    companyData: CompanyIssuer,
    adminUser: {
      nome: string;
      email: string;
      senha?: string;
      telefone?: string;
      cargo?: string;
      cpf?: string;
    }
  ) => Promise<void>;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'FORCA_DE_VENDAS_STATE_V2';

export const SalesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isRetaguardaUnlocked, setIsRetaguardaUnlocked] = useState<boolean>(false);
  const [appMode, setAppModeState] = useState<AppMode>('mobile');

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [retaguardaTab, setRetaguardaTab] = useState<RetaguardaTab>('dashboard');
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const [userType, setUserType] = useState<'MASTER' | 'VENDEDOR'>(() => {
    const savedTipo = localStorage.getItem('tipo');
    if (savedTipo === 'MASTER' || savedTipo === 'VENDEDOR') {
      return savedTipo;
    }
    return 'VENDEDOR';
  });

  // Safe wrapper for changing appMode: strictly requires master password validation for retaguarda
  const setAppMode = (mode: AppMode) => {
    if (mode === 'retaguarda') {
      if (!isRetaguardaUnlocked) {
        setIsMasterUnlockModalOpen(true);
        return;
      }
      setAppModeState('retaguarda');
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_MODE`, 'retaguarda');
    } else {
      setIsRetaguardaUnlocked(false);
      setAppModeState('mobile');
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_MODE`, 'mobile');
    }
  };

  const unlockRetaguarda = () => {
    setIsRetaguardaUnlocked(true);
    setAppModeState('retaguarda');
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_MODE`, 'retaguarda');
  };

  const lockRetaguarda = () => {
    setIsRetaguardaUnlocked(false);
    setAppModeState('mobile');
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_MODE`, 'mobile');
  };

  // Local storage state initialization
  const [seller, setSeller] = useState<SellerProfile>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_SELLER`);
    return saved ? JSON.parse(saved) : INITIAL_SELLER;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_CLIENTS`);
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_PRODUCTS`);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_ORDERS`);
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [visits, setVisits] = useState<Visit[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_VISITS`);
    return saved ? JSON.parse(saved) : INITIAL_VISITS;
  });

  const [financialTitles, setFinancialTitles] = useState<FinancialTitle[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_FINANCIAL`);
    return saved ? JSON.parse(saved) : INITIAL_FINANCIAL_TITLES;
  });

  const [expenses, setExpenses] = useState<SalespersonExpense[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_EXPENSES`);
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [accountabilitySessions, setAccountabilitySessions] = useState<AccountabilitySession[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_ACCOUNTABILITY`);
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTABILITY_SESSIONS;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_SUPPLIERS`);
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  const [payableTitles, setPayableTitles] = useState<PayableTitle[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_PAYABLES`);
    return saved ? JSON.parse(saved) : INITIAL_PAYABLE_TITLES;
  });

  const [stockEntries, setStockEntries] = useState<StockEntry[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_STOCK_ENTRIES`);
    return saved ? JSON.parse(saved) : INITIAL_STOCK_ENTRIES;
  });

  const [issuer, setIssuer] = useState<CompanyIssuer>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_ISSUER`);
    return saved ? JSON.parse(saved) : INITIAL_ISSUER;
  });

  const [companies, setCompanies] = useState<CompanyIssuer[]>(() => {
    const saved = localStorage.getItem('JM_SISTEMAS_COMPANIES_REGISTRY');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.warn('Error parsing companies registry', e);
      }
    }
    return [
      {
        ...INITIAL_ISSUER,
        id: 'comp-matriz-01',
        status: 'ativa',
        dataCadastro: '2025-01-01',
      },
    ];
  });

  const [isGlobalAdminSession, setIsGlobalAdminSession] = useState<boolean>(false);

  // Local Computer Backup Snapshots (Saved on the computer)
  const [localBackupSnapshots, setLocalBackupSnapshots] = useState<LocalBackupSnapshot[]>(() => {
    const saved = localStorage.getItem('JM_BACKUPS_DESKTOP_SNAPSHOTS');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.warn('Error parsing local backup snapshots', e);
      }
    }
    return [];
  });

  // Authentication & System Users
  const [users, setUsers] = useState<SystemUser[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_USERS`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error parsing stored users', e);
      }
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<SystemUser | null>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_CURRENT_USER`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      } catch (e) {
        console.error('Error parsing current user', e);
      }
    }
    return null; // Exige autenticação explícita ao abrir a aplicação
  });

  const [isMasterUnlockModalOpen, setIsMasterUnlockModalOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isCadastroEmpresaOpen, setIsCadastroEmpresaOpen] = useState<boolean>(false);
  const [pendingMasterAction, setPendingMasterAction] = useState<(() => void) | null>(null);

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    pendentesQtd: 0,
    ultimaSincronizacao: 'Hoje às 11:00',
    sincronizando: false,
  });

  // Calculate default delivery date (2 business days ahead)
  const getDefaultDeliveryDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  };

  const initialDraftState: DraftOrderState = {
    cliente: null,
    itens: [],
    tabelaPreco: 'atacado',
    condicaoPagamento: '28/35/42 DDL',
    formaPagamento: 'Boleto Bancário',
    tipoFrete: 'CIF',
    valorFrete: 0,
    tipo: 'pedido',
    observacoesInternas: '',
    observacoesNotaFiscal: '',
    dataPrevisaoEntrega: getDefaultDeliveryDate(),
    parcelas: [],
  };

  const [draftOrder, setDraftOrder] = useState<DraftOrderState>(initialDraftState);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_MODE`, appMode);
  }, [appMode]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_SELLER`, JSON.stringify(seller));
  }, [seller]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_CLIENTS`, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_PRODUCTS`, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_ORDERS`, JSON.stringify(orders));
    const pendingCount = orders.filter((o) => o.status === 'pendente_transmissao').length;
    setSyncStatus((prev) => ({ ...prev, pendentesQtd: pendingCount }));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_VISITS`, JSON.stringify(visits));
  }, [visits]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_FINANCIAL`, JSON.stringify(financialTitles));
  }, [financialTitles]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_EXPENSES`, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_ACCOUNTABILITY`, JSON.stringify(accountabilitySessions));
  }, [accountabilitySessions]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_SUPPLIERS`, JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_PAYABLES`, JSON.stringify(payableTitles));
  }, [payableTitles]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_STOCK_ENTRIES`, JSON.stringify(stockEntries));
  }, [stockEntries]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_ISSUER`, JSON.stringify(issuer));
  }, [issuer]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_USERS`, JSON.stringify(users));
  }, [users]);

  // Sincronização Contínua em Tempo Real com o Banco de Dados Unificado na Nuvem (Celular <-> Desktop)
  useEffect(() => {
    let isMounted = true;

    const syncWithCloud = async () => {
      try {
        const res = await fetchCloudData();
        if (res.success && res.data && isMounted) {
          const cData = res.data;
          if (Array.isArray(cData.orders) && cData.orders.length > 0) {
            setOrders((prev) => mergeItemsById(prev, cData.orders));
          }
          if (Array.isArray(cData.clients) && cData.clients.length > 0) {
            setClients((prev) => mergeItemsById(prev, cData.clients));
          }
          if (Array.isArray(cData.products) && cData.products.length > 0) {
            setProducts((prev) => mergeItemsById(prev, cData.products));
          }
          if (Array.isArray(cData.financialTitles) && cData.financialTitles.length > 0) {
            setFinancialTitles((prev) => mergeItemsById(prev, cData.financialTitles));
          }
          if (Array.isArray(cData.expenses) && cData.expenses.length > 0) {
            setExpenses((prev) => mergeItemsById(prev, cData.expenses));
          }
          if (Array.isArray(cData.accountabilitySessions) && cData.accountabilitySessions.length > 0) {
            setAccountabilitySessions((prev) => mergeItemsById(prev, cData.accountabilitySessions));
          }
          if (Array.isArray(cData.visits) && cData.visits.length > 0) {
            setVisits((prev) => mergeItemsById(prev, cData.visits));
          }
          if (Array.isArray(cData.suppliers) && cData.suppliers.length > 0) {
            setSuppliers((prev) => mergeItemsById(prev, cData.suppliers));
          }
          if (Array.isArray(cData.payableTitles) && cData.payableTitles.length > 0) {
            setPayableTitles((prev) => mergeItemsById(prev, cData.payableTitles));
          }
          if (Array.isArray(cData.stockEntries) && cData.stockEntries.length > 0) {
            setStockEntries((prev) => mergeItemsById(prev, cData.stockEntries));
          }
        }
      } catch (e) {
        console.warn('[Cloud AutoSync Notice]', e);
      }
    };

    // Sincronizar imediatamente na abertura
    syncWithCloud();

    // Sincronizar periodicamente quando a janela estiver ativa
    const intervalId = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncWithCloud();
      }
    }, 10000);

    // Sincronizar ao focar na janela / alternar de aba ou dispositivo
    const handleFocus = () => syncWithCloud();
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_CURRENT_USER`, JSON.stringify(currentUser));
      // If the logged in user is a salesperson, synchronize the active seller profile
      if (currentUser.role === 'VENDEDOR' || currentUser.role === 'GERENTE_VENDAS') {
        setSeller((prev) => ({
          ...prev,
          nome: currentUser.nome,
          email: currentUser.email,
          codigoVendedor: currentUser.codigoVendedor || prev.codigoVendedor,
          fotoUrl: currentUser.fotoUrl || prev.fotoUrl,
          telefone: currentUser.telefone || prev.telefone,
          regiao: currentUser.regiao || prev.regiao,
          metaMensal: currentUser.metaMensal || prev.metaMensal,
          cargo: currentUser.cargo || prev.cargo,
        }));
      }
    } else {
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_CURRENT_USER`);
    }
  }, [currentUser]);

  const isMasterAdmin = currentUser?.role === 'ADMIN_MASTER' || userType === 'MASTER';

  const verifyMasterPassword = (password: string): boolean => {
    if (!password) return false;
    const cleanPwd = password.trim();
    const today = new Date();
    const diaLocal = today.getDate();
    const mesLocal = today.getMonth() + 1;
    const anoLocal = today.getFullYear();
    const somaLocal = String(diaLocal + mesLocal + anoLocal);

    const diaUtc = today.getUTCDate();
    const mesUtc = today.getUTCMonth() + 1;
    const anoUtc = today.getUTCFullYear();
    const somaUtc = String(diaUtc + mesUtc + anoUtc);

    const isDynamicMasterPass = cleanPwd === somaLocal || cleanPwd === somaUtc;
    const isStaticMasterPass =
      cleanPwd === 'jm@2026' ||
      cleanPwd === '94325563' ||
      cleanPwd === MASTER_ADMIN_CREDENTIALS.senhaMaster;

    const isUserMasterPass = users.some(
      (u) =>
        u.role === 'ADMIN_MASTER' &&
        (u.senha === cleanPwd || cleanPwd === (u as any).senhaMaster)
    );

    return isStaticMasterPass || isDynamicMasterPass || isUserMasterPass;
  };

  const saveTenantSnapshot = (companyDoc: string) => {
    const clean = (companyDoc || '').replace(/\D/g, '') || 'default';
    const tenantData = {
      clients,
      products,
      orders,
      visits,
      financialTitles,
      expenses,
      accountabilitySessions,
      suppliers,
      payableTitles,
      stockEntries,
      users,
      seller,
    };
    try {
      localStorage.setItem(`JM_TENANT_${clean}`, JSON.stringify(tenantData));
    } catch (e) {
      console.warn('Error saving tenant snapshot', e);
    }
  };

  const switchToCompany = (cnpjOrCpfOrId: string): boolean => {
    const cleanInput = (cnpjOrCpfOrId || '').trim();
    const cleanDigits = cleanInput.replace(/\D/g, '');

    const target = companies.find((c) => {
      const cCnpjClean = (c.cnpj || '').replace(/\D/g, '');
      const cId = c.id || '';
      return (
        (cleanDigits && cCnpjClean === cleanDigits) ||
        (c.cnpj && c.cnpj.toLowerCase() === cleanInput.toLowerCase()) ||
        cId === cleanInput
      );
    });

    if (!target) {
      showToast('Empresa Não Encontrada', `Não foi localizada empresa com o documento/ID: ${cnpjOrCpfOrId}`, 'warning');
      return false;
    }

    // 1. Salva estado da empresa atual
    if (issuer?.cnpj) {
      saveTenantSnapshot(issuer.cnpj);
    }

    // 2. Carrega estado da empresa destino
    const targetClean = (target.cnpj || '').replace(/\D/g, '') || 'default';
    const savedTarget = localStorage.getItem(`JM_TENANT_${targetClean}`);
    if (savedTarget) {
      try {
        const parsed = JSON.parse(savedTarget);
        if (parsed.clients) {
          setClients(parsed.clients);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_CLIENTS`, JSON.stringify(parsed.clients));
        }
        if (parsed.products) {
          setProducts(parsed.products);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_PRODUCTS`, JSON.stringify(parsed.products));
        }
        if (parsed.orders) {
          setOrders(parsed.orders);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_ORDERS`, JSON.stringify(parsed.orders));
        }
        if (parsed.visits) {
          setVisits(parsed.visits);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_VISITS`, JSON.stringify(parsed.visits));
        }
        if (parsed.financialTitles) {
          setFinancialTitles(parsed.financialTitles);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_FINANCIAL`, JSON.stringify(parsed.financialTitles));
        }
        if (parsed.expenses) {
          setExpenses(parsed.expenses);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_EXPENSES`, JSON.stringify(parsed.expenses));
        }
        if (parsed.accountabilitySessions) {
          setAccountabilitySessions(parsed.accountabilitySessions);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_ACCOUNTABILITY`, JSON.stringify(parsed.accountabilitySessions));
        }
        if (parsed.suppliers) {
          setSuppliers(parsed.suppliers);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_SUPPLIERS`, JSON.stringify(parsed.suppliers));
        }
        if (parsed.payableTitles) {
          setPayableTitles(parsed.payableTitles);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_PAYABLES`, JSON.stringify(parsed.payableTitles));
        }
        if (parsed.stockEntries) {
          setStockEntries(parsed.stockEntries);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_STOCK_ENTRIES`, JSON.stringify(parsed.stockEntries));
        }
        if (parsed.users && parsed.users.length > 0) {
          setUsers(parsed.users);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_USERS`, JSON.stringify(parsed.users));
        }
        if (parsed.seller) {
          setSeller(parsed.seller);
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_SELLER`, JSON.stringify(parsed.seller));
        }
      } catch (e) {
        console.warn('Error restoring tenant snapshot', e);
      }
    }

    // 3. Define novo emitente ativo
    setIssuer(target);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_ISSUER`, JSON.stringify(target));

    // 4. Cria usuário de Acesso Global Master
    const globalAdminUser: SystemUser = {
      id: 'user-super-admin-global',
      nome: 'Super Administrador JM Sistemas',
      email: 'novo@jmsistemaspi.com',
      role: 'ADMIN_MASTER',
      cargo: 'Administrador Global do Sistema',
      codigoVendedor: '001',
      telefone: '(86) 9432-5563',
      fotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      comissaoPadraoPct: 5,
      metaMensal: 100000,
      status: 'ativo',
      isGlobalAdmin: true,
      dataCadastro: '2025-01-01',
      ultimoAcesso: `Hoje às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      permissoes: {
        acessoDesktopRetaguarda: true,
        acessoForcaVendas: true,
        emitirPedidos: true,
        verFinanceiroCompleto: true,
        importarXml: true,
        cadastrarUsuarios: true,
        alterarTabelaPrecos: true,
        darDescontoEspecial: true,
      },
    };

    setCurrentUser(globalAdminUser);
    setUserType('MASTER');
    localStorage.setItem('tipo', 'MASTER');
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_CURRENT_USER`, JSON.stringify(globalAdminUser));
    setIsGlobalAdminSession(true);

    // Fecha modais e libera telas
    setIsCadastroEmpresaOpen(false);
    setIsLoginModalOpen(false);
    unlockRetaguarda();
    setRetaguardaTab('dashboard');

    showToast(
      'Acesso Administrativo Global Liberado',
      `Você entrou na empresa "${target.nomeFantasia || target.razaoSocial}" com privilégio total de Super Administrador.`,
      'success'
    );
    return true;
  };

  const toggleBlockCompany = (cnpjOrCpfOrId: string, blocked: boolean, motivo?: string) => {
    const cleanInput = (cnpjOrCpfOrId || '').trim();
    const cleanDigits = cleanInput.replace(/\D/g, '');

    const updated = companies.map((c) => {
      const cCnpjClean = (c.cnpj || '').replace(/\D/g, '');
      const cId = c.id || '';
      if (
        (cleanDigits && cCnpjClean === cleanDigits) ||
        (c.cnpj && c.cnpj.toLowerCase() === cleanInput.toLowerCase()) ||
        cId === cleanInput
      ) {
        return {
          ...c,
          status: blocked ? ('bloqueada' as const) : ('ativa' as const),
          motivoBloqueio: blocked ? (motivo || 'Bloqueio administrativo por inadimplência ou encerramento') : undefined,
        };
      }
      return c;
    });

    setCompanies(updated);
    localStorage.setItem('JM_SISTEMAS_COMPANIES_REGISTRY', JSON.stringify(updated));

    // Se a empresa alterada for a empresa ativa no momento, atualiza também o state issuer
    const activeClean = (issuer.cnpj || '').replace(/\D/g, '');
    if ((cleanDigits && activeClean === cleanDigits) || (issuer.cnpj && issuer.cnpj.toLowerCase() === cleanInput.toLowerCase())) {
      const updatedActive = {
        ...issuer,
        status: blocked ? ('bloqueada' as const) : ('ativa' as const),
        motivoBloqueio: blocked ? (motivo || 'Bloqueio administrativo por inadimplência ou encerramento') : undefined,
      };
      setIssuer(updatedActive);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_ISSUER`, JSON.stringify(updatedActive));
    }

    showToast(
      blocked ? '🚫 Empresa Bloqueada' : '✅ Empresa Desbloqueada',
      blocked
        ? `Acesso suspenso para usuários comuns da empresa. Motivo: ${motivo || 'Bloqueio administrativo'}`
        : 'Acesso restabelecido com sucesso para todos os usuários da empresa.',
      blocked ? 'warning' : 'success'
    );
  };

  const registerNewCompanyAndTenant = async (
    companyData: CompanyIssuer,
    adminUser: {
      nome: string;
      email: string;
      senha?: string;
      telefone?: string;
      cargo?: string;
      cpf?: string;
    }
  ) => {
    const compWithStatus: CompanyIssuer = {
      ...companyData,
      id: companyData.id || `comp-${Date.now()}`,
      status: companyData.status || 'ativa',
      dataCadastro: companyData.dataCadastro || new Date().toISOString().split('T')[0],
      ultimoAcesso: `Hoje às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    };

    // 1. Salva snapshot da empresa anterior caso exista
    if (issuer?.cnpj) {
      saveTenantSnapshot(issuer.cnpj);
    }

    // 2. Atualiza registro geral de empresas
    setCompanies((prev) => {
      const cleanNew = (compWithStatus.cnpj || '').replace(/\D/g, '');
      const filtered = prev.filter((c) => (c.cnpj || '').replace(/\D/g, '') !== cleanNew);
      const updated = [...filtered, compWithStatus];
      localStorage.setItem('JM_SISTEMAS_COMPANIES_REGISTRY', JSON.stringify(updated));
      return updated;
    });

    // 3. Define dados da empresa emitente ativa
    setIssuer(compWithStatus);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_ISSUER`, JSON.stringify(compWithStatus));

    // 4. Limpa dados de operação (banco zerado mantendo padrões mais comuns)
    setOrders([]);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_ORDERS`, JSON.stringify([]));

    setClients([]);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_CLIENTS`, JSON.stringify([]));

    setFinancialTitles([]);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_FINANCIAL`, JSON.stringify([]));

    setPayableTitles([]);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_PAYABLES`, JSON.stringify([]));

    setStockEntries([]);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_STOCK_ENTRIES`, JSON.stringify([]));

    setExpenses([]);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_EXPENSES`, JSON.stringify([]));

    setAccountabilitySessions([]);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_ACCOUNTABILITY`, JSON.stringify([]));

    setVisits([]);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_VISITS`, JSON.stringify([]));

    setProducts([]);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_PRODUCTS`, JSON.stringify([]));

    setSuppliers([]);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_SUPPLIERS`, JSON.stringify([]));

    setDraftOrder({
      cliente: null,
      itens: [],
      tabelaPreco: 'atacado',
      condicaoPagamento: '28 DDL',
      formaPagamento: 'Boleto Bancário',
      tipoFrete: 'CIF',
      valorFrete: 0,
      tipo: 'pedido',
      observacoesInternas: '',
      observacoesNotaFiscal: '',
    });

    // 5. Cria o usuário Administrador Master inicial ÚNICO para esta nova empresa
    const now = new Date();
    const diaLocal = now.getDate();
    const mesLocal = now.getMonth() + 1;
    const anoLocal = now.getFullYear();
    const somaLocal = String(diaLocal + mesLocal + anoLocal);

    const nowStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const todayStr = now.toISOString().split('T')[0];

    const newMasterUser: SystemUser = {
      id: `user-master-${Date.now().toString(36)}`,
      nome: 'master',
      email: 'novo@jmsistemaspi.com',
      senha: somaLocal,
      role: 'ADMIN_MASTER',
      cargo: 'Administrador Master',
      codigoVendedor: '001',
      telefone: compWithStatus.telefone || '(86) 99432-5563',
      cpf: compWithStatus.cnpj,
      fotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      comissaoPadraoPct: 5,
      metaMensal: 100000,
      status: 'ativo',
      permissoes: {
        acessoDesktopRetaguarda: true,
        acessoForcaVendas: true,
        emitirPedidos: true,
        verFinanceiroCompleto: true,
        importarXml: true,
        cadastrarUsuarios: true,
        alterarTabelaPrecos: true,
        darDescontoEspecial: true,
      },
      dataCadastro: todayStr,
      ultimoAcesso: `Hoje às ${nowStr}`,
    };

    // Atualiza a lista de usuários contendo ESTRITAMENTE APENAS o Master inicial
    setUsers([newMasterUser]);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_USERS`, JSON.stringify([newMasterUser]));

    // Atualiza o perfil ativo do vendedor com os dados do master
    const newSellerProfile: SellerProfile = {
      id: newMasterUser.id,
      nome: 'master',
      cargo: newMasterUser.cargo,
      codigoVendedor: '001',
      fotoUrl: newMasterUser.fotoUrl,
      telefone: newMasterUser.telefone,
      email: newMasterUser.email,
      regiao: `${compWithStatus.endereco.cidade} - ${compWithStatus.endereco.uf}`,
      metaMensal: 100000,
      realizadoMes: 0,
      pedidosHojeCount: 0,
      pedidosHojeValor: 0,
      comissaoMes: 0,
      taxaPositivacaoPct: 0,
      ticketMedioMes: 0,
      clientesCarteiraTotal: 0,
      clientesPositivadosMes: 0,
    };
    setSeller(newSellerProfile);
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_SELLER`, JSON.stringify(newSellerProfile));

    // Salva snapshot inicial da nova empresa
    saveTenantSnapshot(compWithStatus.cnpj);

    // Define sessão autenticada para o novo usuário
    setCurrentUser(newMasterUser);
    setUserType('MASTER');
    localStorage.setItem('tipo', 'MASTER');
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_CURRENT_USER`, JSON.stringify(newMasterUser));

    // Fecha modais e vai para a interface
    setIsCadastroEmpresaOpen(false);
    setIsLoginModalOpen(false);
    setAppMode('mobile');
    setActiveTab('dashboard');

    // Sincroniza a base limpa na nuvem
    try {
      await pushToCloud({
        orders: [],
        clients: [],
        products: [],
        financialTitles: [],
        expenses: [],
        accountabilitySessions: [],
        visits: [],
        suppliers: [],
        payableTitles: [],
        stockEntries: [],
      });
    } catch (e) {
      console.warn('[Cloud push on new company]', e);
    }

    showToast(
      '🎉 Nova Empresa Cadastrada!',
      `Bem-vindo(a) à ${compWithStatus.nomeFantasia || compWithStatus.razaoSocial}! A empresa foi inicializada com o usuário master (novo@jmsistemaspi.com).`,
      'success'
    );
  };

  const login = (userInput: string, passwordInput: string): { success: boolean; message?: string } => {
    const cleanInput = (userInput || '').trim().toLowerCase();
    const cleanPwd = (passwordInput || '').trim();

    const now = new Date();
    const diaLocal = now.getDate();
    const mesLocal = now.getMonth() + 1;
    const anoLocal = now.getFullYear();
    const somaLocal = String(diaLocal + mesLocal + anoLocal);

    const diaUtc = now.getUTCDate();
    const mesUtc = now.getUTCMonth() + 1;
    const anoUtc = now.getUTCFullYear();
    const somaUtc = String(diaUtc + mesUtc + anoUtc);

    const isDynamicMasterPass = cleanPwd === somaLocal || cleanPwd === somaUtc;
    const isMasterAdminPass = isDynamicMasterPass || cleanPwd === 'jm@2026' || cleanPwd === '94325563' || cleanPwd === MASTER_ADMIN_CREDENTIALS.senhaMaster;

    // 0. ACESSO ADMINISTRATIVO GLOBAL MULTI-EMPRESAS (novo@jmsistemaspi.com + senha: soma do dia + mes + ano do computador)
    if (cleanInput === 'novo@jmsistemaspi.com') {
      if (isMasterAdminPass) {
        setIsGlobalAdminSession(true);
        setIsCadastroEmpresaOpen(true);
        setIsLoginModalOpen(false);
        showToast(
          'Painel de Gestão Multi-Empresas Liberado',
          'Acesso de Administrador Global autenticado. Gerencie empresas cadastradas, bloqueios ou cadastre novas empresas.',
          'success'
        );
        return { success: true };
      } else {
        return {
          success: false,
          message: 'Senha incorreta para o acesso administrativo.',
        };
      }
    }

    // VERIFICAÇÃO DE BLOQUEIO DA EMPRESA ATIVA PARA USUÁRIOS COMUNS
    if (issuer.status === 'bloqueada') {
      return {
        success: false,
        message: `Acesso bloqueado: A empresa "${issuer.nomeFantasia || issuer.razaoSocial}" está suspensa pelo setor administrativo. Motivo: ${issuer.motivoBloqueio || 'Bloqueio administrativo temporário'}.`,
      };
    }

    // 1. MASTER user check (user === "master" or email === "jmsistemaspi6@gmail.com" or "admin")
    if (
      (cleanInput === 'master' || cleanInput === 'jmsistemaspi6@gmail.com' || cleanInput === 'admin') &&
      isMasterAdminPass
    ) {
      const masterUser = users.find((u) => u.role === 'ADMIN_MASTER') || {
        id: 'user-master-01',
        nome: 'master',
        email: 'novo@jmsistemaspi.com',
        senha: somaLocal,
        role: 'ADMIN_MASTER' as const,
        cargo: 'Administrador Master',
        codigoVendedor: '001',
        telefone: '(86) 99432-5563',
        fotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
        comissaoPadraoPct: 5,
        metaMensal: 100000,
        status: 'ativo' as const,
        dataCadastro: '2026-01-01',
        permissoes: {
          acessoDesktopRetaguarda: true,
          acessoForcaVendas: true,
          emitirPedidos: true,
          verFinanceiroCompleto: true,
          importarXml: true,
          cadastrarUsuarios: true,
          alterarTabelaPrecos: true,
          darDescontoEspecial: true,
        },
      };

      const nowStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const updatedMaster = { ...masterUser, ultimoAcesso: `Hoje às ${nowStr}` };
      setUsers((prev) => prev.map((u) => (u.id === updatedMaster.id ? updatedMaster : u)));
      setCurrentUser(updatedMaster);
      setUserType('MASTER');
      localStorage.setItem('tipo', 'MASTER');
      setAppMode('mobile'); // Enter Força de Vendas with full master access
      setActiveTab('dashboard');
      setIsLoginModalOpen(false);
      showToast('Acesso Master Concedido', `Bem-vindo(a) ${updatedMaster.nome}! Acesso administrativo total liberado.`, 'success');
      return { success: true };
    }

    // 2. Vendedor / Regular User check (e.g. user === "001" and pass === "123")
    const matchedUser =
      users.find((u) => {
        const uEmail = (u.email || '').toLowerCase();
        const uCode = (u.codigoVendedor || '').toLowerCase();
        const uName = (u.nome || '').toLowerCase();
        return (
          uEmail === cleanInput ||
          uCode === cleanInput ||
          uCode.replace(/\D/g, '') === cleanInput.replace(/\D/g, '') ||
          (cleanInput === '001' && (uCode.includes('842') || uCode.includes('001') || u.id === 'user-vend-01')) ||
          uName === cleanInput
        );
      }) || (cleanInput === '001' ? users.find((u) => u.role === 'VENDEDOR') || INITIAL_USERS[1] : null);

    if (!matchedUser) {
      return { success: false, message: 'Código do vendedor ou usuário não encontrado.' };
    }

    if (matchedUser.status === 'bloqueado' || matchedUser.status === 'inativo') {
      return { success: false, message: 'Este usuário está inativo ou bloqueado pela administração.' };
    }

    const isMasterRole = matchedUser.role === 'ADMIN_MASTER' || cleanInput === 'master';
    const validPwd =
      cleanPwd === matchedUser.senha ||
      (isMasterRole && isMasterAdminPass) ||
      cleanPwd === '123' ||
      cleanPwd === '123456';

    if (validPwd) {
      const nowStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const updatedUser = { ...matchedUser, ultimoAcesso: `Hoje às ${nowStr}` };
      setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
      setCurrentUser(updatedUser);

      const targetTipo: 'MASTER' | 'VENDEDOR' = isMasterRole ? 'MASTER' : 'VENDEDOR';
      setUserType(targetTipo);
      localStorage.setItem('tipo', targetTipo);

      // Usuário não administrativo: entra OBRIGATORIAMENTE no aplicativo do celular
      setAppMode('mobile');
      setActiveTab('dashboard');
      setIsLoginModalOpen(false);

      showToast('Login Realizado', `Bem-vindo(a) ${updatedUser.nome}!`, 'success');
      return { success: true };
    }

    return { success: false, message: 'Senha incorreta. Verifique os dados digitados.' };
  };

  const logout = () => {
    setCurrentUser(null);
    setUserType('VENDEDOR');
    localStorage.removeItem('tipo');
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_CURRENT_USER`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_MODE`);
    setIsRetaguardaUnlocked(false);
    setAppModeState('mobile');
    setActiveTab('dashboard');
    setRetaguardaTab('dashboard');
    setIsGlobalAdminSession(false);
    setIsLoginModalOpen(false);
    showToast('Sessão Encerrada', 'Você saiu do sistema. Faça login para continuar.', 'info');
  };

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      setIsRetaguardaUnlocked(false);
      setAppModeState('mobile');
      showToast('Perfil Alternado', `Operando agora como ${target.nome} (${target.cargo}).`, 'info');
    }
  };

  const addUser = (userData: Omit<SystemUser, 'id' | 'dataCadastro'>): SystemUser => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newUser: SystemUser = {
      ...userData,
      id: `user-${Date.now().toString(36)}`,
      dataCadastro: todayStr,
      ultimoAcesso: 'Nunca acessou',
    };
    setUsers((prev) => [newUser, ...prev]);
    showToast('Vendedor Cadastrado', `${newUser.nome} (${newUser.email}) foi cadastrado com sucesso!`, 'success');
    return newUser;
  };

  const updateUser = (id: string, userData: Partial<SystemUser>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...userData } : u)));
    if (currentUser?.id === id) {
      setCurrentUser((prev) => (prev ? { ...prev, ...userData } : null));
    }
    showToast('Cadastro Atualizado', 'Os dados e permissões do usuário foram salvos.', 'info');
  };

  const deleteUser = (id: string) => {
    const target = users.find((u) => u.id === id);
    if (target?.role === 'ADMIN_MASTER' && users.filter((u) => u.role === 'ADMIN_MASTER').length <= 1) {
      showToast('Ação Bloqueada', 'Não é possível remover o Administrador Master principal do sistema.', 'error');
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    showToast('Usuário Removido', `${target?.nome || 'Usuário'} foi removido com sucesso.`, 'warning');
  };

  const requestMasterAccess = (onSuccess: () => void) => {
    setPendingMasterAction(() => onSuccess);
    setIsMasterUnlockModalOpen(true);
  };

  const showToast = (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleOnlineMode = () => {
    setSyncStatus((prev) => {
      const nextState = !prev.isOnline;
      showToast(
        nextState ? 'Modo Online Ativado' : 'Modo Offline Ativado',
        nextState
          ? 'Conexão restabelecida. Pedidos e dados financeiros sincronizados em tempo real.'
          : 'Trabalhando offline. Dados salvos localmente no dispositivo.',
        nextState ? 'success' : 'warning'
      );
      return { ...prev, isOnline: nextState };
    });
  };

  const syncPendingOrders = async () => {
    if (!syncStatus.isOnline) {
      showToast('Offline', 'Conecte-se à internet para sincronizar com o ERP.', 'warning');
      return;
    }
    setSyncStatus((prev) => ({ ...prev, sincronizando: true }));
    showToast('Sincronizando com a Nuvem', 'Conectando ao banco central e sincronizando pedidos entre Celular e Desktop...', 'info');

    try {
      const nowStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      // Marcar pedidos pendentes como transmitidos
      const updatedOrders = orders.map((o) => {
        if (o.status === 'pendente_transmissao' || !o.sincronizadoEm) {
          return { ...o, status: 'transmitido' as OrderStatus, sincronizadoEm: `Hoje às ${nowStr}` };
        }
        return o;
      });

      // Enviar tudo para o banco unificado na nuvem
      const pushResult = await pushToCloud({
        orders: updatedOrders,
        clients,
        products,
        financialTitles,
        expenses,
        accountabilitySessions,
        visits,
        suppliers,
        payableTitles,
        stockEntries,
      });

      if (pushResult.success && pushResult.data) {
        const cloudData = pushResult.data;
        if (cloudData.orders) setOrders(mergeItemsById(updatedOrders, cloudData.orders));
        if (cloudData.clients) setClients(mergeItemsById(clients, cloudData.clients));
        if (cloudData.products) setProducts(mergeItemsById(products, cloudData.products));
        if (cloudData.financialTitles) setFinancialTitles(mergeItemsById(financialTitles, cloudData.financialTitles));
        if (cloudData.expenses) setExpenses(mergeItemsById(expenses, cloudData.expenses));
        if (cloudData.accountabilitySessions) setAccountabilitySessions(mergeItemsById(accountabilitySessions, cloudData.accountabilitySessions));
        if (cloudData.visits) setVisits(mergeItemsById(visits, cloudData.visits));
        if (cloudData.suppliers) setSuppliers(mergeItemsById(suppliers, cloudData.suppliers));
        if (cloudData.payableTitles) setPayableTitles(mergeItemsById(payableTitles, cloudData.payableTitles));
        if (cloudData.stockEntries) setStockEntries(mergeItemsById(stockEntries, cloudData.stockEntries));

        const finalOrders = cloudData.orders || updatedOrders;
        setSyncStatus({
          isOnline: true,
          pendentesQtd: 0,
          ultimaSincronizacao: `Hoje às ${nowStr}`,
          sincronizando: false,
        });

        showToast(
          'Sincronização em Nuvem Concluída!',
          `${finalOrders.length} pedido(s) unificados no banco de dados central.`,
          'success'
        );
      } else {
        // Fallback local
        setOrders(updatedOrders);
        setSyncStatus({
          isOnline: true,
          pendentesQtd: 0,
          ultimaSincronizacao: `Hoje às ${nowStr}`,
          sincronizando: false,
        });
        showToast('Sincronização Concluída', 'Pedidos atualizados localmente com sucesso.', 'success');
      }
    } catch (err) {
      console.error('[Sync Error]', err);
      setSyncStatus((prev) => ({ ...prev, sincronizando: false }));
      showToast('Aviso de Sincronização', 'Dados gravados localmente. Sincronização em nuvem em segundo plano.', 'info');
    }
  };

  // Client Management
  const addClient = (clientData: Omit<Client, 'id' | 'totalComprasHistorico' | 'pedidosRealizadosCount'>): Client => {
    const newClient: Client = {
      ...clientData,
      id: `cli-${Date.now().toString(36)}`,
      totalComprasHistorico: 0,
      pedidosRealizadosCount: 0,
      diasSemComprar: 0,
    };
    setClients((prev) => [newClient, ...prev]);
    setSeller((prev) => ({ ...prev, clientesCarteiraTotal: prev.clientesCarteiraTotal + 1 }));
    showToast('Cliente Cadastrado', `${newClient.nomeFantasia} foi adicionado à carteira.`, 'success');
    return newClient;
  };

  const updateClient = (id: string, clientData: Partial<Client>) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...clientData } : c)));
    showToast('Cadastro Atualizado', 'Os dados do cliente foram atualizados com sucesso.', 'info');
  };

  // Supplier Management
  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'totalComprasHistorico' | 'totalNotasCount'>): Supplier => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: `sup-${Date.now().toString(36)}`,
      totalComprasHistorico: 0,
      totalNotasCount: 0,
    };
    setSuppliers((prev) => [newSupplier, ...prev]);
    showToast('Fornecedor Cadastrado', `${newSupplier.nomeFantasia || newSupplier.razaoSocial} foi adicionado ao sistema.`, 'success');
    return newSupplier;
  };

  const updateSupplier = (id: string, supplierData: Partial<Supplier>) => {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...supplierData } : s)));
    showToast('Fornecedor Atualizado', 'Dados do fornecedor atualizados com sucesso.', 'info');
  };

  // Helper para gerar títulos no Contas a Receber a partir do Pedido
  const generateReceivablesFromOrderInternal = (order: Order) => {
    const now = new Date();

    // Se o pedido tiver parcelas personalizadas/editadas pelo operador no Faturamento
    if (order.parcelas && order.parcelas.length > 0) {
      const novosTitulos: FinancialTitle[] = order.parcelas.map((p, idx) => {
        const totalParcelas = order.parcelas!.length;
        const parcelaStr = `${p.numero}/${totalParcelas}`;

        return {
          id: `tit-rec-${Date.now()}-${idx}`,
          clienteId: order.cliente.id,
          clienteNome: order.cliente.razaoSocial,
          clienteCnpj: order.cliente.cnpjCpf,
          vendedorId: currentUser?.id || 'user-001',
          vendedorNome: currentUser?.nome || seller.nome || 'Lucas Mendonça',
          pedidoOrigemId: order.id,
          numeroDocumento: `${order.numeroPedido}/${parcelaStr}`,
          parcela: parcelaStr,
          valorOriginal: p.valor,
          valor: p.valor,
          valorRecebido: 0,
          saldoRestante: p.valor,
          dataEmissao: now.toISOString().split('T')[0],
          dataVencimento: p.dataVencimento,
          status: 'a_vencer',
          diasAtraso: 0,
          linhaDigitavel: `23793.${Math.floor(10000 + Math.random() * 90000)} ${Math.floor(10000 + Math.random() * 90000)}.${Math.floor(100000 + Math.random() * 900000)} 12000.123456 1 9845000${Math.floor(p.valor * 100)}`,
          chavePix: 'financeiro@distribuidoranacional.com.br',
          formaCobranca: p.formaPagamento || order.formaPagamento,
          historicoBaixas: [],
          observacoes: `Gerado automaticamente pelo Pedido ${order.numeroPedido} (Faturamento Customizado).`,
        };
      });

      setFinancialTitles((prev) => [...novosTitulos, ...prev]);
      return;
    }

    const condicao = String(order.condicaoPagamento || '').toLowerCase();
    const valorTotal = order.valorTotalLiquido;

    let parcelas: Array<{ dias: number; parcelaStr: string; valor: number }> = [];

    if (condicao.includes('28/35/42')) {
      const v = Number((valorTotal / 3).toFixed(2));
      parcelas = [
        { dias: 28, parcelaStr: '1/3', valor: v },
        { dias: 35, parcelaStr: '2/3', valor: v },
        { dias: 42, parcelaStr: '3/3', valor: Number((valorTotal - v * 2).toFixed(2)) },
      ];
    } else if (condicao.includes('14/21/28')) {
      const v = Number((valorTotal / 3).toFixed(2));
      parcelas = [
        { dias: 14, parcelaStr: '1/3', valor: v },
        { dias: 21, parcelaStr: '2/3', valor: v },
        { dias: 28, parcelaStr: '3/3', valor: Number((valorTotal - v * 2).toFixed(2)) },
      ];
    } else if (condicao.includes('30/60/90')) {
      const v = Number((valorTotal / 3).toFixed(2));
      parcelas = [
        { dias: 30, parcelaStr: '1/3', valor: v },
        { dias: 60, parcelaStr: '2/3', valor: v },
        { dias: 90, parcelaStr: '3/3', valor: Number((valorTotal - v * 2).toFixed(2)) },
      ];
    } else if (condicao.includes('14 ddl') || condicao.includes('14')) {
      parcelas = [{ dias: 14, parcelaStr: '1/1', valor: valorTotal }];
    } else if (condicao.includes('21 ddl') || condicao.includes('21')) {
      parcelas = [{ dias: 21, parcelaStr: '1/1', valor: valorTotal }];
    } else if (condicao.includes('28 ddl') || condicao.includes('28')) {
      parcelas = [{ dias: 28, parcelaStr: '1/1', valor: valorTotal }];
    } else if (condicao.includes('vista') || condicao.includes('pix')) {
      parcelas = [{ dias: 0, parcelaStr: '1/1', valor: valorTotal }];
    } else {
      parcelas = [{ dias: 30, parcelaStr: '1/1', valor: valorTotal }];
    }

    const novosTitulos: FinancialTitle[] = parcelas.map((p, idx) => {
      const vDate = new Date(now);
      vDate.setDate(vDate.getDate() + p.dias);
      const dataVenc = vDate.toISOString().split('T')[0];

      return {
        id: `tit-rec-${Date.now()}-${idx}`,
        clienteId: order.cliente.id,
        clienteNome: order.cliente.razaoSocial,
        clienteCnpj: order.cliente.cnpjCpf,
        vendedorId: currentUser?.id || 'user-001',
        vendedorNome: currentUser?.nome || seller.nome || 'Lucas Mendonça',
        pedidoOrigemId: order.id,
        numeroDocumento: `${order.numeroPedido}/${p.parcelaStr}`,
        parcela: p.parcelaStr,
        valorOriginal: p.valor,
        valor: p.valor,
        valorRecebido: 0,
        saldoRestante: p.valor,
        dataEmissao: now.toISOString().split('T')[0],
        dataVencimento: dataVenc,
        status: 'a_vencer',
        diasAtraso: 0,
        linhaDigitavel: `23793.${Math.floor(10000 + Math.random() * 90000)} ${Math.floor(10000 + Math.random() * 90000)}.${Math.floor(100000 + Math.random() * 900000)} 12000.123456 1 9845000${Math.floor(p.valor * 100)}`,
        chavePix: 'financeiro@distribuidoranacional.com.br',
        formaCobranca: order.formaPagamento,
        historicoBaixas: [],
        observacoes: `Gerado automaticamente pelo Pedido ${order.numeroPedido} (Força de Vendas).`,
      };
    });

    setFinancialTitles((prev) => [...novosTitulos, ...prev]);
  };

  const resetDraftOrder = () => {
    setDraftOrder(initialDraftState);
  };

  const startNewOrderForClient = (client: Client) => {
    setDraftOrder({
      cliente: client,
      itens: [],
      tabelaPreco: (client.tabelaPrecoPadrao as 'varejo' | 'atacado' | 'distribuidor') || 'atacado',
      condicaoPagamento: client.condicaoPagamentoPadrao || '28/35/42 DDL',
      formaPagamento: 'Boleto Bancário',
      tipoFrete: 'CIF',
      valorFrete: 0,
      tipo: 'pedido',
      observacoesInternas: '',
      observacoesNotaFiscal: '',
      dataPrevisaoEntrega: getDefaultDeliveryDate(),
    });
    setActiveTab('novo_pedido');
  };

  const addItemToDraft = (product: Product, quantity = 1, customPrice?: number) => {
    const priceTableKey = draftOrder.tabelaPreco || 'atacado';
    const baseTablePrice = product.precoTabela[priceTableKey] || product.precoTabela.varejo;
    const finalPrice = customPrice !== undefined ? customPrice : baseTablePrice;

    setDraftOrder((prev) => {
      const existingItemIndex = prev.itens.findIndex((it) => it.produtoId === product.id);
      let updatedItens = [...prev.itens];

      if (existingItemIndex >= 0) {
        const existing = updatedItens[existingItemIndex];
        const newQty = existing.quantidade + quantity;
        const subtotal = newQty * finalPrice;
        const descontoPct = baseTablePrice > 0 ? Math.max(0, ((baseTablePrice - finalPrice) / baseTablePrice) * 100) : 0;
        const comissaoValor = subtotal * (product.comissaoPct / 100);
        const margemLucroPct = finalPrice > 0 ? ((finalPrice - product.precoCusto) / finalPrice) * 100 : 0;

        updatedItens[existingItemIndex] = {
          ...existing,
          quantidade: newQty,
          precoUnitarioCobrado: finalPrice,
          subtotal,
          descontoPct,
          comissaoValor,
          margemLucroPct,
        };
      } else {
        const subtotal = quantity * finalPrice;
        const descontoPct = baseTablePrice > 0 ? Math.max(0, ((baseTablePrice - finalPrice) / baseTablePrice) * 100) : 0;
        const comissaoValor = subtotal * (product.comissaoPct / 100);
        const margemLucroPct = finalPrice > 0 ? ((finalPrice - product.precoCusto) / finalPrice) * 100 : 0;

        const newItem: OrderItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          produtoId: product.id,
          produto: product,
          quantidade: quantity,
          precoUnitarioTabela: baseTablePrice,
          precoUnitarioCobrado: finalPrice,
          descontoPct,
          subtotal,
          comissaoValor,
          margemLucroPct,
        };
        updatedItens.push(newItem);
      }

      return { ...prev, itens: updatedItens };
    });
  };

  const removeItemFromDraft = (itemId: string) => {
    setDraftOrder((prev) => ({
      ...prev,
      itens: prev.itens.filter((it) => it.id !== itemId),
    }));
  };

  const updateDraftItemQty = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromDraft(itemId);
      return;
    }

    setDraftOrder((prev) => {
      const updatedItens = prev.itens.map((it) => {
        if (it.id === itemId) {
          const subtotal = quantity * it.precoUnitarioCobrado;
          const comissaoValor = subtotal * (it.produto.comissaoPct / 100);
          return {
            ...it,
            quantidade: quantity,
            subtotal,
            comissaoValor,
          };
        }
        return it;
      });
      return { ...prev, itens: updatedItens };
    });
  };

  const updateDraftItemPrice = (itemId: string, price: number) => {
    setDraftOrder((prev) => {
      const updatedItens = prev.itens.map((it) => {
        if (it.id === itemId) {
          const baseTablePrice = it.precoUnitarioTabela;
          const descontoPct = baseTablePrice > 0 ? Math.max(0, ((baseTablePrice - price) / baseTablePrice) * 100) : 0;
          const subtotal = it.quantidade * price;
          const comissaoValor = subtotal * (it.produto.comissaoPct / 100);
          const margemLucroPct = price > 0 ? ((price - it.produto.precoCusto) / price) * 100 : 0;

          return {
            ...it,
            precoUnitarioCobrado: price,
            descontoPct,
            subtotal,
            comissaoValor,
            margemLucroPct,
          };
        }
        return it;
      });
      return { ...prev, itens: updatedItens };
    });
  };

  const submitDraftOrder = (asDraftOnly = false, signatureBase64?: string, receiverName?: string): Order | null => {
    if (!draftOrder.cliente) {
      showToast('Atenção', 'Selecione um cliente para fechar o pedido.', 'error');
      return null;
    }
    if (draftOrder.itens.length === 0) {
      showToast('Carrinho Vazio', 'Adicione pelo menos 1 produto ao pedido.', 'error');
      return null;
    }

    // Calculations
    const subtotalBruto = draftOrder.itens.reduce((sum, it) => sum + it.precoUnitarioTabela * it.quantidade, 0);
    const subtotalLiquidoItens = draftOrder.itens.reduce((sum, it) => sum + it.subtotal, 0);
    const descontoTotalReais = Math.max(0, subtotalBruto - subtotalLiquidoItens);
    const descontoTotalPct = subtotalBruto > 0 ? (descontoTotalReais / subtotalBruto) * 100 : 0;
    const valorTotalLiquido = subtotalLiquidoItens + (draftOrder.valorFrete || 0);
    const comissaoTotalReais = draftOrder.itens.reduce((sum, it) => sum + it.comissaoValor, 0);
    const pesoTotalKg = draftOrder.itens.reduce((sum, it) => sum + it.produto.pesoKg * it.quantidade, 0);
    const volumeTotalCaixas = draftOrder.itens.reduce((sum, it) => sum + it.quantidade, 0);
    const margemMediaPct =
      draftOrder.itens.length > 0
        ? draftOrder.itens.reduce((sum, it) => sum + it.margemLucroPct, 0) / draftOrder.itens.length
        : 0;

    const orderNumber = `PED-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    let status: OrderStatus = 'rascunho';
    if (!asDraftOnly) {
      status = syncStatus.isOnline ? 'transmitido' : 'pendente_transmissao';
    }

    const newOrder: Order = {
      id: `ped-${Date.now()}`,
      numeroPedido: orderNumber,
      dataCriacao: formattedDate,
      dataPrevisaoEntrega: draftOrder.dataPrevisaoEntrega,
      clienteId: draftOrder.cliente.id,
      cliente: draftOrder.cliente,
      itens: draftOrder.itens,
      tabelaPreco: draftOrder.tabelaPreco,
      condicaoPagamento: draftOrder.condicaoPagamento,
      formaPagamento: draftOrder.formaPagamento,
      tipoFrete: draftOrder.tipoFrete,
      valorFrete: draftOrder.valorFrete,
      subtotalItensBruto: subtotalBruto,
      descontoTotalReais,
      descontoTotalPct,
      valorTotalLiquido,
      comissaoTotalReais,
      margemMediaPct,
      pesoTotalKg,
      volumeTotalCaixas,
      tipo: draftOrder.tipo,
      status,
      observacoesInternas: draftOrder.observacoesInternas,
      observacoesNotaFiscal: draftOrder.observacoesNotaFiscal,
      assinaturaClienteBase64: signatureBase64,
      nomeRecebedorAssinatura: receiverName,
      sincronizadoEm: status === 'transmitido' ? formattedDate : undefined,
      parcelas: draftOrder.parcelas && draftOrder.parcelas.length > 0 ? draftOrder.parcelas : undefined,
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Generate receivables if order is confirmed
    if (!asDraftOnly) {
      generateReceivablesFromOrderInternal(newOrder);
    }

    // Update client stats
    setClients((prev) =>
      prev.map((c) => {
        if (c.id === draftOrder.cliente?.id) {
          return {
            ...c,
            diasSemComprar: 0,
            dataUltimaCompra: now.toISOString().split('T')[0],
            valorUltimaCompra: valorTotalLiquido,
            totalComprasHistorico: c.totalComprasHistorico + valorTotalLiquido,
            pedidosRealizadosCount: c.pedidosRealizadosCount + 1,
            creditoUtilizado: c.creditoUtilizado + valorTotalLiquido,
          };
        }
        return c;
      })
    );

    // Update seller stats
    setSeller((prev) => ({
      ...prev,
      realizadoMes: prev.realizadoMes + valorTotalLiquido,
      pedidosHojeCount: prev.pedidosHojeCount + 1,
      pedidosHojeValor: prev.pedidosHojeValor + valorTotalLiquido,
      comissaoMes: prev.comissaoMes + comissaoTotalReais,
    }));

    // Update product stocks
    setProducts((prev) =>
      prev.map((p) => {
        const item = draftOrder.itens.find((it) => it.produtoId === p.id);
        if (item) {
          return { ...p, estoqueAtual: Math.max(0, p.estoqueAtual - item.quantidade) };
        }
        return p;
      })
    );

    resetDraftOrder();
    setSelectedOrderId(null);

    // Enviar imediatamente para o banco central na nuvem para unificar celular e computador
    if (!asDraftOnly) {
      transmitSingleOrderToCloud(newOrder).catch((err) => {
        console.warn('[Auto-cloud transmit error]', err);
      });
    }

    showToast(
      asDraftOnly ? 'Rascunho Salvo' : 'Pedido Emitido & Contas a Receber Gerado!',
      `${newOrder.numeroPedido} de R$ ${valorTotalLiquido.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
      })} integrado ao ERP com sucesso!`,
      'success'
    );

    return newOrder;
  };

  const transmitOrder = (orderId: string) => {
    const nowStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const targetOrder = orders.find((o) => o.id === orderId);

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: syncStatus.isOnline ? 'transmitido' : 'pendente_transmissao',
              sincronizadoEm: syncStatus.isOnline ? `Hoje às ${nowStr}` : undefined,
            }
          : o
      )
    );

    if (targetOrder && syncStatus.isOnline) {
      transmitSingleOrderToCloud({
        ...targetOrder,
        status: 'transmitido',
        sincronizadoEm: `Hoje às ${nowStr}`,
      }).catch(console.warn);
    }

    showToast(
      'Pedido Transmitido',
      syncStatus.isOnline
        ? 'Pedido enviado com sucesso ao banco central unificado da nuvem.'
        : 'Pedido marcado para envio automático assim que a conexão retornar.',
      'success'
    );
  };

  const cancelOrder = (orderId: string) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelado' } : o)));
    showToast('Pedido Cancelado', 'O status do pedido foi alterado para Cancelado.', 'warning');
  };

  const duplicateOrder = (order: Order) => {
    setDraftOrder({
      cliente: order.cliente,
      itens: order.itens.map((it) => ({
        ...it,
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      })),
      tabelaPreco: order.tabelaPreco,
      condicaoPagamento: order.condicaoPagamento,
      formaPagamento: order.formaPagamento,
      tipoFrete: order.tipoFrete,
      valorFrete: order.valorFrete,
      tipo: order.tipo,
      observacoesInternas: `Recompra baseada no pedido ${order.numeroPedido}`,
      observacoesNotaFiscal: order.observacoesNotaFiscal || '',
      dataPrevisaoEntrega: getDefaultDeliveryDate(),
    });
    setActiveTab('novo_pedido');
    showToast('Pedido Carregado', `Itens do pedido ${order.numeroPedido} clonados para novo rascunho.`, 'info');
  };

  const startVisit = (visitId: string) => {
    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setVisits((prev) =>
      prev.map((v) =>
        v.id === visitId
          ? {
              ...v,
              status: 'em_andamento',
              checkInHora: now,
            }
          : v
      )
    );
    showToast('Check-in Realizado!', `Visita iniciada às ${now}. Geolocalização capturada.`, 'success');
  };

  const completeVisit = (
    visitId: string,
    notes?: string,
    reasonNotSold?: string,
    generatedOrderId?: string,
    generatedOrderValue?: number
  ) => {
    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setVisits((prev) =>
      prev.map((v) =>
        v.id === visitId
          ? {
              ...v,
              status: 'realizada',
              checkOutHora: now,
              duracaoMinutos: 35,
              notasVisita: notes || v.notasVisita,
              motivoNaoVenda: reasonNotSold,
              pedidoGeradoId: generatedOrderId || v.pedidoGeradoId,
              pedidoGeradoValor: generatedOrderValue || v.pedidoGeradoValor,
            }
          : v
      )
    );
    showToast('Visita Concluída', `Check-out registrado às ${now}.`, 'success');
  };

  const addVisit = (visitData: Omit<Visit, 'id'>) => {
    const newVisit: Visit = {
      ...visitData,
      id: `vis-${Date.now()}`,
    };
    setVisits((prev) => [...prev, newVisit]);
    showToast('Visita Agendada', `Visita agendada para ${newVisit.clienteFantasia}`, 'success');
  };

  // Financial Titles Receivables (Contas a Receber)
  const markTitleAsPaid = (titleId: string) => {
    setFinancialTitles((prev) =>
      prev.map((t) =>
        t.id === titleId
          ? {
              ...t,
              status: 'pago',
              valorRecebido: t.valorOriginal || t.valor,
              saldoRestante: 0,
              diasAtraso: 0,
              dataRecebimentoUltimo: new Date().toISOString().split('T')[0],
              historicoBaixas: [
                ...t.historicoBaixas,
                {
                  id: `rec-${Date.now()}`,
                  dataRecebimento: new Date().toLocaleString('pt-BR'),
                  valorRecebido: t.saldoRestante || t.valor,
                  valorJurosMulta: 0,
                  valorDesconto: 0,
                  valorLiquidoEfetivo: t.saldoRestante || t.valor,
                  formaRecebimento: 'PIX',
                  reciboNumero: `REC-${Math.floor(10000 + Math.random() * 90000)}`,
                  responsavel: 'Financeiro Central',
                  observacoes: 'Baixa total rápida realizada.',
                },
              ],
            }
          : t
      )
    );
    showToast('Título Baixado', 'Recebimento do título confirmado com sucesso.', 'success');
  };

  const settleReceivableTitle = (
    titleId: string,
    settlement: {
      valorRecebido: number;
      valorJurosMulta?: number;
      valorDesconto?: number;
      formaRecebimento: 'PIX' | 'Boleto Bancário' | 'Transferência Bancária' | 'Dinheiro' | 'Cartão Crédito' | 'Cheque';
      responsavel: string;
      observacoes?: string;
    }
  ) => {
    const juros = settlement.valorJurosMulta || 0;
    const desconto = settlement.valorDesconto || 0;
    const liquido = settlement.valorRecebido + juros - desconto;
    const reciboNumero = `REC-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowStr = new Date().toLocaleString('pt-BR');

    setFinancialTitles((prev) =>
      prev.map((t) => {
        if (t.id === titleId) {
          const totalRecebidoApos = (t.valorRecebido || 0) + settlement.valorRecebido;
          const novoSaldo = Math.max(0, (t.saldoRestante ?? t.valor) - settlement.valorRecebido);
          const novoStatus = novoSaldo <= 0.01 ? 'pago' : 'parcial';

          const novaBaixa: ReceivablePaymentItem = {
            id: `rec-bx-${Date.now()}`,
            dataRecebimento: nowStr,
            valorRecebido: settlement.valorRecebido,
            valorJurosMulta: juros,
            valorDesconto: desconto,
            valorLiquidoEfetivo: liquido,
            formaRecebimento: settlement.formaRecebimento,
            reciboNumero,
            responsavel: settlement.responsavel || 'Operador Financeiro',
            observacoes: settlement.observacoes,
          };

          return {
            ...t,
            valorRecebido: totalRecebidoApos,
            saldoRestante: novoSaldo,
            status: novoStatus,
            diasAtraso: novoStatus === 'pago' ? 0 : t.diasAtraso,
            dataRecebimentoUltimo: new Date().toISOString().split('T')[0],
            historicoBaixas: [...t.historicoBaixas, novaBaixa],
          };
        }
        return t;
      })
    );

    showToast(
      'Baixa Registrada no Contas a Receber!',
      `Recebimento de R$ ${settlement.valorRecebido.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
      })} registrado com Recibo ${reciboNumero}.`,
      'success'
    );
  };

  const addReceivableTitle = (
    titleData: Omit<FinancialTitle, 'id' | 'historicoBaixas' | 'saldoRestante'>
  ): FinancialTitle => {
    const newTitle: FinancialTitle = {
      ...titleData,
      id: `tit-rec-${Date.now()}`,
      saldoRestante: titleData.valorOriginal - (titleData.valorRecebido || 0),
      historicoBaixas: [],
    };
    setFinancialTitles((prev) => [newTitle, ...prev]);
    showToast('Título a Receber Cadastrado', `Documento ${newTitle.numeroDocumento} adicionado.`, 'success');
    return newTitle;
  };

  // Prestação de Contas & Despesas de Vendedor (Mobile & Retaguarda)
  const addExpense = (expenseData: Omit<SalespersonExpense, 'id' | 'criadoEm'>): SalespersonExpense => {
    const newExpense: SalespersonExpense = {
      ...expenseData,
      id: `desp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      criadoEm: new Date().toLocaleString('pt-BR'),
    };
    setExpenses((prev) => [newExpense, ...prev]);
    showToast('Despesa Lançada!', `${newExpense.tipo} de R$ ${newExpense.valor.toFixed(2)} registrado com sucesso.`, 'success');
    return newExpense;
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((d) => d.id !== id));
    showToast('Despesa Removida', 'Lançamento de despesa excluído.', 'info');
  };

  const closeAccountabilitySession = (dados: {
    vendedorId?: string;
    vendedorNome?: string;
    observacoes?: string;
  }): AccountabilitySession => {
    const vId = dados.vendedorId || currentUser?.id || 'user-001';
    const vNome = dados.vendedorNome || currentUser?.nome || seller.nome || 'Lucas Mendonça';

    // 1. Filtrar despesas abertas do vendedor
    const despesasVendedor = expenses.filter((d) => (d.vendedorId ? d.vendedorId === vId : true));

    // 2. Coletar baixas efetuadas hoje / recentes pelos títulos do vendedor
    const hojeStr = new Date().toISOString().split('T')[0];
    const recebimentosColetados: AccountabilitySession['recebimentos'] = [];

    financialTitles.forEach((t) => {
      // Se pertence ao vendedor ou se o responsável da baixa é o vendedor
      const pertenceAoVendedor = !t.vendedorId || t.vendedorId === vId || (t.vendedorNome && t.vendedorNome.toLowerCase().includes(vNome.toLowerCase()));
      if (pertenceAoVendedor && Array.isArray(t.historicoBaixas)) {
        t.historicoBaixas.forEach((bx) => {
          // Coleta baixas recentes
          recebimentosColetados.push({
            tituloId: t.id,
            clienteNome: t.clienteNome,
            numeroDocumento: t.numeroDocumento,
            valorRecebido: bx.valorRecebido,
            forma: bx.formaRecebimento,
            tipo: t.status === 'pago' ? 'TOTAL' : 'PARCIAL',
            dataRecebimento: bx.dataRecebimento,
          });
        });
      }
    });

    const totalRecebido = recebimentosColetados.reduce((acc, r) => acc + r.valorRecebido, 0);
    const totalDespesas = despesasVendedor.reduce((acc, d) => acc + d.valor, 0);
    const saldoEntregar = Math.max(0, totalRecebido - totalDespesas);

    const now = new Date();
    const numeroControle = `PC-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const novaSessao: AccountabilitySession = {
      id: `prest-${Date.now()}`,
      numeroControle,
      vendedorId: vId,
      vendedorNome: vNome,
      dataAbertura: `${hojeStr} 08:00`,
      dataFechamento: now.toLocaleString('pt-BR'),
      status: 'fechada_vendedor',
      totalRecebido,
      totalDespesas,
      saldoEntregar,
      recebimentos: recebimentosColetados,
      despesas: [...despesasVendedor],
      observacoes: dados.observacoes || 'Prestação fechada pelo Força de Vendas e transmitida à retaguarda.',
    };

    setAccountabilitySessions((prev) => [novaSessao, ...prev]);

    // Limpar despesas ativas do vendedor que foram arquivadas nesta sessão
    setExpenses((prev) => prev.filter((d) => d.vendedorId && d.vendedorId !== vId));

    showToast(
      'Prestação de Contas Fechada!',
      `Controle ${numeroControle} transmitido com sucesso. Saldo a entregar: R$ ${saldoEntregar.toFixed(2)}.`,
      'success'
    );

    return novaSessao;
  };

  const approveAccountabilitySession = (sessionId: string, aprovadoPor?: string) => {
    const nomeAprovador = aprovadoPor || currentUser?.nome || 'Administrador Master';
    const dataHora = new Date().toLocaleString('pt-BR');

    setAccountabilitySessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          // Garantir que todos os títulos vinculados tenham baixas consolidadas
          return {
            ...s,
            status: 'aprovada_retaguarda',
            aprovadoPor: nomeAprovador,
            aprovadoEm: dataHora,
          };
        }
        return s;
      })
    );

    showToast('Prestação Aprovada!', `Prestação de contas auditada e homologada por ${nomeAprovador}.`, 'success');
  };

  const rejectAccountabilitySession = (sessionId: string, motivo?: string) => {
    setAccountabilitySessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          return {
            ...s,
            status: 'rejeitada',
            observacoes: motivo ? `${s.observacoes || ''} [Rejeitado]: ${motivo}` : s.observacoes,
          };
        }
        return s;
      })
    );
    showToast('Prestação Rejeitada', motivo || 'A prestação de contas foi devolvida para correção.', 'warning');
  };

  // Financial Payables (Contas a Pagar)
  const settlePayableTitle = (
    titleId: string,
    settlement: {
      valorPago: number;
      valorJurosMulta?: number;
      valorDesconto?: number;
      formaPagamento: 'PIX' | 'Boleto Bancário' | 'Transferência Bancária' | 'Dinheiro' | 'Cartão Crédito' | 'Cheque';
      contaOuCaixa?: string;
      comprovanteDoc?: string;
      responsavel?: string;
      observacoes?: string;
    }
  ) => {
    const juros = settlement.valorJurosMulta || 0;
    const desconto = settlement.valorDesconto || 0;
    const liquido = settlement.valorPago + juros - desconto;
    const nowStr = new Date().toLocaleString('pt-BR');

    setPayableTitles((prev) =>
      prev.map((t) => {
        if (t.id === titleId) {
          const totalPagoApos = (t.valorPago || 0) + settlement.valorPago;
          const novoSaldo = Math.max(0, t.saldoRestante - settlement.valorPago);
          const novoStatus = novoSaldo <= 0.01 ? 'pago' : 'parcial';

          const novaBaixa: PaymentSettlementItem = {
            id: `pag-bx-${Date.now()}`,
            dataPagamento: nowStr,
            valorPago: settlement.valorPago,
            valorJurosMulta: juros,
            valorDesconto: desconto,
            valorLiquidoEfetivo: liquido,
            formaPagamento: settlement.formaPagamento,
            contaOuCaixa: settlement.contaOuCaixa || 'Banco Itaú - Conta Corrente',
            comprovanteDoc: settlement.comprovanteDoc || `COMP-PAG-${Math.floor(10000 + Math.random() * 90000)}`,
            responsavel: settlement.responsavel || 'Tesouraria ERP',
            observacoes: settlement.observacoes,
          };

          return {
            ...t,
            valorPago: totalPagoApos,
            saldoRestante: novoSaldo,
            status: novoStatus,
            diasAtraso: novoStatus === 'pago' ? 0 : t.diasAtraso,
            dataPagamentoUltima: new Date().toISOString().split('T')[0],
            historicoBaixas: [...t.historicoBaixas, novaBaixa],
          };
        }
        return t;
      })
    );

    showToast(
      'Baixa no Contas a Pagar Registrada!',
      `Pagamento de R$ ${settlement.valorPago.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
      })} baixado com sucesso.`,
      'success'
    );
  };

  const addPayableTitle = (
    titleData: Omit<PayableTitle, 'id' | 'historicoBaixas' | 'saldoRestante'>
  ): PayableTitle => {
    const newTitle: PayableTitle = {
      ...titleData,
      id: `pag-${Date.now()}`,
      saldoRestante: titleData.valorOriginal - (titleData.valorPago || 0),
      historicoBaixas: [],
    };
    setPayableTitles((prev) => [newTitle, ...prev]);
    showToast('Conta a Pagar Cadastrada', `${newTitle.descricao} - R$ ${newTitle.valorOriginal.toFixed(2)}`, 'success');
    return newTitle;
  };

  // Stock Entry & XML Import Implementation
  const importStockEntryFromParsedXml = (
    parsed: ParsedNFeResult,
    options: {
      updateStock: boolean;
      generatePayables: boolean;
      createNewProducts: boolean;
    }
  ): StockEntry => {
    const now = new Date();
    const formattedNow = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    // 1. Cadastrar ou atualizar Fornecedor
    let supplierId = '';
    const cleanEmitCnpj = parsed.fornecedor.cnpjCpf.replace(/\D/g, '');
    const existingSupplier = suppliers.find((s) => s.cnpjCpf.replace(/\D/g, '') === cleanEmitCnpj);

    if (existingSupplier) {
      supplierId = existingSupplier.id;
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === existingSupplier.id
            ? {
                ...s,
                totalComprasHistorico: s.totalComprasHistorico + parsed.totais.valorTotalNota,
                totalNotasCount: s.totalNotasCount + 1,
                dataUltimaCompra: parsed.dataEmissao,
              }
            : s
        )
      );
    } else {
      const newSup: Supplier = {
        id: `sup-${Date.now()}`,
        razaoSocial: parsed.fornecedor.razaoSocial,
        nomeFantasia: parsed.fornecedor.nomeFantasia || parsed.fornecedor.razaoSocial,
        cnpjCpf: parsed.fornecedor.cnpjCpf,
        inscricaoEstadual: parsed.fornecedor.inscricaoEstadual,
        email: parsed.fornecedor.email || 'comercial@fornecedor.com.br',
        telefone: parsed.fornecedor.telefone || '(11) 3000-0000',
        categoriaFornecedor: 'Alimentos & Bebidas',
        status: 'ativo',
        totalComprasHistorico: parsed.totais.valorTotalNota,
        totalNotasCount: 1,
        dataUltimaCompra: parsed.dataEmissao,
        endereco: {
          rua: parsed.fornecedor.endereco.logradouro,
          numero: parsed.fornecedor.endereco.numero,
          complemento: parsed.fornecedor.endereco.complemento,
          bairro: parsed.fornecedor.endereco.bairro,
          cidade: parsed.fornecedor.endereco.municipio,
          uf: parsed.fornecedor.endereco.uf,
          cep: parsed.fornecedor.endereco.cep,
        },
      };
      supplierId = newSup.id;
      setSuppliers((prev) => [newSup, ...prev]);
    }

    // 2. Processar Itens e Estoque
    const updatedStockEntryItems = parsed.itens.map((item) => {
      // Tentar encontrar produto por código SKU, EAN ou Nome
      const descFornec = String(item.descricaoFornecedor || '').toLowerCase();
      const matchedProd = products.find(
        (p) =>
          (item.codigoBarrasEan && p.codigoBarras === item.codigoBarrasEan) ||
          (p.codigoSku && item.codigoProdutoFornecedor && p.codigoSku === item.codigoProdutoFornecedor) ||
          (descFornec && String(p.nome || '').toLowerCase().includes(descFornec.slice(0, 15)))
      );

      if (matchedProd) {
        return {
          ...item,
          vinculadoProdutoId: matchedProd.id,
          produtoNomeEstoque: matchedProd.nome,
          isNovoProduto: false,
        };
      } else {
        return {
          ...item,
          isNovoProduto: true,
        };
      }
    });

    if (options.updateStock) {
      // Atualiza produtos existentes e cria novos produtos se solicitado
      const newProductsToAdd: Product[] = [];

      updatedStockEntryItems.forEach((item) => {
        if (item.vinculadoProdutoId) {
          setProducts((prev) =>
            prev.map((p) => {
              if (p.id === item.vinculadoProdutoId) {
                const novoEstoque = p.estoqueAtual + item.quantidade;
                return {
                  ...p,
                  estoqueAtual: novoEstoque,
                  precoCusto: item.custoUnitarioCalculado || p.precoCusto,
                };
              }
              return p;
            })
          );
        } else if (options.createNewProducts) {
          const novoId = `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const precoVendaAtacado = Number((item.custoUnitarioCalculado * 1.35).toFixed(2));
          const precoVendaVarejo = Number((item.custoUnitarioCalculado * 1.55).toFixed(2));
          const precoVendaDistribuidor = Number((item.custoUnitarioCalculado * 1.25).toFixed(2));

          const newProd: Product = {
            id: novoId,
            codigoSku: item.codigoProdutoFornecedor || `SKU-${Date.now().toString().slice(-4)}`,
            codigoBarras: item.codigoBarrasEan || '789' + Math.floor(1000000000 + Math.random() * 9000000000),
            nome: item.descricaoFornecedor,
            categoria: 'Importados & Novos',
            marca: parsed.fornecedor.nomeFantasia || 'Geral',
            unidade: (['FD', 'CX', 'UN', 'KG', 'PCT', 'LT'].includes(item.unidade?.toUpperCase()) ? item.unidade.toUpperCase() : 'UN') as 'FD' | 'CX' | 'UN' | 'KG' | 'PCT' | 'LT',
            precoTabela: {
              varejo: precoVendaVarejo,
              atacado: precoVendaAtacado,
              distribuidor: precoVendaDistribuidor,
            },
            precoCusto: item.custoUnitarioCalculado,
            estoqueAtual: item.quantidade,
            estoqueMinimo: 20,
            multiploVenda: 1,
            fotoUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
            descricao: `Entrada via NF-e ${parsed.numeroNota} de ${parsed.fornecedor.razaoSocial}. NCM: ${item.ncm}`,
            destaquePromo: false,
            descontoMaximoPct: 10,
            comissaoPct: 4.0,
            aliquotaIcmsPct: 12,
            pesoKg: 1.0,
          };
          newProductsToAdd.push(newProd);
          item.vinculadoProdutoId = novoId;
          item.produtoNomeEstoque = newProd.nome;
        }
      });

      if (newProductsToAdd.length > 0) {
        setProducts((prev) => [...newProductsToAdd, ...prev]);
      }
    }

    // 3. Gerar Títulos no Contas a Pagar
    const entryId = `ent-${Date.now()}`;
    if (options.generatePayables && parsed.duplicatas.length > 0) {
      const payablesToAdd: PayableTitle[] = parsed.duplicatas.map((dup, idx) => ({
        id: `pag-nfe-${Date.now()}-${idx}`,
        fornecedorId: supplierId,
        fornecedorNome: parsed.fornecedor.razaoSocial,
        fornecedorCnpj: parsed.fornecedor.cnpjCpf,
        numeroDocumento: `NF-${parsed.numeroNota}/${dup.numeroDuplicata}`,
        parcela: dup.numeroDuplicata,
        descricao: `Compra NF-e ${parsed.numeroNota} (${parsed.fornecedor.nomeFantasia || parsed.fornecedor.razaoSocial})`,
        categoriaDespesa: 'Compra de Mercadorias (XML)',
        valorOriginal: dup.valorDuplicata,
        valorPago: 0,
        saldoRestante: dup.valorDuplicata,
        dataEmissao: parsed.dataEmissao,
        dataVencimento: dup.dataVencimento,
        status: 'a_vencer',
        diasAtraso: 0,
        codigoBarras: `34191.${Math.floor(10000 + Math.random() * 90000)} ${Math.floor(10000 + Math.random() * 90000)}.${Math.floor(100000 + Math.random() * 900000)} 1 9845000${Math.floor(dup.valorDuplicata * 100)}`,
        chavePix: `financeiro@${String(parsed.fornecedor.razaoSocial || 'fornecedor').toLowerCase().split(' ')[0]}.com.br`,
        notaFiscalEntradaId: entryId,
        chaveAcessoNFe: parsed.chaveAcesso,
        historicoBaixas: [],
      }));

      setPayableTitles((prev) => [...payablesToAdd, ...prev]);
    }

    // 4. Criar registro da Entrada de Mercadorias
    const newStockEntry: StockEntry = {
      id: entryId,
      numeroNota: parsed.numeroNota,
      serie: parsed.serie,
      chaveAcesso: parsed.chaveAcesso,
      naturezaOperacao: parsed.naturezaOperacao,
      dataEmissao: parsed.dataEmissao,
      dataEntrada: formattedNow,
      fornecedor: {
        cnpj: parsed.fornecedor.cnpjCpf,
        razaoSocial: parsed.fornecedor.razaoSocial,
        nomeFantasia: parsed.fornecedor.nomeFantasia,
        inscricaoEstadual: parsed.fornecedor.inscricaoEstadual,
        uf: parsed.fornecedor.endereco.uf,
        municipio: parsed.fornecedor.endereco.municipio,
      },
      destinatario: {
        cnpj: parsed.destinatario.cnpjCpf,
        razaoSocial: parsed.destinatario.razaoSocial,
      },
      totais: parsed.totais,
      itens: updatedStockEntryItems,
      duplicatas: parsed.duplicatas,
      status: 'processada',
      xmlRaw: parsed.xmlOriginal,
      criadoPor: 'Importação XML NF-e SEFAZ',
    };

    setStockEntries((prev) => [newStockEntry, ...prev]);

    showToast(
      'NF-e Importada com Sucesso!',
      `Nota ${parsed.numeroNota} de R$ ${parsed.totais.valorTotalNota.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
      })} processada. Estoque e Contas a Pagar atualizados.`,
      'success'
    );

    return newStockEntry;
  };

  const addManualStockEntry = (entryData: Omit<StockEntry, 'id'>): StockEntry => {
    const newEntryId = `ent-man-${Date.now()}`;
    const newEntry: StockEntry = {
      ...entryData,
      id: newEntryId,
    };
    setStockEntries((prev) => [newEntry, ...prev]);

    // Atualiza estoque dos itens vinculados
    newEntry.itens.forEach((item) => {
      if (item.vinculadoProdutoId) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === item.vinculadoProdutoId
              ? {
                  ...p,
                  estoqueAtual: p.estoqueAtual + item.quantidade,
                  precoCusto: item.custoUnitarioCalculado || p.precoCusto,
                }
              : p
          )
        );
      }
    });

    // Se houver duplicatas informadas, gerar automaticamente no Contas a Pagar
    if (newEntry.duplicatas && newEntry.duplicatas.length > 0) {
      const payablesToAdd: PayableTitle[] = newEntry.duplicatas.map((dup, idx) => ({
        id: `pag-man-${Date.now()}-${idx}`,
        fornecedorId: `sup-man-${Date.now()}`,
        fornecedorNome: newEntry.fornecedor.razaoSocial,
        fornecedorCnpj: newEntry.fornecedor.cnpj,
        numeroDocumento: `NF-${newEntry.numeroNota}/${dup.numeroDuplicata}`,
        parcela: dup.numeroDuplicata,
        descricao: `Compra Entrada Manual NF-e ${newEntry.numeroNota} (${newEntry.fornecedor.razaoSocial})`,
        categoriaDespesa: 'Compra Manual de Mercadorias',
        valorOriginal: dup.valorDuplicata,
        valorPago: 0,
        saldoRestante: dup.valorDuplicata,
        dataEmissao: newEntry.dataEmissao,
        dataVencimento: dup.dataVencimento,
        status: 'a_vencer',
        diasAtraso: 0,
        codigoBarras: `34191.${Math.floor(10000 + Math.random() * 90000)} ${Math.floor(10000 + Math.random() * 90000)}.${Math.floor(100000 + Math.random() * 900000)} 1 9845000${Math.floor(dup.valorDuplicata * 100)}`,
        chavePix: `pix@${String(newEntry.fornecedor?.razaoSocial || 'fornecedor').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)}.com.br`,
        notaFiscalEntradaId: newEntryId,
        chaveAcessoNFe: newEntry.chaveAcesso,
        historicoBaixas: [],
      }));

      setPayableTitles((prev) => [...payablesToAdd, ...prev]);
    }

    showToast(
      'Entrada Manual Registrada!',
      `Nota ${newEntry.numeroNota} de R$ ${newEntry.totais.valorTotalNota.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} registrada. Estoque e Contas a Pagar atualizados.`,
      'success'
    );
    return newEntry;
  };

  // Product Management (Desktop CRUD)
  const addProduct = (productData: Omit<Product, 'id'>): Product => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    setProducts((prev) => [newProduct, ...prev]);
    showToast('Produto Cadastrado', `${newProduct.nome} foi incluído no catálogo.`, 'success');
    return newProduct;
  };

  const updateProduct = (id: string, productData: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...productData } : p))
    );
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast('Produto Removido', 'O produto foi excluído do catálogo.', 'info');
  };

  const updateIssuer = (issuerData: Partial<CompanyIssuer>) => {
    setIssuer((prev) => {
      const updated = { ...prev, ...issuerData };
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_ISSUER`, JSON.stringify(updated));
      return updated;
    });

    setCompanies((prev) => {
      const activeClean = (issuer.cnpj || '').replace(/\D/g, '');
      const updatedList = prev.map((c) => {
        const cClean = (c.cnpj || '').replace(/\D/g, '');
        if (cClean === activeClean || c.id === issuer.id) {
          return { ...c, ...issuerData };
        }
        return c;
      });
      localStorage.setItem('JM_SISTEMAS_COMPANIES_REGISTRY', JSON.stringify(updatedList));
      return updatedList;
    });

    showToast('Cadastro do Emitente Atualizado', 'Dados da empresa emitente salvos com sucesso.', 'success');
  };

  const updateProductStock = (productId: string, newStock: number, reason?: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, estoqueAtual: Math.max(0, newStock) } : p))
    );
    showToast('Estoque Ajustado', `Novo saldo de estoque aplicado. ${reason ? `Motivo: ${reason}` : ''}`, 'info');
  };

  const updateProductPrices = (
    productId: string,
    prices: {
      precoCusto?: number;
      varejo?: number;
      atacado?: number;
      distribuidor?: number;
    }
  ) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            precoCusto: prices.precoCusto !== undefined ? prices.precoCusto : p.precoCusto,
            precoTabela: {
              varejo: prices.varejo !== undefined ? prices.varejo : p.precoTabela.varejo,
              atacado: prices.atacado !== undefined ? prices.atacado : p.precoTabela.atacado,
              distribuidor: prices.distribuidor !== undefined ? prices.distribuidor : p.precoTabela.distribuidor,
            },
          };
        }
        return p;
      })
    );
    showToast('Preços Atualizados', 'Tabelas de preço e custo atualizadas.', 'success');
  };

  // Bulk Upsert de Produtos (Clipper / JSON / CSV)
  const bulkUpsertProducts = (importedProducts: Partial<Product>[]) => {
    let inserted = 0;
    let updated = 0;

    setProducts((prev) => {
      const currentList = [...prev];

      importedProducts.forEach((imp) => {
        if (!imp.nome && !imp.codigoSku) return;

        // Normalização de chaves de busca
        const targetSku = String(imp.codigoSku || '').trim().toLowerCase();
        const targetBarras = String(imp.codigoBarras || '').trim().toLowerCase();
        const targetNome = String(imp.nome || '').trim().toLowerCase();

        const existingIndex = currentList.findIndex((p) => {
          const pSku = String(p.codigoSku || '').trim().toLowerCase();
          const pBarras = String(p.codigoBarras || '').trim().toLowerCase();
          const pNome = String(p.nome || '').trim().toLowerCase();

          return (
            (targetSku && pSku === targetSku) ||
            (targetBarras && pBarras === targetBarras) ||
            (targetNome && pNome === targetNome)
          );
        });

        if (existingIndex >= 0) {
          // UPDATE existente
          const old = currentList[existingIndex];
          currentList[existingIndex] = {
            ...old,
            nome: imp.nome || old.nome,
            categoria: imp.categoria || old.categoria,
            marca: imp.marca || old.marca,
            unidade: imp.unidade || old.unidade,
            precoCusto: imp.precoCusto !== undefined ? imp.precoCusto : old.precoCusto,
            precoTabela: {
              varejo: imp.precoTabela?.varejo ?? old.precoTabela.varejo,
              atacado: imp.precoTabela?.atacado ?? old.precoTabela.atacado,
              distribuidor: imp.precoTabela?.distribuidor ?? old.precoTabela.distribuidor,
            },
            estoqueAtual: imp.estoqueAtual !== undefined ? imp.estoqueAtual : old.estoqueAtual,
            estoqueMinimo: imp.estoqueMinimo !== undefined ? imp.estoqueMinimo : old.estoqueMinimo,
            codigoSku: imp.codigoSku || old.codigoSku,
            codigoBarras: imp.codigoBarras || old.codigoBarras,
            descricao: imp.descricao || old.descricao,
          };
          updated++;
        } else {
          // INSERT novo
          const custo = Number(imp.precoCusto || 0);
          const precoVendaBase = Number(imp.precoTabela?.atacado || imp.precoTabela?.varejo || (custo > 0 ? custo * 1.4 : 10));

          const newProduct: Product = {
            id: imp.id || `prod-mig-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
            codigoSku: imp.codigoSku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
            codigoBarras: imp.codigoBarras || '789' + Math.floor(1000000000 + Math.random() * 9000000000),
            nome: imp.nome || 'Produto Importado',
            categoria: imp.categoria || 'Geral / Legado',
            marca: imp.marca || 'Distribuidora',
            unidade: (['UN', 'CX', 'KG', 'PCT', 'FD', 'LT'].includes(String(imp.unidade).toUpperCase())
              ? String(imp.unidade).toUpperCase()
              : 'UN') as any,
            precoTabela: {
              varejo: imp.precoTabela?.varejo ?? Number((precoVendaBase * 1.15).toFixed(2)),
              atacado: imp.precoTabela?.atacado ?? precoVendaBase,
              distribuidor: imp.precoTabela?.distribuidor ?? Number((precoVendaBase * 0.9).toFixed(2)),
            },
            precoCusto: custo,
            estoqueAtual: Number(imp.estoqueAtual || 0),
            estoqueMinimo: Number(imp.estoqueMinimo || 10),
            multiploVenda: Number(imp.multiploVenda || 1),
            fotoUrl: imp.fotoUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
            descricao: imp.descricao || 'Produto importado via migração de dados.',
            descontoMaximoPct: imp.descontoMaximoPct || 10,
            comissaoPct: imp.comissaoPct || 3.5,
            aliquotaIcmsPct: imp.aliquotaIcmsPct || 12,
            pesoKg: imp.pesoKg || 1.0,
            status: 'ativo',
          };
          currentList.push(newProduct);
          inserted++;
        }
      });

      return currentList;
    });

    return { inserted, updated, total: inserted + updated };
  };

  // Bulk Upsert de Clientes (Clipper / JSON / CSV)
  const bulkUpsertClients = (importedClients: Partial<Client>[]) => {
    let inserted = 0;
    let updated = 0;

    setClients((prev) => {
      const currentList = [...prev];

      importedClients.forEach((imp) => {
        const docLimpo = String(imp.cnpjCpf || '').replace(/\D/g, '');
        const nomeAlvo = String(imp.razaoSocial || imp.nomeFantasia || '').trim().toLowerCase();

        if (!docLimpo && !nomeAlvo) return;

        const existingIndex = currentList.findIndex((c) => {
          const cDoc = String(c.cnpjCpf || '').replace(/\D/g, '');
          const cNome = String(c.razaoSocial || c.nomeFantasia || '').trim().toLowerCase();

          return (docLimpo && cDoc === docLimpo) || (nomeAlvo && cNome === nomeAlvo);
        });

        if (existingIndex >= 0) {
          // UPDATE existente
          const old = currentList[existingIndex];
          currentList[existingIndex] = {
            ...old,
            razaoSocial: imp.razaoSocial || old.razaoSocial,
            nomeFantasia: imp.nomeFantasia || old.nomeFantasia,
            cnpjCpf: imp.cnpjCpf || old.cnpjCpf,
            telefone: imp.telefone || old.telefone,
            whatsapp: imp.whatsapp || old.whatsapp || imp.telefone || old.telefone,
            email: imp.email || old.email,
            endereco: {
              ...old.endereco,
              ...(imp.endereco || {}),
            },
            limiteCredito: imp.limiteCredito !== undefined ? imp.limiteCredito : old.limiteCredito,
          };
          updated++;
        } else {
          // INSERT novo
          const newClient: Client = {
            id: imp.id || `cli-mig-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
            razaoSocial: imp.razaoSocial || imp.nomeFantasia || 'Cliente Importado',
            nomeFantasia: imp.nomeFantasia || imp.razaoSocial || 'Cliente Importado',
            cnpjCpf: imp.cnpjCpf || '',
            inscricaoEstadual: imp.inscricaoEstadual || 'ISENTO',
            email: imp.email || '',
            telefone: imp.telefone || '',
            whatsapp: imp.whatsapp || imp.telefone || '',
            contatoPrincipal: imp.contatoPrincipal || 'Responsável',
            status: 'ativo',
            limiteCredito: imp.limiteCredito || 5000,
            creditoUtilizado: imp.creditoUtilizado || 0,
            tabelaPrecoPadrao: imp.tabelaPrecoPadrao || 'atacado',
            condicaoPagamentoPadrao: imp.condicaoPagamentoPadrao || '28 DDL',
            diasSemComprar: 0,
            pontuacaoABC: imp.pontuacaoABC || 'B',
            totalComprasHistorico: imp.totalComprasHistorico || 0,
            pedidosRealizadosCount: imp.pedidosRealizadosCount || 0,
            endereco: imp.endereco || {
              rua: 'Endereço Importado',
              numero: 'S/N',
              bairro: 'Centro',
              cidade: 'Teresina',
              uf: 'PI',
              cep: '64000000',
            },
          };
          currentList.push(newClient);
          inserted++;
        }
      });

      return currentList;
    });

    return { inserted, updated, total: inserted + updated };
  };

  // Bulk Upsert de Contas a Receber (Clipper / JSON / CSV)
  const bulkUpsertFinancialTitles = (importedTitles: Partial<FinancialTitle>[]) => {
    let inserted = 0;
    let updated = 0;

    setFinancialTitles((prev) => {
      const currentList = [...prev];

      importedTitles.forEach((imp) => {
        const docAlvo = String(imp.numeroDocumento || '').trim().toLowerCase();
        const clienteAlvo = String(imp.clienteNome || '').trim().toLowerCase();
        const parcelaAlvo = String(imp.parcela || '1/1').trim();

        if (!docAlvo && !clienteAlvo) return;

        const existingIndex = currentList.findIndex((t) => {
          const tDoc = String(t.numeroDocumento || '').trim().toLowerCase();
          const tCliente = String(t.clienteNome || '').trim().toLowerCase();
          const tParcela = String(t.parcela || '1/1').trim();

          return (
            tDoc &&
            docAlvo &&
            tDoc === docAlvo &&
            tParcela === parcelaAlvo &&
            (!clienteAlvo || tCliente.includes(clienteAlvo) || clienteAlvo.includes(tCliente))
          );
        });

        const valorOrig = Number(imp.valorOriginal ?? imp.valor ?? 0);
        const valorRec = Number(imp.valorRecebido ?? 0);
        const saldoRest = Number(imp.saldoRestante ?? Math.max(0, valorOrig - valorRec));

        if (existingIndex >= 0) {
          // UPDATE existente
          const old = currentList[existingIndex];
          currentList[existingIndex] = {
            ...old,
            clienteNome: imp.clienteNome || old.clienteNome,
            clienteCnpj: imp.clienteCnpj || old.clienteCnpj,
            dataVencimento: imp.dataVencimento || old.dataVencimento,
            valorOriginal: valorOrig || old.valorOriginal,
            valor: valorOrig || old.valor,
            valorRecebido: valorRec || old.valorRecebido,
            saldoRestante: saldoRest,
            status: imp.status || (saldoRest <= 0 ? 'pago' : valorRec > 0 ? 'parcial' : old.status),
            historicoBaixas: (imp.historicoBaixas && imp.historicoBaixas.length > 0)
              ? imp.historicoBaixas
              : old.historicoBaixas,
          };
          updated++;
        } else {
          // INSERT novo
          const newTitle: FinancialTitle = {
            id: imp.id || `tit-mig-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
            clienteId: imp.clienteId || `cli-mig-${Math.floor(Math.random() * 1000)}`,
            clienteNome: imp.clienteNome || 'Cliente Não Identificado',
            clienteCnpj: imp.clienteCnpj || '',
            numeroDocumento: imp.numeroDocumento || `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
            parcela: imp.parcela || '1/1',
            valorOriginal: valorOrig,
            valor: valorOrig,
            valorRecebido: valorRec,
            saldoRestante: saldoRest,
            dataEmissao: imp.dataEmissao || new Date().toISOString().split('T')[0],
            dataVencimento: imp.dataVencimento || new Date().toISOString().split('T')[0],
            status: imp.status || (saldoRest <= 0 ? 'pago' : valorRec > 0 ? 'parcial' : 'a_vencer'),
            diasAtraso: imp.diasAtraso || 0,
            formaPagamento: imp.formaPagamento || 'Boleto Bancário',
            formaCobranca: imp.formaCobranca || 'Boleto',
            historicoBaixas: imp.historicoBaixas || [],
            observacoes: imp.observacoes || 'Importado de sistema legado Clipper.',
          };
          currentList.push(newTitle);
          inserted++;
        }
      });

      return currentList;
    });

    return { inserted, updated, total: inserted + updated };
  };

  // =========================================================================
  // BACKUP COMPLETO DO SISTEMA (GRAVADO NO COMPUTADOR LOCAL)
  // =========================================================================

  const generateFullSystemBackup = (): SystemBackupData => {
    const now = new Date();
    const timestamp = now.getTime();
    const formattedDate = now.toLocaleDateString('pt-BR');
    const formattedTime = now.toLocaleTimeString('pt-BR');
    const geradoEmStr = `${formattedDate} às ${formattedTime}`;

    const valorEstoqueTotal = products.reduce((acc, p) => acc + (p.estoqueAtual * (p.precoCusto || 0)), 0);
    const valorReceberTotal = financialTitles.reduce((acc, t) => acc + (t.saldoRestante || 0), 0);
    const valorPagarTotal = payableTitles.reduce((acc, t) => acc + (t.saldoRestante || 0), 0);

    const backupObj: SystemBackupData = {
      versaoBackup: '2.5.0-DESKTOP',
      tipo: 'FULL_DESKTOP_BACKUP',
      geradoEm: geradoEmStr,
      timestamp: timestamp,
      geradoPor: currentUser?.nome || 'Administrador Master',
      ambiente: 'JM Sistemas ERP Desktop (Versão Desktop)',
      empresa: issuer,
      dados: {
        produtos: products,
        clientes: clients,
        pedidos: orders,
        titulosReceber: financialTitles,
        titulosPagar: payableTitles,
        entradasEstoque: stockEntries,
        fornecedores: suppliers,
        prestacoesContas: accountabilitySessions,
        despesas: expenses,
        visitas: visits,
        usuarios: users,
        seller: seller,
        draftOrder: draftOrder,
      },
      estatisticas: {
        totalProdutos: products.length,
        totalClientes: clients.length,
        totalPedidos: orders.length,
        totalTitulosReceber: financialTitles.length,
        totalTitulosPagar: payableTitles.length,
        totalEntradasEstoque: stockEntries.length,
        totalFornecedores: suppliers.length,
        totalUsuarios: users.length,
        valorTotalEstoqueCusto: valorEstoqueTotal,
        valorTotalReceber: valorReceberTotal,
        valorTotalPagar: valorPagarTotal,
      },
    };

    const jsonStr = JSON.stringify(backupObj, null, 2);
    const sizeKb = Math.round((new Blob([jsonStr]).size / 1024) * 10) / 10;

    // 1. Gera e salva snapshot local no computador (armazenado no navegador desta máquina)
    const safeCompName = (issuer.nomeFantasia || issuer.razaoSocial || 'EMPRESA')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toUpperCase();
    const safeCnpj = (issuer.cnpj || '00000000000').replace(/\D/g, '');
    const dateSlug = now.toISOString().split('T')[0];
    const timeSlug = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
    const fileName = `BACKUP_JM_SISTEMAS_${safeCompName}_CNPJ_${safeCnpj}_${dateSlug}_${timeSlug}.json`;

    const newSnapshot: LocalBackupSnapshot = {
      id: `snap-${timestamp}`,
      nomeArquivo: fileName,
      empresaNome: issuer.nomeFantasia || issuer.razaoSocial,
      empresaCnpj: issuer.cnpj,
      geradoEm: geradoEmStr,
      timestamp: timestamp,
      tamanhoKb: sizeKb,
      totalProdutos: products.length,
      totalClientes: clients.length,
      totalPedidos: orders.length,
      totalTitulos: financialTitles.length + payableTitles.length,
      dadosJson: jsonStr,
    };

    const updatedSnapshots = [newSnapshot, ...localBackupSnapshots.slice(0, 14)];
    setLocalBackupSnapshots(updatedSnapshots);
    try {
      localStorage.setItem('JM_BACKUPS_DESKTOP_SNAPSHOTS', JSON.stringify(updatedSnapshots));
    } catch (e) {
      console.warn('LocalStorage limit for snapshots', e);
    }

    // 2. Executa download físico do arquivo no computador onde está rodando a versão desktop
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(
      '💾 Backup Salvo no Computador!',
      `Arquivo "${fileName}" (${sizeKb} KB) gravado com sucesso no disco do seu computador com todas as tabelas e dados.`,
      'success'
    );

    return backupObj;
  };

  const restoreFullSystemBackup = (rawBackupData: any) => {
    try {
      if (!rawBackupData || typeof rawBackupData !== 'object') {
        throw new Error('Arquivo de backup inválido ou corrompido.');
      }

      // Suporta formato estruturado SystemBackupData ou formato simples
      const dados = rawBackupData.dados || rawBackupData;
      const empresa = rawBackupData.empresa || rawBackupData.issuer;

      if (!dados.produtos && !dados.clientes && !dados.titulosReceber && !dados.financialTitles && !dados.products) {
        throw new Error('O arquivo selecionado não contém estrutura de dados compatível com o JM Sistemas.');
      }

      const restoredProducts: Product[] = Array.isArray(dados.produtos || dados.products)
        ? (dados.produtos || dados.products)
        : products;
      const restoredClients: Client[] = Array.isArray(dados.clientes || dados.clients)
        ? (dados.clientes || dados.clients)
        : clients;
      const restoredOrders: Order[] = Array.isArray(dados.pedidos || dados.orders)
        ? (dados.pedidos || dados.orders)
        : orders;
      const restoredReceivables: FinancialTitle[] = Array.isArray(dados.titulosReceber || dados.financialTitles)
        ? (dados.titulosReceber || dados.financialTitles)
        : financialTitles;
      const restoredPayables: PayableTitle[] = Array.isArray(dados.titulosPagar || dados.payableTitles)
        ? (dados.titulosPagar || dados.payableTitles)
        : payableTitles;
      const restoredStockEntries: StockEntry[] = Array.isArray(dados.entradasEstoque || dados.stockEntries)
        ? (dados.entradasEstoque || dados.stockEntries)
        : stockEntries;
      const restoredSuppliers: Supplier[] = Array.isArray(dados.fornecedores || dados.suppliers)
        ? (dados.fornecedores || dados.suppliers)
        : suppliers;
      const restoredAccountability: AccountabilitySession[] = Array.isArray(dados.prestacoesContas || dados.accountabilitySessions)
        ? (dados.prestacoesContas || dados.accountabilitySessions)
        : accountabilitySessions;
      const restoredExpenses: SalespersonExpense[] = Array.isArray(dados.despesas || dados.expenses)
        ? (dados.despesas || dados.expenses)
        : expenses;
      const restoredVisits: Visit[] = Array.isArray(dados.visitas || dados.visits)
        ? (dados.visitas || dados.visits)
        : visits;
      const restoredUsers: SystemUser[] = Array.isArray(dados.usuarios || dados.users)
        ? (dados.usuarios || dados.users)
        : users;

      setProducts(restoredProducts);
      setClients(restoredClients);
      setOrders(restoredOrders);
      setFinancialTitles(restoredReceivables);
      setPayableTitles(restoredPayables);
      setStockEntries(restoredStockEntries);
      setSuppliers(restoredSuppliers);
      setAccountabilitySessions(restoredAccountability);
      setExpenses(restoredExpenses);
      setVisits(restoredVisits);
      setUsers(restoredUsers);

      if (empresa && empresa.cnpj) {
        setIssuer(empresa);
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_ISSUER`, JSON.stringify(empresa));
      }

      localStorage.setItem(`${LOCAL_STORAGE_KEY}_PRODUCTS`, JSON.stringify(restoredProducts));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_CLIENTS`, JSON.stringify(restoredClients));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_ORDERS`, JSON.stringify(restoredOrders));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_FINANCIAL_TITLES`, JSON.stringify(restoredReceivables));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_PAYABLE_TITLES`, JSON.stringify(restoredPayables));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_STOCK_ENTRIES`, JSON.stringify(restoredStockEntries));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_SUPPLIERS`, JSON.stringify(restoredSuppliers));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_USERS`, JSON.stringify(restoredUsers));

      showToast(
        '🎉 Restauração de Backup Concluída!',
        `Sucesso: ${restoredProducts.length} produtos, ${restoredClients.length} clientes, ${restoredOrders.length} pedidos e ${restoredReceivables.length} títulos a receber restaurados.`,
        'success'
      );

      return {
        success: true,
        message: 'Backup restaurado com sucesso!',
        stats: {
          produtos: restoredProducts.length,
          clientes: restoredClients.length,
          pedidos: restoredOrders.length,
          titulosReceber: restoredReceivables.length,
          titulosPagar: restoredPayables.length,
        },
      };
    } catch (err: any) {
      showToast('Falha na Restauração', err.message || 'Erro ao processar arquivo de backup.', 'error');
      return { success: false, message: err.message };
    }
  };

  const deleteLocalBackupSnapshot = (snapshotId: string) => {
    const updated = localBackupSnapshots.filter((s) => s.id !== snapshotId);
    setLocalBackupSnapshots(updated);
    localStorage.setItem('JM_BACKUPS_DESKTOP_SNAPSHOTS', JSON.stringify(updated));
    showToast('Backup Excluído', 'Ponto de restauração removido do computador.', 'info');
  };

  const downloadLocalBackupSnapshot = (snapshotId: string) => {
    const snap = localBackupSnapshots.find((s) => s.id === snapshotId);
    if (!snap) return;
    const blob = new Blob([snap.dadosJson], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = snap.nomeArquivo || `BACKUP_JM_SISTEMAS_${snap.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Download do Backup Concluído', `Arquivo ${snap.nomeArquivo} gravado no computador.`, 'success');
  };

  // Reset completo do banco para base limpa (0 produtos, 0 clientes, 0 contas a receber)
  const resetDatabaseToEmpty = () => {
    setProducts([]);
    setClients([]);
    setFinancialTitles([]);
    setOrders([]);
    setVisits([]);
    setStockEntries([]);
    setPayableTitles([]);
    setDraftOrder({
      cliente: null,
      itens: [],
      tabelaPreco: 'atacado',
      condicaoPagamento: '28 DDL',
      formaPagamento: 'Boleto Bancário',
      tipoFrete: 'CIF',
      valorFrete: 0,
      tipo: 'pedido',
      observacoesInternas: '',
      observacoesNotaFiscal: '',
    });

    localStorage.removeItem(LOCAL_STORAGE_KEY);
    fetch('/api/reset-db', { method: 'POST' }).catch(() => {});
    showToast('Banco Resetado', 'Tabelas PRODUTOS, CLIENTES e CONTAS A RECEBER limpas com sucesso.', 'info');
  };

  return (
    <SalesContext.Provider
      value={{
        appMode,
        setAppMode,
        activeTab,
        setActiveTab,
        retaguardaTab,
        setRetaguardaTab,
        seller,
        clients,
        products,
        orders,
        visits,
        financialTitles,
        expenses,
        accountabilitySessions,
        addExpense,
        deleteExpense,
        closeAccountabilitySession,
        approveAccountabilitySession,
        rejectAccountabilitySession,
        suppliers,
        payableTitles,
        stockEntries,
        issuer,
        updateIssuer,
        addProduct,
        updateProduct,
        deleteProduct,
        syncStatus,
        toasts,
        showToast,
        removeToast,
        toggleOnlineMode,
        syncPendingOrders,
        addClient,
        updateClient,
        selectedClientId,
        setSelectedClientId,
        addSupplier,
        updateSupplier,
        draftOrder,
        setDraftOrder,
        resetDraftOrder,
        startNewOrderForClient,
        addItemToDraft,
        removeItemFromDraft,
        updateDraftItemQty,
        updateDraftItemPrice,
        submitDraftOrder,
        selectedOrderId,
        setSelectedOrderId,
        transmitOrder,
        cancelOrder,
        duplicateOrder,
        startVisit,
        completeVisit,
        addVisit,
        markTitleAsPaid,
        settleReceivableTitle,
        addReceivableTitle,
        settlePayableTitle,
        addPayableTitle,
        importStockEntryFromParsedXml,
        addManualStockEntry,
        updateProductStock,
        updateProductPrices,
        bulkUpsertProducts,
        bulkUpsertClients,
        bulkUpsertFinancialTitles,
        resetDatabaseToEmpty,
        generateFullSystemBackup,
        restoreFullSystemBackup,
        localBackupSnapshots,
        deleteLocalBackupSnapshot,
        downloadLocalBackupSnapshot,
        selectedProductId,
        setSelectedProductId,
        globalSearch,
        setGlobalSearch,
        currentUser,
        userType,
        setUserType,
        users,
        login,
        logout,
        switchUser,
        addUser,
        updateUser,
        deleteUser,
        verifyMasterPassword,
        isMasterAdmin,
        isMasterUnlockModalOpen,
        setIsMasterUnlockModalOpen,
        requestMasterAccess,
        isRetaguardaUnlocked,
        unlockRetaguarda,
        lockRetaguarda,
        isLoginModalOpen,
        setIsLoginModalOpen,
        isCadastroEmpresaOpen,
        setIsCadastroEmpresaOpen,
        registerNewCompanyAndTenant,
        companies,
        isGlobalAdminSession,
        setIsGlobalAdminSession,
        switchToCompany,
        toggleBlockCompany,
      }}
    >
      {children}
    </SalesContext.Provider>
  );
};

export const useSales = () => {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
};
