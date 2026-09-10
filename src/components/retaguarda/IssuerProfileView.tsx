import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  ShieldAlert,
  Save,
  CheckCircle2,
  FileSpreadsheet,
  AlertTriangle,
  Receipt,
  Phone,
  Mail,
  MapPin,
  Landmark,
  QrCode,
  Info,
  BadgePercent,
  Sparkles,
  Ban,
  Unlock,
  ExternalLink,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { CompanyIssuer } from '../../types';
import { BrandLogo } from '../common/BrandLogo';

export const IssuerProfileView: React.FC = () => {
  const {
    issuer,
    updateIssuer,
    showToast,
    stockEntries,
    orders,
    isGlobalAdminSession,
    currentUser,
    toggleBlockCompany,
    setIsCadastroEmpresaOpen,
  } = useSales();
  const [formData, setFormData] = useState<CompanyIssuer>({ ...issuer });
  const [isSaved, setIsSaved] = useState(false);
  const [blockReasonInput, setBlockReasonInput] = useState(issuer.motivoBloqueio || '');

  const isSuperAdmin = isGlobalAdminSession || currentUser?.isGlobalAdmin || currentUser?.email === 'novo@jmsistemaspi.com';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateIssuer(formData);
    setIsSaved(true);
    showToast(
      'Dados do Emitente Atualizados',
      'As informações da empresa distribuidora foram salvas com sucesso e vinculadas à validação de XMLs e emissão de pedidos.',
      'success'
    );
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleToggleBlock = () => {
    const isCurrentlyBlocked = issuer.status === 'bloqueada';
    toggleBlockCompany(
      issuer.cnpj,
      !isCurrentlyBlocked,
      !isCurrentlyBlocked ? blockReasonInput.trim() || 'Bloqueio administrativo aplicado pela JM Sistemas' : undefined
    );
    setFormData((prev) => ({
      ...prev,
      status: isCurrentlyBlocked ? 'ativa' : 'bloqueada',
      motivoBloqueio: isCurrentlyBlocked ? undefined : (blockReasonInput.trim() || 'Bloqueio administrativo aplicado pela JM Sistemas'),
    }));
  };

  // Helper to format CNPJ
  const formatCNPJ = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 rounded-2xl p-5 sm:p-6 border border-blue-800/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <BrandLogo size="lg" />
          <div className="border-l border-slate-700 pl-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-100">Cadastro da Empresa Emitente</h1>
              <span className="text-[10px] uppercase font-bold bg-blue-950 text-blue-300 border border-blue-700/60 px-2 py-0.5 rounded">
                Matriz Distribuidora
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Identifica a matriz/distribuidora emissora dos pedidos de venda e valida se as notas fiscais de entrada (XMLs e manuais) destinam-se ao seu CNPJ correto.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 px-3.5 py-2 rounded-xl text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-slate-300 font-medium">
            Validação ativa em <strong>{stockEntries.length} entradas</strong> e <strong>{orders.length} pedidos</strong>
          </span>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Dados Cadastrais & Fiscais */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-400" />
              <span>Identificação Jurídica & Regime Tributário</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">Padrão SEFAZ Brasil</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CNPJ */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                CNPJ do Emitente <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                placeholder="00.000.000/0000-00"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Usado para validar destinatários de XMLs de NF-e
              </span>
            </div>

            {/* Razão Social */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Razão Social Completa <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.razaoSocial}
                onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                placeholder="Ex: JM SISTEMAS SOLUÇÕES TECNOLÓGICAS LTDA"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            {/* Nome Fantasia */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nome Fantasia / Marca Comercial <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.nomeFantasia}
                onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                placeholder="Ex: JM Sistemas"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            {/* Inscrição Estadual */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Inscrição Estadual (I.E.)
              </label>
              <input
                type="text"
                value={formData.inscricaoEstadual}
                onChange={(e) => setFormData({ ...formData, inscricaoEstadual: e.target.value })}
                placeholder="Ex: 123.456.789.111"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Inscrição Municipal */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Inscrição Municipal (I.M.)
              </label>
              <input
                type="text"
                value={formData.inscricaoMunicipal || ''}
                onChange={(e) => setFormData({ ...formData, inscricaoMunicipal: e.target.value })}
                placeholder="Ex: 98765-4"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Regime Tributário */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Regime Tributário
              </label>
              <select
                value={formData.regimeTributario}
                onChange={(e) => setFormData({ ...formData, regimeTributario: e.target.value as any })}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Simples Nacional">Simples Nacional (ME / EPP)</option>
                <option value="Lucro Presumido">Lucro Presumido</option>
                <option value="Lucro Real">Lucro Real</option>
                <option value="MEI">Microempreendedor Individual (MEI)</option>
              </select>
            </div>

            {/* CNAE Principal */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                CNAE Principal de Atividade
              </label>
              <input
                type="text"
                value={formData.cnae || ''}
                onChange={(e) => setFormData({ ...formData, cnae: e.target.value })}
                placeholder="Ex: 46.91-5-00 - Comércio atacadista de mercadorias em geral"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Endereço & Localização */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Endereço da Matriz / Centro de Distribuição</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* CEP */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">CEP</label>
              <input
                type="text"
                value={formData.endereco.cep}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    endereco: { ...formData.endereco, cep: e.target.value },
                  })
                }
                placeholder="00000-000"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Logradouro / Rua */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">Logradouro / Avenida</label>
              <input
                type="text"
                value={formData.endereco.rua}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    endereco: { ...formData.endereco, rua: e.target.value },
                  })
                }
                placeholder="Ex: Av. das Indústrias e Distribuição"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Número */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Número</label>
              <input
                type="text"
                value={formData.endereco.numero}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    endereco: { ...formData.endereco, numero: e.target.value },
                  })
                }
                placeholder="Ex: 1500"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Complemento */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Complemento / Galpão</label>
              <input
                type="text"
                value={formData.endereco.complemento || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    endereco: { ...formData.endereco, complemento: e.target.value },
                  })
                }
                placeholder="Ex: Galpão 04"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Bairro */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Bairro</label>
              <input
                type="text"
                value={formData.endereco.bairro}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    endereco: { ...formData.endereco, bairro: e.target.value },
                  })
                }
                placeholder="Ex: Distrito Industrial"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Cidade */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Cidade</label>
              <input
                type="text"
                value={formData.endereco.cidade}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    endereco: { ...formData.endereco, cidade: e.target.value },
                  })
                }
                placeholder="Ex: São Paulo"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* UF */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">UF (Estado)</label>
              <input
                type="text"
                maxLength={2}
                value={formData.endereco.uf}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    endereco: { ...formData.endereco, uf: e.target.value.toUpperCase() },
                  })
                }
                placeholder="SP"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 font-bold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Contatos & Dados Financeiros */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-purple-400" />
              <span>Contatos & Informações Bancárias / PIX Padrão</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Telefone */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Telefone Fixo</label>
              <input
                type="text"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(11) 3456-7890"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">WhatsApp Comercial</label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="(11) 98765-4321"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* E-mail */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">E-mail Financeiro / Cobrança</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="financeiro@distrimax.com.br"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Chave PIX */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">Chave PIX Padrão de Recebimento</label>
              <input
                type="text"
                value={formData.chavePixPadrao || ''}
                onChange={(e) => setFormData({ ...formData, chavePixPadrao: e.target.value })}
                placeholder="Ex: 12.345.678/0001-90 ou financeiro@distrimax.com.br"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Banco / Conta */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">Conta Bancária Principal</label>
              <input
                type="text"
                value={formData.bancoPadrao || ''}
                onChange={(e) => setFormData({ ...formData, bancoPadrao: e.target.value })}
                placeholder="Ex: Banco do Brasil - Ag 1234-5 CC 98765-0"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Observações Fiscais */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Observações Legais / Rodapé dos Pedidos
              </label>
              <textarea
                rows={2}
                value={formData.observacoesFiscais || ''}
                onChange={(e) => setFormData({ ...formData, observacoesFiscais: e.target.value })}
                placeholder="Texto legal que sairá impresso no rodapé de pedidos de venda..."
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Seção Exclusiva Oculta para Super Admin: Controle de Bloqueio da Empresa */}
        {isSuperAdmin && (
          <div className="bg-slate-900 rounded-2xl border border-amber-500/40 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-bold text-amber-200">
                  Painel de Bloqueio da Empresa (Exclusivo Super Admin)
                </h2>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase font-mono">
                SUPER ADMIN
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-2 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-300">Status Operacional:</span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                    issuer.status === 'bloqueada'
                      ? 'bg-rose-950/80 text-rose-300 border-rose-700'
                      : 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                  }`}>
                    {issuer.status === 'bloqueada' ? '🔴 Empresa Bloqueada' : '🟢 Empresa Ativa'}
                  </span>
                </div>

                {issuer.status !== 'bloqueada' ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Motivo do bloqueio (caso deseje suspender esta empresa):
                    </label>
                    <input
                      type="text"
                      value={blockReasonInput}
                      onChange={(e) => setBlockReasonInput(e.target.value)}
                      placeholder="ex: Inadimplência / Licença suspensa / Auditoria"
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                ) : (
                  <p className="text-xs text-rose-300">
                    <strong>Motivo atual:</strong> {issuer.motivoBloqueio || 'Bloqueio administrativo aplicado'}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleToggleBlock}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                    issuer.status === 'bloqueada'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                  }`}
                >
                  {issuer.status === 'bloqueada' ? (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>Desbloquear Empresa</span>
                    </>
                  ) : (
                    <>
                      <Ban className="w-4 h-4" />
                      <span>Bloquear Empresa Agora</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsCadastroEmpresaOpen(true)}
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Ver Todas as Empresas</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Validation Explanatory Card */}
        <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/40 flex items-start gap-3.5">
          <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 space-y-1">
            <h4 className="font-bold text-blue-300">Como funciona a validação cruzada do Destinatário?</h4>
            <p className="text-slate-400">
              Ao importar um arquivo XML de NF-e ou registrar uma entrada de mercadoria manual, o sistema compara automaticamente o CNPJ do destinatário da nota com o CNPJ do Emitente acima (<strong>{formData.cnpj || 'Não definido'}</strong>). Se houver divergência, o sistema emitirá um alerta imediato para evitar lançamento em filial incorreta.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {isSaved && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800 px-3 py-2 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
              Salvo com Sucesso!
            </span>
          )}

          <button
            type="submit"
            id="btn-save-issuer-profile"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Dados da Empresa Emitente</span>
          </button>
        </div>
      </form>
    </div>
  );
};
