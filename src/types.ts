export type ClientStatus = 'ativo' | 'inativo' | 'bloqueado';
export type ClientTier = 'A' | 'B' | 'C';

export interface ClientAddress {
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  lat?: number;
  lng?: number;
}

export interface Client {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpjCpf: string;
  inscricaoEstadual?: string;
  email: string;
  telefone: string;
  whatsapp: string;
  contatoPrincipal: string;
  cargoContato?: string;
  endereco: ClientAddress;
  status: ClientStatus;
  limiteCredito: number;
  creditoUtilizado: number;
  tabelaPrecoPadrao: string;
  condicaoPagamentoPadrao: string;
  diasSemComprar: number;
  valorUltimaCompra?: number;
  dataUltimaCompra?: string;
  pontuacaoABC: ClientTier;
  observacoes?: string;
  totalComprasHistorico: number;
  pedidosRealizadosCount: number;
}

export interface ProductPriceTable {
  varejo: number;
  atacado: number;
  distribuidor: number;
}

export interface Product {
  id: string;
  codigoSku: string;
  codigoBarras: string;
  nome: string;
  categoria: string;
  marca: string;
  unidade: 'UN' | 'CX' | 'KG' | 'PCT' | 'FD' | 'LT';
  precoTabela: ProductPriceTable;
  precoCusto: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  multiploVenda: number;
  fotoUrl: string;
  descricao: string;
  destaquePromo?: boolean;
  descontoMaximoPct: number;
  comissaoPct: number;
  aliquotaIcmsPct: number;
  pesoKg: number;
  ncm?: string;
  status?: 'ativo' | 'inativo';
  substitutos?: string[]; // IDs de produtos similares
}

export interface OrderItem {
  id: string;
  produtoId: string;
  produto: Product;
  quantidade: number;
  precoUnitarioTabela: number;
  precoUnitarioCobrado: number;
  descontoPct: number;
  subtotal: number;
  comissaoValor: number;
  margemLucroPct: number;
  observacaoItem?: string;
}

export type OrderStatus = 'rascunho' | 'pendente_transmissao' | 'transmitido' | 'aprovado' | 'faturado' | 'cancelado';
export type OrderType = 'pedido' | 'orcamento' | 'bonificacao' | 'troca';
export type FreightType = 'CIF' | 'FOB';

export interface OrderParcela {
  numero: number;
  dataVencimento: string; // YYYY-MM-DD
  valor: number;
  formaPagamento?: string;
  observacao?: string;
}

export interface Order {
  id: string;
  numeroPedido: string;
  dataCriacao: string;
  dataPrevisaoEntrega: string;
  clienteId: string;
  cliente: Client;
  itens: OrderItem[];
  tabelaPreco: 'varejo' | 'atacado' | 'distribuidor';
  condicaoPagamento: string;
  formaPagamento: 'Boleto Bancário' | 'PIX' | 'Cartão Crédito' | 'Transferência Bancária' | 'Cheque' | 'Dinheiro';
  tipoFrete: FreightType;
  valorFrete: number;
  subtotalItensBruto: number;
  descontoTotalReais: number;
  descontoTotalPct: number;
  valorTotalLiquido: number;
  comissaoTotalReais: number;
  margemMediaPct: number;
  pesoTotalKg: number;
  volumeTotalCaixas: number;
  tipo: OrderType;
  status: OrderStatus;
  observacoesInternas?: string;
  observacoesNotaFiscal?: string;
  assinaturaClienteBase64?: string;
  nomeRecebedorAssinatura?: string;
  localizacaoEmissao?: {
    lat: number;
    lng: number;
    enderecoAproximado?: string;
  };
  sincronizadoEm?: string;
  parcelas?: OrderParcela[];
}

export type VisitStatus = 'agendada' | 'em_andamento' | 'realizada' | 'remarcada' | 'nao_atendida';
export type VisitType = 'rotina' | 'cobranca' | 'prospeccao' | 'pos_venda' | 'urgente';

