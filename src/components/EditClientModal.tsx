import React, { useState } from 'react';
import { useSales } from '../context/SalesContext';
import { Client, ClientTier, ClientStatus } from '../types';
import {
  X,
  Building2,
  Save,
  CheckCircle2,
  Sparkles,
  MapPin,
  Phone,
  DollarSign,
  Search,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Building,
  Users,
  Edit3
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

interface EditClientModalProps {
  client: Client;
  onClose: () => void;
  onSaved?: () => void;
}

export const EditClientModal: React.FC<EditClientModalProps> = ({ client, onClose, onSaved }) => {
  const { updateClient } = useSales();

  // Estados dos Campos Inicializados com os Dados Existentes do Cliente
  const [razaoSocial, setRazaoSocial] = useState(client.razaoSocial || '');
  const [nomeFantasia, setNomeFantasia] = useState(client.nomeFantasia || '');
  const [cnpjCpf, setCnpjCpf] = useState(client.cnpjCpf || '');
  const [inscricaoEstadual, setInscricaoEstadual] = useState(client.inscricaoEstadual || '');
  const [status, setStatus] = useState<ClientStatus>(client.status || 'ativo');

  // Contato
  const [contatoPrincipal, setContatoPrincipal] = useState(client.contatoPrincipal || '');
  const [cargoContato, setCargoContato] = useState(client.cargoContato || '');
  const [email, setEmail] = useState(client.email || '');
  const [telefone, setTelefone] = useState(client.telefone || '');
  const [whatsapp, setWhatsapp] = useState(client.whatsapp || '');

  // Endereço
  const [rua, setRua] = useState(client.endereco.rua || '');
  const [numero, setNumero] = useState(client.endereco.numero || '');
  const [complemento, setComplemento] = useState(client.endereco.complemento || '');
  const [bairro, setBairro] = useState(client.endereco.bairro || '');
  const [cidade, setCidade] = useState(client.endereco.cidade || '');
  const [uf, setUf] = useState(client.endereco.uf || '');
  const [cep, setCep] = useState(client.endereco.cep || '');

  // Comercial
  const [limiteCredito, setLimiteCredito] = useState(client.limiteCredito?.toString() || '15000');
  const [tabelaPrecoPadrao, setTabelaPrecoPadrao] = useState<'varejo' | 'atacado' | 'distribuidor'>(
    (client.tabelaPrecoPadrao as 'varejo' | 'atacado' | 'distribuidor') || 'atacado'
  );
  const [condicaoPagamentoPadrao, setCondicaoPagamentoPadrao] = useState(
    client.condicaoPagamentoPadrao || '28/35/42 DDL'
  );
  const [pontuacaoABC, setPontuacaoABC] = useState<ClientTier>(client.pontuacaoABC || 'B');
  const [observacoes, setObservacoes] = useState(client.observacoes || '');

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

  // Manipulador de alteração de CNPJ com máscara
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const formatted = formatCNPJ(rawVal);
    setCnpjCpf(formatted);
  };

  // Consulta CNPJ na Receita Federal para atualizar dados
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

      if (data.razaoSocial) setRazaoSocial(data.razaoSocial);
      if (data.nomeFantasia) {
        setNomeFantasia(data.nomeFantasia);
      } else if (data.razaoSocial && !nomeFantasia) {
        setNomeFantasia(data.razaoSocial);
      }

      if (data.logradouro) setRua(data.logradouro);
      if (data.numero) setNumero(data.numero);
      if (data.complemento) setComplemento(data.complemento);
      if (data.bairro) setBairro(data.bairro);
      if (data.municipio) setCidade(data.municipio);
      if (data.uf) setUf(data.uf);
      if (data.cep) setCep(data.cep);

      if (data.telefone && !telefone) {
        setTelefone(data.telefone);
      }
      if (data.email && !email) {
        setEmail(data.email.toLowerCase());
      }

      if (data.qsa && data.qsa.length > 0 && !contatoPrincipal) {
        setContatoPrincipal(data.qsa[0].nome_socio);
        setCargoContato(data.qsa[0].qualificacao_socio || 'Sócio Administrador');
      }

      const isAtiva = data.situacaoCadastral.toUpperCase().includes('ATIVA');

      setCnpjFeedback({
        tipo: isAtiva ? 'success' : 'warning',
        mensagem: isAtiva 
          ? `Dados atualizados com sucesso da base da Receita Federal (CNPJ Ativo).`
          : `Atenção: Situação cadastral na Receita é ${data.situacaoCadastral}.`,
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
        mensagem: `Endereço atualizado pelo CEP: ${data.localidade}/${data.uf}`,
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
      alert('Preencha ao menos o Nome Fantasia e o CNPJ do cliente.');
      return;
    }

    updateClient(client.id, {
      razaoSocial: razaoSocial.trim() || nomeFantasia.trim(),
      nomeFantasia: nomeFantasia.trim(),
      cnpjCpf: cnpjCpf.trim(),
      inscricaoEstadual: inscricaoEstadual.trim() || undefined,
      email: email.trim(),
      telefone: telefone.trim(),
      whatsapp: cleanOnlyNumbers(whatsapp) || client.whatsapp,
      contatoPrincipal: contatoPrincipal.trim() || 'Comprador',
      cargoContato: cargoContato.trim(),
      endereco: {
        rua: rua.trim() || 'Rua Principal',
        numero: numero.trim() || '100',
        complemento: complemento.trim() || undefined,
        bairro: bairro.trim() || 'Centro',
        cidade: cidade.trim() || 'São Paulo',
        uf: uf.trim().toUpperCase() || 'SP',
        cep: cep.trim() || '01000-000',
      },
      status,
      limiteCredito: parseFloat(limiteCredito) || client.limiteCredito,
      tabelaPrecoPadrao,
      condicaoPagamentoPadrao,
      pontuacaoABC,
      observacoes: observacoes.trim() || undefined,
    });

    if (onSaved) onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-100 my-auto">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                <span>Editar Cadastro do Cliente</span>
                <span className="text-[11px] font-mono font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  {client.id}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Altere informações comerciais, contatos, endereço e consulte dados atualizados na Receita Federal
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
                <Building className="w-4 h-4" /> 1. Identificação da Empresa & Atualização na Receita
              </h4>
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-slate-400 font-semibold">Status do Cliente:</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ClientStatus)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border uppercase ${
                    status === 'ativo'
                      ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                      : status === 'bloqueado'
                      ? 'bg-rose-950 border-rose-700 text-rose-300'
                      : 'bg-amber-950 border-amber-700 text-amber-300'
                  }`}
                >
                  <option value="ativo">Ativo</option>
                  <option value="bloqueado">Bloqueado</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>

            {/* CNPJ Input com Botão de Consulta da Receita */}
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80 space-y-2">
              <label className="block text-slate-200 font-bold">
                CNPJ da Empresa <span className="text-slate-400 font-normal">(consulte para atualizar dados cadastrais)</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    required
                    value={cnpjCpf}
                    onChange={handleCnpjChange}
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
                      <span>Atualizar com Dados da Receita</span>
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
                            {cnpjFeedback.detalhes.qsa.length} sócio(s)
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
                  placeholder="Ex: Supermercado Estrela"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Razão Social</label>
                <input
                  type="text"
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  placeholder="Ex: Estrela Alimentos LTDA"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Inscrição Estadual (IE)</label>
                <input
                  type="text"
                  value={inscricaoEstadual}
                  onChange={(e) => setInscricaoEstadual(e.target.value)}
                  placeholder="Ex: 123.456.789.000 ou ISENTO"
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
                  placeholder="Ex: Carlos Silva"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                <label className="block text-slate-300 font-semibold mb-1">WhatsApp para Pedidos & Boletos</label>
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
                <MapPin className="w-4 h-4" /> 3. Endereço de Entrega & Cobrança
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
              <DollarSign className="w-4 h-4" /> 4. Parâmetros Comerciais & Limite de Crédito
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Limite de Crédito (R$)</label>
                <input
                  type="number"
                  step="500"
                  value={limiteCredito}
                  onChange={(e) => setLimiteCredito(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tabela Padrão</label>
                <select
                  value={tabelaPrecoPadrao}
                  onChange={(e) => setTabelaPrecoPadrao(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="atacado">Atacado (Padrão)</option>
                  <option value="distribuidor">Distribuidor / Volume</option>
                  <option value="varejo">Varejo</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Classificação ABC</label>
                <select
                  value={pontuacaoABC}
                  onChange={(e) => setPontuacaoABC(e.target.value as ClientTier)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                >
                  <option value="A">Curva A - Alta Relevância</option>
                  <option value="B">Curva B - Médio Volume</option>
                  <option value="C">Curva C - Pequeno Porte</option>
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
                  placeholder="Ex: Recebe apenas pela manhã até 11h. Descarregar na Doca 2."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/95 sticky bottom-0 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 flex items-center justify-between gap-2">
            <div className="text-[11px] text-slate-400 hidden sm:block">
              {cnpjFeedback?.tipo === 'success' ? (
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Dados atualizados pela Receita
                </span>
              ) : (
                <span>Altere os dados desejados e clique em Salvar Alterações</span>
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
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
