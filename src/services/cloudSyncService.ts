import {
  Order,
  Client,
  Product,
  FinancialTitle,
  SalespersonExpense,
  AccountabilitySession,
  Visit,
  Supplier,
  PayableTitle,
  StockEntry,
} from '../types';

export interface CloudDatabaseData {
  orders: Order[];
  clients: Client[];
  products: Product[];
  financialTitles: FinancialTitle[];
  expenses: SalespersonExpense[];
  accountabilitySessions: AccountabilitySession[];
  visits: Visit[];
  suppliers: Supplier[];
  payableTitles: PayableTitle[];
  stockEntries: StockEntry[];
  lastUpdated?: string;
}

// Obter a URL base da API (funciona perfeitamente em dev, preview, mobile e desktop usando o mesmo link)
function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  return '';
}

// Obter o CNPJ da empresa atualmente ativa
export function getActiveCompanyCnpj(): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const issuerRaw = window.localStorage.getItem('FORCA_DE_VENDAS_STATE_V2_ISSUER');
      if (issuerRaw) {
        const issuer = JSON.parse(issuerRaw);
        if (issuer && issuer.cnpj) {
          return String(issuer.cnpj).replace(/\D/g, '');
        }
      }
    }
  } catch {
    // fallback
  }
  return 'default';
}

/**
 * Função utilitária para mesclar listas locais com dados vindos da nuvem sem duplicidade
 */
export function mergeItemsById<T extends { id: string }>(localItems: T[] = [], cloudItems: T[] = []): T[] {
  const map = new Map<string, T>();
  
  // Primeiro adiciona os itens da nuvem
  cloudItems.forEach((item) => {
    if (item && item.id) {
      map.set(item.id, item);
    }
  });

  // Em seguida mescla com os locais (preservando alterações locais ou unificando)
  localItems.forEach((item) => {
    if (item && item.id) {
      map.set(item.id, item);
    }
  });

  return Array.from(map.values());
}

/**
 * Baixar dados unificados da nuvem
 */
export async function fetchCloudData(): Promise<{ success: boolean; data?: CloudDatabaseData; error?: string }> {
  try {
    const url = `${getApiBaseUrl()}/api/sync/data`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'x-company-cnpj': getActiveCompanyCnpj(),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return { success: true, data: result.data };
  } catch (error: any) {
    console.warn('[CloudSync] Aviso ao buscar dados da nuvem:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Enviar (Push) pedidos e alterações locais para o banco unificado na nuvem
 */
export async function pushToCloud(payload: Partial<CloudDatabaseData>): Promise<{
  success: boolean;
  data?: CloudDatabaseData;
  error?: string;
}> {
  try {
    const url = `${getApiBaseUrl()}/api/sync/push`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-company-cnpj': getActiveCompanyCnpj(),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return { success: true, data: result.data };
  } catch (error: any) {
    console.error('[CloudSync] Erro ao transmitir para a nuvem:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Transmitir um pedido unitário diretamente para a API central em nuvem
 */
export async function transmitSingleOrderToCloud(
  order: Order,
  relatedFinancialTitles?: FinancialTitle[]
): Promise<boolean> {
  try {
    const url = `${getApiBaseUrl()}/api/orders`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-company-cnpj': getActiveCompanyCnpj(),
      },
      body: JSON.stringify({
        ...order,
        financialTitles: relatedFinancialTitles || [],
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('[CloudSync] Erro ao enviar pedido individual:', error);
    return false;
  }
}
