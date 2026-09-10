import React from 'react';
import { useSales } from '../context/SalesContext';
import { Product } from '../types';
import {
  X,
  Package,
  ShoppingCart,
  Plus,
  Layers,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Barcode
} from 'lucide-react';
import { PRICE_TABLE_LABELS } from '../data/mockData';

interface ProductDetailModalProps {
  productId: string;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ productId, onClose }) => {
  const { products, addItemToDraft, setActiveTab, setSelectedProductId } = useSales();

  const product = products.find((p) => p.id === productId);
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {product.categoria}
            </span>
            <span className="text-xs text-slate-400 font-mono">SKU: {product.codigoSku}</span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs">
          
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-square max-h-72">
              <img
                src={product.fotoUrl}
                alt={product.nome}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400">{product.marca}</span>
                <h3 className="text-lg font-black text-white leading-snug">{product.nome}</h3>
                <p className="text-slate-300 leading-relaxed">{product.descricao}</p>
                <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] pt-1">
                  <Barcode className="w-4 h-4 text-slate-500" />
                  <span>EAN/Cód. Barras: {product.codigoBarras}</span>
                </div>
              </div>

              {/* Estoque e Embalagem */}
              <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Estoque Disponível:</span>
                  <span className={`font-bold ${product.estoqueAtual > 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {product.estoqueAtual} {product.unidade}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Múltiplo de Venda:</span>
                  <span className="font-bold text-white">A partir de {product.multiploVenda} {product.unidade}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Peso Unitário:</span>
                  <span className="font-medium text-slate-300">{product.pesoKg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Alíquota ICMS:</span>
                  <span className="font-medium text-slate-300">{product.aliquotaIcmsPct}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de Preços por Canal */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Grade de Preços por Tabela Comercial
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700/60 space-y-1 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Tabela 01 - Varejo</span>
                <p className="text-lg font-extrabold text-white">
                  R$ {product.precoTabela.varejo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-slate-400">Preço balcão / fracionado</span>
              </div>

              <div className="p-3 bg-blue-950/40 rounded-xl border border-blue-600/50 space-y-1 text-center shadow-md">
                <span className="text-[10px] font-bold text-blue-300 uppercase">Tabela 02 - Atacado (Padrão)</span>
                <p className="text-lg font-black text-emerald-400">
                  R$ {product.precoTabela.atacado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-blue-200">Volume padrão B2B</span>
              </div>

              <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700/60 space-y-1 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Tabela 03 - Distribuidor</span>
                <p className="text-lg font-extrabold text-white">
                  R$ {product.precoTabela.distribuidor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-slate-400">Super atacado / Grandes redes</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
          >
            Fechar
          </button>

          <button
            onClick={() => {
              addItemToDraft(product, 1);
              onClose();
              setActiveTab('novo_pedido');
            }}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-700/20 flex items-center gap-1.5 transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Adicionar ao Pedido em Andamento</span>
          </button>
        </div>

      </div>
    </div>
  );
};
