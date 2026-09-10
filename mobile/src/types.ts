export interface Client {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpjCpf: string;
  telefone?: string;
  cidade?: string;
  uf?: string;
  limiteCredito?: number;
  saldoDevedor?: number;
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
  descontoUnitario: number;
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
  valorDescontoTotal: number;
  formaPagamento: string;
  condicaoPagamento: string;
  observacoes?: string;
  status: 'PENDENTE' | 'FATURADO' | 'CANCELADO';
  transmitidoNuvem: boolean;
  empresaCnpj: string;
}

export interface CloudSyncResponse {
  success: boolean;
  cnpj?: string;
  message?: string;
  data?: {
    orders: Order[];
    clients: Client[];
    products: Product[];
    lastUpdated?: string;
  };
  error?: string;
}
