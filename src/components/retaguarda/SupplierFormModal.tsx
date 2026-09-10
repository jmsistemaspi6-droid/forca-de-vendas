import React, { useState } from 'react';
import {
  Building,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { Supplier } from '../../types';
import { consultarCNPJ, consultarCEP, formatCNPJ, formatCEP, formatPhoneBR } from '../../services/consultasApi';

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSupplierCreated?: (newSupplier: Supplier) => void;
}

export const SupplierFormModal: React.FC<SupplierFormModalProps> = ({
  isOpen,
  onClose,
  onSupplierCreated,
}) => {
  const { addSupplier, showToast } = useSales();

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

  if (!isOpen) return null;

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
      showToast('CNPJ Encontrado!', `${data.razaoSocial} localizado na Receita Federal.`, 'success');
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
      setCepError(err.message || 'CEP não encontrado.');
    } finally {
      setIsSearchingCep(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!razaoSocial.trim()) {
      showToast('Campo Obrigatório', 'Informe a Razão Social do fornecedor.', 'error');
      return;
    }

    const newSupplierData = {
      razaoSocial: razaoSocial.trim(),
      nomeFantasia: nomeFantasia.trim() || razaoSocial.trim(),
      cnpjCpf: cnpj.trim() || '00.000.000/0000-00',
      inscricaoEstadual: inscricaoEstadual.trim() || 'ISENTO',
      email: email.trim() || 'comercial@fornecedor.com.br',
      telefone: telefone.trim() || '(11) 3000-0000',
      whatsapp: whatsapp.trim(),
      contatoPrincipal: contatoPrincipal.trim(),
      categoriaFornecedor,
      condicaoPagamentoPadrao,
      status: 'ativo' as const,
      endereco: {
        rua: logradouro.trim() || 'Av. Principal',
        numero: numero.trim() || 'S/N',
        complemento: complemento.trim(),
        bairro: bairro.trim() || 'Centro',
        cidade: cidade.trim() || 'São Paulo',
        uf: uf.trim().toUpperCase() || 'SP',
        cep: cep.trim() || '00000-000',
      },
    };

    const createdSupplier = addSupplier(newSupplierData);
    showToast('Fornecedor Cadastrado!', `${createdSupplier.razaoSocial} adicionado com sucesso.`, 'success');

    if (onSupplierCreated) {
      onSupplierCreated(createdSupplier);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                Cadastrar Novo Fornecedor
              </h3>
              <p className="text-[11px] text-slate-400">
                Consulta automática por CNPJ na Receita Federal e CEP
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* CNPJ Input with Auto Search */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              CNPJ do Fornecedor (Preenchimento Automático)
            </label>
            <div className="relative">
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                onBlur={handleCnpjBlur}
                placeholder="00.000.000/0000-00 (Digite e saia do campo para buscar)"
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
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Razão Social <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={razaoSocial}
                onChange={(e) => setRazaoSocial(e.target.value)}
                placeholder="Ex: DISTRIBUIDORA DE ALIMENTOS LTDA"
                required
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Nome Fantasia
              </label>
              <input
                type="text"
                value={nomeFantasia}
                onChange={(e) => setNomeFantasia(e.target.value)}
                placeholder="Ex: Alimentos Brasil"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Contatos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Telefone
              </label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(formatPhoneBR(e.target.value))}
                placeholder="(11) 3000-0000"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@empresa.com.br"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Inscrição Estadual
              </label>
              <input
                type="text"
                value={inscricaoEstadual}
                onChange={(e) => setInscricaoEstadual(e.target.value)}
                placeholder="ISENTO ou IE"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Endereço */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
            <span className="font-bold text-slate-300 block text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
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
                  placeholder="Rua / Avenida"
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
                  placeholder="Nº"
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Bairro</label>
                <input
                  type="text"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  placeholder="Bairro"
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Cidade</label>
                <input
                  type="text"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  placeholder="Cidade"
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
                  placeholder="UF"
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 uppercase text-center font-bold focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Categorias & Prazos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Categoria de Fornecimento
              </label>
              <select
                value={categoriaFornecedor}
                onChange={(e) => setCategoriaFornecedor(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-blue-500 focus:outline-none"
              >
                <option value="Alimentos & Bebidas">Alimentos & Bebidas</option>
                <option value="Grãos & Cereais">Grãos & Cereais</option>
                <option value="Laticínios & Frios">Laticínios & Frios</option>
                <option value="Higiene & Limpeza">Higiene & Limpeza</option>
                <option value="Embalagens & Descartáveis">Embalagens & Descartáveis</option>
                <option value="Equipamentos & Insumos">Equipamentos & Insumos</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Condição Padrão de Pagamento
              </label>
              <input
                type="text"
                value={condicaoPagamentoPadrao}
                onChange={(e) => setCondicaoPagamentoPadrao(e.target.value)}
                placeholder="Ex: 30 DDL (Boleto)"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-save-supplier"
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-950/50 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Salvar Fornecedor</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
