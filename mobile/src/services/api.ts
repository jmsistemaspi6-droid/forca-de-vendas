import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Order, CloudSyncResponse } from '../types';

const STORAGE_KEY_CNPJ = '@jm_forca_vendas:active_cnpj';
const STORAGE_KEY_BASE_URL = '@jm_forca_vendas:backend_url';

// URL padrão da nuvem (pode ser personalizada no app móvel)
export const DEFAULT_BACKEND_URL = 'https://ais-dev-6fkj2ol534ym35zguvgnwg-504819958965.us-east1.run.app';
export const DEFAULT_CNPJ = '12345678000190';

let currentCnpj: string = DEFAULT_CNPJ;
let currentBaseUrl: string = DEFAULT_BACKEND_URL;

// Criar instância Axios
export const apiClient: AxiosInstance = axios.create({
  baseURL: DEFAULT_BACKEND_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor de requisições: injeta SEMPRE o CNPJ atual no cabeçalho HTTP
apiClient.interceptors.request.use(async (config) => {
  try {
    // Tenta carregar do storage se não estiver em memória
    if (!currentCnpj) {
      const storedCnpj = await AsyncStorage.getItem(STORAGE_KEY_CNPJ);
      if (storedCnpj) currentCnpj = storedCnpj;
    }
  } catch {
    // ignore
  }

  // Define o cabeçalho 'x-company-cnpj' para roteamento multi-tenant dinâmico
  config.headers['x-company-cnpj'] = currentCnpj;
  config.headers['x-cnpj'] = currentCnpj;

  return config;
});

/**
 * Define o CNPJ da empresa ativa no aplicativo e persiste no storage
 */
export async function setActiveCompanyCnpj(cnpj: string): Promise<void> {
  const clean = String(cnpj || '').replace(/\D/g, '').trim() || DEFAULT_CNPJ;
  currentCnpj = clean;
  try {
    await AsyncStorage.setItem(STORAGE_KEY_CNPJ, clean);
  } catch (e) {
    console.warn('[API] Erro ao salvar CNPJ no AsyncStorage:', e);
  }
}

/**
 * Obtém o CNPJ da empresa atualmente conectada
 */
export async function getActiveCompanyCnpj(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY_CNPJ);
    if (stored) {
      currentCnpj = stored;
      return stored;
    }
  } catch {
    // ignore
  }
  return currentCnpj || DEFAULT_CNPJ;
}

/**
 * Configura o endereço base do servidor backend Express
 */
export async function setBackendBaseUrl(url: string): Promise<void> {
  const cleanUrl = (url || '').trim().replace(/\/+$/, '');
  currentBaseUrl = cleanUrl || DEFAULT_BACKEND_URL;
  apiClient.defaults.baseURL = currentBaseUrl;
  try {
    await AsyncStorage.setItem(STORAGE_KEY_BASE_URL, currentBaseUrl);
  } catch (e) {
    console.warn('[API] Erro ao salvar URL no AsyncStorage:', e);
  }
}

/**
 * Obtém a URL do backend atualmente configurada
 */
export async function getBackendBaseUrl(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY_BASE_URL);
    if (stored) {
      currentBaseUrl = stored;
      apiClient.defaults.baseURL = stored;
      return stored;
    }
  } catch {
    // ignore
  }
  return currentBaseUrl;
}

/**
 * 1. Health check do servidor com o CNPJ ativo
 */
export async function checkBackendHealth(): Promise<{ online: boolean; activeCnpj?: string; error?: string }> {
  try {
    const response = await apiClient.get('/api/health');
    return {
      online: response.data?.status === 'online',
      activeCnpj: response.data?.activeCnpj || currentCnpj,
    };
  } catch (error: any) {
    return { online: false, error: error.message };
  }
}

/**
 * 2. Baixar dados da nuvem do banco isolado do CNPJ ativo
 */
export async function fetchCloudData(): Promise<CloudSyncResponse> {
  try {
    const response = await apiClient.get('/api/sync/data');
    return {
      success: true,
      cnpj: response.data?.cnpj || currentCnpj,
      data: response.data?.data,
    };
  } catch (error: any) {
    console.error('[API] Erro ao buscar dados da nuvem:', error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
}

/**
 * 3. Enviar lote de dados (pedidos, clientes) para a nuvem daquele CNPJ
 */
export async function pushCloudData(payload: {
  orders?: Order[];
  clients?: any[];
  products?: any[];
}): Promise<CloudSyncResponse> {
  try {
    const response = await apiClient.post('/api/sync/push', payload);
    return {
      success: true,
      cnpj: response.data?.cnpj || currentCnpj,
      message: response.data?.message,
      data: response.data?.data,
    };
  } catch (error: any) {
    console.error('[API] Erro no push para a nuvem:', error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
}

/**
 * 4. Transmitir pedido individual criado no celular via HTTP POST para o CNPJ
 */
export async function sendOrderToCloud(order: Order): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await apiClient.post('/api/orders', order);
    return {
      success: true,
      message: response.data?.message || 'Pedido transmitido com sucesso!',
    };
  } catch (error: any) {
    console.error('[API] Erro ao enviar pedido individual:', error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
}
