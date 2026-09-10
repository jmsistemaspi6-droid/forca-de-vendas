import React, { useState } from 'react';
import { useSales } from '../context/SalesContext';
import { Product } from '../types';
import {
  PackageSearch,
  Search,
  Filter,
  Plus,
  ShoppingCart,
  Layers,
  Sparkles,
  Barcode,
  Eye,
  Grid,
  List,
  Flame,
  Camera,
} from 'lucide-react';
import { ProductDetailModal } from './ProductDetailModal';
import { BarcodeScannerModal } from './common/BarcodeScannerModal';
import { VoiceSearchButton } from './common/VoiceSearchButton';

export const CatalogView: React.FC = () => {
  const {
    products,
    addItemToDraft,
    selectedProductId,
    setSelectedProductId,
    setActiveTab,
    draftOrder,
    showToast
  } = useSales();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.categoria)))];

  const filteredProducts = products.filter((p) => {
    const sTerm = (search || '').toLowerCase();
    const nome = String(p.nome || '').toLowerCase();
    const sku = String(p.codigoSku || (p as any).codigo || '').toLowerCase();
    const marca = String(p.marca || '').toLowerCase();
    const barcode = String(p.codigoBarras || '');

    const matchesCat = categoryFilter === 'all' || p.categoria === categoryFilter;
    const matchesSearch =
      !sTerm ||
      nome.includes(sTerm) ||
      sku.includes(sTerm) ||
      marca.includes(sTerm) ||
      barcode.includes(search);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight">Catálogo Digital & Estoque</h2>
          <p className="text-xs text-slate-400">
            Consulte estoque atualizado em tempo real, fichas técnicas e grades de preços
          </p>
        </div>

        <div className="flex items-center gap-2">
          {draftOrder.itens.length > 0 && (
            <button
              onClick={() => setActiveTab('novo_pedido')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-700/20 transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Ver Pedido ({draftOrder.itens.length} itens)</span>
            </button>
          )}

          {/* View Toggle */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Visualização em Grade"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Visualização em Tabela B2B"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome do produto, SKU, marca ou código de barras..."
                className="w-full bg-slate-800 text-xs text-slate-200 rounded-xl pl-10 pr-10 py-2.5 border border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <VoiceSearchButton
                  size="sm"
                  onTranscript={(transcript) => setSearch(transcript)}
                  placeholderHint="Fale o nome do produto ou marca..."
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-400 hover:text-blue-300 rounded-xl text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
              title="Escanear Código de Barras pela Câmera"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline font-bold text-xs">Câmera</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-2.5"
            >
              <option value="all">Todas as Categorias</option>
              {categories.filter((c) => c !== 'all').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
          <span>{filteredProducts.length} itens encontrados no catálogo</span>
        </div>
      </div>

      {/* Grid View Mode */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-slate-900 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between overflow-hidden group shadow-sm"
            >
              <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
                <img
                  src={product.fotoUrl}
                  alt={product.nome}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {product.destaquePromo && (
                  <span className="absolute top-2.5 left-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                    <Flame className="w-3 h-3 fill-slate-950" />
                    PROMOÇÃO
                  </span>
                )}
                <span className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur text-slate-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-slate-700">
                  {product.unidade}
                </span>
              </div>

              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400">
                    {product.categoria}
                  </span>
                  <h4 className="text-xs font-bold text-white line-clamp-2 mt-0.5 leading-snug">
                    {product.nome}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {product.codigoSku}</p>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] text-slate-400">Atacado:</span>
                    <span className="text-base font-black text-emerald-400 font-mono">
                      R$ {product.precoTabela.atacado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`font-semibold ${product.estoqueAtual > 30 ? 'text-slate-400' : 'text-amber-400'}`}>
                      Estoque: {product.estoqueAtual} {product.unidade}
                    </span>
                    <span className="text-slate-400">Varejo: R$ {product.precoTabela.varejo.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="p-3 bg-slate-800/40 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                <button
                  onClick={() => setSelectedProductId(product.id)}
                  className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span>Ficha</span>
                </button>

                <button
                  onClick={() => addItemToDraft(product, 1)}
                  className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Adicionar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View Mode */
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800/90 text-slate-300 font-bold border-b border-slate-700">
                  <th className="p-3">Produto / Marca</th>
                  <th className="p-3 font-mono">SKU</th>
                  <th className="p-3 text-center">Un.</th>
                  <th className="p-3 text-right">Preço Varejo</th>
                  <th className="p-3 text-right">Preço Atacado</th>
                  <th className="p-3 text-right">Preço Distribuidor</th>
                  <th className="p-3 text-center">Estoque</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img src={p.fotoUrl} alt={p.nome} className="w-10 h-10 rounded-lg object-cover bg-slate-950 shrink-0" />
                        <div>
                          <p className="font-bold text-white">{p.nome}</p>
                          <p className="text-[10px] text-slate-400">{p.marca} • {p.categoria}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-400">{p.codigoSku}</td>
                    <td className="p-3 text-center font-mono">{p.unidade}</td>
                    <td className="p-3 text-right font-mono">R$ {p.precoTabela.varejo.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">R$ {p.precoTabela.atacado.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono text-slate-400">R$ {p.precoTabela.distribuidor.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <span className={`font-bold px-2 py-0.5 rounded-full ${p.estoqueAtual > 50 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                        {p.estoqueAtual}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedProductId(p.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                          title="Ver Ficha Técnica"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => addItemToDraft(p, 1)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Adicionar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Produto */}
      {selectedProductId && (
        <ProductDetailModal
          productId={selectedProductId}
          onClose={() => setSelectedProductId(null)}
        />
      )}

      {/* Modal de Leitura de Código de Barras */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(code) => {
          setSearch(code);
          const found = products.find(
            (p) =>
              p.codigoBarras === code ||
              String(p.codigoSku || (p as any).codigo || '').toLowerCase() === String(code || '').toLowerCase()
          );
          if (found) {
            showToast('Produto Identificado', `${found.nome} encontrado no catálogo.`, 'success');
          } else {
            showToast('Código Escaneado', `Filtrando por: ${code}`, 'info');
          }
        }}
        title="Escanear Código de Barras do Catálogo"
      />

    </div>
  );
};
