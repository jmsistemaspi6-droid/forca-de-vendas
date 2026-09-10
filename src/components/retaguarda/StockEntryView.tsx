import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Calendar,
  Building,
  CheckCircle2,
  FileText,
  Boxes,
  ArrowUpRight,
  Eye,
  Filter,
  DollarSign,
  PackageCheck,
  ChevronDown,
  ChevronUp,
  PlusCircle,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { StockEntry } from '../../types';
import { ImportNFeXmlModal } from './ImportNFeXmlModal';
import { ManualStockEntryModal } from './ManualStockEntryModal';

export const StockEntryView: React.FC = () => {
  const { stockEntries } = useSales();
  const [searchTerm, setSearchTerm] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Helper getters
  const getFornecedorNome = (e: StockEntry) => e.fornecedor?.razaoSocial || (e as any).fornecedorNome || 'Fornecedor';
  const getFornecedorCnpj = (e: StockEntry) => e.fornecedor?.cnpj || (e as any).fornecedorCnpj || '';
  const getValorTotal = (e: StockEntry) => e.totais?.valorTotalNota ?? (e as any).valorTotal ?? 0;

  // Filter entries
  const filteredEntries = stockEntries.filter((entry) => {
    const sTerm = (searchTerm || '').toLowerCase();
    const fornecedorNome = String(getFornecedorNome(entry) || '').toLowerCase();
    const fornecedorCnpj = String(getFornecedorCnpj(entry) || '');
    const numNota = String(entry.numeroNota || '').toLowerCase();
    const chave = String(entry.chaveAcesso || '');

    const matchesSearch =
      !sTerm ||
      numNota.includes(sTerm) ||
      fornecedorNome.includes(sTerm) ||
      fornecedorCnpj.includes(searchTerm) ||
      chave.includes(searchTerm);
    return matchesSearch;
  });

  // Calculate totals
  const totalComprado = stockEntries.reduce((acc, curr) => acc + getValorTotal(curr), 0);
  const totalItens = stockEntries.reduce((acc, curr) => acc + curr.itens.length, 0);
  const fornecedoresCount = new Set(stockEntries.map((e) => getFornecedorCnpj(e))).size;

  return (
    <div className="space-y-6">
      {/* Top Banner / Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total de Entradas (Compras)
            </span>
            <div className="text-xl font-bold text-slate-100 mt-1 font-mono">
              R$ {totalComprado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Alimentando estoque & contas a pagar
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-950/60 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Notas Fiscais Registradas
            </span>
            <div className="text-xl font-bold text-slate-100 mt-1">
              {stockEntries.length} NF-e
            </div>
            <span className="text-[11px] text-emerald-400 mt-0.5 block">
              100% integradas ao estoque
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-950/60 border border-blue-800 flex items-center justify-center text-blue-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total de Itens Recebidos
            </span>
            <div className="text-xl font-bold text-slate-100 mt-1 font-mono">
              {totalItens} produtos
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Com custos atualizados
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-950/60 border border-purple-800 flex items-center justify-center text-purple-400">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Fornecedores Atendidos
            </span>
            <div className="text-xl font-bold text-slate-100 mt-1">
              {fornecedoresCount} empresas
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Parceiros comerciais
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-950/60 border border-amber-800 flex items-center justify-center text-amber-400">
            <Building className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Action and Search Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-auto flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por NF-e nº, fornecedor, CNPJ ou chave..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="w-full sm:w-auto flex flex-wrap items-center gap-2">
          <button
            id="btn-open-manual-entry"
            onClick={() => setIsManualModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 rounded-xl text-xs font-bold transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Entrada Manual (Sem XML)</span>
          </button>

          <button
            id="btn-open-import-xml"
            onClick={() => setIsImportModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/50 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Importar XML de NF-e</span>
          </button>
        </div>
      </div>

      {/* Stock Entries Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-emerald-400" />
            Histórico de Entradas de Mercadorias ({filteredEntries.length})
          </h3>
          <span className="text-[11px] text-slate-400">
            Clique na nota para ver itens e duplicatas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-300 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">NF-e / Série</th>
                <th className="p-3.5">Fornecedor / Emitente</th>
                <th className="p-3.5">Emissão / Entrada</th>
                <th className="p-3.5 text-center">Qtd Itens</th>
                <th className="p-3.5 text-right">Total da Nota</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Nenhuma entrada de mercadoria encontrada. Clique em <strong>"Importar XML de NF-e"</strong> para começar!
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const isExpanded = expandedRow === entry.id;
                  const fornecedorNome = getFornecedorNome(entry);
                  const fornecedorCnpj = getFornecedorCnpj(entry);
                  const valorTotal = getValorTotal(entry);

                  return (
                    <React.Fragment key={entry.id}>
                      <tr
                        className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                          isExpanded ? 'bg-slate-800/30' : ''
                        }`}
                        onClick={() => setExpandedRow(isExpanded ? null : entry.id)}
                      >
                        <td className="p-3.5">
                          <div className="font-bold text-slate-100 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-blue-400" />
                            <span>NF-e #{entry.numeroNota}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Série {entry.serie}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="font-semibold text-slate-200">
                            {fornecedorNome}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            CNPJ: {fornecedorCnpj}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="text-slate-300">
                            {new Date(entry.dataEmissao).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Entrada: {new Date(entry.dataEntrada).toLocaleDateString('pt-BR')}
                          </div>
                        </td>

                        <td className="p-3.5 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold text-[11px]">
                            {entry.itens.length} itens
                          </span>
                        </td>

                        <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                          R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="p-3.5 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            {entry.status === 'processada' || (entry.status as any) === 'concluida' ? 'Processada / Estoque Ok' : 'Processada'}
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedRow(isExpanded ? null : entry.id);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="p-4 bg-slate-950/80 border-y border-slate-800">
                            <div className="space-y-4">
                              {/* Chave de Acesso */}
                              {entry.chaveAcesso && (
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="font-bold text-slate-400 uppercase text-[10px]">
                                    Chave NF-e:
                                  </span>
                                  <span className="font-mono text-blue-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 select-all">
                                    {entry.chaveAcesso}
                                  </span>
                                </div>
                              )}

                              {/* Products in this entry */}
                              <div>
                                <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                                  Itens Inclusos no Estoque:
                                </h4>
                                <div className="border border-slate-800 rounded-xl overflow-hidden">
                                  <table className="w-full text-left text-xs bg-slate-900/90">
                                    <thead className="bg-slate-800 text-slate-300 font-semibold">
                                      <tr>
                                        <th className="p-2">Cód</th>
                                        <th className="p-2">Descrição do Produto</th>
                                        <th className="p-2">NCM</th>
                                        <th className="p-2 text-center">Un.</th>
                                        <th className="p-2 text-right">Qtd Entrada</th>
                                        <th className="p-2 text-right">Custo Un.</th>
                                        <th className="p-2 text-right">Subtotal</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                      {entry.itens.map((item, i) => {
                                        const cod = item.codigoProdutoFornecedor || (item as any).codigoProduto;
                                        const desc = item.descricaoFornecedor || (item as any).nomeProduto;
                                        const custoUn = item.custoUnitarioCalculado ?? item.valorUnitario;
                                        const sub = item.valorTotalBruto ?? (item.quantidade * item.valorUnitario);

                                        return (
                                          <tr key={i}>
                                            <td className="p-2 font-mono text-slate-400">{cod}</td>
                                            <td className="p-2 font-semibold text-slate-200">{desc}</td>
                                            <td className="p-2 font-mono text-slate-400">{item.ncm || '-'}</td>
                                            <td className="p-2 text-center text-slate-300">{item.unidade}</td>
                                            <td className="p-2 text-right font-bold text-emerald-400">+{item.quantidade}</td>
                                            <td className="p-2 text-right font-mono text-slate-300">R$ {custoUn.toFixed(2)}</td>
                                            <td className="p-2 text-right font-mono font-bold text-slate-100">R$ {sub.toFixed(2)}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* Duplicatas / Contas a pagar geradas */}
                              {entry.duplicatas && entry.duplicatas.length > 0 && (
                                <div>
                                  <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                                    Contas a Pagar Geradas ({entry.duplicatas.length} parcelas):
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {entry.duplicatas.map((dup, dIdx) => {
                                      const num = dup.numeroDuplicata || (dup as any).numeroParcela;
                                      const val = dup.valorDuplicata ?? (dup as any).valor ?? 0;

                                      return (
                                        <div
                                          key={dIdx}
                                          className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                                        >
                                          <div>
                                            <span className="font-semibold text-slate-300">
                                              Parcela {num}
                                            </span>
                                            <div className="text-[10px] text-slate-400">
                                              Vencimento: {new Date(dup.dataVencimento).toLocaleDateString('pt-BR')}
                                            </div>
                                          </div>
                                          <div className="font-mono font-bold text-rose-400">
                                            R$ {val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import Modal */}
      <ImportNFeXmlModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* Manual Stock Entry Modal */}
      <ManualStockEntryModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
      />
    </div>
  );
};
