import React, { useState } from 'react';
import {
  Boxes,
  Search,
  Plus,
  Minus,
  Edit2,
  Check,
  X,
  AlertTriangle,
  Tag,
  DollarSign,
  TrendingUp,
  Sliders,
  Filter,
  PlusCircle,
  Barcode,
  Camera,
  Trash2,
  Package,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { Product } from '../../types';
import { ProductFormModal } from './ProductFormModal';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';
import { VoiceSearchButton } from '../common/VoiceSearchButton';

export const StockManagementView: React.FC = () => {
  const { products, updateProductStock, setProducts, deleteProduct } = useSales();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Inline edit form state
  const [editCusto, setEditCusto] = useState<number>(0);
  const [editVarejo, setEditVarejo] = useState<number>(0);
  const [editAtacado, setEditAtacado] = useState<number>(0);
  const [editMinimo, setEditMinimo] = useState<number>(0);

  const categories = ['todas', ...Array.from(new Set(products.map((p) => p.categoria)))];

  const getProductCode = (p: Product) => p.codigoSku || (p as any).codigo || '';
  const getPrecoVarejo = (p: Product) => p.precoTabela?.varejo ?? (p as any).precoVenda ?? 0;
  const getPrecoAtacado = (p: Product) => p.precoTabela?.atacado ?? (p as any).precoAtacado ?? (getPrecoVarejo(p) * 0.9);

  const filteredProducts = products.filter((p) => {
    const sTerm = (searchTerm || '').toLowerCase();
    const code = String(getProductCode(p) || '').toLowerCase();
    const barcode = String(p.codigoBarras || '');
    const nome = String(p.nome || '').toLowerCase();

    const matchesSearch =
      !sTerm ||
      nome.includes(sTerm) ||
      code.includes(sTerm) ||
      barcode.includes(searchTerm);
    const matchesCat = selectedCategory === 'todas' || p.categoria === selectedCategory;
    const matchesLow = onlyLowStock ? p.estoqueAtual <= p.estoqueMinimo : true;
    return matchesSearch && matchesCat && matchesLow;
  });

  const handleOpenNewProduct = () => {
    setProductToEdit(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setProductToEdit(prod);
    setIsProductModalOpen(true);
  };

  const handleStartEdit = (p: Product) => {
    setEditingProductId(p.id);
    setEditCusto(p.precoCusto);
    setEditVarejo(getPrecoVarejo(p));
    setEditAtacado(getPrecoAtacado(p));
    setEditMinimo(p.estoqueMinimo);
  };

  const handleSaveEdit = (id: string) => {
    setProducts((prev) =>
      prev.map((prod) =>
        prod.id === id
          ? {
              ...prod,
              precoCusto: editCusto,
              precoTabela: {
                ...prod.precoTabela,
                varejo: editVarejo,
                atacado: editAtacado,
                distribuidor: prod.precoTabela?.distribuidor ?? (editAtacado * 0.9),
              },
              estoqueMinimo: editMinimo,
            }
          : prod
      )
    );
    setEditingProductId(null);
  };

  const handleQuickAdjust = (productId: string, delta: number) => {
    updateProductStock(productId, delta);
  };

  const handleDelete = (prod: Product) => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${prod.nome}"?`)) {
      deleteProduct(prod.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="w-full lg:w-96 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, SKU ou cód. barras..."
              className="w-full pl-9 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
              <VoiceSearchButton
                size="sm"
                onTranscript={(t) => setSearchTerm(t)}
                placeholderHint="Fale o nome do produto no estoque..."
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-blue-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
            title="Ler Código de Barras pela Câmera"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2 w-full lg:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'todas' ? 'Todas as Categorias' : c}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyLowStock}
              onChange={(e) => setOnlyLowStock(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
            />
            <span className="text-amber-400 font-semibold">Estoque Baixo</span>
          </label>

          <button
            id="btn-add-new-product"
            onClick={handleOpenNewProduct}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-950/50 transition-colors shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Stock Grid Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Boxes className="w-4 h-4 text-blue-400" />
            Controle de Produtos, Estoque & Tabela de Preços ({filteredProducts.length} itens)
          </h3>
          <span className="text-[11px] text-slate-400">
            Cadastre novos itens ou edite preços e códigos de barras
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-300 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Código / Produto</th>
                <th className="p-3.5">Código de Barras</th>
                <th className="p-3.5 text-center">Un.</th>
                <th className="p-3.5 text-right">Preço de Custo</th>
                <th className="p-3.5 text-right">Preço Venda (Varejo)</th>
                <th className="p-3.5 text-right">Preço Atacado</th>
                <th className="p-3.5 text-center">Margem %</th>
                <th className="p-3.5 text-center">Saldo Atual</th>
                <th className="p-3.5 text-center">Ajuste Rápido</th>
                <th className="p-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    Nenhum produto encontrado. Clique em <strong>"+ Novo Produto"</strong> para cadastrar!
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const isEditing = editingProductId === prod.id;
                  const isLow = prod.estoqueAtual <= prod.estoqueMinimo;
                  const code = getProductCode(prod);
                  const precoVarejo = getPrecoVarejo(prod);
                  const precoAtacado = getPrecoAtacado(prod);
                  const margem =
                    precoVarejo > 0
                      ? (((precoVarejo - prod.precoCusto) / precoVarejo) * 100).toFixed(1)
                      : '0';

                  return (
                    <tr key={prod.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Produto */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          {prod.imagemUrl ? (
                            <img
                              src={prod.imagemUrl}
                              alt={prod.nome}
                              className="w-9 h-9 rounded-lg object-cover border border-slate-700 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-100">{prod.nome}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              SKU: {code} • {prod.categoria}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Código de Barras */}
                      <td className="p-3.5">
                        {prod.codigoBarras ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px]">
                            <Barcode className="w-3 h-3 text-cyan-400" />
                            {prod.codigoBarras}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Sem código</span>
                        )}
                      </td>

                      {/* Unidade */}
                      <td className="p-3.5 text-center font-bold text-slate-300">
                        {prod.unidade}
                      </td>

                      {/* Preço Custo */}
                      <td className="p-3.5 text-right font-mono">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editCusto}
                            onChange={(e) => setEditCusto(parseFloat(e.target.value) || 0)}
                            className="w-20 p-1 bg-slate-950 border border-slate-700 rounded text-right font-mono text-xs"
                          />
                        ) : (
                          <span className="text-slate-400">R$ {prod.precoCusto.toFixed(2)}</span>
                        )}
                      </td>

                      {/* Preço Venda */}
                      <td className="p-3.5 text-right font-mono font-bold">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editVarejo}
                            onChange={(e) => setEditVarejo(parseFloat(e.target.value) || 0)}
                            className="w-20 p-1 bg-slate-950 border border-slate-700 rounded text-right font-mono text-xs text-emerald-400"
                          />
                        ) : (
                          <span className="text-emerald-400">R$ {precoVarejo.toFixed(2)}</span>
                        )}
                      </td>

                      {/* Preço Atacado */}
                      <td className="p-3.5 text-right font-mono">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editAtacado}
                            onChange={(e) => setEditAtacado(parseFloat(e.target.value) || 0)}
                            className="w-20 p-1 bg-slate-950 border border-slate-700 rounded text-right font-mono text-xs text-blue-400"
                          />
                        ) : (
                          <span className="text-blue-400">R$ {precoAtacado.toFixed(2)}</span>
                        )}
                      </td>

                      {/* Margem */}
                      <td className="p-3.5 text-center font-semibold text-purple-400">
                        {margem}%
                      </td>

                      {/* Saldo Atual */}
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isLow
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-slate-800 text-slate-200'
                          }`}
                        >
                          {isLow && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                          {prod.estoqueAtual} {prod.unidade}
                        </span>
                      </td>

                      {/* Ajuste Rápido */}
                      <td className="p-3.5 text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                          <button
                            onClick={() => handleQuickAdjust(prod.id, -1)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400"
                            title="Subtrair 1 unidade"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleQuickAdjust(prod.id, 1)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-emerald-400"
                            title="Adicionar 1 unidade"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSaveEdit(prod.id)}
                                className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                                title="Salvar alterações de preço"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingProductId(null)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                                title="Cancelar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleOpenEditProduct(prod)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                                title="Editar Cadastro Completo (Código de barras, NCM, imagens, preços)"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(prod)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                                title="Excluir Produto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Form Modal (Desktop Creation / Edit) */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        productToEdit={productToEdit}
      />

      {/* Barcode Camera Scanner */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(code) => {
          setSearchTerm(code);
        }}
        title="Escanear Código de Barras do Produto"
      />
    </div>
  );
};
