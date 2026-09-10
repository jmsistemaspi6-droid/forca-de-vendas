import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DATABASE_BASE_DIR = path.join(process.cwd(), 'database');
const TENANTS_DIR = path.join(DATABASE_BASE_DIR, 'tenants');

// Estrutura de dados persistida na nuvem por cada CNPJ/Cliente
export interface CloudDatabase {
  cnpj: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  orders: any[];
  clients: any[];
  products: any[];
  financialTitles: any[];
  expenses: any[];
  accountabilitySessions: any[];
  visits: any[];
  suppliers: any[];
  payableTitles: any[];
  stockEntries: any[];
  users: any[];
  createdAt: string;
  lastUpdated: string;
}

// Higienizar CNPJ para uso como identificador de arquivo e partição
export function sanitizeCnpj(rawCnpj: any): string {
  if (!rawCnpj) return 'default';
  const clean = String(rawCnpj).replace(/\D/g, '').trim();
  return clean || 'default';
}

// Extrair CNPJ da requisição (Cabeçalho HTTP, Query param, Body ou Rota)
export function extractCnpjFromReq(req: express.Request): string {
  const fromHeader =
    req.headers['x-company-cnpj'] ||
    req.headers['x-cnpj'] ||
    req.headers['cnpj'];
  const fromQuery = req.query.cnpj || req.query.companyCnpj;
  const fromBody = req.body && (req.body.cnpj || req.body.companyCnpj);
  const fromParams = req.params && req.params.cnpj;

  const raw = fromHeader || fromQuery || fromBody || fromParams || 'default';
  return sanitizeCnpj(raw);
}

// Caminho do arquivo físico do banco em nuvem daquele CNPJ
export function getTenantDbFilePath(cnpj: string): string {
  const clean = sanitizeCnpj(cnpj);
  return path.join(TENANTS_DIR, `cloud_db_${clean}.json`);
}

// Carregar banco do CNPJ ou criar dinamicamente um banco zerado
export function loadDatabaseForCnpj(cnpj: string, companyMeta?: { razaoSocial?: string; nomeFantasia?: string }): CloudDatabase {
  const cleanCnpj = sanitizeCnpj(cnpj);
  const filePath = getTenantDbFilePath(cleanCnpj);

  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      if (companyMeta) {
        if (companyMeta.razaoSocial && !parsed.razaoSocial) parsed.razaoSocial = companyMeta.razaoSocial;
        if (companyMeta.nomeFantasia && !parsed.nomeFantasia) parsed.nomeFantasia = companyMeta.nomeFantasia;
      }
      return parsed;
    }
  } catch (error) {
    console.error(`[MultiTenant] Erro ao ler banco do CNPJ ${cleanCnpj}:`, error);
  }

  // Se não existir, cria dinamicamente um banco ZERADO para o CNPJ
  const now = new Date().toISOString();
  const zeroDb: CloudDatabase = {
    cnpj: cleanCnpj,
    razaoSocial: companyMeta?.razaoSocial || `Empresa CNPJ ${cleanCnpj}`,
    nomeFantasia: companyMeta?.nomeFantasia || `Filial ${cleanCnpj}`,
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
    users: [],
    createdAt: now,
    lastUpdated: now,
  };

  saveDatabaseForCnpj(cleanCnpj, zeroDb);
  console.log(`[MultiTenant] ✅ Novo banco ZERADO criado com sucesso para o CNPJ: ${cleanCnpj}`);
  return zeroDb;
}

