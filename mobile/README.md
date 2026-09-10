# JM Força de Vendas Mobile (Expo React Native)

Aplicativo móvel 100% puro em **Expo (React Native)**, completamente desacoplado de dependências web (Vite, Express ou scripts de banco de dados).

---

## 🚀 Como Compilar com o EAS Build (Android AAB / APK)

### 1. Entrar na pasta do aplicativo mobile:
```bash
cd mobile
```

### 2. Instalar as dependências do Expo:
```bash
npm install
```

### 3. Fazer login na sua conta Expo (se necessário):
```bash
npx eas-cli login
```

### 4. Gerar o pacote de produção (.AAB para Google Play):
```bash
npx eas-cli build --platform android --profile production
```

### 5. Ou gerar APK direto para testes no celular:
```bash
npx eas-cli build --platform android --profile preview
```

---

## 📡 Comunicação com o Backend Multi-Tenant

O aplicativo comunica-se com a API do servidor através de requisições HTTP (`axios`), injetando automaticamente o cabeçalho:
```http
x-company-cnpj: 12345678000190
```

Isso garante que:
1. O backend saiba exatamente qual banco de dados isolado acessar.
2. Cada empresa/cliente tenha seus próprios pedidos, clientes e produtos.
3. Se um novo CNPJ for configurado no aplicativo, o servidor criará automaticamente uma base **100% ZERADA** na nuvem.