export interface Visit {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteFantasia: string;
  clienteEndereco: string;
  clienteCidade: string;
  clienteTelefone: string;
  clienteWhatsapp: string;
  dataAgendada: string;
  horario: string;
  ordemRota: number;
  status: VisitStatus;
  tipoVisita: VisitType;
  checkInHora?: string;
  checkOutHora?: string;
  duracaoMinutos?: number;
  motivoNaoVenda?: string;
  notasVisita?: string;
  fotosPdv?: string[];
  pedidoGeradoId?: string;
  pedidoGeradoValor?: number;
}

export type AppMode = 'mobile' | 'retaguarda';

export type RetaguardaTab =
  | 'dashboard'
  | 'entradas_xml'
  | 'contas_pagar'
  | 'contas_receber'
  | 'prestacao_contas'
  | 'estoque_precos'
  | 'usuarios_vendedores'
  | 'emitente'
  | 'relatorios'
  | 'fornecedores'
  | 'pedidos_vendas'
  | 'migracao_backup';

export interface CompanyIssuer {
  id?: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  inscricaoEstadual: string;
  inscricaoMunicipal?: string;
  cnae?: string;
  regimeTributario: 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real' | 'MEI';
  telefone: string;
  whatsapp: string;
  email: string;
  endereco: ClientAddress;
  logoUrl?: string;
  chavePixPadrao?: string;
  bancoPadrao?: string;
  observacoesFiscais?: string;
  status?: 'ativa' | 'bloqueada';
  motivoBloqueio?: string;
  dataCadastro?: string;
  ultimoAcesso?: string;
}

export interface PaymentSettlementItem {
  id: string;
  dataPagamento: string;
  valorPago: number;
  valorJurosMulta: number;
  valorDesconto: number;
  valorLiquidoEfetivo: number;
  formaPagamento: 'PIX' | 'Boleto Bancário' | 'Transferência Bancária' | 'Dinheiro' | 'Cartão Crédito' | 'Cheque';
  contaOuCaixa?: string;
  comprovanteDoc?: string;
  responsavel?: string;
  observacoes?: string;
}

export type PayableStatus = 'a_vencer' | 'vencido' | 'parcial' | 'pago' | 'cancelado';
export type SettlementType = 'total' | 'parcial';

export interface PayableTitle {
  id: string;
  fornecedorId: string;
  fornecedorNome: string;
  fornecedorCnpj: string;
  numeroDocumento: string;
  parcela: string;
  descricao: string;
  categoria?: string;
  categoriaDespesa:
    | 'Compra de Mercadorias (XML)'
    | 'Compra Manual de Mercadorias'
    | 'Embalagens & Insumos'
    | 'Fretes & Logística'
    | 'Aluguel & Infra'
    | 'Energia & Água'
    | 'Folha de Pagamento & Comissões'
    | 'Impostos & Tributos'
    | 'Manutenção & TI'
    | 'Combustível & Frotas'
    | 'Telecomunicações & Internet'
    | 'Outros';
  valorOriginal: number;
  valorPago: number;
  saldoRestante: number;
  dataEmissao: string;
  dataVencimento: string;
  dataPagamentoUltima?: string;
  status: PayableStatus;
  diasAtraso: number;
  codigoBarras?: string;
  chavePix?: string;
  notaFiscalEntradaId?: string;
  chaveAcessoNFe?: string;
  historicoBaixas: PaymentSettlementItem[];
  observacoes?: string;
}

export interface ReceivablePaymentItem {
  id: string;
  dataRecebimento: string;
  valorRecebido: number;
  valorJurosMulta: number;
  valorDesconto: number;
  valorLiquidoEfetivo: number;
  formaRecebimento: string;
  reciboNumero: string;
  responsavel: string;
  contaBancaria?: string;
  observacoes?: string;
  // Campos de compatibilidade
  data?: string;
  valorPago?: number;
  formaPagamento?: string;
}

export type ReceivableStatus = 'a_vencer' | 'vencido' | 'parcial' | 'pago' | 'cancelado';
export type FinancialStatus = ReceivableStatus;

