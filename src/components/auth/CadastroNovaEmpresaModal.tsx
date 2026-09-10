import React, { useState } from 'react';
import {
  Building2,
  UserCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Mail,
  Lock,
  Phone,
  MapPin,
  FileSpreadsheet,
  X,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  Briefcase,
  Store,
  Ban,
  Unlock,
  KeyRound,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';
import {
  consultarCnpjReceita,
  consultarCepEndereco,
  formatCNPJ,
  formatCPF,
  formatCEP,
  formatPhone,
} from '../../services/receitaFederalService';
import { useSales } from '../../context/SalesContext';
import { CompanyIssuer } from '../../types';
import { BrandLogo } from '../common/BrandLogo';

interface CadastroNovaEmpresaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CadastroNovaEmpresaModal: React.FC<CadastroNovaEmpresaModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    registerNewCompanyAndTenant,
    companies,
    switchToCompany,
    toggleBlockCompany,
    issuer,
    showToast,
  } = useSales();

  // Abas do Painel Global Super Admin
  const [activeTab, setActiveTab] = useState<'acessar' | 'cadastrar' | 'bloqueio'>('acessar');

  // Busca e Filtros
  const [searchDocQuery, setSearchDocQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'ativas' | 'bloqueadas'>('todos');

  // Modal de Motivo de Bloqueio
  const [blockingTargetCompany, setBlockingTargetCompany] = useState<CompanyIssuer | null>(null);
  const [blockReasonInput, setBlockReasonInput] = useState('');

  // Estados do Cadastro de Nova Empresa
  const [tipoDocumento, setTipoDocumento] = useState<'CNPJ' | 'CPF'>('CNPJ');
  const [documento, setDocumento] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [inscricaoEstadual, setInscricaoEstadual] = useState('');
  const [regimeTributario, setRegimeTributario] = useState<'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real' | 'MEI'>('Simples Nacional');
  const [cnae, setCnae] = useState('');
  const [ramoAtividade, setRamoAtividade] = useState('Distribuidora / Atacado Geral');

  // Endereço
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('PI');

  // Contatos
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [emailEmpresa, setEmailEmpresa] = useState('');

  // Usuário Master / Administrador
  const [adminNome, setAdminNome] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminSenha, setAdminSenha] = useState('');
  const [adminSenhaConfirma, setAdminSenhaConfirma] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Estados de loading e feedback
  const [isSearchingReceita, setIsSearchingReceita] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [receitaDataSuccess, setReceitaDataSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Filtragem de empresas
  const filteredCompanies = companies.filter((c) => {
    const q = searchDocQuery.trim().toLowerCase().replace(/[.\-\/\s]/g, '');
    const cleanCnpj = (c.cnpj || '').toLowerCase().replace(/[.\-\/\s]/g, '');
    const cleanRazao = (c.razaoSocial || '').toLowerCase();
    const cleanFantasia = (c.nomeFantasia || '').toLowerCase();

    const matchesQuery =
      !q ||
      cleanCnpj.includes(q) ||
      cleanRazao.includes(q) ||
      cleanFantasia.includes(q);

    if (!matchesQuery) return false;

    if (filterStatus === 'ativas') return c.status !== 'bloqueada';
    if (filterStatus === 'bloqueadas') return c.status === 'bloqueada';
    return true;
  });

  // Acessar empresa diretamente pelo input
  const handleAcessarDireto = (docToAccess?: string) => {
    const target = (docToAccess || searchDocQuery).trim();
    if (!target) {
      showToast('Atenção', 'Digite o CNPJ, CPF ou selecione uma empresa da lista.', 'warning');
      return;
    }

    const cleanTarget = target.replace(/\D/g, '');
    const found = companies.find((c) => {
      const cClean = (c.cnpj || '').replace(/\D/g, '');
      return (
        cClean === cleanTarget ||
        c.razaoSocial.toLowerCase().includes(target.toLowerCase()) ||
        c.nomeFantasia?.toLowerCase().includes(target.toLowerCase())
      );
    });

    if (found) {
      switchToCompany(found.cnpj);
      onClose();
    } else if (cleanTarget.length === 11 || cleanTarget.length === 14) {
      switchToCompany(target);
      onClose();
    } else {
      showToast('Empresa não encontrada', 'Nenhuma empresa cadastrada com este CNPJ/CPF.', 'error');
    }
  };

  // Confirmar bloqueio / desbloqueio
  const handleConfirmToggleBlock = () => {
    if (!blockingTargetCompany) return;
    const isCurrentlyBlocked = blockingTargetCompany.status === 'bloqueada';
    toggleBlockCompany(
      blockingTargetCompany.cnpj,
      !isCurrentlyBlocked,
      !isCurrentlyBlocked ? blockReasonInput.trim() || 'Bloqueio administrativo aplicado pela JM Sistemas' : undefined
    );
    setBlockingTargetCompany(null);
    setBlockReasonInput('');
  };

  // Consulta CNPJ na Receita Federal
  const handleConsultarReceita = async () => {
    const cleanDoc = documento.replace(/\D/g, '');
    if (cleanDoc.length !== 14) {
      setErrorMsg('Informe um CNPJ válido com 14 dígitos para consultar a Receita Federal.');
      return;
    }

    setErrorMsg('');
    setIsSearchingReceita(true);
    setReceitaDataSuccess(false);

    try {
      const res = await consultarCnpjReceita(cleanDoc);
      if (res.success && res.data) {
        const d = res.data;
        setRazaoSocial(d.razaoSocial || '');
        setNomeFantasia(d.nomeFantasia || d.razaoSocial || '');
        if (d.regimeTributario) setRegimeTributario(d.regimeTributario);
        if (d.cnaeDescricao) setCnae(d.cnaeDescricao);
        if (d.telefone) {
          setTelefone(d.telefone);
          setWhatsapp(d.telefone);
        }
        if (d.email) {
          setEmailEmpresa(d.email);
          if (!adminEmail) setAdminEmail(d.email);
        }
        if (d.logradouro) setLogradouro(d.logradouro);
        if (d.numero) setNumero(d.numero);
        if (d.complemento) setComplemento(d.complemento);
        if (d.bairro) setBairro(d.bairro);
        if (d.municipio) setCidade(d.municipio);
        if (d.uf) setUf(d.uf);
        if (d.cep) setCep(d.cep);

        if (!adminNome) {
          setAdminNome(d.nomeFantasia || d.razaoSocial || 'Administrador');
        }

        setReceitaDataSuccess(true);
        showToast(
          'Receita Federal Consultada!',
          `Dados da empresa "${d.nomeFantasia || d.razaoSocial}" carregados automaticamente.`,
          'success'
        );
      } else {
        setErrorMsg(res.message || 'CNPJ não encontrado na Receita Federal.');
      }
    } catch (e: any) {
      setErrorMsg('Erro de conexão ao consultar a Receita Federal. Preencha manualmente os dados.');
    } finally {
      setIsSearchingReceita(false);
    }
  };

  // Consulta CEP no ViaCEP
  const handleConsultarCep = async (cepValue?: string) => {
    const targetCep = (cepValue || cep).replace(/\D/g, '');
    if (targetCep.length !== 8) return;

    setIsSearchingCep(true);
    try {
      const res = await consultarCepEndereco(targetCep);
      if (res.success && res.data) {
        setLogradouro(res.data.logradouro || '');
        setBairro(res.data.bairro || '');
        setCidade(res.data.municipio || '');
        setUf(res.data.uf || 'PI');
        showToast('Endereço Localizado', `${res.data.logradouro}, ${res.data.municipio} - ${res.data.uf}`, 'info');
      }
    } catch (e) {
      console.warn('Erro ao consultar CEP', e);
    } finally {
      setIsSearchingCep(false);
    }
  };

  const handleDocumentChange = (val: string) => {
    if (tipoDocumento === 'CNPJ') {
      const formatted = formatCNPJ(val);
      setDocumento(formatted);
      if (formatted.replace(/\D/g, '').length === 14 && !receitaDataSuccess) {
        setTimeout(() => {
          handleConsultarReceita();
        }, 300);
      }
    } else {
      setDocumento(formatCPF(val));
    }
    setErrorMsg('');
  };

  const handleCepChange = (val: string) => {
    const formatted = formatCEP(val);
    setCep(formatted);
    if (formatted.replace(/\D/g, '').length === 8) {
      handleConsultarCep(formatted);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanDoc = documento.replace(/\D/g, '');
    if (tipoDocumento === 'CNPJ' && cleanDoc.length !== 14) {
      setErrorMsg('Por favor, informe um CNPJ válido com 14 dígitos.');
      return;
    }
    if (tipoDocumento === 'CPF' && cleanDoc.length !== 11) {
      setErrorMsg('Por favor, informe um CPF válido com 11 dígitos.');
      return;
    }

    if (!razaoSocial.trim()) {
      setErrorMsg('Informe a Razão Social ou Nome Completo da Empresa.');
      return;
    }

    setIsSubmitting(true);

    try {
      const companyData: CompanyIssuer = {
        cnpj: documento,
        razaoSocial: razaoSocial.trim(),
        nomeFantasia: (nomeFantasia || razaoSocial).trim(),
        inscricaoEstadual: inscricaoEstadual.trim() || 'ISENTO',
        inscricaoMunicipal: '',
        cnae: cnae.trim() || 'Comércio Varejista / Atacadista',
        regimeTributario,
        telefone: telefone.trim() || '(86) 99999-0000',
        whatsapp: whatsapp.trim() || telefone.trim(),
        email: emailEmpresa.trim() || 'novo@jmsistemaspi.com',
        endereco: {
          rua: logradouro.trim() || 'Endereço Principal',
          numero: numero.trim() || 'S/N',
          complemento: complemento.trim(),
          bairro: bairro.trim() || 'Centro',
          cidade: cidade.trim() || 'Teresina',
          uf: uf.trim() || 'PI',
          cep: cep.trim() || '64000-000',
        },
        chavePixPadrao: emailEmpresa.trim() || 'novo@jmsistemaspi.com',
        bancoPadrao: 'Banco do Brasil',
        observacoesFiscais: `Empresa cadastrada no padrão unificado JM Sistemas 2026. Ramo: ${ramoAtividade}`,
        status: 'ativa',
      };

      const adminUser = {
        nome: 'master',
        email: 'novo@jmsistemaspi.com',
        senha: '',
        telefone: whatsapp.trim() || telefone.trim() || '(86) 99999-0000',
        cargo: 'Administrador Master',
        cpf: tipoDocumento === 'CPF' ? documento : undefined,
      };

      registerNewCompanyAndTenant(companyData, adminUser);
      onClose();
    } catch (err: any) {
      console.error('Erro ao cadastrar empresa:', err);
      setErrorMsg(err.message || 'Ocorreu um erro ao inicializar a nova empresa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/95 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden relative my-6 text-slate-100 flex flex-col max-h-[94vh]">
        {/* Header Superior Super Admin */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 px-6 py-5 border-b border-slate-700/80 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-800 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400 shadow-inner">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Painel de Gestão Multi-Empresas
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase">
                  Super Admin JM
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-0.5">
                Acesso global, troca instantânea de empresa por CNPJ/CPF, bloqueio de licença e implantação de novos clientes.
              </p>
            </div>
          </div>
        </div>

        {/* Abas Super Admin */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('acessar')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'acessar'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-4 h-4 text-blue-300" />
            <span>🏢 Entrar em Empresa ({companies.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cadastrar')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'cadastrar'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>✨ Cadastrar Nova Empresa</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bloqueio')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'bloqueio'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-300" />
            <span>🛡️ Bloqueio & Licenças</span>
          </button>
        </div>

        {/* Conteúdo das Abas */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ================= ABA 1: ACESSAR EMPRESA CADASTRADA ================= */}
          {activeTab === 'acessar' && (
            <div className="space-y-5">
              {/* Barra de Busca por CNPJ / CPF ou Nome */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                <label className="block text-xs font-bold text-slate-300">
                  Acesso Rápido por CNPJ ou CPF:
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchDocQuery}
                      onChange={(e) => setSearchDocQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAcessarDireto();
                        }
                      }}
                      placeholder="Digite o CNPJ, CPF ou nome da empresa..."
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAcessarDireto()}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 cursor-pointer shrink-0"
                  >
                    <span>Entrar na Empresa</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>
                    Empresa ativa no momento: <strong className="text-blue-300">{issuer.nomeFantasia || issuer.razaoSocial}</strong> ({issuer.cnpj})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFilterStatus('todos')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${filterStatus === 'todos' ? 'bg-blue-900 text-blue-200' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Todas ({companies.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterStatus('ativas')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${filterStatus === 'ativas' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Ativas ({companies.filter((c) => c.status !== 'bloqueada').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterStatus('bloqueadas')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${filterStatus === 'bloqueadas' ? 'bg-rose-950 text-rose-300 border border-rose-800/40' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Bloqueadas ({companies.filter((c) => c.status === 'bloqueada').length})
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de Empresas Cadastradas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredCompanies.map((emp) => {
                  const isCurrent = (issuer.cnpj || '').replace(/\D/g, '') === (emp.cnpj || '').replace(/\D/g, '');
                  const isBlocked = emp.status === 'bloqueada';

                  return (
                    <div
                      key={emp.id || emp.cnpj}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                        isCurrent
                          ? 'bg-blue-950/40 border-blue-500/80 shadow-lg shadow-blue-950/40 ring-1 ring-blue-500/40'
                          : isBlocked
                          ? 'bg-rose-950/20 border-rose-900/60'
                          : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                              isBlocked ? 'bg-rose-500/20 text-rose-300' : 'bg-blue-500/20 text-blue-300'
                            }`}>
                              🏢
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-100 truncate">
                                {emp.nomeFantasia || emp.razaoSocial}
                              </p>
                              <p className="text-xs text-slate-400 font-mono">
                                {emp.cnpj}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/40">
                                EM USO ATUAL
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isBlocked
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            }`}>
                              {isBlocked ? '🔴 Bloqueada' : '🟢 Ativa'}
                            </span>
                          </div>
                        </div>

                        {emp.razaoSocial !== emp.nomeFantasia && (
                          <p className="text-[11px] text-slate-400 mt-2 truncate">
                            Razão: {emp.razaoSocial}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {emp.endereco?.cidade || 'Teresina'} - {emp.endereco?.uf || 'PI'}
                          </span>
                          <span>•</span>
                          <span className="truncate">{emp.email || emp.telefone}</span>
                        </div>

                        {isBlocked && emp.motivoBloqueio && (
                          <div className="mt-2.5 p-2 bg-rose-950/40 border border-rose-800/40 rounded-xl text-[11px] text-rose-200">
                            <strong>Motivo do Bloqueio:</strong> {emp.motivoBloqueio}
                          </div>
                        )}
                      </div>

                      {/* Botões de Ação */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            switchToCompany(emp.cnpj);
                            onClose();
                          }}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                            isCurrent
                              ? 'bg-blue-600/80 text-white'
                              : 'bg-blue-600 hover:bg-blue-500 text-white'
                          }`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{isCurrent ? 'Permanecer Conectado' : 'Entrar com Acesso Total'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setBlockingTargetCompany(emp)}
                          title={isBlocked ? 'Desbloquear empresa' : 'Bloquear empresa'}
                          className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                            isBlocked
                              ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300 hover:bg-emerald-900'
                              : 'bg-rose-950/60 border-rose-700 text-rose-300 hover:bg-rose-900'
                          }`}
                        >
                          {isBlocked ? <Unlock className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredCompanies.length === 0 && (
                  <div className="col-span-full p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800">
                    <p className="text-sm text-slate-400">Nenhuma empresa encontrada para "{searchDocQuery}".</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('cadastrar')}
                      className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Cadastrar Esta Empresa Agora</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= ABA 2: CADASTRAR NOVA EMPRESA ================= */}
          {activeTab === 'cadastrar' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Seletor CNPJ ou CPF */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <Store className="w-4 h-4 text-blue-400" />
                    <span>Tipo de Inscrição da Nova Empresa</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {tipoDocumento === 'CNPJ' ? 'Pessoa Jurídica' : 'Pessoa Física / Produtor Rural'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTipoDocumento('CNPJ');
                      setDocumento('');
                      setReceitaDataSuccess(false);
                      setErrorMsg('');
                    }}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                      tipoDocumento === 'CNPJ'
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/30'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>CNPJ (Consulta Receita Federal)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTipoDocumento('CPF');
                      setDocumento('');
                      setReceitaDataSuccess(false);
                      setErrorMsg('');
                    }}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                      tipoDocumento === 'CPF'
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/30'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>CPF / Manual (Busca por CEP)</span>
                  </button>
                </div>
              </div>

              {/* Campo Principal de Documento */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      {tipoDocumento === 'CNPJ' ? 'CNPJ da Empresa' : 'CPF do Titular / Produtor'} <span className="text-rose-400">*</span>
                    </label>
                    {tipoDocumento === 'CNPJ' && (
                      <span className="text-[10px] text-blue-400 font-medium flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        Auto-preenchimento Receita Federal
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={documento}
                        onChange={(e) => handleDocumentChange(e.target.value)}
                        placeholder={tipoDocumento === 'CNPJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                        required
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      {receitaDataSuccess && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      )}
                    </div>

                    {tipoDocumento === 'CNPJ' && (
                      <button
                        type="button"
                        onClick={handleConsultarReceita}
                        disabled={isSearchingReceita || documento.replace(/\D/g, '').length !== 14}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/30 cursor-pointer"
                      >
                        {isSearchingReceita ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Consultando...</span>
                          </>
                        ) : (
                          <>
                            <Search className="w-4 h-4" />
                            <span>Buscar Receita</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Razão Social e Nome Fantasia */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Razão Social / Nome Completo <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={razaoSocial}
                      onChange={(e) => setRazaoSocial(e.target.value)}
                      placeholder="ex: JM DISTRIBUIDORA LTDA"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nome Fantasia
                    </label>
                    <input
                      type="text"
                      value={nomeFantasia}
                      onChange={(e) => setNomeFantasia(e.target.value)}
                      placeholder="ex: JM Distribuidora & Logística"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Inscrição Estadual, Regime e CNAE */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Inscrição Estadual (IE)
                    </label>
                    <input
                      type="text"
                      value={inscricaoEstadual}
                      onChange={(e) => setInscricaoEstadual(e.target.value)}
                      placeholder="ex: 19.456.789-0 ou ISENTO"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Regime Tributário
                    </label>
                    <select
                      value={regimeTributario}
                      onChange={(e) => setRegimeTributario(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Simples Nacional">Simples Nacional</option>
                      <option value="Lucro Presumido">Lucro Presumido</option>
                      <option value="Lucro Real">Lucro Real</option>
                      <option value="MEI">MEI (Microempreendedor)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Ramo de Atividade
                    </label>
                    <input
                      type="text"
                      value={ramoAtividade}
                      onChange={(e) => setRamoAtividade(e.target.value)}
                      placeholder="ex: Distribuidora de Alimentos"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Endereço com Busca por CEP */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span>Endereço Comercial da Empresa</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">ViaCEP Integrado</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      CEP
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cep}
                        onChange={(e) => handleCepChange(e.target.value)}
                        placeholder="64000-000"
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                      />
                      {isSearchingCep && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Logradouro / Rua
                    </label>
                    <input
                      type="text"
                      value={logradouro}
                      onChange={(e) => setLogradouro(e.target.value)}
                      placeholder="ex: Av. Frei Serafim"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Número
                    </label>
                    <input
                      type="text"
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                      placeholder="ex: 1250 ou S/N"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Bairro
                    </label>
                    <input
                      type="text"
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                      placeholder="ex: Centro"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      placeholder="ex: Teresina"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      UF
                    </label>
                    <input
                      type="text"
                      value={uf}
                      maxLength={2}
                      onChange={(e) => setUf(e.target.value.toUpperCase())}
                      placeholder="PI"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-center font-bold"
                    />
                  </div>
                </div>

                {/* Contatos */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Telefone
                    </label>
                    <input
                      type="text"
                      value={telefone}
                      onChange={(e) => setTelefone(formatPhone(e.target.value))}
                      placeholder="(86) 3222-0000"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      WhatsApp
                    </label>
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                      placeholder="(86) 99999-0000"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      E-mail Comercial
                    </label>
                    <input
                      type="email"
                      value={emailEmpresa}
                      onChange={(e) => setEmailEmpresa(e.target.value)}
                      placeholder="contato@empresa.com.br"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Usuário Master Único Inicial */}
              <div className="bg-gradient-to-br from-blue-950/70 via-slate-950/70 to-indigo-950/70 p-4 rounded-2xl border border-blue-500/40 space-y-3">
                <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-amber-400" />
                    <span>Usuário Master Inicial da Nova Empresa</span>
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    MASTER ÚNICO
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Nome do Usuário:</span>
                    <strong className="text-slate-100 font-mono text-sm">master</strong>
                  </div>

                  <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Login / E-mail:</span>
                    <strong className="text-blue-300 font-mono text-sm">novo@jmsistemaspi.com</strong>
                  </div>
                </div>

                <div className="p-3 bg-blue-950/40 rounded-xl border border-blue-800/40 text-[11px] text-blue-200">
                  <p>
                    A nova empresa é inicializada com o usuário <strong>master</strong> (<code>novo@jmsistemaspi.com</code>) e a senha diária dinâmica (soma de dia + mês + ano). Outros vendedores e usuários podem ser cadastrados a qualquer momento na tela de <strong>Vendedores e Usuários</strong> da Retaguarda.
                  </p>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Inicializando Banco Zerado...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-200" />
                      <span>Criar Empresa & Inicializar Banco Zerado</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ================= ABA 3: BLOQUEIO & LICENÇAS ================= */}
          {activeTab === 'bloqueio' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-950/30 border border-amber-800/60 rounded-2xl text-xs text-amber-200 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-100">Controle de Acesso e Licenciamento das Empresas</h4>
                  <p className="mt-1 text-amber-200/90 leading-relaxed">
                    O bloqueio de uma empresa impede que seus vendedores e administradores acessem o sistema (mobile e retaguarda). O usuário Super Admin mantém acesso irrestrito para manutenções ou auditorias.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {companies.map((c) => {
                  const isBlocked = c.status === 'bloqueada';
                  return (
                    <div
                      key={c.id || c.cnpj}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isBlocked ? 'bg-rose-950/30 border-rose-800/80' : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isBlocked ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          }`}>
                            {isBlocked ? 'BLOQUEADA' : 'ATIVA'}
                          </span>
                          <h4 className="text-sm font-bold text-slate-100 truncate">
                            {c.nomeFantasia || c.razaoSocial}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-1">
                          CNPJ: {c.cnpj} • {c.endereco?.cidade || 'Teresina'} - {c.endereco?.uf || 'PI'}
                        </p>
                        {isBlocked && c.motivoBloqueio && (
                          <p className="text-xs text-rose-300 mt-1.5 font-medium">
                            Motivo: {c.motivoBloqueio}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setBlockingTargetCompany(c)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                            isBlocked
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                          }`}
                        >
                          {isBlocked ? (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Desbloquear Empresa</span>
                            </>
                          ) : (
                            <>
                              <Ban className="w-3.5 h-3.5" />
                              <span>Bloquear Empresa</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Motivo de Bloqueio / Desbloqueio */}
      {blockingTargetCompany && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                blockingTargetCompany.status === 'bloqueada' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                {blockingTargetCompany.status === 'bloqueada' ? <Unlock className="w-6 h-6" /> : <Ban className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {blockingTargetCompany.status === 'bloqueada' ? 'Desbloquear Empresa' : 'Bloquear Empresa'}
                </h3>
                <p className="text-xs text-slate-400 truncate">
                  {blockingTargetCompany.nomeFantasia || blockingTargetCompany.razaoSocial}
                </p>
              </div>
            </div>

            {blockingTargetCompany.status !== 'bloqueada' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Motivo do Bloqueio (visível no login bloqueado):
                </label>
                <textarea
                  value={blockReasonInput}
                  onChange={(e) => setBlockReasonInput(e.target.value)}
                  placeholder="ex: Mensalidade em atraso / Licença suspensa / Solicitação de encerramento."
                  rows={3}
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            ) : (
              <p className="text-xs text-slate-300">
                Tem certeza que deseja reativar o acesso da empresa <strong>{blockingTargetCompany.nomeFantasia || blockingTargetCompany.razaoSocial}</strong>? Seus usuários poderão efetuar login normalmente.
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setBlockingTargetCompany(null);
                  setBlockReasonInput('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmToggleBlock}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md ${
                  blockingTargetCompany.status === 'bloqueada'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                Confirmar {blockingTargetCompany.status === 'bloqueada' ? 'Desbloqueio' : 'Bloqueio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
