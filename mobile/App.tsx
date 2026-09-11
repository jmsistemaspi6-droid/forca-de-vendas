import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ShoppingCart,
  Users,
  BarChart3,
  FileText,
  Wallet,
  LogOut,
  ArrowLeft,
  Plus,
  Search,
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  ChevronRight,
  RefreshCw,
  Building2,
  Trash2,
  Shield,
  DollarSign,
  TrendingUp,
  AlertCircle,
} from 'lucide-react-native';

import {
  getActiveCompanyCnpj,
  setActiveCompanyCnpj,
  checkBackendHealth,
  fetchCloudData,
  pushCloudData,
  sendOrderToCloud,
  DEFAULT_CNPJ,
} from './src/services/api';

// Tipos
export interface Client {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpjCpf: string;
  telefone: string;
  cidade: string;
  uf: string;
  endereco?: string;
}

export interface Product {
  id: string;
  codigo: string;
  descricao: string;
  precoVenda: number;
  unidade: string;
  estoqueAtual: number;
  categoria?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  codigo: string;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export interface Order {
  id: string;
  numeroPedido: number;
  dataEmissao: string;
  clienteId: string;
  clienteNome: string;
  clienteCnpj: string;
  itens: OrderItem[];
  valorTotal: number;
  formaPagamento: string;
  condicaoPagamento: string;
  status: 'PENDENTE' | 'TRANSMITIDO' | 'FATURADO';
  transmitidoNuvem: boolean;
  empresaCnpj: string;
}

export interface FinancialTitle {
  id: string;
  numeroTitulo: string;
  clienteNome: string;
  valor: number;
  vencimento: string;
  status: 'A_VENCER' | 'VENCIDO' | 'PAGO';
}

// Dados Iniciais Realistas
const INITIAL_CLIENTS: Client[] = [
  { id: 'c1', razaoSocial: 'Auto Peças & Mecânica Central Ltda', nomeFantasia: 'Auto Peças Central', cnpjCpf: '11.222.333/0001-44', telefone: '(86) 99812-3456', cidade: 'Teresina', uf: 'PI', endereco: 'Av. Frei Serafim, 1200' },
  { id: 'c2', razaoSocial: 'Posto e Centro Automotivo Alvorada', nomeFantasia: 'Auto Center Alvorada', cnpjCpf: '22.333.444/0001-55', telefone: '(86) 98822-1100', cidade: 'Parnaíba', uf: 'PI', endereco: 'Av. São Sebastião, 450' },
  { id: 'c3', razaoSocial: 'Distribuidora de Peças São José ME', nomeFantasia: 'Peças São José', cnpjCpf: '33.444.555/0001-66', telefone: '(89) 99432-8877', cidade: 'Picos', uf: 'PI', endereco: 'Rua Coelho Rodrigues, 88' },
  { id: 'c4', razaoSocial: 'Comercial de Lubrificantes e Filtros Norte', nomeFantasia: 'Norte Lubrificantes', cnpjCpf: '44.555.666/0001-77', telefone: '(86) 98111-9988', cidade: 'Floriano', uf: 'PI', endereco: 'Rodovia BR-230, Km 4' },
];

const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', codigo: 'PROD-001', descricao: 'Óleo Motor Sintético 5W30 1L', precoVenda: 45.0, unidade: 'UN', estoqueAtual: 120, categoria: 'Lubrificantes' },
  { id: 'p2', codigo: 'PROD-002', descricao: 'Filtro de Óleo Lubrificante PSL55', precoVenda: 28.5, unidade: 'UN', estoqueAtual: 85, categoria: 'Filtros' },
  { id: 'p3', codigo: 'PROD-003', descricao: 'Pastilha de Freio Dianteira Cerâmica', precoVenda: 145.0, unidade: 'JG', estoqueAtual: 40, categoria: 'Freios' },
  { id: 'p4', codigo: 'PROD-004', descricao: 'Fluido de Freio DOT 4 500ml', precoVenda: 32.0, unidade: 'UN', estoqueAtual: 60, categoria: 'Fluidos' },
  { id: 'p5', codigo: 'PROD-005', descricao: 'Bateria Automotiva 60Ah Selada', precoVenda: 420.0, unidade: 'UN', estoqueAtual: 15, categoria: 'Elétrica' },
  { id: 'p6', codigo: 'PROD-006', descricao: 'Vela de Ignição Iridium GPower', precoVenda: 38.0, unidade: 'UN', estoqueAtual: 90, categoria: 'Motor' },
];

const INITIAL_TITLES: FinancialTitle[] = [
  { id: 't1', numeroTitulo: 'DUP-4081', clienteNome: 'Auto Peças Central', valor: 1450.0, vencimento: '15/09/2026', status: 'A_VENCER' },
  { id: 't2', numeroTitulo: 'DUP-4055', clienteNome: 'Auto Center Alvorada', valor: 2890.5, vencimento: '05/09/2026', status: 'VENCIDO' },
  { id: 't3', numeroTitulo: 'DUP-3990', clienteNome: 'Peças São José', valor: 870.0, vencimento: '28/08/2026', status: 'PAGO' },
  { id: 't4', numeroTitulo: 'DUP-4099', clienteNome: 'Norte Lubrificantes', valor: 3120.0, vencimento: '22/09/2026', status: 'A_VENCER' },
];

