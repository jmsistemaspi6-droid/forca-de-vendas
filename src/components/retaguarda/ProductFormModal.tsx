import React, { useState, useEffect } from 'react';
import {
  Package,
  X,
  Barcode,
  Camera,
  DollarSign,
  Boxes,
  Percent,
  CheckCircle2,
  Save,
  Image as ImageIcon,
  HelpCircle,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { Product } from '../../types';
import { useSales } from '../../context/SalesContext';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSuccess?: () => void;
}

const PRESET_IMAGES = [
  { label: 'Café / Grãos', url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=600' },
  { label: 'Azeite / Óleo', url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=600' },
  { label: 'Bebidas / Sucos', url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=600' },
  { label: 'Arroz / Cereais', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600' },
  { label: 'Leite / Laticínios', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=600' },
  { label: 'Massas / Macarrão', url: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&q=80&w=600' },
  { label: 'Higiene / Limpeza', url: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&q=80&w=600' },
  { label: 'Embalagens / Caixas', url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=600' },
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSuccess,
}) => {
  const { addProduct, updateProduct, showToast, products } = useSales();

  const isEditing = !!productToEdit;

  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Form State
  const [codigoSku, setCodigoSku] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('Alimentos & Matinais');
  const [marca, setMarca] = useState('');
  const [unidade, setUnidade] = useState<'UN' | 'CX' | 'KG' | 'PCT' | 'FD' | 'LT'>('UN');
  const [ncm, setNcm] = useState('');
  const [precoCusto, setPrecoCusto] = useState<number>(0);
  const [precoVarejo, setPrecoVarejo] = useState<number>(0);
  const [precoAtacado, setPrecoAtacado] = useState<number>(0);
  const [precoDistribuidor, setPrecoDistribuidor] = useState<number>(0);
  const [estoqueAtual, setEstoqueAtual] = useState<number>(0);
  const [estoqueMinimo, setEstoqueMinimo] = useState<number>(10);
  const [multiploVenda, setMultiploVenda] = useState<number>(1);
  const [descontoMaximoPct, setDescontoMaximoPct] = useState<number>(15);
  const [comissaoPct, setComissaoPct] = useState<number>(3.5);
  const [aliquotaIcmsPct, setAliquotaIcmsPct] = useState<number>(12);
  const [pesoKg, setPesoKg] = useState<number>(1.0);
  const [fotoUrl, setFotoUrl] = useState(PRESET_IMAGES[0].url);
  const [descricao, setDescricao] = useState('');
  const [destaquePromo, setDestaquePromo] = useState(false);
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo');

  useEffect(() => {
    if (productToEdit) {
      setCodigoSku(productToEdit.codigoSku || '');
      setCodigoBarras(productToEdit.codigoBarras || '');
      setNome(productToEdit.nome || '');
      setCategoria(productToEdit.categoria || 'Alimentos & Matinais');
      setMarca(productToEdit.marca || '');
      setUnidade(productToEdit.unidade || 'UN');
      setNcm(productToEdit.ncm || '');
      setPrecoCusto(productToEdit.precoCusto || 0);
      setPrecoVarejo(productToEdit.precoTabela?.varejo || 0);
      setPrecoAtacado(productToEdit.precoTabela?.atacado || 0);
      setPrecoDistribuidor(productToEdit.precoTabela?.distribuidor || 0);
      setEstoqueAtual(productToEdit.estoqueAtual || 0);
      setEstoqueMinimo(productToEdit.estoqueMinimo || 10);
      setMultiploVenda(productToEdit.multiploVenda || 1);
      setDescontoMaximoPct(productToEdit.descontoMaximoPct || 15);
      setComissaoPct(productToEdit.comissaoPct || 3.5);
      setAliquotaIcmsPct(productToEdit.aliquotaIcmsPct || 12);
      setPesoKg(productToEdit.pesoKg || 1.0);
      setFotoUrl(productToEdit.fotoUrl || PRESET_IMAGES[0].url);
      setDescricao(productToEdit.descricao || '');
      setDestaquePromo(!!productToEdit.destaquePromo);
      setStatus(productToEdit.status || 'ativo');
    } else {
      // Auto-generate SKU for new product
      const nextNum = products.length + 101;
      setCodigoSku(`PROD-${nextNum}`);
      // Generate random EAN-13 placeholder or leave clean
      setCodigoBarras(`7891${Math.floor(100000000 + Math.random() * 900000000)}`);
      setNome('');
      setCategoria('Alimentos & Matinais');
      setMarca('');
      setUnidade('UN');
      setNcm('2106.90.90');
      setPrecoCusto(10);
      setPrecoVarejo(18.9);
      setPrecoAtacado(16.5);
      setPrecoDistribuidor(14.9);
      setEstoqueAtual(50);
      setEstoqueMinimo(15);
      setMultiploVenda(1);
      setDescontoMaximoPct(15);
      setComissaoPct(3.5);
      setAliquotaIcmsPct(12);
      setPesoKg(1.0);
      setFotoUrl(PRESET_IMAGES[0].url);
      setDescricao('');
      setDestaquePromo(false);
      setStatus('ativo');
    }
  }, [productToEdit, isOpen, products.length]);

  if (!isOpen) return null;

  // Auto calculate prices when cost changes if desired
  const handleCostChange = (newCost: number) => {
    setPrecoCusto(newCost);
    if (!isEditing && newCost > 0) {
      setPrecoVarejo(parseFloat((newCost * 1.7).toFixed(2)));
      setPrecoAtacado(parseFloat((newCost * 1.45).toFixed(2)));
      setPrecoDistribuidor(parseFloat((newCost * 1.3).toFixed(2)));
    }
  };

  const getMargemLucro = (precoVenda: number) => {
    if (precoVenda <= 0 || precoCusto <= 0) return 0;
    return (((precoVenda - precoCusto) / precoVenda) * 100).toFixed(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      showToast('Campo Obrigatório', 'Informe o nome do produto.', 'error');
      return;
    }

    if (!codigoSku.trim()) {
      showToast('Campo Obrigatório', 'Informe o código SKU do produto.', 'error');
      return;
    }

    const payload = {
      codigoSku: codigoSku.trim(),
      codigoBarras: codigoBarras.trim() || `7891${Math.floor(100000000 + Math.random() * 900000000)}`,
      nome: nome.trim(),
      categoria: categoria.trim() || 'Geral',
      marca: marca.trim() || 'Própria',
      unidade,
      ncm: ncm.trim() || '0000.00.00',
      precoTabela: {
        varejo: Number(precoVarejo) || 0,
        atacado: Number(precoAtacado) || 0,
        distribuidor: Number(precoDistribuidor) || 0,
      },
      precoCusto: Number(precoCusto) || 0,
      estoqueAtual: Number(estoqueAtual) || 0,
      estoqueMinimo: Number(estoqueMinimo) || 0,
      multiploVenda: Number(multiploVenda) || 1,
      descontoMaximoPct: Number(descontoMaximoPct) || 0,
      comissaoPct: Number(comissaoPct) || 0,
      aliquotaIcmsPct: Number(aliquotaIcmsPct) || 0,
      pesoKg: Number(pesoKg) || 0,
      fotoUrl: fotoUrl.trim() || PRESET_IMAGES[0].url,
      descricao: descricao.trim(),
      destaquePromo,
      status,
    };

    if (isEditing && productToEdit) {
      updateProduct(productToEdit.id, payload);
      showToast('Produto Atualizado', `O produto ${payload.nome} foi atualizado com sucesso.`, 'success');
    } else {
      addProduct(payload);
      showToast('Produto Cadastrado', `O produto ${payload.nome} foi incluído no catálogo.`, 'success');
    }

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn overflow-y-auto">
        <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>{isEditing ? 'Editar Cadastro do Produto' : 'Cadastrar Novo Produto'}</span>
                  {status === 'ativo' ? (
                    <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">
                      Ativo
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded">
                      Inativo
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-400">
                  Gerenciamento de estoque, código de barras EAN, custos e tabelas de preço
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Section 1: Identificação & Código de Barras */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                <Tag className="w-3.5 h-3.5 text-blue-400" />
                <span>Identificação & Códigos</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Código de Barras EAN com Scanner */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Código de Barras (EAN-13 / GTIN)
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={codigoBarras}
                        onChange={(e) => setCodigoBarras(e.target.value)}
                        placeholder="Ex: 7891000100015"
                        className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl pl-9 pr-3 py-2.5 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsScannerOpen(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-bold border border-blue-500/40 transition-colors shadow-sm"
                      title="Abrir Câmera para Ler Código de Barras"
                    >
                      <Camera className="w-4 h-4" />
                      <span className="hidden sm:inline">Ler Câmera</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Permite bipar via câmera do celular ou leitor USB na emissão de pedidos
                  </span>
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Código SKU / Ref <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={codigoSku}
                    onChange={(e) => setCodigoSku(e.target.value)}
                    placeholder="Ex: ALM-8041"
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Status do Produto
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="ativo">Ativo no Catálogo</option>
                    <option value="inativo">Inativo / Descontinuado</option>
                  </select>
                </div>

                {/* Nome do Produto */}
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nome / Descrição do Produto <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Café Torrado e Moído Especial 500g (Pack c/ 10)"
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Unidade */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Unidade de Medida
                  </label>
                  <select
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="UN">UN - Unidade</option>
                    <option value="CX">CX - Caixa</option>
                    <option value="FD">FD - Fardo</option>
                    <option value="PCT">PCT - Pacote</option>
                    <option value="KG">KG - Quilograma</option>
                    <option value="LT">LT - Litro</option>
                  </select>
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Categoria
                  </label>
                  <input
                    type="text"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    placeholder="Ex: Alimentos, Bebidas..."
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Marca */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Marca / Fabricante
                  </label>
                  <input
                    type="text"
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    placeholder="Ex: Grão Nobre"
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* NCM */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    NCM (Fiscal)
                  </label>
                  <input
                    type="text"
                    value={ncm}
                    onChange={(e) => setNcm(e.target.value)}
                    placeholder="0000.00.00"
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Peso Kg */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Peso Unitário (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={pesoKg}
                    onChange={(e) => setPesoKg(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Formação de Preços & Margens */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Custos, Tabelas de Preço & Margem de Lucro</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Preço de Custo */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    Preço de Custo (R$)
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={precoCusto}
                    onChange={(e) => handleCostChange(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3 py-2 font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                  <span className="text-[10px] text-slate-500">Base para cálculo das margens</span>
                </div>

                {/* Preço Varejo */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300 uppercase">
                      Tabela 01 - Varejo
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
                      {getMargemLucro(precoVarejo)}% mrg
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={precoVarejo}
                    onChange={(e) => setPrecoVarejo(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 text-emerald-400 text-sm rounded-xl px-3 py-2 font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                  <span className="text-[10px] text-slate-400">Preço balcão / padrão</span>
                </div>

                {/* Preço Atacado */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300 uppercase">
                      Tabela 02 - Atacado
                    </span>
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-800">
                      {getMargemLucro(precoAtacado)}% mrg
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={precoAtacado}
                    onChange={(e) => setPrecoAtacado(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 text-blue-400 text-sm rounded-xl px-3 py-2 font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                  <span className="text-[10px] text-slate-400">Volume médio</span>
                </div>

                {/* Preço Distribuidor */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300 uppercase">
                      Tabela 03 - Distribuidor
                    </span>
                    <span className="text-[10px] font-bold text-purple-400 bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-800">
                      {getMargemLucro(precoDistribuidor)}% mrg
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={precoDistribuidor}
                    onChange={(e) => setPrecoDistribuidor(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 text-purple-400 text-sm rounded-xl px-3 py-2 font-mono font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    required
                  />
                  <span className="text-[10px] text-slate-400">Grandes redes / atacarejos</span>
                </div>
              </div>

              {/* Parâmetros Comerciais */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Desconto Máximo Vendedor (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={descontoMaximoPct}
                    onChange={(e) => setDescontoMaximoPct(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Comissão do Vendedor (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={comissaoPct}
                    onChange={(e) => setComissaoPct(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Alíquota ICMS Padrão (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={aliquotaIcmsPct}
                    onChange={(e) => setAliquotaIcmsPct(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Gestão de Estoque */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                <Boxes className="w-3.5 h-3.5 text-amber-400" />
                <span>Saldos de Estoque & Regras de Venda</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Saldo de Estoque Físico Atual
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={estoqueAtual}
                    onChange={(e) => setEstoqueAtual(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Estoque Mínimo de Alerta
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={estoqueMinimo}
                    onChange={(e) => setEstoqueMinimo(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Múltiplo de Venda (Embalagem)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={multiploVenda}
                    onChange={(e) => setMultiploVenda(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Foto do Produto & Descrição */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                <span>Foto & Detalhes Comerciais</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Image Preview & Presets */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300">
                    Foto do Produto
                  </label>
                  <div className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 relative">
                    <img
                      src={fotoUrl}
                      alt={nome || 'Produto'}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = PRESET_IMAGES[0].url;
                      }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {PRESET_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFotoUrl(preset.url)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                          fotoUrl === preset.url
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom URL & Description */}
                <div className="md:col-span-2 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      URL da Imagem Personalizada
                    </label>
                    <input
                      type="url"
                      value={fotoUrl}
                      onChange={(e) => setFotoUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Descrição Detalhada / Ficha Técnica
                    </label>
                    <textarea
                      rows={3}
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder="Informações adicionais do produto para os vendedores..."
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={destaquePromo}
                      onChange={(e) => setDestaquePromo(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-amber-400">
                      ⭐ Destacar Produto na vitrine e promoções do app mobile
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                id="btn-save-product-modal"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isEditing ? 'Salvar Alterações' : 'Cadastrar Produto'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(code) => {
          setCodigoBarras(code);
          showToast('Código de Barras Capturado', `Código EAN: ${code}`, 'success');
        }}
        title="Escanear Código de Barras do Produto"
        subtitle="Aponte a câmera para a embalagem para preencher o código EAN"
      />
    </>
  );
};
