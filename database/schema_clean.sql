-- ============================================================================
-- SCHEMA DDL: TABELAS DO SISTEMA DE FORÇA DE VENDAS E RETAGUARDA
-- ============================================================================

-- 1. TABELA DE PRODUTOS
DROP TABLE IF EXISTS produtos CASCADE;
CREATE TABLE produtos (
    id VARCHAR(64) PRIMARY KEY,
    codigo_sku VARCHAR(50) UNIQUE NOT NULL,
    codigo_barras VARCHAR(50),
    nome VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) DEFAULT 'Geral',
    marca VARCHAR(100) DEFAULT 'Distribuidora',
    unidade VARCHAR(10) DEFAULT 'UN',
    preco_custo DECIMAL(12, 2) DEFAULT 0.00,
    preco_venda_atacado DECIMAL(12, 2) DEFAULT 0.00,
    preco_venda_varejo DECIMAL(12, 2) DEFAULT 0.00,
    preco_venda_distribuidor DECIMAL(12, 2) DEFAULT 0.00,
    saldo_estoque DECIMAL(12, 2) DEFAULT 0.00,
    estoque_minimo DECIMAL(12, 2) DEFAULT 0.00,
    multiplo_venda INT DEFAULT 1,
    desconto_maximo_pct DECIMAL(5, 2) DEFAULT 10.00,
    comissao_pct DECIMAL(5, 2) DEFAULT 3.00,
    peso_kg DECIMAL(8, 3) DEFAULT 0.000,
    status VARCHAR(20) DEFAULT 'ativo',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DE CLIENTES
DROP TABLE IF EXISTS clientes CASCADE;
CREATE TABLE clientes (
    id VARCHAR(64) PRIMARY KEY,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    documento VARCHAR(20) UNIQUE, -- CNPJ ou CPF desformatado (apenas números)
    inscricao_estadual VARCHAR(30) DEFAULT 'ISENTO',
    email VARCHAR(150),
    telefone VARCHAR(20),
    whatsapp VARCHAR(20),
    contato_principal VARCHAR(100),
    endereco_rua VARCHAR(255),
    endereco_numero VARCHAR(20),
    endereco_bairro VARCHAR(100),
    endereco_cidade VARCHAR(100),
    endereco_uf VARCHAR(2),
    endereco_cep VARCHAR(10),
    limite_credito DECIMAL(12, 2) DEFAULT 5000.00,
    credito_utilizado DECIMAL(12, 2) DEFAULT 0.00,
    tabela_preco_padrao VARCHAR(30) DEFAULT 'atacado',
    condicao_pagamento_padrao VARCHAR(50) DEFAULT '28 DDL',
    dias_sem_comprar INT DEFAULT 0,
    pontuacao_abc CHAR(1) DEFAULT 'B',
    status VARCHAR(20) DEFAULT 'ativo',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABELA DE CONTAS A RECEBER
DROP TABLE IF EXISTS contas_a_receber_baixas CASCADE;
DROP TABLE IF EXISTS contas_a_receber CASCADE;

CREATE TABLE contas_a_receber (
    id VARCHAR(64) PRIMARY KEY,
    cliente_id VARCHAR(64) REFERENCES clientes(id) ON DELETE SET NULL,
    cliente_nome VARCHAR(255) NOT NULL,
    cliente_documento VARCHAR(20),
    numero_documento VARCHAR(50) NOT NULL,
    parcela VARCHAR(10) DEFAULT '1/1',
    data_emissao DATE NOT NULL,
    data_vencimento DATE NOT NULL,
    valor_original DECIMAL(12, 2) NOT NULL,
    valor_recebido DECIMAL(12, 2) DEFAULT 0.00,
    saldo_restante DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'a_vencer', -- 'a_vencer', 'vencido', 'parcial', 'pago', 'cancelado'
    forma_cobranca VARCHAR(50) DEFAULT 'Boleto Bancário',
    dias_atraso INT DEFAULT 0,
    observacoes TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA DE HISTÓRICO DE BAIXAS / AMORTIZAÇÕES PARCIAIS (JOIN com Contas a Receber)
CREATE TABLE contas_a_receber_baixas (
    id VARCHAR(64) PRIMARY KEY,
    titulo_id VARCHAR(64) REFERENCES contas_a_receber(id) ON DELETE CASCADE,
    data_recebimento DATE NOT NULL,
    valor_recebido DECIMAL(12, 2) NOT NULL,
    valor_juros_multa DECIMAL(12, 2) DEFAULT 0.00,
    valor_desconto DECIMAL(12, 2) DEFAULT 0.00,
    valor_liquido_efetivo DECIMAL(12, 2) NOT NULL,
    forma_recebimento VARCHAR(50) NOT NULL,
    recibo_numero VARCHAR(50),
    responsavel VARCHAR(100),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);