export default function App() {
  // Navegação: 'home' exibe os 5 cards principais exatamente como na tela web
  const [currentView, setCurrentView] = useState<'home' | 'pedidos' | 'novo_pedido' | 'clientes' | 'dashboard' | 'relatorios' | 'financeiro'>('home');

  // Estados dos Dados
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [financialTitles, setFinancialTitles] = useState<FinancialTitle[]>(INITIAL_TITLES);

  // Estados de Nuvem & Empresa
  const [activeCnpj, setActiveCnpjState] = useState<string>(DEFAULT_CNPJ);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isCnpjModalOpen, setIsCnpjModalOpen] = useState<boolean>(false);
  const [tempCnpjInput, setTempCnpjInput] = useState<string>('');

  // Estados de busca & filtros
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [ordersFilter, setOrdersFilter] = useState<'todos' | 'transmitidos' | 'pendentes'>('todos');

  // Estados do Formulário de Novo Pedido
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [cartItems, setCartItems] = useState<{ [productId: string]: number }>({});
  const [condicaoPagamento, setCondicaoPagamento] = useState<string>('30 Dias');
  const [formaPagamento, setFormaPagamento] = useState<string>('Boleto Bancário');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);

  // Carregar dados salvos no AsyncStorage ao iniciar
  useEffect(() => {
    async function loadData() {
      try {
        const savedCnpj = await getActiveCompanyCnpj();
        setActiveCnpjState(savedCnpj);
        setTempCnpjInput(savedCnpj);

        const savedOrders = await AsyncStorage.getItem(`@jm_orders_${savedCnpj}`);
        if (savedOrders) {
          setOrders(JSON.parse(savedOrders));
        }

        const health = await checkBackendHealth();
        setIsOnline(health.online);
      } catch (err) {
        console.warn('Erro ao carregar dados:', err);
      }
    }
    loadData();
  }, []);

  // Salvar pedidos
  const saveOrders = async (newOrders: Order[]) => {
    setOrders(newOrders);
    try {
      await AsyncStorage.setItem(`@jm_orders_${activeCnpj}`, JSON.stringify(newOrders));
    } catch (e) {
      console.warn('Erro ao salvar no storage:', e);
    }
  };

  // Trocar CNPJ da empresa
  const handleSwitchCnpj = async (newCnpj: string) => {
    const clean = newCnpj.replace(/\D/g, '').trim() || DEFAULT_CNPJ;
    await setActiveCompanyCnpj(clean);
    setActiveCnpjState(clean);
    setIsCnpjModalOpen(false);

    const savedOrders = await AsyncStorage.getItem(`@jm_orders_${clean}`);
    setOrders(savedOrders ? JSON.parse(savedOrders) : []);

    Alert.alert('Empresa Conectada', `Aplicativo apontado para o banco do CNPJ ${clean}.`);
    const health = await checkBackendHealth();
    setIsOnline(health.online);
  };

  // Sincronizar com a Nuvem
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const pending = orders.filter((o) => !o.transmitidoNuvem);
      if (pending.length > 0) {
        await pushCloudData({ orders: pending });
      }

      const res = await fetchCloudData();
      if (res.success && res.data) {
        if (Array.isArray(res.data.orders) && res.data.orders.length > 0) {
          saveOrders(res.data.orders);
        }
        if (Array.isArray(res.data.clients) && res.data.clients.length > 0) {
          setClients(res.data.clients);
        }
        if (Array.isArray(res.data.products) && res.data.products.length > 0) {
          setProducts(res.data.products);
        }
        setIsOnline(true);
        Alert.alert('Sincronização', 'Dados atualizados com sucesso com o servidor em nuvem!');
      } else {
        Alert.alert('Sincronização', res.error || 'Nuvem consultada com sucesso.');
      }
    } catch (e: any) {
      Alert.alert('Aviso', 'Não foi possível conectar ao servidor. Operando em modo offline.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Carrinho de Compras
  const updateProductQty = (prodId: string, delta: number) => {
    setCartItems((prev) => {
      const curr = prev[prodId] || 0;
      const next = curr + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[prodId];
        return copy;
      }
      return { ...prev, [prodId]: next };
    });
  };

  const calculateCartTotal = () => {
    let sum = 0;
    Object.entries(cartItems).forEach(([pId, qty]) => {
      const p = products.find((item) => item.id === pId);
      if (p) sum += p.precoVenda * qty;
    });
    return sum;
  };

  const totalCartCount = useMemo(() => {
    return Object.values(cartItems).reduce((a, b) => a + b, 0);
  }, [cartItems]);

  // Finalizar e Emitir Pedido
  const handleFinalizeOrder = async () => {
    if (!selectedClient) {
      Alert.alert('Atenção', 'Selecione um cliente para o pedido.');
      return;
    }
    const itemKeys = Object.keys(cartItems);
    if (itemKeys.length === 0) {
      Alert.alert('Atenção', 'Adicione pelo menos um produto ao pedido.');
      return;
    }

    setIsSubmittingOrder(true);
    const orderItems: OrderItem[] = itemKeys.map((pId) => {
      const p = products.find((item) => item.id === pId)!;
      const q = cartItems[pId];
      return {
        id: `item-${Date.now()}-${pId}`,
        productId: p.id,
        codigo: p.codigo,
        descricao: p.descricao,
        quantidade: q,
        precoUnitario: p.precoVenda,
        subtotal: p.precoVenda * q,
      };
    });

    const totalVal = calculateCartTotal();
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      numeroPedido: orders.length + 101,
      dataEmissao: new Date().toLocaleDateString('pt-BR'),
      clienteId: selectedClient.id,
      clienteNome: selectedClient.nomeFantasia || selectedClient.razaoSocial,
      clienteCnpj: selectedClient.cnpjCpf,
      itens: orderItems,
      valorTotal: totalVal,
      formaPagamento: formaPagamento,
      condicaoPagamento: condicaoPagamento,
      status: 'PENDENTE',
      transmitidoNuvem: false,
      empresaCnpj: activeCnpj,
    };

    // Tentar envio imediato
    try {
      const cloudRes = await sendOrderToCloud(newOrder);
      if (cloudRes.success) {
        newOrder.transmitidoNuvem = true;
        newOrder.status = 'TRANSMITIDO';
      }
    } catch (e) {
      // Salva offline
    }

    const updated = [newOrder, ...orders];
    saveOrders(updated);
    setIsSubmittingOrder(false);

    // Resetar formulário
    setSelectedClient(null);
    setCartItems({});
    Alert.alert(
      'Sucesso!',
      `Pedido #${newOrder.numeroPedido} emitido com sucesso! ${newOrder.transmitidoNuvem ? 'Transmitido para a nuvem.' : 'Gravado offline no celular.'}`,
      [{ text: 'Ver Pedidos', onPress: () => setCurrentView('pedidos') }]
    );
  };

  // Métricas do Dashboard
  const metrics = useMemo(() => {
    const totalVendido = orders.reduce((sum, o) => sum + o.valorTotal, 0);
    const totalPedidos = orders.length;
    const ticketMedio = totalPedidos > 0 ? totalVendido / totalPedidos : 0;
    const metaMes = 50000;
    const atingimento = metaMes > 0 ? (totalVendido / metaMes) * 100 : 0;
    return { totalVendido, totalPedidos, ticketMedio, metaMes, atingimento };
  }, [orders]);

  // Filtro de Pedidos
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.clienteNome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.numeroPedido.toString().includes(searchQuery);
      if (ordersFilter === 'transmitidos') return matchSearch && o.transmitidoNuvem;
      if (ordersFilter === 'pendentes') return matchSearch && !o.transmitidoNuvem;
      return matchSearch;
    });
  }, [orders, searchQuery, ordersFilter]);

  // Filtro de Clientes
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const q = searchQuery.toLowerCase();
      return (
        c.razaoSocial.toLowerCase().includes(q) ||
        c.nomeFantasia.toLowerCase().includes(q) ||
        c.cnpjCpf.includes(q) ||
        c.cidade.toLowerCase().includes(q)
      );
    });
  }, [clients, searchQuery]);

  // Filtro de Produtos
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase();
      return p.descricao.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q);
    });
  }, [products, searchQuery]);

  // =========================================================================
  // 1. TELA PRINCIPAL: EXATAMENTE IGUAL À TELA WEB COM OS 5 GRANDES CARDS
  // =========================================================================
  const renderHomeScreen = () => {
    return (
      <View style={styles.homeContainer}>
        {/* HEADER: Logo JM Sistemas + Força de Vendas + Botão Sair */}
        <View style={styles.homeHeader}>
          {/* Status Nuvem / CNPJ à esquerda */}
          <TouchableOpacity
            style={[styles.cloudPill, isOnline ? styles.cloudPillOnline : styles.cloudPillOffline]}
            onPress={() => setIsCnpjModalOpen(true)}
          >
            <View style={[styles.dotIndicator, isOnline ? { backgroundColor: '#10B981' } : { backgroundColor: '#F43F5E' }]} />
            <Text style={[styles.cloudPillText, isOnline ? { color: '#059669' } : { color: '#E11D48' }]}>
              {isOnline ? 'Online' : 'Offline'} • CNPJ
            </Text>
          </TouchableOpacity>

          {/* Logo Centralizado */}
          <View style={styles.headerLogoBox}>
            <View style={styles.shieldIconBox}>
              <Shield size={24} color="#2563EB" />
            </View>
            <Text style={styles.headerBrandTitle}>JM SISTEMAS</Text>
            <Text style={styles.headerBrandSubtitle}>FORÇA DE VENDAS</Text>
          </View>

          {/* Botão Sair no canto direito */}
          <TouchableOpacity
            style={styles.exitBtnTop}
            onPress={() => {
              Alert.alert('Sair do Aplicativo', 'Deseja realmente sair?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sair', style: 'destructive', onPress: () => Alert.alert('Sessão encerrada') },
              ]);
            }}
          >
            <LogOut size={14} color="#E11D48" />
            <Text style={styles.exitBtnTopText}>Sair</Text>
          </TouchableOpacity>
        </View>

        {/* CONTEÚDO DOS 5 CARDS GIGANTES DE 140PX */}
        <ScrollView style={styles.homeBody} contentContainerStyle={styles.homeBodyContent} showsVerticalScrollIndicator={false}>
          <View style={styles.cardsGrid}>
            {/* CARD 1: PEDIDOS */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.bigCard}
              onPress={() => {
                setSearchQuery('');
                setCurrentView('pedidos');
              }}
            >
              <View style={[styles.bigCardIconBox, { backgroundColor: '#DBEAFE' }]}>
                <ShoppingCart size={32} color="#3B82F6" />
              </View>
              <Text style={styles.bigCardTitle}>Pedidos</Text>
              {orders.length > 0 && (
                <Text style={styles.cardCounterBadge}>{orders.length} pedidos</Text>
              )}
            </TouchableOpacity>

            {/* CARD 2: CLIENTES */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.bigCard}
              onPress={() => {
                setSearchQuery('');
                setCurrentView('clientes');
              }}
            >
              <View style={[styles.bigCardIconBox, { backgroundColor: '#D1FAE5' }]}>
                <Users size={32} color="#10B981" />
              </View>
              <Text style={styles.bigCardTitle}>Clientes</Text>
              <Text style={styles.cardCounterBadge}>{clients.length} cadastros</Text>
            </TouchableOpacity>

            {/* CARD 3: DASHBOARD */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.bigCard}
              onPress={() => setCurrentView('dashboard')}
            >
              <View style={[styles.bigCardIconBox, { backgroundColor: '#EDE9FE' }]}>
                <BarChart3 size={32} color="#8B5CF6" />
              </View>
              <Text style={styles.bigCardTitle}>Dashboard</Text>
              <Text style={styles.cardCounterBadge}>Indicadores</Text>
            </TouchableOpacity>

            {/* CARD 4: RELATÓRIOS */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.bigCard}
              onPress={() => setCurrentView('relatorios')}
            >
              <View style={[styles.bigCardIconBox, { backgroundColor: '#FEF3C7' }]}>
                <FileText size={32} color="#F59E0B" />
              </View>
              <Text style={styles.bigCardTitle}>Relatórios</Text>
              <Text style={styles.cardCounterBadge}>Faturamento</Text>
            </TouchableOpacity>

            {/* CARD 5: FINANCEIRO (LARGURA TOTAL / COLUNA DUPLA) */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.financialWideCard}
              onPress={() => setCurrentView('financeiro')}
            >
              <View style={[styles.bigCardIconBox, { backgroundColor: '#D1FAE5' }]}>
                <Wallet size={32} color="#059669" />
              </View>
              <View style={styles.financialCardTextCol}>
                <Text style={styles.bigCardTitle}>Financeiro</Text>
                <Text style={styles.financialSubtitle}>Contas a receber dos clientes</Text>
              </View>
              <ChevronRight size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* BARRA DE SINCRONIZAÇÃO EM NUVEM POR CNPJ */}
          <View style={styles.syncBanner}>
            <View style={styles.syncBannerInfo}>
              <Building2 size={16} color="#0284C7" />
              <Text style={styles.syncBannerText} numberOfLines={1}>
                Empresa: {activeCnpj}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.syncBannerBtn}
              onPress={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color="#0284C7" />
              ) : (
                <>
                  <RefreshCw size={13} color="#0284C7" style={{ marginRight: 4 }} />
                  <Text style={styles.syncBannerBtnText}>Sincronizar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* BOTÃO INFERIOR: SAIR DO APLICATIVO */}
          <TouchableOpacity
            style={styles.bottomExitBtn}
            onPress={() => {
              Alert.alert('Sair do Aplicativo', 'Deseja realmente sair?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sair', style: 'destructive', onPress: () => Alert.alert('Sessão finalizada') },
              ]);
            }}
          >
            <LogOut size={18} color="#E11D48" style={{ marginRight: 8 }} />
            <Text style={styles.bottomExitBtnText}>Sair do Aplicativo</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  // =========================================================================
  // 2. SUB-TELA: PEDIDOS (LISTA DE PEDIDOS + BOTÃO + NOVO PEDIDO)
  // =========================================================================
  const renderOrdersScreen = () => {
    return (
      <View style={styles.subScreenContainer}>
        {/* Barra Superior de Navegação */}
        <View style={styles.subHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentView('home')}>
            <ArrowLeft size={20} color="#1E293B" />
            <Text style={styles.backButtonText}>Início</Text>
          </TouchableOpacity>
          <Text style={styles.subHeaderTitle}>Pedidos de Venda</Text>
          <TouchableOpacity
            style={styles.newOrderHeaderButton}
            onPress={() => {
              setSelectedClient(null);
              setCartItems({});
              setCurrentView('novo_pedido');
            }}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.newOrderHeaderButtonText}>Novo</Text>
          </TouchableOpacity>
        </View>

        {/* Barra de Busca e Filtros */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={16} color="#64748B" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por cliente ou número..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            style={[styles.filterPill, ordersFilter === 'todos' && styles.filterPillActive]}
            onPress={() => setOrdersFilter('todos')}
          >
            <Text style={[styles.filterPillText, ordersFilter === 'todos' && styles.filterPillTextActive]}>
              Todos ({orders.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, ordersFilter === 'transmitidos' && styles.filterPillActive]}
            onPress={() => setOrdersFilter('transmitidos')}
          >
            <Text style={[styles.filterPillText, ordersFilter === 'transmitidos' && styles.filterPillTextActive]}>
              Sincronizados ({orders.filter((o) => o.transmitidoNuvem).length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, ordersFilter === 'pendentes' && styles.filterPillActive]}
            onPress={() => setOrdersFilter('pendentes')}
          >
            <Text style={[styles.filterPillText, ordersFilter === 'pendentes' && styles.filterPillTextActive]}>
              Pendentes ({orders.filter((o) => !o.transmitidoNuvem).length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Pedidos */}
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ShoppingCart size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Nenhum pedido encontrado</Text>
            <Text style={styles.emptySubtitle}>Toque no botão "+ Novo" acima para emitir seu primeiro pedido.</Text>
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            renderItem={({ item }) => (
              <View style={styles.orderListItem}>
                <View style={styles.orderListItemHeader}>
                  <Text style={styles.orderNumberTitle}>Pedido #{item.numeroPedido}</Text>
                  <View
                    style={[
                      styles.orderBadge,
                      item.transmitidoNuvem ? styles.orderBadgeSuccess : styles.orderBadgeWarning,
                    ]}
                  >
                    {item.transmitidoNuvem ? (
                      <CheckCircle2 size={12} color="#059669" style={{ marginRight: 4 }} />
                    ) : (
                      <Clock size={12} color="#D97706" style={{ marginRight: 4 }} />
                    )}
                    <Text
                      style={[
                        styles.orderBadgeText,
                        item.transmitidoNuvem ? { color: '#059669' } : { color: '#D97706' },
                      ]}
                    >
                      {item.transmitidoNuvem ? 'Nuvem OK' : 'Pendente'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.orderClientName}>{item.clienteNome}</Text>
                <Text style={styles.orderMetaText}>
                  Emissão: {item.dataEmissao} • {item.itens.length} {item.itens.length === 1 ? 'item' : 'itens'}
                </Text>
                <Text style={styles.orderPaymentText}>
                  {item.formaPagamento} • {item.condicaoPagamento}
                </Text>

                <View style={styles.orderFooter}>
                  <Text style={styles.orderTotalLabel}>VALOR TOTAL:</Text>
                  <Text style={styles.orderTotalValue}>
                    R$ {item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
            )}
          />
        )}
      </View>
    );
  };

  // =========================================================================
  // 3. SUB-TELA: NOVO PEDIDO DE VENDA COMPLETO
  // =========================================================================
  const renderNewOrderScreen = () => {
    return (
      <View style={styles.subScreenContainer}>
        {/* Header com Voltar */}
        <View style={styles.subHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentView('pedidos')}>
            <ArrowLeft size={20} color="#1E293B" />
            <Text style={styles.backButtonText}>Pedidos</Text>
          </TouchableOpacity>
          <Text style={styles.subHeaderTitle}>Emitir Pedido</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {/* ETAPA 1: CLIENTE */}
          <Text style={styles.stepTitle}>1. Selecione o Cliente</Text>
          {selectedClient ? (
            <View style={styles.selectedClientCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedClientName}>{selectedClient.nomeFantasia || selectedClient.razaoSocial}</Text>
                <Text style={styles.selectedClientSub}>CNPJ: {selectedClient.cnpjCpf}</Text>
                <Text style={styles.selectedClientSub}>Cidade: {selectedClient.cidade} - {selectedClient.uf}</Text>
              </View>
              <TouchableOpacity
                style={styles.changeClientBtn}
                onPress={() => setSelectedClient(null)}
              >
                <Text style={styles.changeClientBtnText}>Trocar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.helperText}>Toque em um cliente para selecioná-lo:</Text>
              {clients.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.clientPickItem}
                  onPress={() => setSelectedClient(c)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.clientPickName}>{c.nomeFantasia || c.razaoSocial}</Text>
                    <Text style={styles.clientPickSub}>{c.cnpjCpf} • {c.cidade}-{c.uf}</Text>
                  </View>
                  <ChevronRight size={18} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ETAPA 2: PRODUTOS & CARRINHO */}
          <Text style={[styles.stepTitle, { marginTop: 24 }]}>2. Produtos e Quantidades</Text>
          {products.map((p) => {
            const qty = cartItems[p.id] || 0;
            return (
              <View key={p.id} style={styles.productPickCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productPickDesc}>{p.descricao}</Text>
                  <Text style={styles.productPickCode}>Cód: {p.codigo} • Estoque: {p.estoqueAtual} {p.unidade}</Text>
                  <Text style={styles.productPickPrice}>R$ {p.precoVenda.toFixed(2)} / {p.unidade}</Text>
                </View>
                <View style={styles.qtyControlBox}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateProductQty(p.id, -1)}
                  >
                    <Text style={styles.qtyBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyValueText}>{qty}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateProductQty(p.id, 1)}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {/* ETAPA 3: CONDIÇÃO E FORMA DE PAGAMENTO */}
          <Text style={[styles.stepTitle, { marginTop: 24 }]}>3. Pagamento</Text>
          <View style={styles.paymentBox}>
            <Text style={styles.inputLabel}>Condição de Pagamento:</Text>
            <View style={styles.chipsRow}>
              {['À Vista', '30 Dias', '30/60 Dias', '30/60/90 Dias'].map((cond) => (
                <TouchableOpacity
                  key={cond}
                  style={[styles.condChip, condicaoPagamento === cond && styles.condChipActive]}
                  onPress={() => setCondicaoPagamento(cond)}
                >
                  <Text style={[styles.condChipText, condicaoPagamento === cond && styles.condChipTextActive]}>
                    {cond}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Forma de Pagamento:</Text>
            <View style={styles.chipsRow}>
              {['Boleto Bancário', 'PIX', 'Cartão', 'Dinheiro'].map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.condChip, formaPagamento === f && styles.condChipActive]}
                  onPress={() => setFormaPagamento(f)}
                >
                  <Text style={[styles.condChipText, formaPagamento === f && styles.condChipTextActive]}>
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* BARRA FIXA INFERIOR DO TOTAL & FINALIZAR */}
        <View style={styles.bottomCheckoutBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.checkoutTotalLabel}>TOTAL DO PEDIDO ({totalCartCount} itens):</Text>
            <Text style={styles.checkoutTotalValue}>
              R$ {calculateCartTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.checkoutButton, (totalCartCount === 0 || !selectedClient) && styles.checkoutButtonDisabled]}
            onPress={handleFinalizeOrder}
            disabled={totalCartCount === 0 || !selectedClient || isSubmittingOrder}
          >
            {isSubmittingOrder ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <CheckCircle2 size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.checkoutButtonText}>Gravar Pedido</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // =========================================================================
  // 4. SUB-TELA: CLIENTES
  // =========================================================================
  const renderClientsScreen = () => {
    return (
      <View style={styles.subScreenContainer}>
        <View style={styles.subHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentView('home')}>
            <ArrowLeft size={20} color="#1E293B" />
            <Text style={styles.backButtonText}>Início</Text>
          </TouchableOpacity>
          <Text style={styles.subHeaderTitle}>Carteira de Clientes</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={16} color="#64748B" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar cliente, CNPJ ou cidade..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <FlatList
          data={filteredClients}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <View style={styles.clientCardItem}>
              <View style={styles.clientCardHeader}>
                <Text style={styles.clientCardTitle}>{item.nomeFantasia || item.razaoSocial}</Text>
                <View style={styles.activeTag}>
                  <Text style={styles.activeTagText}>Ativo</Text>
                </View>
              </View>
              <Text style={styles.clientCardRazao}>{item.razaoSocial}</Text>
              <Text style={styles.clientCardSub}>CNPJ: {item.cnpjCpf}</Text>

              <View style={styles.clientCardMetaRow}>
                <MapPin size={14} color="#64748B" style={{ marginRight: 4 }} />
                <Text style={styles.clientCardMetaText}>{item.cidade} - {item.uf}</Text>
              </View>

              <View style={styles.clientCardMetaRow}>
                <Phone size={14} color="#64748B" style={{ marginRight: 4 }} />
                <Text style={styles.clientCardMetaText}>{item.telefone}</Text>
              </View>

              <View style={styles.clientCardActions}>
                <TouchableOpacity
                  style={styles.emitOrderToClientBtn}
                  onPress={() => {
                    setSelectedClient(item);
                    setCartItems({});
                    setCurrentView('novo_pedido');
                  }}
                >
                  <Plus size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.emitOrderToClientBtnText}>Emitir Pedido</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>
    );
  };

  // =========================================================================
  // 5. SUB-TELA: DASHBOARD INDICADORES
  // =========================================================================
  const renderDashboardScreen = () => {
    return (
      <View style={styles.subScreenContainer}>
        <View style={styles.subHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentView('home')}>
            <ArrowLeft size={20} color="#1E293B" />
            <Text style={styles.backButtonText}>Início</Text>
          </TouchableOpacity>
          <Text style={styles.subHeaderTitle}>Dashboard do Vendedor</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          {/* Card Principal: Total Vendido */}
          <View style={styles.metricBigCard}>
            <Text style={styles.metricBigLabel}>TOTAL VENDIDO NO MÊS</Text>
            <Text style={styles.metricBigValue}>
              R$ {metrics.totalVendido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
            <View style={styles.metricProgressBarBg}>
              <View style={[styles.metricProgressBarFill, { width: `${Math.min(metrics.atingimento, 100)}%` }]} />
            </View>
            <Text style={styles.metricProgressText}>
              Meta: R$ {metrics.metaMes.toLocaleString('pt-BR')} ({metrics.atingimento.toFixed(1)}% atingido)
            </Text>
          </View>

          {/* Cards Secundários */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <ShoppingCart size={22} color="#3B82F6" />
              <Text style={styles.kpiValue}>{metrics.totalPedidos}</Text>
              <Text style={styles.kpiLabel}>Pedidos Emitidos</Text>
            </View>
            <View style={styles.kpiCard}>
              <TrendingUp size={22} color="#10B981" />
              <Text style={styles.kpiValue}>
                R$ {metrics.ticketMedio.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </Text>
              <Text style={styles.kpiLabel}>Ticket Médio</Text>
            </View>
          </View>

          {/* Últimos Pedidos */}
          <Text style={[styles.stepTitle, { marginTop: 24, marginBottom: 12 }]}>Vendas Recentes</Text>
          {orders.slice(0, 5).map((o) => (
            <View key={o.id} style={styles.recentOrderItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.recentOrderClient}>{o.clienteNome}</Text>
                <Text style={styles.recentOrderSub}>Pedido #{o.numeroPedido} • {o.dataEmissao}</Text>
              </View>
              <Text style={styles.recentOrderValue}>
                R$ {o.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  // =========================================================================
  // 6. SUB-TELA: RELATÓRIOS
  // =========================================================================
  const renderReportsScreen = () => {
    const totalComissao = metrics.totalVendido * 0.05; // 5% de comissão estimada
    return (
      <View style={styles.subScreenContainer}>
        <View style={styles.subHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentView('home')}>
            <ArrowLeft size={20} color="#1E293B" />
            <Text style={styles.backButtonText}>Início</Text>
          </TouchableOpacity>
          <Text style={styles.subHeaderTitle}>Relatórios de Vendas</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          {/* Card de Faturamento */}
          <View style={[styles.metricBigCard, { backgroundColor: '#0F172A' }]}>
            <Text style={[styles.metricBigLabel, { color: '#94A3B8' }]}>FATURAMENTO BRUTO</Text>
            <Text style={[styles.metricBigValue, { color: '#38BDF8' }]}>
              R$ {metrics.totalVendido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
            <Text style={{ color: '#F8FAFC', fontSize: 13, marginTop: 4 }}>
              Comissão estimada (5%): R$ {totalComissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <Text style={[styles.stepTitle, { marginTop: 24, marginBottom: 12 }]}>Ranking de Produtos Mais Vendidos</Text>
          {products.map((p, idx) => (
            <View key={p.id} style={styles.rankingRow}>
              <View style={styles.rankingNumberBox}>
                <Text style={styles.rankingNumberText}>{idx + 1}º</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.rankingDesc}>{p.descricao}</Text>
                <Text style={styles.rankingSub}>Cód: {p.codigo} • {p.categoria}</Text>
              </View>
              <Text style={styles.rankingPrice}>R$ {p.precoVenda.toFixed(2)}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  // =========================================================================
  // 7. SUB-TELA: FINANCEIRO (CONTAS A RECEBER)
  // =========================================================================
  const renderFinancialScreen = () => {
    const totalReceber = financialTitles.reduce((sum, t) => sum + t.valor, 0);
    const totalVencido = financialTitles.filter((t) => t.status === 'VENCIDO').reduce((sum, t) => sum + t.valor, 0);
    const totalAVencer = financialTitles.filter((t) => t.status === 'A_VENCER').reduce((sum, t) => sum + t.valor, 0);

    return (
      <View style={styles.subScreenContainer}>
        <View style={styles.subHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentView('home')}>
            <ArrowLeft size={20} color="#1E293B" />
            <Text style={styles.backButtonText}>Início</Text>
          </TouchableOpacity>
          <Text style={styles.subHeaderTitle}>Financeiro / Cobrança</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          {/* Card Totalizador */}
          <View style={styles.financialSummaryCard}>
            <Text style={styles.financialSummaryLabel}>TOTAL A RECEBER</Text>
            <Text style={styles.financialSummaryValue}>
              R$ {totalReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>

            <View style={styles.financialPillsRow}>
              <View style={styles.financialStatPill}>
                <Text style={styles.statPillLabel}>A Vencer:</Text>
                <Text style={[styles.statPillValue, { color: '#0284C7' }]}>
                  R$ {totalAVencer.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.financialStatPill}>
                <Text style={styles.statPillLabel}>Vencidos:</Text>
                <Text style={[styles.statPillValue, { color: '#E11D48' }]}>
                  R$ {totalVencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          </View>

          <Text style={[styles.stepTitle, { marginTop: 24, marginBottom: 12 }]}>Títulos e Duplicatas</Text>
          {financialTitles.map((t) => {
            const isVencido = t.status === 'VENCIDO';
            return (
              <View key={t.id} style={styles.titleCard}>
                <View style={styles.titleCardTop}>
                  <Text style={styles.titleNumber}>{t.numeroTitulo}</Text>
                  <View
                    style={[
                      styles.titleBadge,
                      isVencido ? styles.titleBadgeVencido : styles.titleBadgeAVencer,
                    ]}
                  >
                    <Text
                      style={[
                        styles.titleBadgeText,
                        isVencido ? { color: '#E11D48' } : { color: '#0284C7' },
                      ]}
                    >
                      {isVencido ? 'Vencido' : 'A Vencer'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.titleClient}>{t.clienteNome}</Text>
                <View style={styles.titleBottom}>
                  <Text style={styles.titleDate}>Vencimento: {t.vencimento}</Text>
                  <Text style={styles.titleValue}>
                    R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // RENDERIZADOR PRINCIPAL
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {currentView === 'home' && renderHomeScreen()}
      {currentView === 'pedidos' && renderOrdersScreen()}
      {currentView === 'novo_pedido' && renderNewOrderScreen()}
      {currentView === 'clientes' && renderClientsScreen()}
      {currentView === 'dashboard' && renderDashboardScreen()}
      {currentView === 'relatorios' && renderReportsScreen()}
      {currentView === 'financeiro' && renderFinancialScreen()}

      {/* MODAL PARA TROCA DE CNPJ / MULTI-TENANT */}
      <Modal visible={isCnpjModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Empresa / CNPJ em Nuvem</Text>
            <Text style={styles.modalDesc}>
              Digite o CNPJ da empresa para conectar à sua respectiva base isolada em nuvem:
            </Text>
            <TextInput
              style={styles.modalInput}
              value={tempCnpjInput}
              onChangeText={setTempCnpjInput}
              placeholder="00.000.000/0000-00"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsCnpjModalOpen(false)}>
                <Text style={styles.modalCancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={() => handleSwitchCnpj(tempCnpjInput)}>
                <Text style={styles.modalConfirmBtnText}>Conectar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// =========================================================================
// ESTILOS: ALTA FIDELIDADE COM A TELA WEB (BRANCO + CARDS DE 140PX)
// =========================================================================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  homeContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Header Idêntico à Web
  homeHeader: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLogoBox: {
    alignItems: 'center',
  },
  shieldIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  headerBrandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  headerBrandSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    letterSpacing: 2,
    fontWeight: '700',
    marginTop: 2,
  },
  cloudPill: {
    position: 'absolute',
    left: 16,
    top: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  cloudPillOnline: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  cloudPillOffline: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  cloudPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  exitBtnTop: {
    position: 'absolute',
    right: 16,
    top: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  exitBtnTopText: {
    color: '#E11D48',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },

  // Body com os 5 Cards de 140px
  homeBody: {
    flex: 1,
  },
  homeBodyContent: {
    padding: 20,
    paddingBottom: 40,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
  },
  bigCard: {
    width: '48%',
    height: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 4,
  },
  bigCardIconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  bigCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  cardCounterBadge: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // Card Financeiro Largo
  financialWideCard: {
    width: '100%',
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginTop: 6,
  },
  financialCardTextCol: {
    flex: 1,
    marginLeft: 16,
  },
  financialSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },

  // Banner Sincronização
  syncBanner: {
    marginTop: 20,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  syncBannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  syncBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369A1',
    marginLeft: 6,
  },
  syncBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  syncBannerBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },

  // Botão Sair Inferior
  bottomExitBtn: {
    marginTop: 24,
    height: 52,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  bottomExitBtnText: {
    color: '#E11D48',
    fontSize: 14,
    fontWeight: '700',
  },

  // Sub-Telas Comuns
  subScreenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  subHeader: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 4,
  },
  subHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  newOrderHeaderButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  newOrderHeaderButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },

  // Busca e Filtros
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  filterPillsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  filterPillActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },

  // Itens de Pedido
  orderListItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  orderListItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumberTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  orderBadgeSuccess: {
    backgroundColor: '#ECFDF5',
  },
  orderBadgeWarning: {
    backgroundColor: '#FFFBEB',
  },
  orderBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orderClientName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  orderMetaText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  orderPaymentText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  orderTotalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  orderTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
  },

  // Formulário de Novo Pedido
  stepTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  selectedClientCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedClientName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E40AF',
  },
  selectedClientSub: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 2,
  },
  changeClientBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  changeClientBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  clientPickItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 14,
    padding: 12,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientPickName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  clientPickSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  productPickCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  productPickDesc: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  productPickCode: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  productPickPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB',
    marginTop: 3,
  },
  qtyControlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  qtyValueText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    width: 28,
    textAlign: 'center',
  },
  paymentBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  condChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  condChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  condChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  condChipTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  bottomCheckoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  checkoutTotalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  checkoutTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#059669',
  },
  checkoutButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // Clientes
  clientCardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  clientCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  activeTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activeTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  clientCardRazao: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  clientCardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  clientCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  clientCardMetaText: {
    fontSize: 12,
    color: '#64748B',
  },
  clientCardActions: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  emitOrderToClientBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  emitOrderToClientBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Dashboard & Métricas
  metricBigCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  metricBigLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  metricBigValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#059669',
    marginVertical: 6,
  },
  metricProgressBarBg: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 6,
  },
  metricProgressBarFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 4,
  },
  metricProgressText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 4,
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  recentOrderItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recentOrderClient: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  recentOrderSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  recentOrderValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },

  // Relatórios
  rankingRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankingNumberBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankingNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  rankingDesc: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  rankingSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  rankingPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB',
  },

  // Financeiro
  financialSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  financialSummaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  financialSummaryValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0284C7',
    marginVertical: 4,
  },
  financialPillsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  financialStatPill: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statPillLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  statPillValue: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  titleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  titleCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  titleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  titleBadgeVencido: {
    backgroundColor: '#FFF1F2',
  },
  titleBadgeAVencer: {
    backgroundColor: '#F0F9FF',
  },
  titleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  titleClient: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
    marginTop: 4,
  },
  titleBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  titleDate: {
    fontSize: 11,
    color: '#64748B',
  },
  titleValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0284C7',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    lineHeight: 18,
  },
  modalInput: {
    height: 48,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0F172A',
    marginVertical: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  modalConfirmBtn: {
    flex: 1,
    height: 44,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Estados vazios
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
