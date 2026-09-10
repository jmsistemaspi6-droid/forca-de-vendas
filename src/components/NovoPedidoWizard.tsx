import React, { useState, useRef, useEffect } from 'react';
import { useSales } from '../context/SalesContext';
import { Product, Client, Order, OrderParcela } from '../types';
import { PAYMENT_CONDITIONS, PRICE_TABLE_LABELS } from '../data/mockData';
import confetti from 'canvas-confetti';
import {
  Search,
  Building2,
  Phone,
  MapPin,
  DollarSign,
  Plus,
  Minus,
  Trash2,
  X,
  CreditCard,
  Truck,
  Check,
  CheckCircle2,
  FileText,
  UserPlus,
  Camera,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Barcode,
  Sparkles,
  ShoppingBag,
  RotateCcw,
  Package,
  ChevronDown,
  ChevronUp,
  Calendar,
} from 'lucide-react';
import { NewClientModal } from './NewClientModal';
import { BarcodeScannerModal } from './common/BarcodeScannerModal';
import { VoiceSearchButton } from './common/VoiceSearchButton';
import { OrderPrintModal } from './OrderPrintModal';

const DRAFT_STORAGE_KEY = 'jm_sistemas_pedido_wizard_draft_v1';

export const NovoPedidoWizard: React.FC = () => {
  const {
    draftOrder,
    setDraftOrder,
    clients,
    products,
    addItemToDraft,
    removeItemFromDraft,
    updateDraftItemQty,
    submitDraftOrder,
    resetDraftOrder,
    showToast,
    setActiveTab,
  } = useSales();

  // Etapa atual (1 a 6)
  const [etapaAtual, setEtapaAtual] = useState<number>(1);

  // Modais auxiliares
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Etapa 1: Busca de clientes
  const [clientSearch, setClientSearch] = useState('');

  // Etapa 2: Busca e seleção de produtos
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [modalQuantity, setModalQuantity] = useState<number>(1.0);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Etapa 3: Faturamento, Parcelas & Desconto
  const [descontoPercentual, setDescontoPercentual] = useState<number>(0);
  const [descontoReais, setDescontoReais] = useState<number>(0);
  const [parcelas, setParcelas] = useState<OrderParcela[]>([]);
  const [parcelasCustomizadas, setParcelasCustomizadas] = useState<boolean>(false);

  // Etapa 5: Assinatura
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [semAssinatura, setSemAssinatura] = useState(false);
  const [comprovanteFoto, setComprovanteFoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Etapa 6: Pedido Concluído & Modal de Impressão
  const [pedidoSalvo, setPedidoSalvo] = useState<Order | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Carregar rascunho persistente do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.etapa === 'number') {
          // Não avança para etapa 6 ao recarregar
          setEtapaAtual(Math.min(parsed.etapa, 5));
        }
      }
    } catch (e) {
      console.warn('Erro ao restaurar rascunho do wizard:', e);
    }
  }, []);

  // Salvar rascunho no localStorage a cada etapa ou alteração do draft
  useEffect(() => {
    try {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          etapa: etapaAtual,
          draftOrder,
          descontoPercentual,
          descontoReais,
          semAssinatura,
        })
      );
    } catch (e) {
      console.warn('Erro ao salvar rascunho no localStorage:', e);
    }
  }, [etapaAtual, draftOrder, descontoPercentual, descontoReais, semAssinatura]);

  // Sincronizar dados do cliente selecionado no draft
  const clienteSelecionado = draftOrder.cliente;

  // Lista de categorias de produtos
  const categories = ['all', ...Array.from(new Set(products.map((p) => p.categoria)))];

  // Filtro de Clientes
  const filteredClients = clients.filter((c) => {
    const sTerm = (clientSearch || '').toLowerCase();
    const razao = String(c.razaoSocial || '').toLowerCase();
    const fantasia = String(c.nomeFantasia || '').toLowerCase();
    const doc = String(c.cnpjCpf || '');
    const cod = String((c as any).codigo || c.id).toLowerCase();
    const cidade = String(c.endereco?.cidade || '').toLowerCase();

    return (
      !sTerm ||
      razao.includes(sTerm) ||
      fantasia.includes(sTerm) ||
      doc.includes(clientSearch) ||
      cod.includes(sTerm) ||
      cidade.includes(sTerm)
    );
  });

  // Filtro de Produtos
  const filteredProducts = products.filter((p) => {
    const sTerm = (productSearch || '').toLowerCase();
    const nome = String(p.nome || '').toLowerCase();
    const sku = String(p.codigoSku || (p as any).codigo || '').toLowerCase();
    const marca = String(p.marca || '').toLowerCase();
    const barcode = String(p.codigoBarras || '');

    const matchesCat = selectedCategory === 'all' || p.categoria === selectedCategory;
    const matchesSearch =
      !sTerm ||
      nome.includes(sTerm) ||
      sku.includes(sTerm) ||
      marca.includes(sTerm) ||
      barcode.includes(productSearch);

    return matchesCat && matchesSearch;
  });

  // Cálculos financeiros
  const tableKey = draftOrder.tabelaPreco || 'atacado';
  const subtotalBruto = draftOrder.itens.reduce((sum, it) => sum + it.precoUnitarioTabela * it.quantidade, 0);
  const totalItensSubtotal = draftOrder.itens.reduce((sum, it) => sum + it.subtotal, 0);
  
  // Total de descontos aplicados nos itens ou geral
  const totalDescontosItens = Math.max(0, subtotalBruto - totalItensSubtotal);
  const totalDescontoAplicado = totalDescontosItens + descontoReais;
  const valorFrete = draftOrder.valorFrete || 0;
  const valorTotalFinal = Math.max(0, totalItensSubtotal - descontoReais + valorFrete);

  // Gerador padrão de parcelas a partir da condição comercial selecionada
  const calcularParcelasPadrao = (
    condicao: string,
    valorTotal: number,
    formaPagamento: string
  ): OrderParcela[] => {
    const cond = String(condicao || '').toLowerCase();
    let diasArray: number[] = [];

    if (cond.includes('28/35/42')) {
      diasArray = [28, 35, 42];
    } else if (cond.includes('14/21/28')) {
      diasArray = [14, 21, 28];
    } else if (cond.includes('30/60/90')) {
      diasArray = [30, 60, 90];
    } else if (cond.includes('30/60')) {
      diasArray = [30, 60];
    } else if (cond.includes('3x')) {
      diasArray = [30, 60, 90];
    } else if (cond.includes('07') || cond.includes('7 ddl')) {
      diasArray = [7];
    } else if (cond.includes('14 ddl') || cond.includes('14')) {
      diasArray = [14];
    } else if (cond.includes('21 ddl') || cond.includes('21')) {
      diasArray = [21];
    } else if (cond.includes('28 ddl') || cond.includes('28')) {
      diasArray = [28];
    } else if (cond.includes('vista') || cond.includes('pix') || cond.includes('dinheiro')) {
      diasArray = [0];
    } else {
      const partes = cond
        .split(/[/,-]/)
        .map((p) => parseInt(p.replace(/\D/g, ''), 10))
        .filter((n) => !isNaN(n) && n > 0);
      if (partes.length > 0) {
        diasArray = partes;
      } else {
        diasArray = [30];
      }
    }

    const qtd = Math.max(1, diasArray.length);
    const baseValue = Math.floor((valorTotal / qtd) * 100) / 100;

    return diasArray.map((dias, idx) => {
      const d = new Date();
      d.setDate(d.getDate() + dias);
      const isLast = idx === qtd - 1;
      const valor = isLast
        ? Number((valorTotal - baseValue * (qtd - 1)).toFixed(2))
        : baseValue;
      return {
        numero: idx + 1,
        dataVencimento: d.toISOString().split('T')[0],
        valor: Math.max(0, valor),
        formaPagamento: formaPagamento,
      };
    });
  };

  // Sincronização automática das parcelas ao carregar faturamento ou mudar condição/total
  useEffect(() => {
    if (etapaAtual === 3) {
      if (!parcelasCustomizadas || parcelas.length === 0) {
        const defaultParcelas = calcularParcelasPadrao(
          draftOrder.condicaoPagamento,
          valorTotalFinal,
          draftOrder.formaPagamento
        );
        setParcelas(defaultParcelas);
      }
    }
  }, [etapaAtual, draftOrder.condicaoPagamento, valorTotalFinal]);

  // Manipulação de parcelas pelo usuário
  const handleEditarParcelaData = (index: number, novaData: string) => {
    setParcelasCustomizadas(true);
    setParcelas((prev) =>
      prev.map((p, i) => (i === index ? { ...p, dataVencimento: novaData } : p))
    );
  };

  const handleEditarParcelaValor = (index: number, novoValor: number) => {
    setParcelasCustomizadas(true);
    setParcelas((prev) =>
      prev.map((p, i) => (i === index ? { ...p, valor: Number(novoValor) } : p))
    );
  };

  const handleAdicionarParcela = () => {
    setParcelasCustomizadas(true);
    setParcelas((prev) => {
      const proximoNum = prev.length + 1;
      let novaData = new Date();
      if (prev.length > 0) {
        const ult = new Date(prev[prev.length - 1].dataVencimento + 'T12:00:00');
        ult.setDate(ult.getDate() + 30);
        novaData = ult;
      } else {
        novaData.setDate(novaData.getDate() + 30);
      }
      return [
        ...prev,
        {
          numero: proximoNum,
          dataVencimento: novaData.toISOString().split('T')[0],
          valor: 0,
          formaPagamento: draftOrder.formaPagamento,
        },
      ];
    });
  };

  const handleRemoverParcela = (index: number) => {
    if (parcelas.length <= 1) return;
    setParcelasCustomizadas(true);
    setParcelas((prev) =>
      prev.filter((_, i) => i !== index).map((p, i) => ({ ...p, numero: i + 1 }))
    );
  };

  const handleDistribuirIgualmente = () => {
    const qtd = Math.max(1, parcelas.length);
    const baseVal = Math.floor((valorTotalFinal / qtd) * 100) / 100;
    setParcelas((prev) =>
      prev.map((p, idx) => {
        const isLast = idx === qtd - 1;
        const val = isLast ? Number((valorTotalFinal - baseVal * (qtd - 1)).toFixed(2)) : baseVal;
        return { ...p, valor: Math.max(0, val) };
      })
    );
    setParcelasCustomizadas(true);
    showToast('Parcelas Distribuídas', 'Valor total dividido igualmente entre as parcelas.', 'info');
  };

  const handleAjustarDiferencaUltima = () => {
    if (parcelas.length === 0) return;
    const somaExcetoUltima = parcelas.slice(0, -1).reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
    const novoValorUltima = Number(Math.max(0, valorTotalFinal - somaExcetoUltima).toFixed(2));
    setParcelas((prev) =>
      prev.map((p, idx) => (idx === prev.length - 1 ? { ...p, valor: novoValorUltima } : p))
    );
    setParcelasCustomizadas(true);
    showToast('Ajustado na Última Parcela', `A última parcela foi ajustada para R$ ${novoValorUltima.toFixed(2)}.`, 'success');
  };

  // Total das parcelas e validação de igualdade
  const somaParcelas = Number(parcelas.reduce((acc, p) => acc + (Number(p.valor) || 0), 0).toFixed(2));
  const diferencaFaturamento = Number((somaParcelas - valorTotalFinal).toFixed(2));
  const faturamentoValido = Math.abs(diferencaFaturamento) <= 0.01 && parcelas.length > 0;

  // Abertura do Bottom Sheet de Quantidade
  const handleOpenQuantitySheet = (product: Product) => {
    // Procura se o produto já existe no carrinho para pré-carregar quantidade
    const itemExistente = draftOrder.itens.find((it) => it.produtoId === product.id);
    setSelectedProductForModal(product);
    setModalQuantity(itemExistente ? itemExistente.quantidade : 1.0);
  };

  // Adição/Atualização de Item no Carrinho
  const handleConfirmarItem = () => {
    if (!selectedProductForModal) return;
    const qtd = Number(parseFloat(String(modalQuantity)).toFixed(3));
    if (qtd <= 0) {
      showToast('Quantidade Inválida', 'Informe uma quantidade maior que zero.', 'error');
      return;
    }

    if (selectedProductForModal.estoqueAtual > 0 && qtd > selectedProductForModal.estoqueAtual) {
      showToast(
        'Estoque Insuficiente',
        `A quantidade (${qtd.toFixed(3)}) ultrapassa o estoque atual (${selectedProductForModal.estoqueAtual.toFixed(3)}).`,
        'warning'
      );
    }

    const itemExistente = draftOrder.itens.find((it) => it.produtoId === selectedProductForModal.id);
    if (itemExistente) {
      updateDraftItemQty(itemExistente.id, qtd);
    } else {
      addItemToDraft(selectedProductForModal, qtd);
    }

    // Fechar sheet sem exibir sub-tela de toast na parte inferior
    setSelectedProductForModal(null);
  };

  // Canvas de Assinatura
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e293b';
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Upload de Foto de Comprovante
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setComprovanteFoto(reader.result as string);
        showToast('Foto Anexada', 'Comprovante/pedido fotográfico anexado com sucesso.', 'info');
      };
      reader.readAsDataURL(file);
    }
  };

  // Salvar e Concluir Pedido (Etapa 5 -> Etapa 6)
  const handleFecharPedido = () => {
    if (!clienteSelecionado) {
      showToast('Atenção', 'Selecione um cliente para fechar o pedido.', 'error');
      setEtapaAtual(1);
      return;
    }
    if (draftOrder.itens.length === 0) {
      showToast('Carrinho Vazio', 'Adicione pelo menos 1 item ao pedido.', 'error');
      setEtapaAtual(2);
      return;
    }

    // Validação de segurança final das parcelas do faturamento
    if (parcelas.length > 0) {
      if (!faturamentoValido) {
        showToast(
          'Faturamento Não Confere',
          `A soma das parcelas (R$ ${somaParcelas.toFixed(2)}) deve ser exatamente igual ao total do pedido (R$ ${valorTotalFinal.toFixed(2)}). Ajuste as parcelas na etapa 3.`,
          'error'
        );
        setEtapaAtual(3);
        return;
      }
      draftOrder.parcelas = parcelas;
    }

    let signatureDataUrl: string | undefined = undefined;
    if (canvasRef.current && hasSignature && !semAssinatura) {
      signatureDataUrl = canvasRef.current.toDataURL('image/png');
    }

    const order = submitDraftOrder(false, signatureDataUrl, clienteSelecionado.contatoPrincipal || '');
    if (order) {
      setPedidoSalvo(order);
      setEtapaAtual(6);
      setIsPrintModalOpen(true);
      localStorage.removeItem(DRAFT_STORAGE_KEY);

      // Efeito de celebração
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#10b981', '#f59e0b', '#3b82f6'],
        });
      } catch (e) {
        // Confetti fallback
      }
    }
  };

  // Reiniciar Wizard para Novo Pedido
  const handleIniciarNovoPedido = () => {
    resetDraftOrder();
    setPedidoSalvo(null);
    setIsPrintModalOpen(false);
    setEtapaAtual(1);
    setClientSearch('');
    setProductSearch('');
    setDescontoPercentual(0);
    setDescontoReais(0);
    setSemAssinatura(false);
    setComprovanteFoto(null);
    clearSignature();
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24 text-slate-900 animate-in fade-in overflow-x-hidden">
      {/* ========================================================= */}
      {/* 1. TOPO FIXO COM STEPPER (1 a 6) */}
      {/* ========================================================= */}
      <div className="sticky top-0 z-20 bg-white shadow-sm border-b border-slate-200">
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 max-w-4xl mx-auto w-full">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                onClick={() => {
                  // Permitir voltar para etapas anteriores já preenchidas
                  if (n < etapaAtual) setEtapaAtual(n);
                }}
                disabled={n > etapaAtual}
                className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all shadow-sm shrink-0 ${
                  etapaAtual === n
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100 scale-105'
                    : etapaAtual > n
                    ? 'bg-emerald-500 text-white cursor-pointer hover:bg-emerald-600'
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                }`}
              >
                {etapaAtual > n ? '✓' : n}
              </button>
              {n < 6 && (
                <div
                  className={`flex-1 min-w-1 sm:min-w-3 max-w-8 sm:max-w-10 h-0.5 mx-1 transition-colors ${
                    etapaAtual > n ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Subtítulo da Etapa */}
        <div className="px-3 sm:px-6 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between max-w-4xl mx-auto w-full gap-2">
          <p className="text-[11px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider truncate">
            {etapaAtual === 1 && '1. Identificação do Cliente'}
            {etapaAtual === 2 && '2. Seleção dos Itens'}
            {etapaAtual === 3 && '3. Faturamento & Condições'}
            {etapaAtual === 4 && '4. Resumo Geral do Pedido'}
            {etapaAtual === 5 && '5. Assinatura & Fechamento'}
            {etapaAtual === 6 && '6. Conclusão & Impressão'}
          </p>

          <div className="flex items-center gap-2 shrink-0">
            {draftOrder.itens.length > 0 && etapaAtual !== 6 && (
              <div className="text-[11px] sm:text-xs font-extrabold text-blue-700 bg-blue-50 px-2 sm:px-2.5 py-0.5 rounded-full border border-blue-200 shrink-0">
                {draftOrder.itens.length} {draftOrder.itens.length === 1 ? 'item' : 'itens'} • R$ {valorTotalFinal.toFixed(2)}
              </div>
            )}

            {etapaAtual !== 6 && (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg px-2.5 py-1 transition-colors cursor-pointer shrink-0"
                title="Cancelar pedido e começar outro"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden sm:inline">Cancelar Pedido</span>
                <span className="sm:hidden">Cancelar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo Central do Wizard */}
      <div className="max-w-4xl w-full mx-auto p-3 sm:p-6 flex-1 flex flex-col">
        {/* ========================================================= */}
        {/* ETAPA 1: IDENTIFICAÇÃO DO CLIENTE */}
        {/* ========================================================= */}
        {etapaAtual === 1 && (
          <div className="space-y-5 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por Nome, Fantasia, CNPJ ou Cidade..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                />
                {clientSearch && (
                  <button
                    onClick={() => setClientSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowAddClientModal(true)}
                className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
              >
                <UserPlus className="w-4 h-4 text-blue-400" />
                <span>Novo Cliente</span>
              </button>
            </div>

            {/* Card do Cliente Selecionado */}
            {clienteSelecionado ? (
              <div className="p-5 rounded-2xl bg-white border-2 border-blue-600 shadow-md space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black flex items-center justify-center text-lg shadow-md shadow-blue-600/30">
                      {clienteSelecionado.nomeFantasia?.substring(0, 2).toUpperCase() || 'CL'}
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Cliente Selecionado ✓
                      </span>
                      <h3 className="font-extrabold text-base text-slate-900 mt-1">
                        {clienteSelecionado.nomeFantasia}
                      </h3>
                      <p className="text-xs text-slate-500">{clienteSelecionado.razaoSocial}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDraftOrder((prev) => ({ ...prev, cliente: null }))}
                    className="text-xs text-red-600 hover:text-red-700 font-bold underline cursor-pointer"
                  >
                    Trocar Cliente
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 font-semibold block text-[10px]">CNPJ / CPF</span>
                    <span className="font-bold text-slate-800">{clienteSelecionado.cnpjCpf}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 font-semibold block text-[10px]">Limite de Crédito</span>
                    <span className="font-bold text-emerald-700">
                      R$ {clienteSelecionado.limiteCredito?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 font-semibold block text-[10px]">Última Compra</span>
                    <span className="font-bold text-slate-800">
                      {clienteSelecionado.dataUltimaCompra || 'Sem compras registradas'}
                    </span>
                  </div>
                </div>

                {clienteSelecionado.endereco && (
                  <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      {clienteSelecionado.endereco.rua}, {clienteSelecionado.endereco.numero} -{' '}
                      {clienteSelecionado.endereco.bairro}, {clienteSelecionado.endereco.cidade}/
                      {clienteSelecionado.endereco.uf}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* Lista de Clientes para Seleção */
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Selecione um cliente da lista ({filteredClients.length}):
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-1">
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      onClick={() => {
                        setDraftOrder((prev) => ({
                          ...prev,
                          cliente: client,
                          condicaoPagamento: client.condicaoPagamentoPadrao || prev.condicaoPagamento,
                          tabelaPreco: (client.tabelaPrecoPadrao as any) || prev.tabelaPreco,
                        }));
                        showToast('Cliente Selecionado', `${client.nomeFantasia} vinculado ao pedido.`, 'info');
                      }}
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all flex items-start justify-between gap-3 group"
                    >
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                          {client.nomeFantasia}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-1">{client.razaoSocial}</p>
                        <p className="text-[11px] font-mono text-slate-400">{client.cnpjCpf}</p>
                        <p className="text-[11px] text-slate-500">
                          {client.endereco?.cidade}/{client.endereco?.uf} • Limite:{' '}
                          <strong className="text-emerald-600">
                            R$ {client.limiteCredito?.toLocaleString('pt-BR')}
                          </strong>
                        </p>
                      </div>
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-xl bg-slate-100 group-hover:bg-blue-600 text-slate-600 group-hover:text-white font-bold text-xs transition-colors shrink-0"
                      >
                        Selecionar
                      </button>
                    </div>
                  ))}
                  {filteredClients.length === 0 && (
                    <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                      <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-600">Nenhum cliente encontrado</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Tente outro termo ou cadastre um novo cliente rápido.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Botão de Avanço Etapa 1 -> 2 */}
            <div className="pt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-3 rounded-2xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Cancelar pedido e começar outro"
              >
                <RotateCcw className="w-4 h-4 text-rose-500" />
                <span>Cancelar Pedido</span>
              </button>

              <button
                type="button"
                disabled={!clienteSelecionado}
                onClick={() => setEtapaAtual(2)}
                className={`px-8 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                  clienteSelecionado
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 cursor-pointer active:scale-95'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Próximo: Itens do Pedido</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ETAPA 2: SELEÇÃO DOS ITENS (A MAIS IMPORTANTE) */}
        {/* ========================================================= */}
        {etapaAtual === 2 && (
          <div className="space-y-4 animate-in fade-in">
            {/* Barra de Busca e Scanner */}
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por código ou descrição do produto..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                  />
                  {productSearch && (
                    <button
                      onClick={() => setProductSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer shrink-0"
                  title="Scanner de Código de Barras"
                >
                  <Barcode className="w-4 h-4 text-blue-400" />
                </button>
              </div>

              {/* Categorias */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg font-bold text-xs whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'all' ? 'Todos os Produtos' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid / Lista de Produtos para Adicionar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Catálogo de Produtos ({filteredProducts.length}):
                </span>
                <span className="text-[11px] text-slate-400">
                  Toque para definir quantidade
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[50vh] sm:max-h-[56vh] overflow-y-auto pr-1">
                {filteredProducts.map((prod) => {
                  const preco = prod.precoTabela?.[tableKey] || prod.precoTabela?.atacado || 0;
                  const itemNoCarrinho = draftOrder.itens.find((it) => it.produtoId === prod.id);

                  return (
                    <div
                      key={prod.id}
                      onClick={() => handleOpenQuantitySheet(prod)}
                      className={`p-3 rounded-xl bg-white border transition-all cursor-pointer flex flex-col justify-between group ${
                        itemNoCarrinho
                          ? 'border-blue-500 ring-2 ring-blue-100 shadow-sm'
                          : 'border-slate-200 hover:border-blue-400 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <img
                          src={prod.fotoUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&q=80'}
                          alt={prod.nome}
                          className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-mono font-bold text-slate-400 block">
                            COD: {prod.codigoSku}
                          </span>
                          <h4 className="font-bold text-xs text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
                            {prod.nome}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                            <span>Estoque:</span>
                            <strong className={prod.estoqueAtual > 0 ? 'text-emerald-700' : 'text-rose-600'}>
                              {prod.estoqueAtual.toFixed(3)} {prod.unidade}
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-semibold block">Preço Unitário</span>
                          <p className="font-extrabold text-sm text-blue-700">
                            R$ {preco.toFixed(2)}
                          </p>
                        </div>

                        {itemNoCarrinho ? (
                          <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-extrabold text-[11px] border border-blue-200 flex items-center gap-1">
                            <Check className="w-3 h-3 text-blue-600" />
                            <span>{itemNoCarrinho.quantidade.toFixed(3)} {prod.unidade}</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenQuantitySheet(prod);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1 font-bold text-xs shadow-sm transition-transform active:scale-95 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Incluir</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lista dos Itens Adicionados ao Pedido com Edição e Exclusão */}
            {draftOrder.itens.length > 0 && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() => setShowCartDrawer(!showCartDrawer)}
                >
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-blue-600" />
                    <span>Itens no Pedido ({draftOrder.itens.length})</span>
                    {showCartDrawer ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </h4>
                  <span className="font-black text-xs sm:text-sm text-slate-900">
                    Total: R$ {totalItensSubtotal.toFixed(2)}
                  </span>
                </div>

                {/* Itens visíveis (ou retráteis para economizar tela) */}
                <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
                  {draftOrder.itens.map((item) => (
                    <div key={item.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 line-clamp-1">{item.produto.nome}</p>
                        <p className="text-slate-500 text-[11px]">
                          {item.quantidade.toFixed(3)} {item.produto.unidade} x R$ {item.precoUnitarioCobrado.toFixed(2)} ={' '}
                          <strong className="text-blue-700">R$ {item.subtotal.toFixed(2)}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenQuantitySheet(item.produto)}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] cursor-pointer"
                        >
                          Ajustar
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItemFromDraft(item.id)}
                          className="p-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                          title="Remover Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Barra Flutuante de Resumo e Avanço Rápido (Mobile & Desktop) */}
            {draftOrder.itens.length > 0 && (
              <div className="sticky bottom-0 z-30 p-3 bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg rounded-2xl flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Parcial</span>
                  <p className="font-black text-xs sm:text-sm text-slate-900 truncate">
                    {draftOrder.itens.length} {draftOrder.itens.length === 1 ? 'item' : 'itens'} •{' '}
                    <span className="text-blue-700 font-black">R$ {totalItensSubtotal.toFixed(2)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    title="Cancelar pedido e começar outro"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Cancelar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEtapaAtual(3)}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                  >
                    <span>Faturamento</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Navegação Padrão Etapa 2 */}
            <div className="pt-2 flex items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEtapaAtual(1)}
                  className="px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar ao Cliente</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Cancelar pedido e começar outro"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                  <span className="hidden sm:inline">Cancelar Pedido</span>
                </button>
              </div>

              <button
                type="button"
                disabled={draftOrder.itens.length === 0}
                onClick={() => setEtapaAtual(3)}
                className={`px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all ${
                  draftOrder.itens.length > 0
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 cursor-pointer active:scale-95'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Próximo: Faturamento</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ETAPA 3: FATURAMENTO & CONDIÇÕES */}
        {/* ========================================================= */}
        {etapaAtual === 3 && (
          <div className="space-y-5 animate-in fade-in">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Condições Comerciais & Pagamento</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Condição de Pagamento */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Condição de Pagamento</label>
                  <select
                    value={draftOrder.condicaoPagamento}
                    onChange={(e) => {
                      const novaCond = e.target.value;
                      setDraftOrder((prev) => ({ ...prev, condicaoPagamento: novaCond }));
                      const novas = calcularParcelasPadrao(novaCond, valorTotalFinal, draftOrder.formaPagamento);
                      setParcelas(novas);
                      setParcelasCustomizadas(false);
                    }}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {PAYMENT_CONDITIONS.map((cond) => (
                      <option key={cond} value={cond}>
                        {cond}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Forma de Pagamento */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Forma de Pagamento</label>
                  <select
                    value={draftOrder.formaPagamento}
                    onChange={(e) => {
                      const novaForma = e.target.value;
                      setDraftOrder((prev) => ({ ...prev, formaPagamento: novaForma as any }));
                      setParcelas((prev) => prev.map((p) => ({ ...p, formaPagamento: novaForma })));
                    }}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Boleto Bancário">Boleto Bancário</option>
                    <option value="PIX">PIX</option>
                    <option value="Cartão Crédito">Cartão de Crédito</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Transferência Bancária">Transferência Bancária</option>
                  </select>
                </div>

                {/* Tabela de Preço */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Tabela de Preço Aplicada</label>
                  <select
                    value={draftOrder.tabelaPreco}
                    onChange={(e) =>
                      setDraftOrder((prev) => ({ ...prev, tabelaPreco: e.target.value as any }))
                    }
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="atacado">Atacado (Padrão)</option>
                    <option value="varejo">Varejo (+15%)</option>
                    <option value="distribuidor">Distribuidor (-8%)</option>
                  </select>
                </div>

                {/* Tipo de Frete */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Tipo de Frete</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDraftOrder((prev) => ({ ...prev, tipoFrete: 'CIF', valorFrete: 0 }))}
                      className={`p-2.5 rounded-xl font-bold border transition-colors ${
                        draftOrder.tipoFrete === 'CIF'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      CIF (Por conta do Emitente)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraftOrder((prev) => ({ ...prev, tipoFrete: 'FOB' }))}
                      className={`p-2.5 rounded-xl font-bold border transition-colors ${
                        draftOrder.tipoFrete === 'FOB'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      FOB (Destinatário)
                    </button>
                  </div>
                </div>

                {/* Desconto Geral */}
                <div className="space-y-1.5 sm:col-span-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="font-bold text-slate-800 block">Desconto Geral no Pedido</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">Desconto em %</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={descontoPercentual}
                        onChange={(e) => {
                          const pct = parseFloat(e.target.value) || 0;
                          setDescontoPercentual(pct);
                          setDescontoReais(Number(((totalItensSubtotal * pct) / 100).toFixed(2)));
                        }}
                        className="w-full p-2.5 rounded-lg bg-white border border-slate-300 font-bold focus:ring-2 focus:ring-blue-500 outline-none text-right"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">Desconto em R$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={descontoReais}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value) || 0;
                          setDescontoReais(v);
                          setDescontoPercentual(
                            totalItensSubtotal > 0 ? Number(((v / totalItensSubtotal) * 100).toFixed(2)) : 0
                          );
                        }}
                        className="w-full p-2.5 rounded-lg bg-white border border-slate-300 font-bold focus:ring-2 focus:ring-blue-500 outline-none text-right text-emerald-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Observações */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-bold text-slate-700 block">Observações do Pedido / NF</label>
                  <textarea
                    rows={2}
                    placeholder="Instruções de entrega, horários ou observações da nota fiscal..."
                    value={draftOrder.observacoesInternas || ''}
                    onChange={(e) =>
                      setDraftOrder((prev) => ({
                        ...prev,
                        observacoesInternas: e.target.value,
                        observacoesNotaFiscal: e.target.value,
                      }))
                    }
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* QUADRO DE PARCELAS GERADAS DO FATURAMENTO & VENCIMENTOS */}
            {/* ========================================================= */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900">
                      Parcelas Geradas do Faturamento
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {parcelas.length} {parcelas.length === 1 ? 'parcela' : 'parcelas'} geradas • Edite os valores e datas de vencimento se necessário
                    </p>
                  </div>
                </div>

                {/* Botões de Ação de Parcelamento */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleAdicionarParcela}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1 border border-blue-200 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Parcela</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDistribuirIgualmente}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 border border-slate-200 transition-colors cursor-pointer"
                    title="Dividir igualmente o total do pedido entre todas as parcelas"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Dividir Igualmente</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAjustarDiferencaUltima}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 border border-slate-200 transition-colors cursor-pointer"
                    title="Ajustar qualquer diferença de centavos na última parcela"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
                    <span>Ajustar Última</span>
                  </button>
                </div>
              </div>

              {/* Lista de Parcelas com Inputs de Valor e Data */}
              <div className="space-y-2.5">
                {parcelas.map((parcela, index) => {
                  const vencDate = new Date(parcela.dataVencimento + 'T12:00:00');
                  const hoje = new Date();
                  hoje.setHours(12, 0, 0, 0);
                  const diffDias = Math.round((vencDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

                  return (
                    <div
                      key={parcela.numero}
                      className="p-3 sm:p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-blue-300 transition-all space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:gap-3"
                    >
                      {/* Número da Parcela e Botão Remover (Mobile) */}
                      <div className="flex items-center justify-between sm:justify-start gap-2 sm:w-28 shrink-0">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-black text-xs shadow-sm">
                          {parcela.numero}ª Parcela
                        </span>
                        <span className="text-[11px] font-bold text-slate-400 sm:hidden">
                          de {parcelas.length}
                        </span>
                        {parcelas.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoverParcela(index)}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-100 sm:hidden"
                            title="Remover esta parcela"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Data de Vencimento */}
                      <div className="flex-1 min-w-[150px]">
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                          Vencimento
                          <span className="ml-1 text-[10px] font-normal text-blue-600">
                            ({diffDias === 0 ? 'Hoje' : diffDias > 0 ? `Em ${diffDias} dias` : `${Math.abs(diffDias)} dias atrás`})
                          </span>
                        </label>
                        <input
                          type="date"
                          value={parcela.dataVencimento}
                          onChange={(e) => handleEditarParcelaData(index, e.target.value)}
                          className="w-full p-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      {/* Valor da Parcela */}
                      <div className="flex-1 min-w-[140px]">
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                          Valor da Parcela (R$)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                            R$
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={parcela.valor}
                            onChange={(e) => handleEditarParcelaValor(index, parseFloat(e.target.value) || 0)}
                            className="w-full pl-8 pr-2.5 py-2 rounded-lg bg-white border border-slate-300 text-xs font-black text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>

                      {/* Botão Remover (Desktop) */}
                      {parcelas.length > 1 && (
                        <div className="hidden sm:block shrink-0 pt-4">
                          <button
                            type="button"
                            onClick={() => handleRemoverParcela(index)}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remover parcela"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ========================================================= */}
              {/* VALIDAÇÃO DE IGUALDADE DO FATURAMENTO */}
              {/* ========================================================= */}
              <div
                className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                  faturamentoValido
                    ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                    : 'bg-amber-50/90 border-amber-300 text-amber-950'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    {faturamentoValido ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h5 className="font-black text-xs sm:text-sm">
                        {faturamentoValido
                          ? 'Faturamento Validado com Sucesso'
                          : 'Atenção: O Faturamento Não Confere com o Pedido'}
                      </h5>
                      <p className="text-xs mt-0.5">
                        {faturamentoValido ? (
                          <span>
                            A soma das parcelas (<strong>R$ {somaParcelas.toFixed(2)}</strong>) confere exatamente com o valor total do pedido.
                          </span>
                        ) : (
                          <span>
                            Soma das parcelas: <strong>R$ {somaParcelas.toFixed(2)}</strong> | Total do pedido: <strong>R$ {valorTotalFinal.toFixed(2)}</strong>.
                            <span className="block font-bold text-amber-800 mt-0.5">
                              Diferença: R$ {Math.abs(diferencaFaturamento).toFixed(2)} ({diferencaFaturamento > 0 ? 'a mais que o total' : 'a menos que o total'})
                            </span>
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {!faturamentoValido && (
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={handleAjustarDiferencaUltima}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow transition-colors cursor-pointer"
                      >
                        Corrigir na Parcela {parcelas.length}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Totalizadores Automáticos */}
            <div className="p-4 rounded-2xl bg-blue-900 text-white shadow-md flex items-center justify-between">
              <div>
                <span className="text-[11px] text-blue-200 block uppercase font-bold">Total Líquido Calculado</span>
                <span className="text-xl font-black">R$ {valorTotalFinal.toFixed(2)}</span>
              </div>
              <div className="text-right text-xs text-blue-200">
                <p>Soma Parcelas: R$ {somaParcelas.toFixed(2)}</p>
                <p>Desconto: R$ {totalDescontoAplicado.toFixed(2)}</p>
              </div>
            </div>

            {/* Navegação Etapa 3 */}
            <div className="pt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEtapaAtual(2)}
                  className="px-4 sm:px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar aos Itens</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="px-3 sm:px-4 py-3.5 rounded-2xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Cancelar pedido e começar outro"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                  <span className="hidden sm:inline">Cancelar Pedido</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!faturamentoValido) {
                    showToast(
                      'Faturamento Inválido',
                      `A soma das parcelas (R$ ${somaParcelas.toFixed(2)}) deve ser exatamente igual ao total do pedido (R$ ${valorTotalFinal.toFixed(2)}).`,
                      'error'
                    );
                    return;
                  }
                  setDraftOrder((prev) => ({ ...prev, parcelas }));
                  setEtapaAtual(4);
                }}
                className={`px-6 sm:px-8 py-3.5 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg transition-all ${
                  faturamentoValido
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 cursor-pointer active:scale-95'
                    : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30 cursor-pointer'
                }`}
                title={!faturamentoValido ? 'A soma das parcelas deve ser igual ao total do pedido' : 'Avançar para o Resumo'}
              >
                <span>Próximo: Resumo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ETAPA 4: RESUMO DO PEDIDO */}
        {/* ========================================================= */}
        {etapaAtual === 4 && (
          <div className="space-y-5 animate-in fade-in">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 text-xs">
              {/* Header do Resumo */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-sm text-slate-900">Resumo da Proposta de Venda</h3>
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  {draftOrder.itens.length} {draftOrder.itens.length === 1 ? 'Produto' : 'Produtos'}
                </span>
              </div>

              {/* Dados do Cliente */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Cliente Comprador</span>
                <p className="font-black text-sm text-slate-900">{clienteSelecionado?.nomeFantasia}</p>
                <p className="text-slate-500">
                  {clienteSelecionado?.razaoSocial} • CNPJ: {clienteSelecionado?.cnpjCpf}
                </p>
                <p className="text-slate-500">
                  Condição: <strong>{draftOrder.condicaoPagamento}</strong> ({draftOrder.formaPagamento})
                </p>
              </div>

              {/* Tabela de Itens */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 block">Itens do Pedido (Quantidade com 3 Decimais):</span>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {draftOrder.itens.map((it) => (
                    <div key={it.id} className="p-3 bg-white flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 line-clamp-1">{it.produto.nome}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          COD: {it.produto.codigoSku} • {it.quantidade.toFixed(3)} {it.produto.unidade} x R${' '}
                          {it.precoUnitarioCobrado.toFixed(2)}
                        </p>
                      </div>
                      <span className="font-black text-blue-700 text-sm shrink-0">
                        R$ {it.subtotal.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quadro de Valores Totais */}
              <div className="p-4 rounded-xl bg-slate-900 text-slate-100 space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Total Bruto:</span>
                  <span>R$ {subtotalBruto.toFixed(2)}</span>
                </div>
                {totalDescontoAplicado > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Descontos Totais:</span>
                    <span>- R$ {totalDescontoAplicado.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
                  <span>TOTAL LÍQUIDO A FATURAR:</span>
                  <span className="text-emerald-400">R$ {valorTotalFinal.toFixed(2)}</span>
                </div>
              </div>

              {/* Quadro de Parcelas do Faturamento */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 block">
                    Parcelas do Faturamento ({parcelas.length}x):
                  </span>
                  <button
                    type="button"
                    onClick={() => setEtapaAtual(3)}
                    className="text-blue-600 hover:text-blue-700 font-bold text-[11px] underline cursor-pointer"
                  >
                    Alterar Parcelas / Vencimentos
                  </button>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {parcelas.map((p) => {
                    const dParts = p.dataVencimento.split('-');
                    const dataFormatada =
                      dParts.length === 3 ? `${dParts[2]}/${dParts[1]}/${dParts[0]}` : p.dataVencimento;
                    return (
                      <div key={p.numero} className="p-2.5 bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center">
                            {p.numero}ª
                          </span>
                          <div>
                            <p className="font-bold text-slate-800 text-xs">Vencimento: {dataFormatada}</p>
                            <p className="text-[10px] text-slate-500">
                              {p.formaPagamento || draftOrder.formaPagamento}
                            </p>
                          </div>
                        </div>
                        <span className="font-black text-slate-900 text-xs">
                          R$ {p.valor.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Navegação Etapa 4 */}
            <div className="pt-4 flex items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEtapaAtual(3)}
                  className="px-3 sm:px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Voltar para ajustar condições e parcelas do faturamento"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Faturamento</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEtapaAtual(2)}
                  className="hidden sm:flex px-3 sm:px-4 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-600 font-bold text-xs border border-slate-200 transition-all items-center gap-1.5 cursor-pointer"
                  title="Voltar para a seleção de itens"
                >
                  <span>Editar Itens</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="px-3 sm:px-4 py-3.5 rounded-2xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Cancelar pedido e começar outro"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                  <span className="hidden sm:inline">Cancelar Pedido</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setEtapaAtual(5)}
                className="px-6 sm:px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer active:scale-95"
              >
                <span>Avançar para Assinatura</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ETAPA 5: ASSINATURA E FECHAMENTO */}
        {/* ========================================================= */}
        {etapaAtual === 5 && (
          <div className="space-y-5 animate-in fade-in">
            <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-5">
              <div>
                <p className="font-extrabold text-base text-slate-900 mb-1">
                  Assinatura do Cliente / Comprovante
                </p>
                <p className="text-xs text-slate-500">
                  Colete a assinatura digital na tela ou marque se a venda foi realizada por telefone.
                </p>
              </div>

              {/* Canvas de Assinatura */}
              {!semAssinatura ? (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-slate-300 rounded-2xl h-48 bg-slate-50 relative overflow-hidden flex flex-col justify-center items-center">
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={192}
                      className="w-full h-full touch-none cursor-crosshair"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                    {!hasSignature && (
                      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400">
                        <span className="text-xs font-semibold">Assine com o dedo ou caneta aqui</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Limpar Assinatura
                    </button>

                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={semAssinatura}
                        onChange={(e) => setSemAssinatura(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                      />
                      <span>Cliente não presente / Venda por telefone</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Venda marcada como: Sem Assinatura (Venda por Telefone/WhatsApp)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSemAssinatura(false)}
                    className="text-xs text-blue-600 font-bold underline"
                  >
                    Ativar Assinatura
                  </button>
                </div>
              )}

              {/* Anexo de Foto / Comprovante Opcional */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600">
                    <Camera className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-800">Foto do Pedido / Comprovante (Opcional)</p>
                    <p className="text-[11px] text-slate-500">
                      {comprovanteFoto ? 'Comprovante fotográfico anexado ✓' : 'Tirar foto do canhoto ou pedido físico'}
                    </p>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoCapture}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300 transition-colors cursor-pointer"
                >
                  {comprovanteFoto ? 'Trocar Foto' : 'Capturar Foto'}
                </button>
              </div>

              {/* Botão Gigante Verde de Fechamento */}
              <button
                type="button"
                onClick={handleFecharPedido}
                className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-base sm:text-lg shadow-xl shadow-emerald-600/30 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-6 h-6" />
                <span>FECHAR PEDIDO - R$ {valorTotalFinal.toFixed(2)}</span>
              </button>
            </div>

            {/* Voltar e Cancelar */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setEtapaAtual(4)}
                className="px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar ao Resumo</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-3 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Cancelar pedido e começar outro"
              >
                <RotateCcw className="w-4 h-4 text-rose-500" />
                <span>Cancelar Pedido</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ETAPA 6: IMPRESSÃO & CONCLUSÃO */}
        {/* ========================================================= */}
        {etapaAtual === 6 && pedidoSalvo && (
          <div className="space-y-5 animate-in fade-in text-center py-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Pedido {pedidoSalvo.numeroPedido} Concluído!
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              Venda gravada com sucesso para <strong>{pedidoSalvo.cliente?.nomeFantasia}</strong> no valor de{' '}
              <strong className="text-emerald-600">R$ {pedidoSalvo.valorTotalLiquido.toFixed(2)}</strong>.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Abrir Opções de Impressão (Meia Folha / PDF)</span>
              </button>

              <button
                type="button"
                onClick={handleIniciarNovoPedido}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Fechar e Fazer Novo Pedido</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* BOTTOM SHEET DE QUANTIDADE OTIMIZADO PARA CELULAR */}
      {/* ========================================================= */}
      {selectedProductForModal && (() => {
        const precoUnitario =
          selectedProductForModal.precoTabela?.[tableKey] ||
          selectedProductForModal.precoTabela?.atacado ||
          0;
        const subtotalCalculado = Number((modalQuantity * precoUnitario).toFixed(2));
        const itemExistente = draftOrder.itens.find(
          (it) => it.produtoId === selectedProductForModal.id
        );
        const unidade = selectedProductForModal.unidade || 'UN';
        const isFracionado =
          ['KG', 'M', 'LT', 'L', 'METRO'].includes(unidade.toUpperCase()) ||
          (selectedProductForModal.multiploVenda && selectedProductForModal.multiploVenda < 1);
        const step = isFracionado ? 0.5 : 1;

        return (
          <div
            className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-in fade-in"
            onClick={() => setSelectedProductForModal(null)}
          >
            <div
              className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Barra de Arraste / Indicador Mobile */}
              <div className="pt-2 pb-0.5 sm:hidden flex justify-center shrink-0">
                <div className="w-9 h-1 bg-slate-300 rounded-full" />
              </div>

              {/* Cabeçalho Compacto do Produto */}
              <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-slate-100 flex items-center justify-between gap-2.5 shrink-0 bg-slate-50/90">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={selectedProductForModal.fotoUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&q=80'}
                    alt={selectedProductForModal.nome}
                    className="w-10 h-10 rounded-lg object-cover bg-slate-200 border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {selectedProductForModal.codigoSku}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-slate-200/80 text-slate-700">
                        Estoque: {selectedProductForModal.estoqueAtual.toFixed(3)} {unidade}
                      </span>
                    </div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight truncate max-w-[200px] sm:max-w-xs">
                      {selectedProductForModal.nome}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedProductForModal(null)}
                  className="p-1.5 rounded-lg bg-slate-200/70 hover:bg-slate-200 text-slate-600 cursor-pointer shrink-0 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Corpo Compacto e Ergonômico */}
              <div className="p-3.5 sm:p-4 space-y-3 overflow-y-auto flex-1 text-xs">
                {/* Preço Unitário & Subtotal lado a lado */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Preço Unitário ({unidade})
                    </span>
                    <p className="font-bold text-xs sm:text-sm text-slate-800">
                      R$ {precoUnitario.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-blue-600 block">
                      Subtotal Calculado
                    </span>
                    <p className="font-black text-sm sm:text-base text-blue-700">
                      R$ {subtotalCalculado.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Controle de Quantidade */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-0.5">
                    <label className="text-xs font-bold text-slate-700">
                      Quantidade ({unidade}):
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {isFracionado ? 'Fracionado (3 decimais)' : 'Unidades inteiras'}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setModalQuantity((q) => Math.max(0.001, Number((q - step).toFixed(3))))
                      }
                      className="w-11 h-11 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl text-lg font-black text-slate-800 transition-all flex items-center justify-center cursor-pointer select-none shrink-0 border border-slate-200"
                      title={`Diminuir ${step}`}
                    >
                      <Minus className="w-5 h-5" />
                    </button>

                    <input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      min="0.001"
                      value={modalQuantity || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setModalQuantity(isNaN(val) ? 0 : val);
                      }}
                      className="w-28 sm:w-32 h-11 text-center text-lg font-black border-2 border-blue-600 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setModalQuantity((q) => Number((q + step).toFixed(3)))
                      }
                      className="w-11 h-11 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl text-lg font-black transition-all flex items-center justify-center cursor-pointer select-none shrink-0"
                      title={`Aumentar ${step}`}
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Atalhos Rápidos de Quantidade */}
                <div className="flex items-center justify-center gap-1.5 flex-wrap pt-0.5">
                  {(isFracionado ? [0.5, 1, 2, 5, 10] : [1, 2, 5, 10, 20]).map((incremento) => (
                    <button
                      key={incremento}
                      type="button"
                      onClick={() =>
                        setModalQuantity((q) => Number((q + incremento).toFixed(3)))
                      }
                      className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-colors cursor-pointer active:scale-95"
                    >
                      +{incremento}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setModalQuantity(1)}
                    className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    1 un
                  </button>
                </div>

                {/* Alerta de Estoque */}
                {selectedProductForModal.estoqueAtual > 0 &&
                  modalQuantity > selectedProductForModal.estoqueAtual && (
                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-1.5 text-amber-800 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span>
                        Quantidade superior ao estoque ({selectedProductForModal.estoqueAtual.toFixed(3)} {unidade}).
                      </span>
                    </div>
                  )}
              </div>

              {/* Rodapé Fixo com Botão de Confirmação */}
              <div className="p-3 sm:p-4 bg-white border-t border-slate-100 shrink-0 pb-4">
                <button
                  type="button"
                  onClick={handleConfirmarItem}
                  className="w-full h-11 sm:h-12 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {itemExistente ? 'Atualizar Item' : 'Confirmar e Adicionar'} • R$ {subtotalCalculado.toFixed(2)}
                  </span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de Confirmação para Cancelar Pedido e Começar Outro */}
      {showCancelModal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowCancelModal(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4 border border-slate-200 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                  Cancelar Pedido e Começar Outro?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tem certeza que deseja descartar o pedido em andamento? Todos os itens adicionados e dados preenchidos serão cancelados para você iniciar um novo pedido do zero.
                </p>
              </div>
            </div>

            {/* Resumo do que será descartado */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between items-center">
                <span>Cliente:</span>
                <strong className="text-slate-800 truncate max-w-[200px]">
                  {clienteSelecionado ? clienteSelecionado.nomeFantasia : 'Nenhum cliente'}
                </strong>
              </div>
              <div className="flex justify-between items-center">
                <span>Itens Adicionados:</span>
                <strong className="text-slate-800">
                  {draftOrder.itens.length} {draftOrder.itens.length === 1 ? 'item' : 'itens'}
                </strong>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                <span>Valor Total:</span>
                <strong className="text-blue-700 font-black">
                  R$ {valorTotalFinal.toFixed(2)}
                </strong>
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer order-2 sm:order-1"
              >
                Continuar Pedido Atual
              </button>
              <button
                type="button"
                onClick={() => {
                  handleIniciarNovoPedido();
                  setShowCancelModal(false);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-rose-600/25 order-1 sm:order-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Sim, Cancelar e Novo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro Rápido de Cliente */}
      {showAddClientModal && (
        <NewClientModal
          isOpen={showAddClientModal}
          onClose={() => setShowAddClientModal(false)}
          onClientCreated={(newCl) => {
            setDraftOrder((prev) => ({ ...prev, cliente: newCl }));
            setShowAddClientModal(false);
          }}
        />
      )}

      {/* Scanner Modal */}
      {isScannerOpen && (
        <BarcodeScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScan={(code) => {
            setProductSearch(code);
            setIsScannerOpen(false);
          }}
        />
      )}

      {/* Modal Pós-Venda / Impressão Meia Folha Carbonada */}
      {pedidoSalvo && (
        <OrderPrintModal
          order={pedidoSalvo}
          isOpen={isPrintModalOpen}
          isPostSale={true}
          onClose={() => setIsPrintModalOpen(false)}
          onNewOrder={handleIniciarNovoPedido}
        />
      )}
    </div>
  );
};
