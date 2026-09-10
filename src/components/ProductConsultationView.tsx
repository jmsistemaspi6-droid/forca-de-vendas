import React, { useState } from 'react';
import { useSales } from '../context/SalesContext';
import { Product } from '../types';
import {
  PackageSearch,
  Search,
  Barcode,
  Layers,
  CheckCircle2,
  AlertCircle,
  Eye,
  Tag,
  DollarSign,
  Boxes,
  Percent,
  SlidersHorizontal,
} from 'lucide-react';
import { ProductDetailModal } from './ProductDetailModal';
import { VoiceSearchButton } from './common/VoiceSearchButton';

export const ProductConsultationView: React.FC = () => {
  const { products, selectedProductId, setSelectedProductId } = useSales();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock'>('all');

  const categories = Array.from(new Set(products.map((p) => p.categoria || 'Geral')));

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      p.nome.toLowerCase().includes(term) ||
      p.codigoSku.toLowerCase().includes(term) ||
      p.codigoBarras.toLowerCase().includes(term) ||
      p.marca.toLowerCase().includes(term);

    const matchesCategory = selectedCategory === 'all' || p.categoria === selectedCategory;

    const matchesStock =
      stockFilter === 'all' ||
      (stockFilter === 'in_stock' && p.estoqueAtual > 0) ||
      (stockFilter === 'low_stock' && p.estoqueAtual <= p.estoqueMinimo);

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/70 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <PackageSearch className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg lg:text-xl font-black text-white tracking-tight flex items-center gap-2">
              Consulta de Produtos & Estoque
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/60 font-semibold uppercase">
                Somente Leitura
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Verifique preços nas 3 tabelas, múltiplos e disponibilidade física em tempo real
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-300 font-medium bg-slate-950/80 px-3.5 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto font-mono">
          <span className="text-blue-400 font-bold">{filteredProducts.length}</span> de{' '}
          <span className="text-slate-400">{products.length}</span> produtos
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-6 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por descrição, SKU, código de barras EAN ou marca..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-20 py-2.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-[11px] text-slate-400 hover:text-slate-200 px-1.5 py-0.5"
              >
                Limpar
              </button>
            )}
            <VoiceSearchButton size="sm" onTranscript={(t) => setSearchTerm(t)} />
          </div>
        </div>

        <div className="md:col-span-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-all"
          >
            <option value="all">Todas as Categorias ({categories.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-all"
          >
            <option value="all">Todos os Estoques</option>
            <option value="in_stock">Com Estoque Disponível (&gt; 0)</option>
            <option value="low_stock">Estoque Baixo / Crítico</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <PackageSearch className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-200">Nenhum produto encontrado</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Tente buscar com outros termos ou selecione outra categoria no filtro acima.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredProducts.map((p) => {
            const isLowStock = p.estoqueAtual <= p.estoqueMinimo;
            const hasStock = p.estoqueAtual > 0;

            return (
              <div
                key={p.id}
                onClick={() => setSelectedProductId(p.id)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all hover:shadow-xl group"
              >
                <div>
                  {/* Top Bar: SKU & Stock Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-mono font-bold text-blue-400 bg-blue-950/70 border border-blue-800/60 px-2 py-0.5 rounded-md">
                      SKU: {p.codigoSku}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        !hasStock
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                          : isLowStock
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                          : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                      }`}
                    >
                      {hasStock ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{p.estoqueAtual} {p.unidade} em estoque</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          <span>Esgotado</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Title and Category */}
                  <h3 className="text-sm font-bold text-slate-100 group-hover:text-blue-300 transition-colors line-clamp-2 mb-1">
                    {p.nome}
                  </h3>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-3">
                    <span>{p.marca}</span>
                    <span>•</span>
                    <span className="truncate">{p.categoria}</span>
                    {p.multiploVenda > 1 && (
                      <>
                        <span>•</span>
                        <span className="text-amber-400 font-semibold">
                          Mult: {p.multiploVenda} un
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Price Table 3 Tiers Box */}
                <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 space-y-2 mt-2">
                  <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Atacado (Padrão):</span>
                    <span className="font-mono font-bold text-emerald-400 text-xs">
                      R$ {p.precoTabela.atacado.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Varejo (+15%):</span>
                    <span className="font-mono font-semibold text-slate-300">
                      R$ {p.precoTabela.varejo.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Distribuidor (-10%):</span>
                    <span className="font-mono font-semibold text-blue-300">
                      R$ {p.precoTabela.distribuidor.toFixed(2)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Comissão: <strong className="text-slate-300">{p.comissaoPct}%</strong></span>
                    <button className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      Ver Ficha
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProductId && (
        <ProductDetailModal
          productId={selectedProductId}
          isOpen={Boolean(selectedProductId)}
          onClose={() => setSelectedProductId(null)}
        />
      )}
    </div>
  );
};
