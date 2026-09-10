import React, { useState } from 'react';
import {
  Building,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  FileSpreadsheet,
  Calendar,
  DollarSign,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { Supplier } from '../../types';
import { consultarCNPJ, consultarCEP, formatCNPJ, formatCEP, formatPhoneBR } from '../../services/consultasApi';
import { VoiceSearchButton } from '../common/VoiceSearchButton';

export const SuppliersView: React.FC = () => {
  const { suppliers, addSupplier, stockEntries } = useSales();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [cnpj, setCnpj] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [inscricaoEstadual, setInscricaoEstadual] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [contatoPrincipal, setContatoPrincipal] = useState('');
  const [categoriaFornecedor, setCategoriaFornecedor] = useState('Alimentos & Bebidas');
  const [condicaoPagamentoPadrao, setCondicaoPagamentoPadrao] = useState('28 DDL (Boleto)');
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('SP');

  const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [cnpjSuccess, setCnpjSuccess] = useState(false);
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  const [cepError, setCepError] = useState<string | null>(null);

  const getCnpj = (s: Supplier) => s.cnpjCpf || (s as any).cnpj || '';
  const getCidade = (s: Supplier) => s.endereco?.cidade || (s as any).cidade || '';
  const getUf = (s: Supplier) => s.endereco?.uf || (s as any).uf || '';

  const filteredSuppliers = suppliers.filter((s) => {
    const term = (searchTerm || '').toLowerCase();
    const sCnpj = String(getCnpj(s) || '');
    const sCidade = String(getCidade(s) || '').toLowerCase();
    const razao = String(s.razaoSocial || '').toLowerCase();
    const fantasia = String(s.nomeFantasia || '').toLowerCase();

    return (
      !term ||
      razao.includes(term) ||
      fantasia.includes(term) ||
      sCnpj.includes(searchTerm) ||
      sCidade.includes(term)
    );
  });

  const handleCnpjBlur = async () => {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) return;

    setIsSearchingCnpj(true);
    setCnpjError(null);
    setCnpjSuccess(false);

    try {
      const data = await consultarCNPJ(cleanCnpj);
      setRazaoSocial(data.razaoSocial || '');
      setNomeFantasia(data.nomeFantasia || data.razaoSocial || '');
      if (data.email) setEmail(data.email);
      if (data.telefone) setTelefone(data.telefone);
      if (data.cep) setCep(data.cep);
      if (data.logradouro) setLogradouro(data.logradouro);
      if (data.numero) setNumero(data.numero);
      if (data.complemento) setComplemento(data.complemento);
      if (data.bairro) setBairro(data.bairro);
      if (data.municipio) setCidade(data.municipio);
      if (data.uf) setUf(data.uf);

      setCnpjSuccess(true);
    } catch (err: any) {
      setCnpjError(err.message || 'Erro ao consultar Receita Federal.');
    } finally {
      setIsSearchingCnpj(false);
    }
  };

  const handleCepBlur = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setIsSearchingCep(true);
    setCepError(null);

    try {
      const data = await consultarCEP(cleanCep);
      if (data.logradouro) setLogradouro(data.logradouro);
      if (data.bairro) setBairro(data.bairro);
      if (data.localidade) setCidade(data.localidade);
      if (data.uf) setUf(data.uf);
    } catch (err: any) {
      setCepError(err.message || 'Erro ao consultar CEP.');
    } finally {
      setIsSearchingCep(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!razaoSocial || !cnpj) {
      alert('Informe a Razão Social e o CNPJ.');
      return;
    }

    const novoFornecedor: Supplier = {
      id: `sup-${Date.now()}`,
      razaoSocial,
      nomeFantasia: nomeFantasia || razaoSocial,
      cnpjCpf: formatCNPJ(cnpj),
      inscricaoEstadual: inscricaoEstadual || undefined,
      email: email || 'comercial@fornecedor.com.br',
      telefone: telefone || '(11) 3000-0000',
      whatsapp: whatsapp || undefined,
      contatoPrincipal: contatoPrincipal || undefined,
      categoriaFornecedor: categoriaFornecedor || 'Geral',
      condicaoPagamentoPadrao: condicaoPagamentoPadrao || '28 DDL',
      status: 'ativo',
      totalComprasHistorico: 0,
      totalNotasCount: 0,
      endereco: {
        rua: logradouro || 'Rua Principal',
        numero: numero || 'S/N',
        complemento: complemento || '',
        bairro: bairro || 'Centro',
        cidade: cidade || 'São Paulo',
        uf: uf || 'SP',
        cep: cep ? formatCEP(cep) : '01001-000',
      },
    };

    addSupplier(novoFornecedor);
    setIsModalOpen(false);

    // Reset
    setCnpj('');
    setRazaoSocial('');
    setNomeFantasia('');
    setInscricaoEstadual('');
    setEmail('');
    setTelefone('');
    setWhatsapp('');
    setContatoPrincipal('');
    setCep('');
    setLogradouro('');
    setNumero('');
    setComplemento('');
    setBairro('');
    setCidade('');
    setUf('SP');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-auto flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por razão social, nome fantasia, CNPJ, cidade..."
            className="w-full pl-9 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
            <VoiceSearchButton
              size="sm"
              onTranscript={(t) => setSearchTerm(t)}
              placeholderHint="Fale o nome do fornecedor ou CNPJ..."
            />
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Fornecedor</span>
        </button>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((supplier) => {
          const sCnpj = getCnpj(supplier);
          const sCidade = getCidade(supplier);
          const sUf = getUf(supplier);
          const entriesForSupplier = stockEntries.filter(
            (e) => (e.fornecedor?.cnpj || (e as any).fornecedorCnpj) === sCnpj
          );
          const comprasCount = entriesForSupplier.length;
          const totalComprado = entriesForSupplier.reduce(
            (sum, e) => sum + (e.totais?.valorTotalNota ?? (e as any).valorTotal ?? 0),
            0
          );

          return (
            <div
              key={supplier.id}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">{supplier.razaoSocial}</h3>
                  {supplier.nomeFantasia && (
                    <p className="text-xs text-blue-400 font-medium">{supplier.nomeFantasia}</p>
                  )}
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">CNPJ: {sCnpj}</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                  <Building className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                {supplier.telefone && (
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{supplier.telefone}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {sCidade ? `${sCidade} - ${sUf}` : 'Não informado'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">
                  {comprasCount > 0 ? `${comprasCount} notas de entrada` : 'Nenhuma entrada ainda'}
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  R$ {((supplier.totalComprasHistorico || totalComprado) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Cadastrar Fornecedor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Novo Fornecedor</h3>
                  <p className="text-xs text-slate-400">Preenchimento automático via Receita Federal & CEP</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* CNPJ Input with Auto Search */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  CNPJ (com consulta automática na Receita) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cnpj}
                    onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                    onBlur={handleCnpjBlur}
                    placeholder="00.000.000/0000-00"
                    required
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 font-mono focus:border-blue-500 focus:outline-none"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {isSearchingCnpj && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                    {cnpjSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </div>
                </div>
                {cnpjError && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {cnpjError}
                  </p>
                )}
              </div>

              {/* Razão e Fantasia */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Razão Social *</label>
                  <input
                    type="text"
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nome Fantasia</label>
                  <input
                    type="text"
                    value={nomeFantasia}
                    onChange={(e) => setNomeFantasia(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Contatos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(formatPhoneBR(e.target.value))}
                    placeholder="(11) 3000-0000"
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="comercial@fornecedor.com.br"
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Inscrição Estadual</label>
                  <input
                    type="text"
                    value={inscricaoEstadual}
                    onChange={(e) => setInscricaoEstadual(e.target.value)}
                    placeholder="ISENTO ou IE"
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                <span className="font-bold text-slate-300 block text-[11px] uppercase tracking-wider">
                  Endereço do Fornecedor
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">CEP</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cep}
                        onChange={(e) => setCep(formatCEP(e.target.value))}
                        onBlur={handleCepBlur}
                        placeholder="00000-000"
                        className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 font-mono focus:border-blue-500 focus:outline-none"
                      />
                      {isSearchingCep && (
                        <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin absolute right-2 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1">Logradouro (Rua / Av)</label>
                    <input
                      type="text"
                      value={logradouro}
                      onChange={(e) => setLogradouro(e.target.value)}
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Número</label>
                    <input
                      type="text"
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Bairro</label>
                    <input
                      type="text"
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Cidade</label>
                    <input
                      type="text"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">UF</label>
                    <input
                      type="text"
                      value={uf}
                      onChange={(e) => setUf(e.target.value.toUpperCase())}
                      maxLength={2}
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 uppercase text-center font-bold focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Categorias & Prazos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Categoria de Fornecimento</label>
                  <input
                    type="text"
                    value={categoriaFornecedor}
                    onChange={(e) => setCategoriaFornecedor(e.target.value)}
                    placeholder="Ex: Alimentos, Embalagens, Bebidas..."
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Condição Padrão de Pagamento</label>
                  <input
                    type="text"
                    value={condicaoPagamentoPadrao}
                    onChange={(e) => setCondicaoPagamentoPadrao(e.target.value)}
                    placeholder="Ex: 28 DDL (Boleto)"
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-950/50"
                >
                  Salvar Fornecedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
