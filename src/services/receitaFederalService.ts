/**
 * Serviço de Consulta de Dados de Empresas e Endereços na Nuvem
 * Integração com Receita Federal (BrasilAPI / MinhaReceita) e ViaCEP
 */

export interface DadosReceitaFederal {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  situacaoCadastral: string;
  dataAbertura?: string;
  cnaeDescricao?: string;
  cnaeCodigo?: string;
  naturezaJuridica?: string;
  regimeTributario?: 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real' | 'MEI';
  telefone?: string;
  email?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
}

export interface DadosCep {
  cep: string;
  logradouro: string;
  bairro: string;
  municipio: string;
  uf: string;
  ibge?: string;
}

/**
 * Formata CNPJ (00.000.000/0000-00)
 */
export function formatCNPJ(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

/**
 * Formata CPF (000.000.000-00)
 */
export function formatCPF(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Formata CEP (00000-000)
 */
export function formatCEP(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

/**
 * Formata Telefone / Celular ((00) 00000-0000)
 */
export function formatPhone(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Consulta dados de CNPJ diretamente na Receita Federal
 */
export async function consultarCnpjReceita(
  cnpjInput: string
): Promise<{ success: boolean; data?: DadosReceitaFederal; message?: string }> {
  const cleanCnpj = cnpjInput.replace(/\D/g, '');

  if (cleanCnpj.length !== 14) {
    return {
      success: false,
      message: 'CNPJ inválido. Digite os 14 dígitos numéricos.',
    };
  }

  // 1ª Tentativa: BrasilAPI (Rápida e sem necessidade de chave)
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`, {
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      const data = await res.json();
      const formatado: DadosReceitaFederal = {
        cnpj: formatCNPJ(cleanCnpj),
        razaoSocial: data.razao_social || data.nome_fantasia || '',
        nomeFantasia: data.nome_fantasia || data.razao_social || '',
        situacaoCadastral: data.descricao_situacao_cadastral || 'ATIVA',
        dataAbertura: data.data_inicio_atividade || '',
        cnaeCodigo: String(data.cnae_fiscal || ''),
        cnaeDescricao: data.cnae_fiscal_descricao || '',
        naturezaJuridica: data.natureza_juridica || '',
        regimeTributario: data.opcao_pelo_simples
          ? 'Simples Nacional'
          : data.opcao_pelo_mei
          ? 'MEI'
          : 'Lucro Presumido',
        telefone: data.ddd_telefone_1 ? formatPhone(data.ddd_telefone_1) : '',
        email: (data.email || '').toLowerCase(),
        logradouro: data.descricao_tipo_de_logradouro
          ? `${data.descricao_tipo_de_logradouro} ${data.logradouro || ''}`.trim()
          : data.logradouro || '',
        numero: data.numero || 'S/N',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        municipio: data.municipio || '',
        uf: (data.uf || '').toUpperCase(),
        cep: data.cep ? formatCEP(String(data.cep)) : '',
      };
      return { success: true, data: formatado };
    }
  } catch (err) {
    console.warn('[ReceitaFederal] Tentativa BrasilAPI falhou, tentando fallback...', err);
  }

  // 2ª Tentativa Fallback: MinhaReceita
  try {
    const res = await fetch(`https://minhareceita.org/${cleanCnpj}`, {
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      const data = await res.json();
      const formatado: DadosReceitaFederal = {
        cnpj: formatCNPJ(cleanCnpj),
        razaoSocial: data.razao_social || '',
        nomeFantasia: data.nome_fantasia || data.razao_social || '',
        situacaoCadastral: data.descricao_situacao_cadastral || 'ATIVA',
        dataAbertura: data.data_inicio_atividade || '',
        cnaeCodigo: String(data.cnae_fiscal || ''),
        cnaeDescricao: data.cnae_fiscal_descricao || '',
        naturezaJuridica: data.natureza_juridica || '',
        regimeTributario: data.opcao_pelo_simples
          ? 'Simples Nacional'
          : data.opcao_pelo_mei
          ? 'MEI'
          : 'Lucro Presumido',
        telefone: data.ddd_telefone_1 ? formatPhone(data.ddd_telefone_1) : '',
        email: (data.email || '').toLowerCase(),
        logradouro: data.descricao_tipo_de_logradouro
          ? `${data.descricao_tipo_de_logradouro} ${data.logradouro || ''}`.trim()
          : data.logradouro || '',
        numero: data.numero || 'S/N',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        municipio: data.municipio || '',
        uf: (data.uf || '').toUpperCase(),
        cep: data.cep ? formatCEP(String(data.cep)) : '',
      };
      return { success: true, data: formatado };
    }
  } catch (err) {
    console.error('[ReceitaFederal] Erro ao consultar CNPJ:', err);
  }

  return {
    success: false,
    message: 'Não foi possível consultar os dados na Receita Federal. Verifique o CNPJ ou digite os dados manualmente.',
  };
}

/**
 * Consulta dados de Endereço pelo CEP (ViaCEP / BrasilAPI)
 */
export async function consultarCepEndereco(
  cepInput: string
): Promise<{ success: boolean; data?: DadosCep; message?: string }> {
  const cleanCep = cepInput.replace(/\D/g, '');

  if (cleanCep.length !== 8) {
    return {
      success: false,
      message: 'CEP inválido. Digite os 8 dígitos numéricos.',
    };
  }

  // 1ª Tentativa: ViaCEP
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      const data = await res.json();
      if (!data.erro) {
        return {
          success: true,
          data: {
            cep: formatCEP(cleanCep),
            logradouro: data.logradouro || '',
            bairro: data.bairro || '',
            municipio: data.localidade || '',
            uf: (data.uf || '').toUpperCase(),
            ibge: data.ibge,
          },
        };
      }
    }
  } catch (err) {
    console.warn('[ViaCEP] Tentativa ViaCEP falhou, tentando BrasilAPI...', err);
  }

  // 2ª Tentativa Fallback: BrasilAPI
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`, {
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        data: {
          cep: formatCEP(cleanCep),
          logradouro: data.street || '',
          bairro: data.neighborhood || '',
          municipio: data.city || '',
          uf: (data.state || '').toUpperCase(),
        },
      };
    }
  } catch (err) {
    console.error('[ViaCEP] Erro ao consultar CEP:', err);
  }

  return {
    success: false,
    message: 'Endereço não localizado para este CEP. Digite o endereço manualmente.',
  };
}
