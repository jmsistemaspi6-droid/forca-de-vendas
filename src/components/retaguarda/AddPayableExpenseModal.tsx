import React, { useState } from 'react';
import {
  ArrowUpRight,
  X,
  Building,
  Calendar,
  DollarSign,
  Barcode,
  Camera,
  Layers,
  FileText,
  Save,
  CheckCircle2,
  Receipt,
  QrCode,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';

interface AddPayableExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const EXPENSE_CATEGORIES = [
  { id: 'Aluguel & Infra', label: 'Aluguel & Condomínio de Galpões / Infra' },
  { id: 'Energia & Água', label: 'Energia Elétrica, Água & Saneamento' },
  { id: 'Folha de Pagamento & Comissões', label: 'Folha de Pagamento, Pró-Labore & Comissões' },
  { id: 'Impostos & Tributos', label: 'Impostos, DAS Simples, ICMS & Taxas' },
  { id: 'Manutenção & TI', label: 'Sistemas TI, Nuvem, Licenças & Manutenção' },
  { id: 'Combustível & Frotas', label: 'Combustível, Manutenção de Veículos & Frotas' },
  { id: 'Telecomunicações & Internet', label: 'Telefonia, Internet Fibra & Chips M2M' },
  { id: 'Fretes & Logística', label: 'Fretes Terceirizados & Carretos' },
  { id: 'Embalagens & Insumos', label: 'Embalagens, Fitas, Bobinas & Caixas' },
  { id: 'Outros', label: 'Outras Despesas Operacionais' },
];

export const AddPayableExpenseModal: React.FC<AddPayableExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addPayableTitle, showToast } = useSales();

  const [fornecedorNome, setFornecedorNome] = useState('');
  const [fornecedorCnpj, setFornecedorCnpj] = useState('');
  const [numeroDocumento, setNumeroDocumento] = useState(`DOC-${Math.floor(1000 + Math.random() * 9000)}`);
  const [descricao, setDescricao] = useState('');
  const [categoriaDespesa, setCategoriaDespesa] = useState<any>('Aluguel & Infra');
  const [valorTotal, setValorTotal] = useState<number>(0);
  const [dataEmissao, setDataEmissao] = useState(new Date().toISOString().split('T')[0]);
  const [dataPrimeiroVencimento, setDataPrimeiroVencimento] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );
  const [parcelasCount, setParcelasCount] = useState<number>(1);
  const [codigoBarras, setCodigoBarras] = useState('');
  const [chavePix, setChavePix] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const [isScannerOpen, setIsScannerOpen] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fornecedorNome.trim()) {
      showToast('Campo Obrigatório', 'Informe o favorecido / credor da despesa.', 'error');
      return;
    }

    if (valorTotal <= 0) {
      showToast('Valor Inválido', 'Informe um valor maior que zero.', 'error');
      return;
    }

    const valorPorParcela = valorTotal / parcelasCount;
    const baseDate = new Date(dataPrimeiroVencimento);

    for (let i = 1; i <= parcelasCount; i++) {
      const vencDate = new Date(baseDate);
      if (i > 1) {
        vencDate.setMonth(vencDate.getMonth() + (i - 1));
      }
      const vencStr = vencDate.toISOString().split('T')[0];

      const parcelaLabel = parcelasCount === 1 ? '1/1' : `${i}/${parcelasCount}`;
      const docLabel = parcelasCount === 1 ? numeroDocumento : `${numeroDocumento}-${i}`;

      const hoje = new Date().toISOString().split('T')[0];
      const isVencido = vencStr < hoje;

      addPayableTitle({
        fornecedorId: `cred-${Math.floor(1000 + Math.random() * 9000)}`,
        fornecedorNome: fornecedorNome.trim(),
        fornecedorCnpj: fornecedorCnpj.trim() || '00.000.000/0000-00',
        numeroDocumento: docLabel,
        parcela: parcelaLabel,
        descricao: descricao.trim() || `Despesa com ${categoriaDespesa} (${parcelaLabel})`,
        categoriaDespesa,
        valorOriginal: valorPorParcela,
        valorPago: 0,
        dataEmissao,
        dataVencimento: vencStr,
        status: isVencido ? 'vencido' : 'a_vencer',
        diasAtraso: isVencido
          ? Math.floor((new Date(hoje).getTime() - new Date(vencStr).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
        codigoBarras: codigoBarras.trim() || undefined,
        chavePix: chavePix.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
      });
    }

    showToast(
      'Despesa Lançada no Contas a Pagar',
      `Foram gerados ${parcelasCount} título(s) no valor total de R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
      'success'
    );

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn overflow-y-auto">
        <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>Lançamento Direto de Outras Despesas</span>
                  <span className="text-[10px] uppercase font-bold bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded">
                    Sem NF-e
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Cadastre contas de consumo, aluguéis, tributos, folha de pagamento e despesas avulsas
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Beneficiário & Categoria */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Favorecido / Credor / Fornecedor <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={fornecedorNome}
                    onChange={(e) => setFornecedorNome(e.target.value)}
                    placeholder="Ex: Enel Distribuição SP, Sabesp, Locadora Central, Posto Ipiranga..."
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl pl-9 pr-3 py-2.5 font-semibold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  CNPJ ou CPF do Credor (Opcional)
                </label>
                <input
                  type="text"
                  value={fornecedorCnpj}
                  onChange={(e) => setFornecedorCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Categoria da Despesa <span className="text-rose-400">*</span>
                </label>
                <select
                  value={categoriaDespesa}
                  onChange={(e) => setCategoriaDespesa(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Documento & Descrição */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nº Documento / Contrato / Fatura
                </label>
                <input
                  type="text"
                  value={numeroDocumento}
                  onChange={(e) => setNumeroDocumento(e.target.value)}
                  placeholder="Ex: FAT-2026/08"
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 font-mono font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Descrição do Lançamento
                </label>
                <input
                  type="text"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Conta de energia elétrica do galpão de distribuição - Mês 08/2026"
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Valores & Parcelamento */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-rose-300 mb-1">
                    Valor Total (R$) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={valorTotal || ''}
                      onChange={(e) => setValorTotal(parseFloat(e.target.value) || 0)}
                      placeholder="0,00"
                      className="w-full bg-slate-900 border border-slate-700 text-rose-400 text-base font-mono font-bold rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Data de Emissão
                  </label>
                  <input
                    type="date"
                    value={dataEmissao}
                    onChange={(e) => setDataEmissao(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-300 mb-1">
                    1º Vencimento <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={dataPrimeiroVencimento}
                    onChange={(e) => setDataPrimeiroVencimento(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Parcelamento */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-slate-300">
                    Número de Parcelas:
                  </label>
                  <select
                    value={parcelasCount}
                    onChange={(e) => setParcelasCount(parseInt(e.target.value, 10))}
                    className="bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-1.5 font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value={1}>1x (À vista / Parcela única)</option>
                    <option value={2}>2x Mensais</option>
                    <option value={3}>3x Mensais</option>
                    <option value={4}>4x Mensais</option>
                    <option value={5}>5x Mensais</option>
                    <option value={6}>6x Mensais</option>
                    <option value={12}>12x Anual</option>
                  </select>
                </div>

                {parcelasCount > 1 && valorTotal > 0 && (
                  <span className="text-xs text-slate-400">
                    <strong>{parcelasCount}x</strong> de{' '}
                    <strong className="text-rose-400 font-mono">
                      R$ {(valorTotal / parcelasCount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>{' '}
                    / mês
                  </span>
                )}
              </div>
            </div>

            {/* Código de Barras / Linha Digitável & PIX */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Código de Barras / Linha Digitável do Boleto ou Concessionária
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={codigoBarras}
                      onChange={(e) => setCodigoBarras(e.target.value)}
                      placeholder="Ex: 83640000001 23450004000 89123456789 0"
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl pl-9 pr-3 py-2.5 font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-bold border border-blue-500/40 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    <span className="hidden sm:inline">Escanear Boleto</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Chave PIX para Pagamento (Opcional)
                </label>
                <div className="relative">
                  <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={chavePix}
                    onChange={(e) => setChavePix(e.target.value)}
                    placeholder="Chave CNPJ, e-mail, telefone ou aleatória..."
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl pl-9 pr-3 py-2.5 font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Observações Internas
                </label>
                <textarea
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Informações adicionais para a equipe do financeiro..."
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl p-3 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
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
                id="btn-save-payable-expense"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Registrar Despesa</span>
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
          showToast('Código de Barras Capturado', `Linha digitável: ${code}`, 'success');
        }}
        title="Escanear Código de Barras do Boleto"
        subtitle="Aponte a câmera para o boleto bancário ou conta de consumo"
      />
    </>
  );
};
