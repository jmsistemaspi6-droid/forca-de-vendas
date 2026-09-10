import React, { useState, useEffect, useCallback } from 'react';
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
  FileText,
  Users,
  Package,
  RefreshCw,
  Plus,
  Building2,
  CheckCircle2,
  Clock,
  Wifi,
  WifiOff,
  ChevronRight,
  Server,
} from 'lucide-react-native';

import {
  apiClient,
  getActiveCompanyCnpj,
  setActiveCompanyCnpj,
  getBackendBaseUrl,
  setBackendBaseUrl,
  checkBackendHealth,
  fetchCloudData,
  pushCloudData,
  sendOrderToCloud,
  DEFAULT_CNPJ,
} from './src/services/api';
import { Order, Client, Product, OrderItem } from './src/types';

// Mock inicial para primeiro uso offline caso ainda não tenha sincronizado
const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', codigo: 'PROD-001', descricao: 'Óleo Motor Sintético 5W30 1L', precoVenda: 45.0, unidade: 'UN', estoqueAtual: 120 },
  { id: 'p2', codigo: 'PROD-002', descricao: 'Filtro de Óleo Lubrificante PSL55', precoVenda: 28.5, unidade: 'UN', estoqueAtual: 85 },
  { id: 'p3', codigo: 'PROD-003', descricao: 'Pastilha de Freio Dianteira Cerâmica', precoVenda: 145.0, unidade: 'JG', estoqueAtual: 40 },
  { id: 'p4', codigo: 'PROD-004', descricao: 'Fluido de Freio DOT 4 500ml', precoVenda: 32.0, unidade: 'UN', estoqueAtual: 60 },
  { id: 'p5', codigo: 'PROD-005', descricao: 'Bateria Automotiva 60Ah Selada', precoVenda: 420.0, unidade: 'UN', estoqueAtual: 15 },
];

