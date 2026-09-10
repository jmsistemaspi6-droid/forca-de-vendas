// Serviços de consulta externa de CNPJ (Receita Federal) e CEP (ViaCEP / BrasilAPI)

export interface CnpjLookupResult {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  situacaoCadastral: string;
  dataSituacaoCadastral?: string;
  motivoSituacaoCadastral?: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  email: string;
  telefone: string;
  cnaePrincipalDescricao?: string;
  capitalSocial?: number;
  qsa?: Array<{ nome_socio: string; qualificacao_socio?: string }>;
}

export interface CepLookupResult {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge?: string;
  ddd?: string;
}

export function cleanOnlyNumbers(str: string): string {
  return str.replace(/\D/g, '');
}

export function formatCNPJ(value: string): string {
  const digits = cleanOnlyNumbers(value).slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

export function formatCEP(value: string): string {
  const digits = cleanOnlyNumbers(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

export function formatPhoneBR(value: string): string {
  const digits = cleanOnlyNumbers(value).slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Consulta CNPJ na Receita Federal via BrasilAPI (com fallback seguro para Minha Receita)
 */
export async function consultarCNPJ(cnpjInput: string): Promise<CnpjLookupResult> {
  const cleanCnpj = cleanOnlyNumbers(cnpjInput);
  if (cleanCnpj.length !== 14) {
    throw new Error('CNPJ deve conter exatamente 14 dígitos numéricos.');
  }

  // Tenta primeira fonte: BrasilAPI (rápida, dados oficiais da Receita Federal)
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (res.ok) {
      const data = await res.json();
      
      const phoneDigits = cleanOnlyNumbers(data.ddd_telefone_1 || data.telefone || '');
      const formattedPhone = phoneDigits.length >= 8 ? formatPhoneBR(phoneDigits) : (data.ddd_telefone_1 || '');

      return {
        cnpj: formatCNPJ(cleanCnpj),
        razaoSocial: data.razao_social || '',
        nomeFantasia: data.nome_fantasia || data.razao_social || '',
        situacaoCadastral: data.descricao_situacao_cadastral || data.situacao_cadastral || 'ATIVA',
        dataSituacaoCadastral: data.data_situacao_cadastral || '',
        motivoSituacaoCadastral: data.descricao_motivo_situacao_cadastral || '',
        logradouro: `${data.descricao_tipo_de_logradouro ? data.descricao_tipo_de_logradouro + ' ' : ''}${data.logradouro || ''}`.trim(),
        numero: data.numero || '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        municipio: data.municipio || '',
        uf: data.uf || '',
        cep: formatCEP(data.cep || ''),
        email: data.email || '',
        telefone: formattedPhone,
        cnaePrincipalDescricao: data.cnae_fiscal_descricao || '',
        capitalSocial: typeof data.capital_social === 'number' ? data.capital_social : undefined,
        qsa: data.qsa || [],
      };
    }
  } catch (err) {
    console.warn('Falha na consulta primária do CNPJ (BrasilAPI), tentando fallback...', err);
  }

  // Fallback 1: Minha Receita (Open-source Receita Federal mirror)
  try {
    const resFallback = await fetch(`https://minhareceita.org/${cleanCnpj}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (resFallback.ok) {
      const data = await resFallback.json();
      const phoneDigits = cleanOnlyNumbers(data.ddd_telefone_1 || '');
      const formattedPhone = phoneDigits.length >= 8 ? formatPhoneBR(phoneDigits) : (data.ddd_telefone_1 || '');

      return {
        cnpj: formatCNPJ(cleanCnpj),
        razaoSocial: data.razao_social || '',
        nomeFantasia: data.nome_fantasia || data.razao_social || '',
        situacaoCadastral: data.descricao_situacao_cadastral || 'ATIVA',
        dataSituacaoCadastral: data.data_situacao_cadastral || '',
        logradouro: `${data.descricao_tipo_de_logradouro ? data.descricao_tipo_de_logradouro + ' ' : ''}${data.logradouro || ''}`.trim(),
        numero: data.numero || '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        municipio: data.municipio || '',
        uf: data.uf || '',
        cep: formatCEP(data.cep || ''),
        email: data.email || '',
        telefone: formattedPhone,
        cnaePrincipalDescricao: data.cnae_fiscal_descricao || '',
        capitalSocial: typeof data.capital_social === 'number' ? data.capital_social : undefined,
        qsa: data.qsa || [],
      };
    }
  } catch (err) {
    console.warn('Falha no fallback Minha Receita', err);
  }

  throw new Error('Não foi possível localizar dados para o CNPJ informado na Receita Federal. Verifique o número digitado.');
}

/**
 * Consulta CEP via ViaCEP (com fallback para BrasilAPI)
 */
export async function consultarCEP(cepInput: string): Promise<CepLookupResult> {
  const cleanCep = cleanOnlyNumbers(cepInput);
  if (cleanCep.length !== 8) {
    throw new Error('CEP deve conter exatamente 8 dígitos numéricos.');
  }

  // Fonte primária: ViaCEP
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.erro) {
        throw new Error('CEP não encontrado na base dos Correios.');
      }

      return {
        cep: formatCEP(data.cep || cleanCep),
        logradouro: data.logradouro || '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        localidade: data.localidade || '',
        uf: data.uf || '',
        ibge: data.ibge,
        ddd: data.ddd,
      };
    }
  } catch (err: any) {
    if (err.message && err.message.includes('não encontrado')) {
      throw err;
    }
    console.warn('Falha na consulta primária do CEP (ViaCEP), tentando BrasilAPI...', err);
  }

  // Fallback: BrasilAPI CEP
  try {
    const resFallback = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (resFallback.ok) {
      const data = await resFallback.json();
      return {
        cep: formatCEP(data.cep || cleanCep),
        logradouro: data.street || '',
        complemento: '',
        bairro: data.neighborhood || '',
        localidade: data.city || '',
        uf: data.state || '',
      };
    }
  } catch (err) {
    console.warn('Falha no fallback BrasilAPI CEP', err);
  }

  throw new Error('CEP não encontrado. Verifique se o código postal está correto.');
}

// Aliases for convenience
export const consultarCnpjReceita = consultarCNPJ;
export const consultarCepCorreios = consultarCEP;
export const formatarCnpj = formatCNPJ;
export const formatarCep = formatCEP;

