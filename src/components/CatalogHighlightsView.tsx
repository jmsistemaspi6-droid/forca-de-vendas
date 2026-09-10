import React, { useState } from 'react';
import { useSales } from '../context/SalesContext';
import { Product } from '../types';
import {
  Sparkles,
  TrendingUp,
  Percent,
  ShoppingCart,
  Eye,
  CheckCircle2,
  AlertCircle,
  Tag,
  Flame,
  Star,
  Search,
  Plus,
} from 'lucide-react';
import { ProductDetailModal } from './ProductDetailModal';
import { VoiceSearchButton } from './common/VoiceSearchButton';

export const CatalogHighlightsView: React.FC = () => {
  const { products, selectedProductId, setSelectedProductId, addItemToDraft, showToast, setActiveTab } = useSales();
  const [selectedSection, setSelectedSection] = useState<'todos' | 'promocoes' | 'mais_vendidos' | 'novidades'>('todos');
  const [search, setSearch] = useState('');

  // Identifica destaques
  const promoProducts = products.filter((p) => p.destaquePromo || p.descontoMaximoPct >= 12);
  const bestSellers = products.filter((p) => p.categoria.includes('Bebidas') || p.comissaoPct >= 4 || p.estoqueAtual > 50);
  const newReleases = products.slice(0, 8);

  const displayedProducts = products.filter((p) => {
    const term = search.toLowerCase().trim();
    const matchesSearch =
      !term ||
      p.nome.toLowerCase().includes(term) ||
      p.codigoSku.toLowerCase().includes(term) ||
      p.marca.toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (selectedSection === 'promocoes') {
      return p.destaquePromo || p.descontoMaximoPct >= 12;
    }
    if (selectedSection === 'mais_vendidos') {
      return p.categoria.includes('Bebidas') || p.comissaoPct >= 4 || p.estoqueAtual > 50;
    }
    if (selectedSection === 'novidades') {
      return newReleases.some((nr) => nr.id === p.id);
    }
    return true;
  });

  const handleQuickAddToCart = (p: Product) => {
    if (p.estoqueAtual <= 0) {
      showToast('Estoque Indisponível', 'Este produto está esgotado no momento.', 'warning');
      return;
    }
    addItemToDraft(p, p.multiploVenda || 1);
    showToast('Adicionado ao Pedido', `${p.nome} adicionado ao carrinho de vendas.`, 'success');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-slate-900 p-5 rounded-2xl border border-blue-800/40 backdrop-blur-sm shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-950/60 font-black">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Destaques do Catálogo
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-blue-900/60 text-blue-300 border border-blue-700/50">
                Vitrine Comercial
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Apresente campanhas promocionais, lançamentos e produtos com maior giro no PDV
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('novo_pedido')}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-950/50 self-start md:self-auto transition-all"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Ver Carrinho do Pedido</span>
        </button>
      </div>

      {/* Categories Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'todos', label: 'Todos os Destaques', icon: Star, count: products.length },
            { id: 'promocoes', label: 'Super Promoções', icon: Flame, count: promoProducts.length },
            { id: 'mais_vendidos', label: 'Mais Vendidos (Top Giro)', icon: TrendingUp, count: bestSellers.length },
            { id: 'novidades', label: 'Lançamentos & Novidades', icon: Sparkles, count: newReleases.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedSection(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-950/40'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-blue-800 text-blue-100' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar destaque..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-14 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
            <VoiceSearchButton size="sm" onTranscript={(t) => setSearch(t)} />
          </div>
        </div>
      </div>

      {/* Grid of Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {displayedProducts.map((p) => {
          const isPromo = p.destaquePromo || p.descontoMaximoPct >= 12;
          const hasStock = p.estoqueAtual > 0;

          return (
            <div
              key={p.id}
              className="bg-slate-900 border border-slate-800 hover:border-blue-500/60 rounded-2xl p-4 flex flex-col justify-between transition-all hover:shadow-2xl hover:-translate-y-0.5 group"
            >
              <div>
                {/* Badges */}
                <div className="flex items-center justify-between gap-1.5 mb-2.5">
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {p.codigoSku}
                  </span>

                  {isPromo && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800/60 flex items-center gap-1">
                      <Flame className="w-3 h-3 text-rose-400" />
                      Promoção Especial
                    </span>
                  )}
                </div>

                {/* Product Name */}
                <h3
                  onClick={() => setSelectedProductId(p.id)}
                  className="text-sm font-bold text-slate-100 group-hover:text-blue-300 transition-colors line-clamp-2 cursor-pointer mb-1"
                >
                  {p.nome}
                </h3>

                <div className="text-[11px] text-slate-400 mb-3 flex items-center gap-1.5">
                  <span>{p.marca}</span>
                  <span>•</span>
                  <span>{p.categoria}</span>
                </div>
              </div>

              {/* Price & Cart Actions */}
              <div className="space-y-3 mt-2">
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">
                    Preço Atacado Especial
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-black font-mono text-emerald-400">
                      R$ {p.precoTabela.atacado.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400">/ {p.unidade}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 pt-1 border-t border-slate-800/60">
                    <span>Estoque: <strong className={hasStock ? 'text-slate-300' : 'text-rose-400'}>{p.estoqueAtual} {p.unidade}</strong></span>
                    <span>Comissão: <strong className="text-emerald-400">{p.comissaoPct}%</strong></span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProductId(p.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Detalhes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickAddToCart(p)}
                    disabled={!hasStock}
                    className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-md shadow-blue-950/50 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Pedido</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Detalhes */}
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
