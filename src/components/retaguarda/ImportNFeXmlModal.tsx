import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  PackageCheck,
  Building,
  Calendar,
  DollarSign,
  X,
  FileText,
  Boxes,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { parseNFeXml, ParsedNFeResult, SAMPLE_NFE_XML_1, SAMPLE_NFE_XML_2, SAMPLE_NFE_XML_3 } from '../../services/nfeXmlParser';

interface ImportNFeXmlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ImportNFeXmlModal: React.FC<ImportNFeXmlModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { products, issuer, importStockEntryFromParsedXml } = useSales();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [xmlContent, setXmlContent] = useState<string>('');
  const [parsedNFe, setParsedNFe] = useState<ParsedNFeResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upload' | 'preview'>('upload');

  // Import options
  const [updateStock, setUpdateStock] = useState(true);
  const [generatePayables, setGeneratePayables] = useState(true);
  const [createNewProducts, setCreateNewProducts] = useState(true);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      processXmlText(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        processXmlText(text, file.name);
      };
      reader.readAsText(file);
    }
  };

  const processXmlText = (rawXml: string, sourceName = 'arquivo.xml') => {
    setXmlContent(rawXml);
    try {
      const parsed = parseNFeXml(rawXml);
      setParsedNFe(parsed);
      setParseError(null);
      setActiveTab('preview');
    } catch (err: any) {
      setParseError(err.message || 'Erro ao processar o arquivo XML da NF-e.');
      setParsedNFe(null);
    }
  };

  const loadSample = (sampleNumber: 1 | 2 | 3) => {
    let xml = SAMPLE_NFE_XML_1;
    let name = 'NFe_Dist_Cafe_Graos_84920.xml';
    if (sampleNumber === 2) {
      xml = SAMPLE_NFE_XML_2;
      name = 'NFe_Sucos_Vale_Verde_31849.xml';
    } else if (sampleNumber === 3) {
      xml = SAMPLE_NFE_XML_3;
      name = 'NFe_FMAgropecuaria_36.xml';
    }
    setFileName(name);
    processXmlText(xml, name);
  };

  const handleConfirmImport = () => {
    if (!parsedNFe) return;

    try {
      importStockEntryFromParsedXml(parsedNFe, {
        updateStock,
        generatePayables,
        createNewProducts,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      alert(`Erro ao salvar entrada: ${err.message}`);
    }
  };

  // Match items with existing catalog
  const checkProductMatch = (itemCodigo: string, itemDescricao: string) => {
    const cleanCod = String(itemCodigo || '').toLowerCase();
    const cleanDesc = String(itemDescricao || '').toLowerCase();

    const found = products.find((p) => {
      const pCode = String((p as any).codigo || p.codigoSku || '').toLowerCase();
      const pNome = String(p.nome || '').toLowerCase();

      return (
        (cleanCod && pCode === cleanCod) ||
        (cleanDesc && pNome.includes(cleanDesc.slice(0, 8)))
      );
    });
    return found;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/60 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Importação de NF-e (XML de Entrada)
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-semibold">
                  SEFAZ / NF-e 4.0
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Alimente o estoque e gere o Contas a Pagar automaticamente
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {/* Sub Navigation */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'upload'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                1. Selecionar Arquivo XML
              </button>
              <button
                onClick={() => parsedNFe && setActiveTab('preview')}
                disabled={!parsedNFe}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-500 disabled:opacity-40'
                }`}
              >
                2. Conferência & Lançamento {parsedNFe ? `(NF-e #${parsedNFe.numeroNota})` : ''}
              </button>
            </div>

            {/* 1-Click Samples */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 text-[11px] hidden sm:inline">Exemplos prontos:</span>
              <button
                id="btn-sample-alimentos"
                type="button"
                onClick={() => loadSample(1)}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Café e Grãos</span>
              </button>
              <button
                id="btn-sample-agro"
                type="button"
                onClick={() => loadSample(3)}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-xs font-medium transition-colors"
                title="Exemplo real: FM Agropecuária / Argola Servi"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>FM Agropecuária (Argola)</span>
              </button>
            </div>
          </div>

          {/* TAB 1: Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-900/60"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xml,text/xml"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-blue-950/60 border border-blue-800 flex items-center justify-center text-blue-400 mb-3 shadow-inner">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200">
                  Arraste o arquivo XML da NF-e ou clique para buscar
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Compatível com NF-e modelo 55 emitidas por qualquer distribuidor ou fabricante.
                </p>
                <span className="mt-3 px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-full text-[11px] font-medium">
                  Formatos aceitos: .xml
                </span>
              </div>

              {/* Paste Raw XML Alternative */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-blue-400" />
                  Ou cole o conteúdo XML diretamente aqui:
                </label>
                <textarea
                  rows={4}
                  value={xmlContent}
                  onChange={(e) => processXmlText(e.target.value, 'xml_colado.xml')}
                  placeholder="<nfeProc xmlns=...><NFe>...</NFe></nfeProc>"
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {parseError && (
                <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Erro no XML:</span> {parseError}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Preview & Confirmation */}
          {activeTab === 'preview' && parsedNFe && (
            <div className="space-y-5">
              {/* Recipient Validation Banner */}
              {(() => {
                const isMatching =
                  issuer.cnpj.replace(/\D/g, '') === parsedNFe.destinatario.cnpjCpf.replace(/\D/g, '');
                return (
                  <div
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                      isMatching
                        ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                        : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${
                          isMatching ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      />
                      <div>
                        <span className="font-bold block">
                          {isMatching
                            ? 'Destinatário da NF-e confere com a Empresa Emitente Cadastrada'
                            : 'Aviso de Divergência no Destinatário da NF-e'}
                        </span>
                        <span className="text-[11px] opacity-90 block mt-0.5">
                          Destinatário no XML: <strong>{parsedNFe.destinatario.razaoSocial}</strong> (CNPJ: {parsedNFe.destinatario.cnpjCpf})
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-900 border border-slate-800 shrink-0">
                      Sua Empresa: {issuer.cnpj}
                    </span>
                  </div>
                );
              })()}

              {/* Header Box */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Nota Fiscal Eletrônica de Entrada
                    </span>
                    <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <span>NF-e nº {parsedNFe.numeroNota}</span>
                      <span className="text-xs font-normal text-slate-400">
                        (Série {parsedNFe.serie})
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Data de Emissão
                    </span>
                    <div className="text-xs font-semibold text-slate-200 flex items-center gap-1 justify-end">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      {new Date(parsedNFe.dataEmissao).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>

                {/* Fornecedor info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                      <Building className="w-3 h-3 text-emerald-400" />
                      Fornecedor / Emitente
                    </span>
                    <p className="font-bold text-slate-100">{parsedNFe.fornecedor.razaoSocial}</p>
                    <p className="text-slate-400">
                      CNPJ: <span className="font-mono text-slate-300">{parsedNFe.fornecedor.cnpjCpf}</span> • IE: {parsedNFe.fornecedor.inscricaoEstadual}
                    </p>
                    <p className="text-slate-400">
                      {parsedNFe.fornecedor.endereco.municipio} - {parsedNFe.fornecedor.endereco.uf}
                    </p>
                  </div>

                  <div className="space-y-1 md:text-right">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Chave de Acesso NF-e (44 dígitos)
                    </span>
                    <p className="font-mono text-[11px] text-blue-400 bg-slate-900 p-1.5 rounded border border-slate-800 break-all select-all">
                      {parsedNFe.chaveAcesso}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Natureza: <span className="text-slate-200">{parsedNFe.naturezaOperacao}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Grid */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-blue-400" />
                    Itens da Nota ({parsedNFe.itens.length} produtos para dar entrada)
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Total dos Produtos: R$ {parsedNFe.totais.valorProdutos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                  <div className="max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800 text-slate-300 font-semibold sticky top-0 z-10">
                        <tr>
                          <th className="p-2.5">Código / Descrição</th>
                          <th className="p-2.5">NCM / CFOP</th>
                          <th className="p-2.5 text-center">Un.</th>
                          <th className="p-2.5 text-right">Qtd</th>
                          <th className="p-2.5 text-right">Custo Un.</th>
                          <th className="p-2.5 text-right">Total Item</th>
                          <th className="p-2.5 text-center">Status Estoque</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {parsedNFe.itens.map((item, idx) => {
                          const existingProduct = checkProductMatch(item.codigoProdutoFornecedor, item.descricaoFornecedor);
                          return (
                            <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                              <td className="p-2.5">
                                <div className="font-semibold text-slate-100">{item.descricaoFornecedor}</div>
                                <div className="text-[10px] text-slate-400 font-mono">Cód: {item.codigoProdutoFornecedor}</div>
                              </td>
                              <td className="p-2.5 font-mono text-[11px] text-slate-400">
                                {item.ncm} / {item.cfop}
                              </td>
                              <td className="p-2.5 text-center font-semibold text-slate-300">
                                {item.unidade}
                              </td>
                              <td className="p-2.5 text-right font-bold text-emerald-400">
                                +{item.quantidade}
                              </td>
                              <td className="p-2.5 text-right font-mono text-slate-300">
                                R$ {item.custoUnitarioCalculado.toFixed(2)}
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold text-slate-100">
                                R$ {item.valorTotalBruto.toFixed(2)}
                              </td>
                              <td className="p-2.5 text-center">
                                {existingProduct ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Existente (Atualizar)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950 text-blue-300 border border-blue-800">
                                    <Sparkles className="w-3 h-3" />
                                    Novo Produto
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Duplicatas / Contas a Pagar Preview */}
              {parsedNFe.duplicatas.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-rose-400" />
                    Duplicatas & Parcelas (Lançamento no Contas a Pagar)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {parsedNFe.duplicatas.map((dup, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-300">
                            Parcela {dup.numeroDuplicata}
                          </span>
                          <div className="text-[11px] text-slate-400">
                            Venc: {new Date(dup.dataVencimento).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        <div className="font-mono font-bold text-rose-400">
                          R$ {dup.valorDuplicata.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Import Options Checkboxes */}
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2.5 text-xs">
                <span className="font-bold text-slate-200 block text-[11px] uppercase tracking-wider">
                  Configurações de Processamento no ERP:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={updateStock}
                      onChange={(e) => setUpdateStock(e.target.checked)}
                      className="rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Atualizar saldo de estoque automaticamente (+Qtd)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={generatePayables}
                      onChange={(e) => setGeneratePayables(e.target.checked)}
                      className="rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Gerar títulos de Contas a Pagar ({parsedNFe.duplicatas.length} parcelas)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={createNewProducts}
                      onChange={(e) => setCreateNewProducts(e.target.checked)}
                      className="rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Cadastrar novos itens não encontrados no catálogo</span>
                  </label>
                </div>
              </div>

              {/* Total Summary Footer */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs">
                <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>NF-e validada com sucesso com a SEFAZ</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase">Valor Total da Nota:</span>
                  <div className="text-base font-bold text-emerald-400 font-mono">
                    R$ {parsedNFe.totais.valorTotalNota.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>

          {activeTab === 'preview' && parsedNFe && (
            <button
              id="btn-confirm-xml-import"
              onClick={handleConfirmImport}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/60 transition-all"
            >
              <PackageCheck className="w-4 h-4" />
              <span>Concluir Entrada no ERP</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