export interface FinancialTitle {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteCnpj?: string;
  pedidoOrigemId?: string;
  numeroDocumento: string;
  parcela: string;
  valorOriginal: number;
  valor: number; // mantido para compatibilidade
  valorRecebido: number;
  saldoRestante: number;
  dataEmissao: string;
  dataVencimento: string;
  dataRecebimentoUltimo?: string;
  status: ReceivableStatus;
  diasAtraso: number;
  linhaDigitavel?: string;
  chavePix?: string;
  formaCobranca?: string;
  formaPagamento?: string;
  historicoBaixas: ReceivablePaymentItem[];
  observacoes?: string;
  vendedorId?: string;
  vendedorNome?: string;
}

export type ExpenseType =
  | 'Alimentação'
  | 'Combustível'
  | 'Hospedagem'
  | 'Pedágio'
  | 'Manutenção'
  | 'Outras';

export type ExpensePaymentSource =
  | 'Dinheiro da cobrança'
  | 'Pix próprio'
  | 'Cartão'
  | 'Dinheiro do Caixa (Vendas)'
  | 'Recursos Próprios (Reembolso)'
  | 'Cartão Corporativo';

export interface SalespersonExpense {
  id: string;
  vendedorId: string;
  vendedorNome: string;
  tipo: ExpenseType;
  descricao: string;
  valor: number;
  data: string;
  forma: ExpensePaymentSource;
  origemPagamento?: ExpensePaymentSource;
  comprovanteFoto?: string;
  prestacaoId?: string;
  criadoEm: string;
}

export type AccountabilityStatus = 'aberta' | 'fechada' | 'fechada_vendedor' | 'aprovada_retaguarda' | 'rejeitada';

export interface AccountabilitySession {
  id: string;
  numeroControle: string;
  vendedorId: string;
  vendedorNome: string;
  dataAbertura: string;
  dataFechamento?: string;
  status: AccountabilityStatus;
  totalRecebido: number;
  totalDespesas: number;
  saldoEntregar: number;
  recebimentos: Array<{
    tituloId: string;
    clienteNome: string;
    numeroDocumento: string;
    valorRecebido: number;
    forma: string;
    tipo: 'TOTAL' | 'PARCIAL';
    dataRecebimento: string;
    desconto?: number;
  }>;
  despesas: SalespersonExpense[];
  observacoes?: string;
  aprovadoPor?: string;
  aprovadoEm?: string;
}


export interface Supplier {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpjCpf: string;
  inscricaoEstadual?: string;
  email: string;
  telefone: string;
  whatsapp?: string;
  contatoPrincipal?: string;
  endereco: ClientAddress;
  categoriaFornecedor: string;
  condicaoPagamentoPadrao?: string;
  status: 'ativo' | 'inativo' | 'bloqueado';
  totalComprasHistorico: number;
  totalNotasCount: number;
  dataUltimaCompra?: string;
}

export interface StockEntryItem {
  id: string;
  codigoProdutoFornecedor: string;
  codigoBarrasEan?: string;
  descricaoFornecedor: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotalBruto: number;
  valorIpi: number;
  valorIcmsSt: number;
  valorFreteRateio: number;
  valorDescontoItem: number;
  custoUnitarioCalculado: number;
  // Vinculação com produto do estoque
  vinculadoProdutoId?: string;
  produtoNomeEstoque?: string;
  isNovoProduto?: boolean;
  margemLucroSugeridaPct?: number;
  novoPrecoVendaSugerido?: number;
}

export interface StockEntryDuplicate {
  numeroDuplicata: string;
  dataVencimento: string;
  valorDuplicata: number;
}

export interface StockEntry {
  id: string;
  numeroNota: string;
  serie: string;
  chaveAcesso: string;
  naturezaOperacao: string;
  dataEmissao: string;
  dataEntrada: string;
  fornecedor: {
    cnpj: string;
    razaoSocial: string;
    nomeFantasia?: string;
    inscricaoEstadual?: string;
    uf: string;
    municipio: string;
  };
  destinatario: {
    cnpj: string;
    razaoSocial: string;
  };
  totais: {
    valorProdutos: number;
    valorFrete: number;
    valorSeguro: number;
    valorDesconto: number;
    valorIpi: number;
    valorIcmsSt: number;
    valorOutrasDespesas: number;
    valorTotalNota: number;
  };
  itens: StockEntryItem[];
  duplicatas: StockEntryDuplicate[];
  status: 'processada' | 'rascunho' | 'cancelada';
  observacoes?: string;
  xmlRaw?: string;
  criadoPor?: string;
}

