import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Barcode,
  Camera,
  Boxes,
  DollarSign,
  Calendar,
  Building,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Save,
  X,
  Sparkles,
  PackageCheck,
  ShieldCheck,
  Percent,
  UserPlus,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { Product, StockEntryItem, StockEntryDuplicate, Supplier } from '../../types';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';
import { SupplierFormModal } from './SupplierFormModal';

interface ManualStockEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ManualItemRow {
  id: string;
  produtoId: string;
  isNovoProduto: boolean;
  codigoSku: string;
  codigoBarras: string;
  nome: string;
  categoria: string;
  unidade: 'UN' | 'CX' | 'KG' | 'PCT' | 'FD' | 'LT';
  ncm: string;
  quantidade: number;
  valorUnitario: number;
  valorIpi: number;
  valorIcmsSt: number;
  valorFreteRateio: number;
  valorDescontoItem: number;
}

export const ManualStockEntryModal: React.FC<ManualStockEntryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    products,
    suppliers,
    issuer,
    addManualStockEntry,
    addProduct,
    addSupplier,
    showToast,
  } = useSales();

  // Cabeçalho da Nota
  const [numeroNota, setNumeroNota] = useState(`${Math.floor(10000 + Math.random() * 90000)}`);
  const [serie, setSerie] = useState('1');
  const [chaveAcesso, setChaveAcesso] = useState('');
  const [naturezaOperacao, setNaturezaOperacao] = useState('COMPRA PARA COMERCIALIZAÇÃO (ENTRADA MANUAL)');
  const [dataEmissao, setDataEmissao] = useState(new Date().toISOString().split('T')[0]);
  const [dataEntrada, setDataEntrada] = useState(new Date().toISOString().split('T')[0]);

  // Fornecedor
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('novo');
  const [fornecedorRazao, setFornecedorRazao] = useState('');
  const [fornecedorCnpj, setFornecedorCnpj] = useState('');
  const [fornecedorUf, setFornecedorUf] = useState('SP');
  const [fornecedorMunicipio, setFornecedorMunicipio] = useState('São Paulo');
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState(false);

  // Destinatário (verificação com o emitente)
  const [destinatarioCnpj, setDestinatarioCnpj] = useState(issuer.cnpj);
  const [destinatarioRazao, setDestinatarioRazao] = useState(issuer.razaoSocial);

  // Adicionais e Totais
  const [valorFrete, setValorFrete] = useState<number>(0);
  const [valorSeguro, setValorSeguro] = useState<number>(0);
  const [valorDesconto, setValorDesconto] = useState<number>(0);
  const [valorOutrasDespesas, setValorOutrasDespesas] = useState<number>(0);

  // Itens
  const [itens, setItens] = useState<ManualItemRow[]>([
    {
      id: `item-${Date.now()}-1`,
      produtoId: products[0]?.id || '',
      isNovoProduto: false,
      codigoSku: products[0]?.codigoSku || 'SKU-001',
      codigoBarras: products[0]?.codigoBarras || '',
      nome: products[0]?.nome || '',
      categoria: products[0]?.categoria || 'Geral',
      unidade: products[0]?.unidade || 'UN',
      ncm: products[0]?.ncm || '2106.90.90',
      quantidade: 10,
      valorUnitario: products[0]?.precoCusto || 15.0,
      valorIpi: 0,
      valorIcmsSt: 0,
      valorFreteRateio: 0,
      valorDescontoItem: 0,
    },
  ]);

  // Faturamento & Contas a Pagar
  const [gerarContasPagar, setGerarContasPagar] = useState(true);
  const [condicaoPagamento, setCondicaoPagamento] = useState('30 DDL');
  const [numParcelas, setNumParcelas] = useState<number>(1);
  const [primeiroVencimento, setPrimeiroVencimento] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );

  // Opções de atualização
  const [atualizarEstoque, setAtualizarEstoque] = useState(true);

  // Barcode Scanner Modal State
  const [scannerTargetIndex, setScannerTargetIndex] = useState<number | null>(null);

  // Sync recipient with issuer if issuer changes
  useEffect(() => {
    if (issuer) {
      setDestinatarioCnpj(issuer.cnpj);
      setDestinatarioRazao(issuer.razaoSocial);
    }
  }, [issuer]);

  // Handle supplier change
  const handleSupplierSelect = (supId: string) => {
    setSelectedSupplierId(supId);
    if (supId === 'novo') {
      setFornecedorRazao('');
      setFornecedorCnpj('');
    } else {
      const sup = suppliers.find((s) => s.id === supId);
      if (sup) {
        setFornecedorRazao(sup.razaoSocial);
        setFornecedorCnpj(sup.cnpjCpf);
        setFornecedorUf(sup.endereco.uf);
        setFornecedorMunicipio(sup.endereco.cidade);
      }
    }
  };

  // Helper calculation of items
  const valorTotalProdutos = itens.reduce((sum, it) => sum + (it.quantidade * it.valorUnitario), 0);
  const valorTotalIpi = itens.reduce((sum, it) => sum + it.valorIpi, 0);
  const valorTotalIcmsSt = itens.reduce((sum, it) => sum + it.valorIcmsSt, 0);
  const valorTotalNota = Math.max(
    0,
    valorTotalProdutos + valorFrete + valorSeguro + valorOutrasDespesas + valorTotalIpi + valorTotalIcmsSt - valorDesconto
  );

  // Add Item Row
  const handleAddItem = () => {
    const defaultProd = products[0];
    setItens((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${prev.length + 1}`,
        produtoId: defaultProd?.id || '',
        isNovoProduto: false,
        codigoSku: defaultProd?.codigoSku || `SKU-${prev.length + 1}`,
        codigoBarras: defaultProd?.codigoBarras || '',
        nome: defaultProd?.nome || '',
        categoria: defaultProd?.categoria || 'Geral',
        unidade: defaultProd?.unidade || 'UN',
        ncm: defaultProd?.ncm || '2106.90.90',
        quantidade: 1,
        valorUnitario: defaultProd?.precoCusto || 10,
        valorIpi: 0,
        valorIcmsSt: 0,
        valorFreteRateio: 0,
        valorDescontoItem: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (itens.length === 1) {
      showToast('Atenção', 'A nota deve conter no mínimo 1 item.', 'warning');
      return;
    }
    setItens((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemProductSelect = (index: number, prodId: string) => {
    if (prodId === 'novo') {
      setItens((prev) =>
        prev.map((item, idx) => {
          if (idx !== index) return item;
          return {
            ...item,
            produtoId: 'novo',
            isNovoProduto: true,
            codigoSku: `PROD-${products.length + idx + 10}`,
            codigoBarras: `7891${Math.floor(100000000 + Math.random() * 900000000)}`,
            nome: '',
            categoria: 'Alimentos & Matinais',
            unidade: 'UN',
            ncm: '2106.90.90',
            valorUnitario: 10,
          };
        })
      );
    } else {
      const prod = products.find((p) => p.id === prodId);
      if (!prod) return;
      setItens((prev) =>
        prev.map((item, idx) => {
          if (idx !== index) return item;
          return {
            ...item,
            produtoId: prod.id,
            isNovoProduto: false,
            codigoSku: prod.codigoSku,
            codigoBarras: prod.codigoBarras,
            nome: prod.nome,
            categoria: prod.categoria,
            unidade: prod.unidade,
            ncm: prod.ncm || '2106.90.90',
            valorUnitario: prod.precoCusto,
          };
        })
      );
    }
  };

  const updateItemField = (index: number, field: keyof ManualItemRow, value: any) => {
    setItens((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return { ...item, [field]: value };
      })
    );
  };

  // Recipient CNPJ check
  const isDestinatarioValid =
    issuer.cnpj.replace(/\D/g, '') === destinatarioCnpj.replace(/\D/g, '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fornecedorRazao.trim()) {
      showToast('Campo Obrigatório', 'Informe a Razão Social do Fornecedor.', 'error');
      return;
    }

    if (itens.length === 0) {
      showToast('Itens Obrigatórios', 'Adicione pelo menos 1 produto na entrada.', 'error');
      return;
    }

    // Process new products if any
    const processedStockItems: StockEntryItem[] = itens.map((it, idx) => {
      let targetProductId = it.produtoId;

      if (it.isNovoProduto || it.produtoId === 'novo') {
        const newProd = addProduct({
          codigoSku: it.codigoSku,
          codigoBarras: it.codigoBarras || `7891${Math.floor(100000000 + Math.random() * 900000000)}`,
          nome: it.nome || `Novo Produto Recebido ${idx + 1}`,
          categoria: it.categoria || 'Geral',
          marca: fornecedorRazao.split(' ')[0] || 'Geral',
          unidade: it.unidade,
          ncm: it.ncm,
          precoCusto: it.valorUnitario,
          precoTabela: {
            varejo: parseFloat((it.valorUnitario * 1.65).toFixed(2)),
            atacado: parseFloat((it.valorUnitario * 1.4).toFixed(2)),
            distribuidor: parseFloat((it.valorUnitario * 1.25).toFixed(2)),
          },
          estoqueAtual: atualizarEstoque ? it.quantidade : 0,
          estoqueMinimo: 10,
          multiploVenda: 1,
          descontoMaximoPct: 15,
          comissaoPct: 3.5,
          aliquotaIcmsPct: 12,
          pesoKg: 1.0,
          fotoUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=600',
          descricao: `Produto cadastrado via Entrada Manual NF-e ${numeroNota}`,
          status: 'ativo',
        });
        targetProductId = newProd.id;
      }

      const totalBruto = it.quantidade * it.valorUnitario;
      const custoUnitario = it.quantidade > 0 ? (totalBruto + it.valorFreteRateio + it.valorIpi + it.valorIcmsSt - it.valorDescontoItem) / it.quantidade : it.valorUnitario;

      return {
        id: `entry-item-${Date.now()}-${idx + 1}`,
        codigoProdutoFornecedor: it.codigoSku,
        codigoBarrasEan: it.codigoBarras,
        descricaoFornecedor: it.nome,
        ncm: it.ncm,
        cfop: '1102',
        unidade: it.unidade,
        quantidade: it.quantidade,
        valorUnitario: it.valorUnitario,
        valorTotalBruto: totalBruto,
        valorIpi: it.valorIpi,
        valorIcmsSt: it.valorIcmsSt,
        valorFreteRateio: it.valorFreteRateio,
        valorDescontoItem: it.valorDescontoItem,
        custoUnitarioCalculado: parseFloat(custoUnitario.toFixed(2)),
        vinculadoProdutoId: targetProductId,
        produtoNomeEstoque: it.nome,
        isNovoProduto: it.isNovoProduto,
      };
    });

    // Auto-cadastrar Fornecedor na lista de fornecedores caso seja digitado manualmente
    const cleanSupCnpj = (fornecedorCnpj || '').replace(/\D/g, '');
    const cleanRazao = (fornecedorRazao || '').trim().toLowerCase();
    const existingSup = suppliers.find(
      (s) =>
        (cleanSupCnpj.length >= 11 && (s.cnpjCpf || '').replace(/\D/g, '') === cleanSupCnpj) ||
        (cleanRazao && String(s.razaoSocial || '').trim().toLowerCase() === cleanRazao)
    );

    if (!existingSup && fornecedorRazao.trim()) {
      addSupplier({
        razaoSocial: fornecedorRazao.trim(),
        nomeFantasia: fornecedorRazao.trim(),
        cnpjCpf: fornecedorCnpj.trim() || '00.000.000/0000-00',
        inscricaoEstadual: 'ISENTO',
        email: `financeiro@${String(fornecedorRazao || 'fornecedor').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || 'fornecedor'}.com.br`,
        telefone: '(11) 3000-0000',
        categoriaFornecedor: 'Alimentos & Bebidas',
        condicaoPagamentoPadrao: condicaoPagamento,
        status: 'ativo',
        endereco: {
          rua: 'Av. Principal',
          numero: 'S/N',
          bairro: 'Centro',
          cidade: fornecedorMunicipio || 'São Paulo',
          uf: fornecedorUf || 'SP',
          cep: '00000-000',
        },
      });
    }

    // Generate Duplicates / Payables data
    const duplicates: StockEntryDuplicate[] = [];
    const valorParcela = valorTotalNota / numParcelas;
    const baseDate = new Date(primeiroVencimento);

    for (let p = 1; p <= numParcelas; p++) {
      const vDate = new Date(baseDate);
      if (p > 1) {
        vDate.setMonth(vDate.getMonth() + (p - 1));
      }
      const vDateStr = vDate.toISOString().split('T')[0];
      const dupNum = numParcelas === 1 ? '001/01' : `00${p}/0${numParcelas}`;

      duplicates.push({
        numeroDuplicata: dupNum,
        dataVencimento: vDateStr,
        valorDuplicata: parseFloat(valorParcela.toFixed(2)),
      });
    }

    const generatedChave = chaveAcesso.trim() || `3526${Math.floor(10000000000000000000 + Math.random() * 90000000000000000000).toString().slice(0, 40)}`;

    addManualStockEntry({
      numeroNota: numeroNota.trim(),
      serie: serie.trim(),
      chaveAcesso: generatedChave,
      naturezaOperacao,
      dataEmissao,
      dataEntrada,
      fornecedor: {
        cnpj: fornecedorCnpj.trim() || '00.000.000/0000-00',
        razaoSocial: fornecedorRazao.trim(),
        uf: fornecedorUf,
        municipio: fornecedorMunicipio,
      },
      destinatario: {
        cnpj: destinatarioCnpj.trim(),
        razaoSocial: destinatarioRazao.trim(),
      },
      totais: {
        valorProdutos: valorTotalProdutos,
        valorFrete,
        valorSeguro,
        valorDesconto,
        valorIpi: valorTotalIpi,
        valorIcmsSt: valorTotalIcmsSt,
        valorOutrasDespesas,
        valorTotalNota,
      },
      itens: processedStockItems,
      duplicatas: duplicates,
      status: 'processada',
      criadoPor: 'Entrada Manual Sem XML',
    });

    showToast(
      'Entrada de Mercadoria Registrada',
      `Nota ${numeroNota} registrada com sucesso. Estoque atualizado e ${duplicates.length} título(s) gerados no Contas a Pagar.`,
      'success'
    );

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn overflow-y-auto">
        <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>Entrada Manual de Mercadorias</span>
                  <span className="text-[10px] uppercase font-bold bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded">
                    Sem XML
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Lançamento de compras, atualização de estoque e integração direta com o Contas a Pagar
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
            {/* Destinatário Validation Badge */}
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                isDestinatarioValid
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isDestinatarioValid ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                )}
                <div>
                  <span className="font-bold block">
                    {isDestinatarioValid
                      ? 'Destinatário Validado com a Empresa Emitente'
                      : 'Atenção: CNPJ Destinatário Difere da Empresa Emitente'}
                  </span>
                  <span className="text-[11px] opacity-90 block mt-0.5">
                    Entrada direcionada para: <strong>{destinatarioRazao}</strong> (CNPJ: {destinatarioCnpj})
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-900 border border-slate-800 shrink-0">
                Emitente: {issuer.cnpj}
              </span>
            </div>

            {/* Section 1: Dados da Nota Fiscal & Fornecedor */}
            <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-4 sm:p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                <Building className="w-3.5 h-3.5 text-blue-400" />
                <span>Dados da Nota & Fornecedor</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Fornecedor Selector */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-300">
                      Selecionar Fornecedor Cadastrado
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsNewSupplierModalOpen(true)}
                      className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Cadastrar Fornecedor</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedSupplierId}
                      onChange={(e) => handleSupplierSelect(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="novo">+ Digitar Fornecedor Manualmente</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.razaoSocial} ({s.cnpjCpf})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsNewSupplierModalOpen(true)}
                      className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 hover:text-emerald-300 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
                      title="Abrir formulário com consulta de CNPJ"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span className="hidden sm:inline">Novo</span>
                    </button>
                  </div>
                </div>

                {/* Razão Social Fornecedor */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Razão Social do Fornecedor <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={fornecedorRazao}
                    onChange={(e) => setFornecedorRazao(e.target.value)}
                    placeholder="Ex: GRÃOS & MATINAIS DISTRIBUIDORA LTDA"
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                {/* CNPJ Fornecedor */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    CNPJ / CPF do Fornecedor
                  </label>
                  <input
                    type="text"
                    value={fornecedorCnpj}
                    onChange={(e) => setFornecedorCnpj(e.target.value)}
                    placeholder="00.000.000/0000-00"
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Número da Nota */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Número da NF-e / Documento <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={numeroNota}
                    onChange={(e) => setNumeroNota(e.target.value)}
                    placeholder="Ex: 54920"
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Série */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Série
                  </label>
                  <input
                    type="text"
                    value={serie}
                    onChange={(e) => setSerie(e.target.value)}
                    placeholder="1"
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Data Emissão */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Data de Emissão
                  </label>
                  <input
                    type="date"
                    value={dataEmissao}
                    onChange={(e) => setDataEmissao(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Data Entrada */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Data de Entrada no Estoque
                  </label>
                  <input
                    type="date"
                    value={dataEntrada}
                    onChange={(e) => setDataEntrada(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Natureza da Operação */}
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Natureza da Operação
                  </label>
                  <input
                    type="text"
                    value={naturezaOperacao}
                    onChange={(e) => setNaturezaOperacao(e.target.value)}
                    placeholder="Ex: COMPRA PARA COMERCIALIZAÇÃO"
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Itens Recebidos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Boxes className="w-3.5 h-3.5 text-amber-400" />
                  <span>Itens da Nota de Entrada ({itens.length})</span>
                </h3>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-bold border border-emerald-500/40 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Adicionar Produto</span>
                </button>
              </div>

              <div className="space-y-3">
                {itens.map((item, index) => {
                  const subtotal = item.quantidade * item.valorUnitario;
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800/60 pb-2.5">
                        <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span>Produto / Item</span>
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-emerald-400">
                            Subtotal: R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 transition-colors"
                            title="Remover Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
                        {/* Produto Selector */}
                        <div className="sm:col-span-2 md:col-span-3">
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">
                            Selecionar do Catálogo ou Criar Novo
                          </label>
                          <select
                            value={item.isNovoProduto ? 'novo' : item.produtoId}
                            onChange={(e) => handleItemProductSelect(index, e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-xl px-2.5 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          >
                            <option value="novo">+ Cadastrar Novo Produto na Entrada</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.nome} ({p.codigoSku} - EAN: {p.codigoBarras || 'S/N'})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Nome do Produto se novo */}
                        {item.isNovoProduto && (
                          <div className="sm:col-span-2 md:col-span-3">
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">
                              Descrição do Novo Produto
                            </label>
                            <input
                              type="text"
                              value={item.nome}
                              onChange={(e) => updateItemField(index, 'nome', e.target.value)}
                              placeholder="Nome do produto..."
                              className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-xl px-2.5 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                              required
                            />
                          </div>
                        )}

                        {/* Código de Barras EAN com Scanner */}
                        <div className="sm:col-span-2 md:col-span-3">
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">
                            Código de Barras (EAN-13)
                          </label>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={item.codigoBarras}
                              onChange={(e) => updateItemField(index, 'codigoBarras', e.target.value)}
                              placeholder="789..."
                              className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-xl px-2.5 py-2 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setScannerTargetIndex(index)}
                              className="p-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40"
                              title="Escanear Código de Barras com a Câmera"
                            >
                              <Camera className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Quantidade */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">
                            Quantidade
                          </label>
                          <input
                            type="number"
                            step="1"
                            min="1"
                            value={item.quantidade}
                            onChange={(e) =>
                              updateItemField(index, 'quantidade', parseInt(e.target.value, 10) || 1)
                            }
                            className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-xl px-2.5 py-2 font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            required
                          />
                        </div>

                        {/* Unidade */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">
                            Unidade
                          </label>
                          <select
                            value={item.unidade}
                            onChange={(e) => updateItemField(index, 'unidade', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-xl px-2 py-2 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          >
                            <option value="UN">UN</option>
                            <option value="CX">CX</option>
                            <option value="FD">FD</option>
                            <option value="PCT">PCT</option>
                            <option value="KG">KG</option>
                            <option value="LT">LT</option>
                          </select>
                        </div>

                        {/* Preço Unitário de Compra */}
                        <div>
                          <label className="block text-[11px] font-bold text-emerald-400 mb-1">
                            Valor Unit. (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={item.valorUnitario}
                            onChange={(e) =>
                              updateItemField(index, 'valorUnitario', parseFloat(e.target.value) || 0)
                            }
                            className="w-full bg-slate-900 border border-slate-700 text-emerald-400 text-xs rounded-xl px-2.5 py-2 font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            required
                          />
                        </div>

                        {/* NCM */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">
                            NCM
                          </label>
                          <input
                            type="text"
                            value={item.ncm}
                            onChange={(e) => updateItemField(index, 'ncm', e.target.value)}
                            placeholder="0000.00.00"
                            className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-xl px-2 py-2 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Adicionais & Totais */}
            <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-4 sm:p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Frete, Descontos & Totalização</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Valor Frete (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valorFrete || ''}
                    onChange={(e) => setValorFrete(parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Seguro & Outras Desp. (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valorOutrasDespesas || ''}
                    onChange={(e) => setValorOutrasDespesas(parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-rose-400 mb-1">
                    Desconto Total (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valorDesconto || ''}
                    onChange={(e) => setValorDesconto(parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                    className="w-full bg-slate-900 border border-slate-700 text-rose-400 text-xs rounded-xl px-3 py-2 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Total da Nota */}
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 flex flex-col justify-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Valor Total da Nota
                  </span>
                  <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
                    R$ {valorTotalNota.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Faturamento & Contas a Pagar */}
            <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gerarContasPagar}
                    onChange={(e) => setGerarContasPagar(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-xs font-bold text-slate-100 flex items-center gap-2">
                    <PackageCheck className="w-4 h-4 text-rose-400" />
                    <span>Gerar Faturamento da Nota Direto para o Contas a Pagar</span>
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={atualizarEstoque}
                    onChange={(e) => setAtualizarEstoque(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span className="text-xs font-bold text-emerald-400">
                    Atualizar Estoque Físico & Custos
                  </span>
                </label>
              </div>

              {gerarContasPagar && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Condição de Pagamento
                    </label>
                    <select
                      value={condicaoPagamento}
                      onChange={(e) => {
                        setCondicaoPagamento(e.target.value);
                        if (e.target.value === 'À Vista') setNumParcelas(1);
                        if (e.target.value === '30 DDL') setNumParcelas(1);
                        if (e.target.value === '30/60 DDL') setNumParcelas(2);
                        if (e.target.value === '30/60/90 DDL') setNumParcelas(3);
                      }}
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="À Vista">À Vista (PIX / TED)</option>
                      <option value="30 DDL">30 DDL (1x)</option>
                      <option value="30/60 DDL">30 / 60 DDL (2x)</option>
                      <option value="30/60/90 DDL">30 / 60 / 90 DDL (3x)</option>
                      <option value="Personalizado">Personalizado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Número de Parcelas
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={numParcelas}
                      onChange={(e) => setNumParcelas(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-300 mb-1">
                      1º Vencimento
                    </label>
                    <input
                      type="date"
                      value={primeiroVencimento}
                      onChange={(e) => setPrimeiroVencimento(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
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
                id="btn-save-manual-stock-entry"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Entrada & Faturar</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Barcode Scanner Modal for row items */}
      <BarcodeScannerModal
        isOpen={scannerTargetIndex !== null}
        onClose={() => setScannerTargetIndex(null)}
        onScanSuccess={(scannedCode) => {
          if (scannerTargetIndex !== null) {
            updateItemField(scannerTargetIndex, 'codigoBarras', scannedCode);
            showToast('Código de Barras Capturado', `EAN ${scannedCode} associado ao item.`, 'success');
          }
        }}
        title="Escanear Código de Barras do Item"
        subtitle="Aponte a câmera para a embalagem do produto recebido"
      />

      {/* Cadastro Rápido de Fornecedor Modal */}
      <SupplierFormModal
        isOpen={isNewSupplierModalOpen}
        onClose={() => setIsNewSupplierModalOpen(false)}
        onSaved={(createdSupplier: Supplier) => {
          setSelectedSupplierId(createdSupplier.id);
          setFornecedorRazao(createdSupplier.razaoSocial);
          setFornecedorCnpj(createdSupplier.cnpjCpf);
          setFornecedorUf(createdSupplier.endereco.uf);
          setFornecedorMunicipio(createdSupplier.endereco.cidade);
          setIsNewSupplierModalOpen(false);
          showToast('Fornecedor Selecionado', `${createdSupplier.razaoSocial} foi preenchido na entrada.`, 'success');
        }}
      />
    </>
  );
};