const INITIAL_CLIENTS: Client[] = [
  { id: 'c1', razaoSocial: 'Auto Peças & Mecânica Central Ltda', nomeFantasia: 'Auto Peças Central', cnpjCpf: '11.222.333/0001-44', cidade: 'Teresina', uf: 'PI' },
  { id: 'c2', razaoSocial: 'Posto e Centro Automotivo Alvorada', nomeFantasia: 'Auto Center Alvorada', cnpjCpf: '22.333.444/0001-55', cidade: 'Parnaíba', uf: 'PI' },
  { id: 'c3', razaoSocial: 'Distribuidora de Peças São José ME', nomeFantasia: 'Peças São José', cnpjCpf: '33.444.555/0001-66', cidade: 'Picos', uf: 'PI' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'pedidos' | 'novo_pedido' | 'catalogo' | 'sync'>('pedidos');
  const [activeCnpj, setActiveCnpjState] = useState<string>(DEFAULT_CNPJ);
  const [backendUrl, setBackendUrlState] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Estados dos Dados
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);

  // Modais
  const [isCnpjModalVisible, setIsCnpjModalVisible] = useState<boolean>(false);
  const [tempCnpjInput, setTempCnpjInput] = useState<string>('');
  const [tempUrlInput, setTempUrlInput] = useState<string>('');

  // Estado do Novo Pedido
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [cartItems, setCartItems] = useState<{ [productId: string]: number }>({});
  const [condicaoPagamento, setCondicaoPagamento] = useState<string>('30 Dias');

  // Inicialização e Carga do Storage
  useEffect(() => {
    async function loadStoredData() {
      try {
        const savedCnpj = await getActiveCompanyCnpj();
        const savedUrl = await getBackendBaseUrl();
        setActiveCnpjState(savedCnpj);
        setBackendUrlState(savedUrl);
        setTempCnpjInput(savedCnpj);
        setTempUrlInput(savedUrl);

        // Carregar pedidos locais do CNPJ ativo
        const localOrdersRaw = await AsyncStorage.getItem(`@jm_orders_${savedCnpj}`);
        if (localOrdersRaw) {
          setOrders(JSON.parse(localOrdersRaw));
        }

        // Testar conexão inicial com a nuvem
        const health = await checkBackendHealth();
        setIsOnline(health.online);
      } catch (err) {
        console.warn('Erro ao carregar dados locais:', err);
      }
    }
    loadStoredData();
  }, []);

  // Salvar pedidos locais sempre que mudar
  const persistOrdersLocally = async (newOrders: Order[], cnpjToSave: string) => {
    setOrders(newOrders);
    try {
      await AsyncStorage.setItem(`@jm_orders_${cnpjToSave}`, JSON.stringify(newOrders));
    } catch (e) {
      console.warn('Erro ao salvar pedidos locais:', e);
    }
  };

  // Trocar CNPJ ativo
  const handleSwitchCnpj = async (newCnpj: string) => {
    const clean = newCnpj.replace(/\D/g, '').trim() || DEFAULT_CNPJ;
    await setActiveCompanyCnpj(clean);
    setActiveCnpjState(clean);
    setIsCnpjModalVisible(false);

    // Carregar pedidos locais do novo CNPJ
    const localRaw = await AsyncStorage.getItem(`@jm_orders_${clean}`);
    if (localRaw) {
      setOrders(JSON.parse(localRaw));
    } else {
      setOrders([]);
    }

    Alert.alert(
      'Empresa Conectada',
      `O aplicativo agora está apontando para o banco isolado do CNPJ ${clean}. Sincronize para puxar os dados da nuvem.`
    );

    // Testar conectividade com o novo CNPJ
    const health = await checkBackendHealth();
    setIsOnline(health.online);
  };

  // Sincronizar com a Nuvem
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // 1. Enviar pedidos pendentes
      const pendingOrders = orders.filter((o) => !o.transmitidoNuvem);
      if (pendingOrders.length > 0) {
        await pushCloudData({ orders: pendingOrders });
      }

      // 2. Baixar dados da nuvem daquele CNPJ
      const res = await fetchCloudData();
      if (res.success && res.data) {
        if (Array.isArray(res.data.orders) && res.data.orders.length > 0) {
          await persistOrdersLocally(res.data.orders, activeCnpj);
        }
        if (Array.isArray(res.data.clients) && res.data.clients.length > 0) {
          setClients(res.data.clients);
        }
        if (Array.isArray(res.data.products) && res.data.products.length > 0) {
          setProducts(res.data.products);
        }
        setIsOnline(true);
        Alert.alert('Sincronização Concluída', `Dados da nuvem para o CNPJ ${activeCnpj} atualizados com sucesso!`);
      } else {
        Alert.alert('Aviso de Sincronização', res.error || 'Não foi possível obter dados da nuvem no momento.');
      }
    } catch (error: any) {
      Alert.alert('Erro na Sincronização', error.message || 'Falha de rede.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Manipular carrinho
  const updateProductQty = (prodId: string, delta: number) => {
    setCartItems((prev) => {
      const current = prev[prodId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[prodId];
        return copy;
      }
      return { ...prev, [prodId]: next };
    });
  };

  const calculateTotalOrder = () => {
    let total = 0;
    Object.entries(cartItems).forEach(([prodId, qty]) => {
      const p = products.find((prod) => prod.id === prodId);
      if (p) total += p.precoVenda * Number(qty);
    });
    return total;
  };

  // Finalizar e Transmitir Pedido
  const handleFinalizeOrder = async () => {
    if (!selectedClient) {
      Alert.alert('Atenção', 'Selecione um cliente para o pedido.');
      return;
    }

    const itemKeys = Object.keys(cartItems);
    if (itemKeys.length === 0) {
      Alert.alert('Atenção', 'Adicione pelo menos um produto ao carrinho.');
      return;
    }

    const orderItems: OrderItem[] = itemKeys.map((pId) => {
      const p = products.find((prod) => prod.id === pId)!;
      const qty = cartItems[pId];
      return {
        id: `item-${Date.now()}-${pId}`,
        productId: p.id,
        codigo: p.codigo,
        descricao: p.descricao,
        quantidade: qty,
        precoUnitario: p.precoVenda,
        descontoUnitario: 0,
        subtotal: p.precoVenda * qty,
      };
    });

    const totalValue = calculateTotalOrder();
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      numeroPedido: orders.length + 101,
      dataEmissao: new Date().toISOString(),
      clienteId: selectedClient.id,
      clienteNome: selectedClient.nomeFantasia || selectedClient.razaoSocial,
      clienteCnpj: selectedClient.cnpjCpf,
      itens: orderItems,
      valorTotal: totalValue,
      valorDescontoTotal: 0,
      formaPagamento: 'Boleto Bancário',
      condicaoPagamento: condicaoPagamento,
      status: 'PENDENTE',
      transmitidoNuvem: false,
      empresaCnpj: activeCnpj,
    };

    // Tentar transmitir imediatamente via HTTP POST com cabeçalho 'x-company-cnpj'
    let transmitted = false;
    try {
      const sendRes = await sendOrderToCloud(newOrder);
      if (sendRes.success) {
        transmitted = true;
        newOrder.transmitidoNuvem = true;
      }
    } catch {
      transmitted = false;
    }

    const updatedOrders = [newOrder, ...orders];
    await persistOrdersLocally(updatedOrders, activeCnpj);

    // Reset formulário
    setSelectedClient(null);
    setCartItems({});
    setActiveTab('pedidos');

    Alert.alert(
      'Pedido Salvo com Sucesso!',
      transmitted
        ? `Pedido #${newOrder.numeroPedido} transmitido diretamente para a nuvem do CNPJ ${activeCnpj}.`
        : `Pedido #${newOrder.numeroPedido} salvo localmente no celular. Ele será enviado na próxima sincronização.`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />

      {/* HEADER SUPERIOR */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>JM</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>JM Força de Vendas</Text>
              <Text style={styles.headerSubtitle}>App Expo • React Native Puro</Text>
            </View>
          </View>

          {/* Indicador de Status Online */}
          <TouchableOpacity
            style={[styles.statusPill, isOnline ? styles.statusOnline : styles.statusOffline]}
            onPress={async () => {
              const h = await checkBackendHealth();
              setIsOnline(h.online);
              Alert.alert('Status do Servidor', h.online ? 'Conectado à nuvem!' : 'Sem resposta do servidor.');
            }}
          >
            {isOnline ? <Wifi size={13} color="#10B981" /> : <WifiOff size={13} color="#F43F5E" />}
            <Text style={[styles.statusPillText, isOnline ? { color: '#10B981' } : { color: '#F43F5E' }]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* BARRA DO CNPJ ATIVO */}
        <TouchableOpacity style={styles.cnpjBar} onPress={() => setIsCnpjModalVisible(true)}>
          <Building2 size={16} color="#38BDF8" />
          <View style={styles.cnpjBarTextContainer}>
            <Text style={styles.cnpjBarLabel}>BANCO EM NUVEM DO CNPJ:</Text>
            <Text style={styles.cnpjBarValue}>{activeCnpj}</Text>
          </View>
          <Text style={styles.cnpjBarChangeBtn}>Alterar</Text>
        </TouchableOpacity>
      </View>

      {/* CONTEÚDO PRINCIPAL DE ACORDO COM A ABA */}
      <View style={styles.content}>
        {/* ABA 1: PEDIDOS */}
        {activeTab === 'pedidos' && (
          <View style={styles.tabContainer}>
            <View style={styles.tabHeaderRow}>
              <Text style={styles.sectionHeading}>Pedidos ({orders.length})</Text>
              <TouchableOpacity
                style={styles.newOrderHeaderBtn}
                onPress={() => setActiveTab('novo_pedido')}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.newOrderHeaderBtnText}>Novo Pedido</Text>
              </TouchableOpacity>
            </View>

            {orders.length === 0 ? (
              <View style={styles.emptyState}>
                <FileText size={48} color="#475569" />
                <Text style={styles.emptyStateTitle}>Nenhum pedido no CNPJ ativo</Text>
                <Text style={styles.emptyStateDesc}>
                  O banco deste cliente está pronto e limpo. Toque em "Novo Pedido" para emitir a primeira venda.
                </Text>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => setActiveTab('novo_pedido')}
                >
                  <Text style={styles.primaryBtnText}>Criar Primeiro Pedido</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={orders}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={styles.orderCard}>
                    <View style={styles.orderCardTop}>
                      <Text style={styles.orderNumber}>Pedido #{item.numeroPedido}</Text>
                      <View
                        style={[
                          styles.syncBadge,
                          item.transmitidoNuvem ? styles.syncBadgeOk : styles.syncBadgePending,
                        ]}
                      >
                        {item.transmitidoNuvem ? (
                          <CheckCircle2 size={12} color="#10B981" />
                        ) : (
                          <Clock size={12} color="#F59E0B" />
                        )}
                        <Text
                          style={[
                            styles.syncBadgeText,
                            item.transmitidoNuvem ? { color: '#10B981' } : { color: '#F59E0B' },
                          ]}
                        >
                          {item.transmitidoNuvem ? 'Nuvem OK' : 'Pendente'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.orderClient}>{item.clienteNome}</Text>
                    <Text style={styles.orderSub}>
                      {item.itens.length} {item.itens.length === 1 ? 'item' : 'itens'} • {item.condicaoPagamento}
                    </Text>

                    <View style={styles.orderCardBottom}>
                      <Text style={styles.orderTotalLabel}>Total:</Text>
                      <Text style={styles.orderTotalValue}>
                        R$ {item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </Text>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        )}

        {/* ABA 2: NOVO PEDIDO */}
        {activeTab === 'novo_pedido' && (
          <ScrollView style={styles.tabContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionHeading}>Emitir Novo Pedido</Text>

            {/* SELEÇÃO DO CLIENTE */}
            <Text style={styles.formLabel}>1. Selecione o Cliente:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.clientChipsScroll}>
              {clients.map((c) => {
                const isSelected = selectedClient?.id === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.clientChip, isSelected && styles.clientChipSelected]}
                    onPress={() => setSelectedClient(c)}
                  >
                    <Text style={[styles.clientChipText, isSelected && styles.clientChipTextSelected]}>
                      {c.nomeFantasia || c.razaoSocial}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* SELEÇÃO DE PRODUTOS */}
            <Text style={[styles.formLabel, { marginTop: 16 }]}>2. Produtos e Quantidades:</Text>
            {products.map((p) => {
              const qty = cartItems[p.id] || 0;
              return (
                <View key={p.id} style={styles.productRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productDesc}>{p.descricao}</Text>
                    <Text style={styles.productPrice}>
                      R$ {p.precoVenda.toFixed(2)} / {p.unidade}
                    </Text>
                  </View>
                  <View style={styles.qtyContainer}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateProductQty(p.id, -1)}
                    >
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyNumber}>{qty}</Text>
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

            {/* CONDIÇÃO DE PAGAMENTO */}
            <Text style={[styles.formLabel, { marginTop: 16 }]}>3. Condição de Pagamento:</Text>
            <View style={styles.paymentRow}>
              {['À Vista', '30 Dias', '30/60 Dias'].map((cond) => (
                <TouchableOpacity
                  key={cond}
                  style={[styles.paymentBtn, condicaoPagamento === cond && styles.paymentBtnSelected]}
                  onPress={() => setCondicaoPagamento(cond)}
                >
                  <Text style={[styles.paymentBtnText, condicaoPagamento === cond && styles.paymentBtnTextSelected]}>
                    {cond}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* TOTAL E FINALIZAÇÃO */}
            <View style={styles.orderSummaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total do Pedido:</Text>
                <Text style={styles.summaryValue}>
                  R$ {calculateTotalOrder().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <Text style={styles.summarySub}>
                O pedido será salvo e transmitido via HTTP para o CNPJ {activeCnpj}
              </Text>
              <TouchableOpacity
                style={styles.finalizeBtn}
                onPress={handleFinalizeOrder}
              >
                <Text style={styles.finalizeBtnText}>Finalizar e Transmitir Pedido</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* ABA 3: CATÁLOGO */}
        {activeTab === 'catalogo' && (
          <ScrollView style={styles.tabContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionHeading}>Clientes e Tabela de Preços</Text>

            <Text style={styles.formLabel}>Clientes Cadastrados ({clients.length})</Text>
            {clients.map((c) => (
              <View key={c.id} style={styles.listItemCard}>
                <Text style={styles.listItemTitle}>{c.nomeFantasia || c.razaoSocial}</Text>
                <Text style={styles.listItemSub}>CNPJ: {c.cnpjCpf} • {c.cidade || 'Teresina'} - {c.uf || 'PI'}</Text>
              </View>
            ))}

            <Text style={[styles.formLabel, { marginTop: 20 }]}>Produtos e Estoque ({products.length})</Text>
            {products.map((p) => (
              <View key={p.id} style={styles.listItemCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.listItemTitle}>{p.descricao}</Text>
                  <Text style={styles.productPriceHighlight}>R$ {p.precoVenda.toFixed(2)}</Text>
                </View>
                <Text style={styles.listItemSub}>
                  Código: {p.codigo} • Estoque: {p.estoqueAtual} {p.unidade}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* ABA 4: SINCRONIZAÇÃO & CNPJ */}
        {activeTab === 'sync' && (
          <ScrollView style={styles.tabContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionHeading}>Configurações de Nuvem & CNPJ</Text>

            <View style={styles.configCard}>
              <Text style={styles.configCardTitle}>Estratégia Multi-Tenant por CNPJ</Text>
              <Text style={styles.configCardDesc}>
                Cada CNPJ/Cliente tem seu próprio banco de dados isolado na nuvem.
                Ao trocar o CNPJ no aplicativo, todas as requisições HTTP (fetch/axios)
                enviam automaticamente o cabeçalho 'x-company-cnpj'.
              </Text>

              <View style={styles.configItem}>
                <Text style={styles.configItemLabel}>CNPJ Ativo:</Text>
                <Text style={styles.configItemValue}>{activeCnpj}</Text>
              </View>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => setIsCnpjModalVisible(true)}
              >
                <Text style={styles.secondaryBtnText}>Trocar Empresa / CNPJ</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.configCard, { marginTop: 16 }]}>
              <Text style={styles.configCardTitle}>Servidor Backend em Nuvem</Text>
              <Text style={styles.configCardDesc}>
                Endereço da API Express que cria e sincroniza as bases dinâmicas.
              </Text>
              <Text style={styles.urlBox}>{backendUrl || 'URL Padrão em Nuvem'}</Text>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleSync}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <RefreshCw size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryBtnText}>Sincronizar Agora com a Nuvem</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>

      {/* MODAL PARA TROCAR O CNPJ */}
      <Modal visible={isCnpjModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Conectar ao Banco do CNPJ</Text>
            <Text style={styles.modalDesc}>
              Digite o CNPJ da empresa/cliente. O servidor Express criará dinamicamente
              uma base 100% zerada caso seja a primeira vez.
            </Text>

            <TextInput
              style={styles.modalInput}
              value={tempCnpjInput}
              onChangeText={setTempCnpjInput}
              placeholder="Ex: 12345678000190"
              placeholderTextColor="#64748B"
              keyboardType="numeric"
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsCnpjModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={() => handleSwitchCnpj(tempCnpjInput)}
              >
                <Text style={styles.modalConfirmBtnText}>Conectar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* BARRA DE NAVEGAÇÃO INFERIOR */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('pedidos')}
        >
          <FileText size={22} color={activeTab === 'pedidos' ? '#38BDF8' : '#64748B'} />
          <Text style={[styles.navItemText, activeTab === 'pedidos' && styles.navItemTextActive]}>
            Pedidos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('novo_pedido')}
        >
          <ShoppingCart size={22} color={activeTab === 'novo_pedido' ? '#38BDF8' : '#64748B'} />
          <Text style={[styles.navItemText, activeTab === 'novo_pedido' && styles.navItemTextActive]}>
            Novo Pedido
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('catalogo')}
        >
          <Package size={22} color={activeTab === 'catalogo' ? '#38BDF8' : '#64748B'} />
          <Text style={[styles.navItemText, activeTab === 'catalogo' && styles.navItemTextActive]}>
            Catálogo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('sync')}
        >
          <RefreshCw size={22} color={activeTab === 'sync' ? '#38BDF8' : '#64748B'} />
          <Text style={[styles.navItemText, activeTab === 'sync' && styles.navItemTextActive]}>
            Nuvem
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  statusOnline: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
    borderWidth: 1,
  },
  statusOffline: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: '#F43F5E',
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  cnpjBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 10,
    gap: 8,
  },
  cnpjBarTextContainer: {
    flex: 1,
  },
  cnpjBarLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: 'bold',
  },
  cnpjBarValue: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  cnpjBarChangeBtn: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  tabContainer: {
    flex: 1,
    padding: 16,
  },
  tabHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeading: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: 'bold',
  },
  newOrderHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  newOrderHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
  },
  emptyStateDesc: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  orderCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  orderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  syncBadgeOk: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  syncBadgePending: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  syncBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  orderClient: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 6,
  },
  orderSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  orderCardBottom: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  orderTotalLabel: {
    color: '#64748B',
    fontSize: 12,
    marginRight: 6,
  },
  orderTotalValue: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: 'bold',
  },
  formLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  clientChipsScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  clientChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  clientChipSelected: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  clientChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  clientChipTextSelected: {
    color: '#FFFFFF',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  productDesc: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: 'bold',
  },
  productPrice: {
    color: '#38BDF8',
    fontSize: 12,
    marginTop: 2,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  qtyNumber: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: 'bold',
    minWidth: 20,
    textAlign: 'center',
  },
  paymentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  paymentBtnSelected: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  paymentBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  paymentBtnTextSelected: {
    color: '#FFFFFF',
  },
  orderSummaryCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#94A3B8',
    fontSize: 14,
  },
  summaryValue: {
    color: '#10B981',
    fontSize: 22,
    fontWeight: 'bold',
  },
  summarySub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 4,
    marginBottom: 16,
  },
  finalizeBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  finalizeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  listItemCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  listItemTitle: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: 'bold',
  },
  listItemSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  productPriceHighlight: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: 'bold',
  },
  configCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  configCardTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: 'bold',
  },
  configCardDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 12,
  },
  configItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  configItemLabel: {
    color: '#64748B',
    fontSize: 12,
  },
  configItemValue: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  urlBox: {
    backgroundColor: '#1E293B',
    color: '#94A3B8',
    fontSize: 11,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  primaryBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  secondaryBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryBtnText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#1E293B',
    color: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: 'bold',
  },
  modalConfirmBtn: {
    flex: 1,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
  },
  navItemTextActive: {
    color: '#38BDF8',
  },
});