export interface SellerProfile {
  id: string;
  nome: string;
  cargo: string;
  codigoVendedor: string;
  fotoUrl: string;
  telefone: string;
  email: string;
  regiao: string;
  metaMensal: number;
  realizadoMes: number;
  pedidosHojeCount: number;
  pedidosHojeValor: number;
  comissaoMes: number;
  taxaPositivacaoPct: number;
  ticketMedioMes: number;
  clientesCarteiraTotal: number;
  clientesPositivadosMes: number;
}

export interface SyncStatus {
  isOnline: boolean;
  pendentesQtd: number;
  ultimaSincronizacao: string;
  sincronizando: boolean;
}

export type UserRole = 'ADMIN_MASTER' | 'GERENTE_VENDAS' | 'VENDEDOR';

export interface UserPermissions {
  acessoDesktopRetaguarda: boolean; // Permissão de acessar a Retaguarda ERP (Senha Master desbloqueia tudo)
  acessoForcaVendas: boolean;        // Permissão de acessar o Força de Vendas Mobile
  emitirPedidos: boolean;
  verFinanceiroCompleto: boolean;
  importarXml: boolean;
  cadastrarUsuarios: boolean;
  alterarTabelaPrecos: boolean;
  darDescontoEspecial: boolean;
}

export interface DraftOrderState {
  cliente: Client | null;
  itens: OrderItem[];
  tabelaPreco: 'varejo' | 'atacado' | 'distribuidor';
  condicaoPagamento: string;
  formaPagamento: 'Boleto Bancário' | 'PIX' | 'Cartão Crédito' | 'Transferência Bancária' | 'Cheque' | 'Dinheiro' | string;
  tipoFrete: FreightType;
  valorFrete: number;
  tipo: OrderType;
  observacoesInternas: string;
  observacoesNotaFiscal: string;
  dataPrevisaoEntrega?: string;
  parcelas?: OrderParcela[];
}

export interface SystemBackupData {
  versaoBackup: string;
  tipo: 'FULL_DESKTOP_BACKUP';
  geradoEm: string;
  timestamp: number;
  geradoPor: string;
  ambiente: string;
  empresa: CompanyIssuer;
  dados: {
    produtos: Product[];
    clientes: Client[];
    pedidos: Order[];
    titulosReceber: FinancialTitle[];
    titulosPagar: PayableTitle[];
    entradasEstoque: StockEntry[];
    fornecedores: Supplier[];
    prestacoesContas: AccountabilitySession[];
    despesas: SalespersonExpense[];
    visitas: Visit[];
    usuarios: SystemUser[];
    seller: SellerProfile;
    draftOrder?: DraftOrderState;
  };
  estatisticas: {
    totalProdutos: number;
    totalClientes: number;
    totalPedidos: number;
    totalTitulosReceber: number;
    totalTitulosPagar: number;
    totalEntradasEstoque: number;
    totalFornecedores: number;
    totalUsuarios: number;
    valorTotalEstoqueCusto: number;
    valorTotalReceber: number;
    valorTotalPagar: number;
  };
  checksum?: string;
}

export interface LocalBackupSnapshot {
  id: string;
  nomeArquivo: string;
  empresaNome: string;
  empresaCnpj: string;
  geradoEm: string;
  timestamp: number;
  tamanhoKb: number;
  totalProdutos: number;
  totalClientes: number;
  totalPedidos: number;
  totalTitulos: number;
  dadosJson: string; // Armazenado no computador para restauração rápida
}

export interface SystemUser {
  id: string;
  nome: string;
  email: string;
  senha?: string;
  role: UserRole;
  cargo: string;
  codigoVendedor?: string;
  telefone: string;
  cpf?: string;
  fotoUrl: string;
  regiao?: string;
  comissaoPadraoPct: number;
  metaMensal: number;
  status: 'ativo' | 'inativo' | 'bloqueado';
  permissoes: UserPermissions;
  isGlobalAdmin?: boolean;
  dataCadastro: string;
  ultimoAcesso?: string;
}

