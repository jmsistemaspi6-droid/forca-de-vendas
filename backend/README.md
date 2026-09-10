# JM Sistemas - Backend Cloud Multi-Tenant por CNPJ

Servidor central Express desenvolvido para persistência e sincronização de dados em nuvem. Cada empresa/cliente cadastrado possui seu próprio banco de dados isolado e zerado, identificado exclusivamente pelo seu CNPJ.

## 🚀 Como Executar o Backend
```bash
cd backend
npm install
npm run dev
```

O servidor iniciará na porta `3000` (ou na variável de ambiente `PORT`).

---

## 🏢 Arquitetura Multi-Tenant Dinâmica por CNPJ

1. **Separação Física por Arquivo**:
   - Cada CNPJ tem sua própria base física salva em: `database/tenants/cloud_db_{CNPJ}.json`.
2. **Criação Dinâmica Automática**:
   - Quando um CNPJ novo realiza a primeira requisição ou login, o servidor automaticamente instancia uma base **100% ZERADA** e limpa para aquela empresa.
3. **Identificação por Cabeçalho HTTP**:
   - O aplicativo móvel (Expo) ou web envia o cabeçalho `x-company-cnpj: 12345678000190` ou parâmetro `?cnpj=12345678000190`.
   - O backend roteia automaticamente todas as operações de leitura, escrita e sincronização para o banco isolado daquela empresa.

---

## 📡 Rotas Disponíveis

- `GET /api/health` - Status da API e CNPJ ativo na requisição
- `GET /api/tenants` - Lista todas as empresas/CNPJs cadastrados
- `POST /api/tenant/create` - Cria explicitamente um banco zerado para um novo CNPJ
- `GET /api/sync/data` - Baixa dados da nuvem do CNPJ especificado no cabeçalho `x-company-cnpj`
- `POST /api/sync/push` - Envia e unifica pedidos, clientes e produtos na base do CNPJ
- `GET /api/orders` - Lista pedidos emitidos para o CNPJ
- `POST /api/orders` - Grava um pedido avulso no banco do CNPJ
- `POST /api/reset-db` - Reinicializa a base do CNPJ para o estado zerado
