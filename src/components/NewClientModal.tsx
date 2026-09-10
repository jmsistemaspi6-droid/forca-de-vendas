import React, { useState, useEffect } from 'react';
import { useSales } from '../context/SalesContext';
import { Client, ClientStatus, ClientTier } from '../types';
import {
  X,
  Building2,
  Save,
  CheckCircle2,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Search,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Building,
  Info,
  Users
} from 'lucide-react';
import { PAYMENT_CONDITIONS } from '../data/mockData';
import {
  consultarCNPJ,
  consultarCEP,
  formatCNPJ,
  formatCEP,
  cleanOnlyNumbers,
  CnpjLookupResult
} from '../services/consultasApi';

interface NewClientModalProps {
  onClose: () => void;
  onClientCreated?: (newClient: Client) => void;
  initialSearch?: string;
}

export const NewClientModal: React.FC<NewClientModalProps> = ({
  onClose,
  onClientCreated,
  initialSearch = ''
}) => {
  const { addClient } = useSales();

  // Processa termo inicial de busca (se fornecido)
  const initialDigits = cleanOnlyNumbers(initialSearch);
  const isCnpjOrCpf = initialDigits.length >= 11;

  // Estados dos Campos
  const [razaoSocial, setRazaoSocial] = useState(isCnpjOrCpf ? '' : initialSearch);
  const [nomeFantasia, setNomeFantasia] = useState(isCnpjOrCpf ? '' : initialSearch);
  const [cnpjCpf, setCnpjCpf] = useState(isCnpjOrCpf ? formatCNPJ(initialSearch) : '');
  const [inscricaoEstadual, setInscricaoEstadual] = useState('');
  const [contatoPrincipal, setContatoPrincipal] = useState('');
  const [cargoContato, setCargoContato] = useState('Gerente de Compras');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  
  // Endereço
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [cep, setCep] = useState('');

  // Comercial
  const [limiteCredito, setLimiteCredito] = useState(15000);
  const [tabelaPrecoPadrao, setTabelaPrecoPadrao] = useState<'varejo' | 'atacado' | 'distribuidor'>('atacado');
  const [condicaoPagamentoPadrao, setCondicaoPagamentoPadrao] = useState('28/35/42 DDL');
  const [pontuacaoABC, setPontuacaoABC] = useState<ClientTier>('B');
  const [observacoes, setObservacoes] = useState('');

  // Estados de Consulta Externa (CNPJ e CEP)
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [cnpjFeedback, setCnpjFeedback] = useState<{
    tipo: 'success' | 'warning' | 'error';
    mensagem: string;
    detalhes?: CnpjLookupResult;
  } | null>(null);
  const [cepFeedback, setCepFeedback] = useState<{
    tipo: 'success' | 'error';
    mensagem: string;
  } | null>(null);

  // Se o termo inicial for um CNPJ completo (14 dígitos), pesquisa automaticamente na Receita
  useEffect(() => {
    if (initialDigits && initialDigits.length === 14) {
      handleBuscarCNPJ(initialDigits);
    }
  }, []);

  // Manipulador de alteração de CNPJ com máscara
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const formatted = formatCNPJ(rawVal);
    setCnpjCpf(formatted);

    // Se o usuário colou ou digitou 14 dígitos completos, aciona busca automática
    const digits = cleanOnlyNumbers(rawVal);
    if (digits.length === 14 && !loadingCnpj) {
      handleBuscarCNPJ(digits);
    }
  };

  // Consulta CNPJ na Receita Federal
  const handleBuscarCNPJ = async (cnpjParaConsultar?: string) => {
    const digits = cleanOnlyNumbers(cnpjParaConsultar || cnpjCpf);
    if (digits.length !== 14) {
      setCnpjFeedback({
        tipo: 'warning',
        mensagem: 'Digite um CNPJ válido com 14 dígitos numéricos para consultar na Receita Federal.',
      });
      return;
    }

    setLoadingCnpj(true);
    setCnpjFeedback(null);

    try {
      const data = await consultarCNPJ(digits);

      // Preenche os dados cadastrais retornados da Receita
      if (data.razaoSocial) setRazaoSocial(data.razaoSocial);
      if (data.nomeFantasia) {
        setNomeFantasia(data.nomeFantasia);
      } else if (data.razaoSocial) {
        setNomeFantasia(data.razaoSocial);
      }

      if (data.logradouro) setRua(data.logradouro);
      if (data.numero) setNumero(data.numero);
      if (data.complemento) setComplemento(data.complemento);
      if (data.bairro) setBairro(data.bairro);
      if (data.municipio) setCidade(data.municipio);
      if (data.uf) setUf(data.uf);
      if (data.cep) setCep(data.cep);

      if (data.telefone) {
        setTelefone(data.telefone);
        if (!whatsapp) setWhatsapp(cleanOnlyNumbers(data.telefone));
      }
      if (data.email) setEmail(data.email.toLowerCase());

      // Se houver sócios no QSA, sugere o primeiro como contato
      if (data.qsa && data.qsa.length > 0 && !contatoPrincipal) {
        setContatoPrincipal(data.qsa[0].nome_socio);
        setCargoContato(data.qsa[0].qualificacao_socio || 'Sócio Administrador');
      }

      // Adiciona observação com atividade econômica se houver
      if (data.cnaePrincipalDescricao) {
        setObservacoes((prev) => 
          prev ? `${prev} | Atividade: ${data.cnaePrincipalDescricao}` : `Atividade Principal: ${data.cnaePrincipalDescricao}`
        );
      }

      const isAtiva = data.situacaoCadastral.toUpperCase().includes('ATIVA');

      setCnpjFeedback({
        tipo: isAtiva ? 'success' : 'warning',
        mensagem: isAtiva 
          ? `CNPJ Ativo na Receita Federal! Dados da empresa e endereço preenchidos automaticamente.`
          : `Atenção: Situação cadastral na Receita é ${data.situacaoCadastral}. Verifique antes de aprovar crédito.`,
        detalhes: data,
      });

    } catch (err: any) {
      setCnpjFeedback({
        tipo: 'error',
        mensagem: err.message || 'Falha ao consultar CNPJ na Receita Federal.',
      });
    } finally {
      setLoadingCnpj(false);
    }
  };

  // Manipulador de alteração de CEP com máscara
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const formatted = formatCEP(rawVal);
    setCep(formatted);

    const digits = cleanOnlyNumbers(rawVal);
    if (digits.length === 8 && !loadingCep) {
      handleBuscarCEP(digits);
    }
  };

  // Consulta CEP nos Correios / ViaCEP
  const handleBuscarCEP = async (cepParaConsultar?: string) => {
    const digits = cleanOnlyNumbers(cepParaConsultar || cep);
    if (digits.length !== 8) {
      setCepFeedback({
        tipo: 'error',
        mensagem: 'Informe um CEP válido com 8 dígitos.',
      });
      return;
    }

    setLoadingCep(true);
    setCepFeedback(null);

    try {
      const data = await consultarCEP(digits);
      if (data.logradouro) setRua(data.logradouro);
      if (data.bairro) setBairro(data.bairro);
      if (data.localidade) setCidade(data.localidade);
      if (data.uf) setUf(data.uf);
      if (data.complemento && !complemento) setComplemento(data.complemento);

      setCepFeedback({
        tipo: 'success',
        mensagem: `Endereço localizado: ${data.localidade}/${data.uf}`,
      });
    } catch (err: any) {
      setCepFeedback({
        tipo: 'error',
        mensagem: err.message || 'Não foi possível encontrar o CEP informado.',
      });
    } finally {
      setLoadingCep(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeFantasia.trim() || !cnpjCpf.trim()) {
      alert('Preencha ao menos Nome Fantasia e CNPJ.');
      return;
    }

    const createdClient = addClient({
      razaoSocial: razaoSocial.trim() || nomeFantasia.trim(),
      nomeFantasia: nomeFantasia.trim(),
      cnpjCpf: cnpjCpf.trim(),
      inscricaoEstadual: inscricaoEstadual.trim() || undefined,
      email: email.trim() || 'compras@cliente.com.br',
      telefone: telefone.trim() || '(11) 3000-0000',
      whatsapp: cleanOnlyNumbers(whatsapp) || '11999999999',
      contatoPrincipal: contatoPrincipal.trim() || 'Comprador',
      cargoContato: cargoContato.trim(),
      endereco: {
        rua: rua.trim() || 'Av. Principal',
        numero: numero.trim() || '100',
        complemento: complemento.trim() || undefined,
        bairro: bairro.trim() || 'Centro',
        cidade: cidade.trim() || 'São Paulo',
        uf: uf.trim().toUpperCase() || 'SP',
        cep: cep.trim() || '01000-000',
      },
      status: 'ativo',
      limiteCredito: Number(limiteCredito) || 10000,
      creditoUtilizado: 0,
      tabelaPrecoPadrao,
      condicaoPagamentoPadrao,
      diasSemComprar: 0,
      pontuacaoABC,
      observacoes: observacoes.trim() || undefined,
    });

    if (onClientCreated && createdClient) {
      onClientCreated(createdClient);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-100 my-auto">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white">Cadastrar Novo Cliente</h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <Sparkles className="w-3 h-3" /> Auto-Preenchimento Receita
                </span>
                {initialSearch && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700/50">
                    Buscando: {initialSearch.length > 20 ? initialSearch.substring(0, 20) + '...' : initialSearch}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Digite o CNPJ para preencher automaticamente os dados na Receita Federal e o CEP para o endereço.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* Seção 1: Identificação & Consulta CNPJ */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Building className="w-4 h-4" /> 1. Identificação & Consulta Receita Federal
              </h4>
              <span className="text-[11px] text-slate-400">Campos com * são obrigatórios</span>
            </div>

            {/* CNPJ Input com Botão de Consulta da Receita */}
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80 space-y-2">
              <label className="block text-slate-200 font-bold">
                CNPJ da Empresa * <span className="text-slate-400 font-normal">(ou CPF)</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    required
                    value={cnpjCpf}
                    onChange={handleCnpjChange}
                    onBlur={() => {
                      const digits = cleanOnlyNumbers(cnpjCpf);
                      if (digits.length === 14 && !cnpjFeedback && !loadingCnpj) {
                        handleBuscarCNPJ(digits);
                      }
                    }}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-500"
                  />
                  {loadingCnpj && (
                    <div className="absolute right-3 top-2.5 text-blue-400 flex items-center gap-1.5 text-xs font-medium">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Consultando Receita...</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleBuscarCNPJ()}
                  disabled={loadingCnpj || cleanOnlyNumbers(cnpjCpf).length < 14}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed"
                >
                  {loadingCnpj ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Buscando...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Consultar Receita Federal</span>
                    </>
                  )}
                </button>
              </div>

              {/* Feedback da Consulta CNPJ */}
              {cnpjFeedback && (
                <div
                  className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs animate-in fade-in ${
                    cnpjFeedback.tipo === 'success'
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : cnpjFeedback.tipo === 'warning'
                      ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  }`}
                >
                  {cnpjFeedback.tipo === 'success' ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : cnpjFeedback.tipo === 'warning' ? (
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-semibold">{cnpjFeedback.mensagem}</p>
                    {cnpjFeedback.detalhes && (
                      <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-300">
                        <span className="bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                          Situação: <strong className={cnpjFeedback.detalhes.situacaoCadastral.includes('ATIVA') ? 'text-emerald-400' : 'text-amber-400'}>{cnpjFeedback.detalhes.situacaoCadastral}</strong>
                        </span>
                        {cnpjFeedback.detalhes.cnaePrincipalDescricao && (
                          <span className="bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 max-w-md truncate" title={cnpjFeedback.detalhes.cnaePrincipalDescricao}>
                            Ramo: {cnpjFeedback.detalhes.cnaePrincipalDescricao}
                          </span>
                        )}
                        {cnpjFeedback.detalhes.qsa && cnpjFeedback.detalhes.qsa.length > 0 && (
                          <span className="bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1">
                            <Users className="w-3 h-3 text-blue-400" />
                            {cnpjFeedback.detalhes.qsa.length} sócio(s) cadastrado(s)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome Fantasia *</label>
                <input
                  type="text"
                  required
                  value={nomeFantasia}
                  onChange={(e) => setNomeFantasia(e.target.value)}
                  placeholder="Ex: Mercadinho São Jorge"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Razão Social (Oficial da Receita)</label>
                <input
                  type="text"
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  placeholder="Ex: S. JORGE COMERCIO DE ALIMENTOS LTDA"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Inscrição Estadual (IE)</label>
                <input
                  type="text"
                  value={inscricaoEstadual}
                  onChange={(e) => setInscricaoEstadual(e.target.value)}
                  placeholder="Isento ou nº estadual"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">E-mail Comercial / NFe</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="compras@empresa.com.br"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Contatos */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Phone className="w-4 h-4" /> 2. Contato & Atendimento Comercial
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Contato Principal / Comprador</label>
                <input
                  type="text"
                  value={contatoPrincipal}
                  onChange={(e) => setContatoPrincipal(e.target.value)}
                  placeholder="Ex: Roberto Silva"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Cargo / Função</label>
                <input
                  type="text"
                  value={cargoContato}
                  onChange={(e) => setCargoContato(e.target.value)}
                  placeholder="Ex: Gerente de Compras"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Telefone Fixo / Comercial</label>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(11) 3000-0000"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-slate-300 font-semibold mb-1">WhatsApp para Envio de Pedidos & Boletos</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="11987654321 (apenas números ou formatado)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Endereço & Consulta de CEP */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> 3. Endereço de Entrega & Cobrança (Consulta por CEP)
              </h4>
            </div>

            {/* CEP com Busca Integrada */}
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80 space-y-2">
              <label className="block text-slate-200 font-bold">
                CEP (Código de Endereçamento Postal)
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={cep}
                    onChange={handleCepChange}
                    onBlur={() => {
                      const digits = cleanOnlyNumbers(cep);
                      if (digits.length === 8 && !cepFeedback && !loadingCep) {
                        handleBuscarCEP(digits);
                      }
                    }}
                    placeholder="00000-000"
                    maxLength={9}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-500"
                  />
                  {loadingCep && (
                    <div className="absolute right-3 top-2.5 text-blue-400 flex items-center gap-1.5 text-xs font-medium">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Buscando CEP...</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleBuscarCEP()}
                  disabled={loadingCep || cleanOnlyNumbers(cep).length < 8}
                  className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed"
                >
                  {loadingCep ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Localizando...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Buscar Endereço pelo CEP</span>
                    </>
                  )}
                </button>
              </div>

              {/* Feedback CEP */}
              {cepFeedback && (
                <div
                  className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs animate-in fade-in ${
                    cepFeedback.tipo === 'success'
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  }`}
                >
                  {cepFeedback.tipo === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{cepFeedback.mensagem}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">Logradouro (Rua / Avenida)</label>
                <input
                  type="text"
                  value={rua}
                  onChange={(e) => setRua(e.target.value)}
                  placeholder="Ex: Av. Brasil"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Número *</label>
                <input
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="1200"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Complemento / Doca / Sala</label>
                <input
                  type="text"
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  placeholder="Galpão B, Sala 102"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Bairro</label>
                <input
                  type="text"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  placeholder="Bairro"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Cidade</label>
                  <input
                    type="text"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    placeholder="Cidade"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">UF</label>
                  <input
                    type="text"
                    value={uf}
                    onChange={(e) => setUf(e.target.value)}
                    placeholder="SP"
                    maxLength={2}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white uppercase font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 4: Condições Comerciais & Limite de Crédito */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" /> 4. Parâmetros Comerciais & Crédito
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Limite de Crédito Inicial (R$)</label>
                <input
                  type="number"
                  value={limiteCredito}
                  onChange={(e) => setLimiteCredito(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tabela Padrão</label>
                <select
                  value={tabelaPrecoPadrao}
                  onChange={(e) => setTabelaPrecoPadrao(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="varejo">Tabela Varejo</option>
                  <option value="atacado">Tabela Atacado</option>
                  <option value="distribuidor">Tabela Super Distribuidor</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Classificação ABC</label>
                <select
                  value={pontuacaoABC}
                  onChange={(e) => setPontuacaoABC(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="A">Curva A (Alto Volume)</option>
                  <option value="B">Curva B (Médio Volume)</option>
                  <option value="C">Curva C (Pequeno Volume)</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-slate-300 font-semibold mb-1">Condição de Pagamento Padrão</label>
                <select
                  value={condicaoPagamentoPadrao}
                  onChange={(e) => setCondicaoPagamentoPadrao(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  {PAYMENT_CONDITIONS.map((cond) => (
                    <option key={cond} value={cond}>
                      {cond}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-slate-300 font-semibold mb-1">Observações de Recebimento & Logística</label>
                <input
                  type="text"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex: Recebe após 14h, descarregamento na doca dos fundos..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/95 sticky bottom-0 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 flex items-center justify-between gap-2">
            <div className="text-[11px] text-slate-400 hidden sm:block">
              {cnpjFeedback?.tipo === 'success' ? (
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Dados validados pela Receita Federal
                </span>
              ) : (
                <span>Preencha os dados cadastrais e clique em Salvar</span>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-700/25 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Cliente</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