// Salvar banco específico do CNPJ
export function saveDatabaseForCnpj(cnpj: string, db: CloudDatabase) {
  const cleanCnpj = sanitizeCnpj(cnpj);
  try {
    if (!fs.existsSync(TENANTS_DIR)) {
      fs.mkdirSync(TENANTS_DIR, { recursive: true });
    }
    const filePath = getTenantDbFilePath(cleanCnpj);
    db.lastUpdated = new Date().toISOString();
    fs.writeFileSync(filePath, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error(`[MultiTenant] Erro ao gravar banco do CNPJ ${cleanCnpj}:`, error);
  }
}

// Helper para mesclar listas por ID
export function mergeById(existingList: any[] = [], incomingList: any[] = []): any[] {
  const map = new Map<string, any>();
  existingList.forEach((item) => {
    if (item && item.id) map.set(String(item.id), item);
  });
  incomingList.forEach((item) => {
    if (item && item.id) {
      map.set(String(item.id), item);
    }
  });
  return Array.from(map.values());
}

// Criar aplicativo Express e configurar rotas
export function createBackendApp(): express.Application {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Middleware de Log Multi-Tenant
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      const cnpj = extractCnpjFromReq(req);
      res.setHeader('X-Company-CNPJ', cnpj);
    }
    next();
  });

  // ==================== ROTAS DA API ====================

  // 1. Health check e status do servidor
  app.get('/api/health', (req, res) => {
    const cnpj = extractCnpjFromReq(req);
    res.json({
      status: 'online',
      service: 'JM Sistemas Multi-Tenant Cloud API',
      activeCnpj: cnpj,
      timestamp: new Date().toISOString(),
    });
  });

  // 2. Listar todas as bases/empresas criadas no servidor
  app.get('/api/tenants', (req, res) => {
    try {
      if (!fs.existsSync(TENANTS_DIR)) {
        fs.mkdirSync(TENANTS_DIR, { recursive: true });
      }
      const files = fs.readdirSync(TENANTS_DIR).filter((f) => f.startsWith('cloud_db_') && f.endsWith('.json'));
      const tenants = files.map((fileName) => {
        try {
          const raw = fs.readFileSync(path.join(TENANTS_DIR, fileName), 'utf-8');
          const data = JSON.parse(raw);
          return {
            cnpj: data.cnpj,
            razaoSocial: data.razaoSocial || '',
            nomeFantasia: data.nomeFantasia || '',
            totalOrders: (data.orders || []).length,
            totalClients: (data.clients || []).length,
            totalProducts: (data.products || []).length,
            lastUpdated: data.lastUpdated,
            createdAt: data.createdAt,
          };
        } catch {
          return null;
        }
      }).filter(Boolean);

      res.json({ success: true, count: tenants.length, tenants });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Criar explicitamente um banco de dados ZERADO para um CNPJ
  app.post('/api/tenant/create', (req, res) => {
    try {
      const { cnpj, razaoSocial, nomeFantasia } = req.body;
      if (!cnpj) {
        return res.status(400).json({ success: false, error: 'CNPJ é obrigatório para criar a base.' });
      }

      const cleanCnpj = sanitizeCnpj(cnpj);
      const filePath = getTenantDbFilePath(cleanCnpj);
      const exists = fs.existsSync(filePath);

      const db = loadDatabaseForCnpj(cleanCnpj, { razaoSocial, nomeFantasia });

      res.json({
        success: true,
        isNew: !exists,
        message: exists
          ? `Base para o CNPJ ${cleanCnpj} já existente e pronta para uso.`
          : `Nova base zerada criada com sucesso na nuvem para o CNPJ ${cleanCnpj}!`,
        tenant: {
          cnpj: db.cnpj,
          razaoSocial: db.razaoSocial,
          nomeFantasia: db.nomeFantasia,
          lastUpdated: db.lastUpdated,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. GET /api/sync/data - Baixar dados da nuvem filtrados pelo CNPJ
  app.get(['/api/sync/data', '/api/tenant/:cnpj/sync/data'], (req, res) => {
    try {
      const cnpj = extractCnpjFromReq(req);
      const db = loadDatabaseForCnpj(cnpj);

      res.json({
        success: true,
        cnpj,
        data: db,
        lastUpdated: db.lastUpdated,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. POST /api/sync/push - Enviar e unificar pedidos, clientes e financeiro para o banco do CNPJ
  app.post(['/api/sync/push', '/api/tenant/:cnpj/sync/push'], (req, res) => {
    try {
      const cnpj = extractCnpjFromReq(req);
      const db = loadDatabaseForCnpj(cnpj);
      const payload = req.body || {};

      if (Array.isArray(payload.orders) && payload.orders.length > 0) {
        db.orders = mergeById(db.orders, payload.orders);
      }
      if (Array.isArray(payload.clients) && payload.clients.length > 0) {
        db.clients = mergeById(db.clients, payload.clients);
      }
      if (Array.isArray(payload.products) && payload.products.length > 0) {
        db.products = mergeById(db.products, payload.products);
      }
      if (Array.isArray(payload.financialTitles) && payload.financialTitles.length > 0) {
        db.financialTitles = mergeById(db.financialTitles, payload.financialTitles);
      }
      if (Array.isArray(payload.expenses) && payload.expenses.length > 0) {
        db.expenses = mergeById(db.expenses, payload.expenses);
      }
      if (Array.isArray(payload.accountabilitySessions) && payload.accountabilitySessions.length > 0) {
        db.accountabilitySessions = mergeById(db.accountabilitySessions, payload.accountabilitySessions);
      }
      if (Array.isArray(payload.visits) && payload.visits.length > 0) {
        db.visits = mergeById(db.visits, payload.visits);
      }
      if (Array.isArray(payload.suppliers) && payload.suppliers.length > 0) {
        db.suppliers = mergeById(db.suppliers, payload.suppliers);
      }
      if (Array.isArray(payload.payableTitles) && payload.payableTitles.length > 0) {
        db.payableTitles = mergeById(db.payableTitles, payload.payableTitles);
      }
      if (Array.isArray(payload.stockEntries) && payload.stockEntries.length > 0) {
        db.stockEntries = mergeById(db.stockEntries, payload.stockEntries);
      }

      saveDatabaseForCnpj(cnpj, db);

      res.json({
        success: true,
        cnpj,
        message: `Dados sincronizados com sucesso na base do CNPJ ${cnpj}!`,
        data: db,
      });
    } catch (err: any) {
      console.error('[MultiTenant Sync Error]:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. GET /api/orders - Listar pedidos daquele CNPJ
  app.get(['/api/orders', '/api/tenant/:cnpj/orders'], (req, res) => {
    try {
      const cnpj = extractCnpjFromReq(req);
      const db = loadDatabaseForCnpj(cnpj);
      res.json({
        success: true,
        cnpj,
        count: db.orders.length,
        orders: db.orders,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. POST /api/orders - Salvar pedido unitário no banco daquele CNPJ
  app.post(['/api/orders', '/api/tenant/:cnpj/orders'], (req, res) => {
    try {
      const cnpj = extractCnpjFromReq(req);
      const db = loadDatabaseForCnpj(cnpj);
      const newOrder = req.body;

      if (!newOrder || !newOrder.id) {
        return res.status(400).json({ success: false, error: 'Pedido inválido ou sem ID' });
      }

      const existingIdx = db.orders.findIndex((o) => o.id === newOrder.id);
      if (existingIdx >= 0) {
        db.orders[existingIdx] = newOrder;
      } else {
        db.orders.unshift(newOrder);
      }

      if (Array.isArray(req.body.financialTitles)) {
        db.financialTitles = mergeById(db.financialTitles, req.body.financialTitles);
      }

      saveDatabaseForCnpj(cnpj, db);

      res.json({
        success: true,
        cnpj,
        message: `Pedido ${newOrder.numeroPedido || newOrder.id} gravado na nuvem do CNPJ ${cnpj}!`,
        order: newOrder,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 8. POST /api/reset-db - Resetar para zerado o banco de um CNPJ
  app.post(['/api/reset-db', '/api/tenant/:cnpj/reset-db'], (req, res) => {
    try {
      const cnpj = extractCnpjFromReq(req);
      const now = new Date().toISOString();
      const emptyDb: CloudDatabase = {
        cnpj,
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
        users: [],
        createdAt: now,
        lastUpdated: now,
      };

      saveDatabaseForCnpj(cnpj, emptyDb);
      res.json({
        success: true,
        cnpj,
        message: `Banco de dados do CNPJ ${cnpj} reinicializado para zerado com sucesso.`,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return app;
}

// Se executado diretamente como script de servidor
if (process.argv[1] && process.argv[1].includes('backend')) {
  const app = createBackendApp();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[JM Backend] Servidor Express Multi-Tenant CNPJ ativo na porta ${PORT}`);
  });
}
