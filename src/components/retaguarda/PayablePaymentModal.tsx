import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Calendar,
  Building,
  CreditCard,
  CheckCircle2,
  X,
  AlertCircle,
  FileText,
  Clock,
  ArrowUpRight,
  TrendingDown,
  Percent,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { PayableTitle, SettlementType } from '../../types';

interface PayablePaymentModalProps {
  title: PayableTitle | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PayablePaymentModal: React.FC<PayablePaymentModalProps> = ({
  title,
  isOpen,
  onClose,
}) => {
  const { settlePayableTitle } = useSales();

  const [settlementType, setSettlementType] = useState<SettlementType>('total');
  const [valorPago, setValorPago] = useState<number>(0);
  const [juros, setJuros] = useState<number>(0);
  const [desconto, setDesconto] = useState<number>(0);
  const [formaPagamento, setFormaPagamento] = useState<string>('PIX');
  const [contaBancaria, setContaBancaria] = useState<string>('Banco Itaú - Conta Corrente');
  const [comprovante, setComprovante] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize values when title opens
  useEffect(() => {
    if (title) {
      const saldo = title.saldoRestante ?? title.valorOriginal;
      setValorPago(saldo);
      setSettlementType('total');
      setJuros(0);
      setDesconto(0);
      setComprovante('');
      setObservacoes('');
      setErrorMsg(null);
    }
  }, [title]);

  if (!isOpen || !title) return null;

  const saldoAtual = title.saldoRestante ?? title.valorOriginal;
  const valorEfetivo = Math.max(0, valorPago + juros - desconto);
  const novoSaldoDevedor = settlementType === 'total' ? 0 : Math.max(0, saldoAtual - valorPago);

  const handleTypeChange = (type: SettlementType) => {
    setSettlementType(type);
    if (type === 'total') {
      setValorPago(saldoAtual);
    } else {
      setValorPago(Number((saldoAtual / 2).toFixed(2)));
    }
  };

  const handleConfirmPayment = () => {
    setErrorMsg(null);

    if (valorPago <= 0) {
      setErrorMsg('O valor a pagar deve ser maior que zero.');
      return;
    }

    if (valorPago > saldoAtual && settlementType === 'parcial') {
      setErrorMsg('O valor de baixa parcial não pode ser superior ao saldo devedor atual.');
      return;
    }

    try {
      settlePayableTitle(title.id, {
        tipo: settlementType,
        valorPago: settlementType === 'total' ? saldoAtual : valorPago,
        juros,
        desconto,
        formaPagamento,
        contaBancaria,
        comprovante,
        observacoes,
      });

      alert(`✅ Pagamento ${settlementType === 'total' ? 'integral (quitação)' : 'parcial'} registrado com sucesso!`);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar o pagamento do título.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-800 flex items-center justify-center text-rose-400">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Baixa de Contas a Pagar
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300 font-semibold uppercase">
                  Despesa / Fornecedor
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {title.fornecedorNome} • Doc: {title.numeroDocumento} {title.numeroParcela ? `(${title.numeroParcela}ª Parcela)` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Title Info Card */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Valor Original</span>
              <div className="text-sm font-bold text-slate-200 font-mono mt-0.5">
                R$ {(title.valorOriginal ?? (title as any).valor ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Saldo a Pagar</span>
              <div className="text-sm font-bold text-rose-400 font-mono mt-0.5">
                R$ {saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Vencimento</span>
              <div className="text-xs font-semibold text-slate-300 mt-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                {new Date(title.dataVencimento).toLocaleDateString('pt-BR')}
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Categoria</span>
              <div className="text-xs font-semibold text-slate-300 mt-1">
                {title.categoria}
              </div>
            </div>
          </div>

          {/* Settlement Type Selector */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300 text-[11px] uppercase tracking-wider block">
              Tipo de Baixa:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleTypeChange('total')}
                className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                  settlementType === 'total'
                    ? 'bg-rose-950/40 border-rose-700 text-rose-200 ring-1 ring-rose-500/50'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="font-bold text-xs">Baixa Total (Quitação)</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Liquidando 100% do título</div>
                </div>
                <div className="text-right font-mono font-bold">
                  R$ {saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('parcial')}
                className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                  settlementType === 'parcial'
                    ? 'bg-blue-950/40 border-blue-700 text-blue-200 ring-1 ring-blue-500/50'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="font-bold text-xs">Baixa Parcial</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Pagar parte e manter saldo</div>
                </div>
                <div className="text-right font-mono font-bold text-blue-400">
                  Parcial
                </div>
              </button>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Valor Base do Pagamento (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={saldoAtual}
                value={valorPago}
                onChange={(e) => setValorPago(parseFloat(e.target.value) || 0)}
                disabled={settlementType === 'total'}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono font-bold focus:outline-none focus:border-rose-500 disabled:opacity-75"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Juros / Multa (+)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={juros}
                onChange={(e) => setJuros(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Desconto Obtido (-)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={desconto}
                onChange={(e) => setDesconto(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Payment Method and Account */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="PIX">PIX / Transferência Instantânea</option>
                <option value="Boleto">Boleto Bancário</option>
                <option value="TED">TED / Transferência Bancária</option>
                <option value="Cartão de Crédito">Cartão de Crédito Corporativo</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
                <option value="Dinheiro">Dinheiro (Caixa Físico)</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Conta de Débito / Origem
              </label>
              <select
                value={contaBancaria}
                onChange={(e) => setContaBancaria(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="Banco Itaú - Conta Corrente Principal">Banco Itaú - Conta Principal</option>
                <option value="Banco Bradesco - Conta Cobrança">Banco Bradesco - Cobrança</option>
                <option value="Banco do Brasil - Giro">Banco do Brasil</option>
                <option value="Caixa Interno Matriz (Dinheiro)">Caixa Interno Tesouraria</option>
              </select>
            </div>
          </div>

          {/* Comprovante and Observação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Nº Autenticação Bancária / Comprovante
              </label>
              <input
                type="text"
                value={comprovante}
                onChange={(e) => setComprovante(e.target.value)}
                placeholder="Ex: AUT-983248239023 / PIX-E2938"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Observações do Pagamento
              </label>
              <input
                type="text"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex: Pago com desconto pontualidade acordado"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Settlement Preview Summary */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Resumo da Transação:
              </span>
              <div className="text-xs text-slate-300 mt-0.5">
                {settlementType === 'total' ? (
                  <span className="text-emerald-400 font-semibold">Quitação Total do Título</span>
                ) : (
                  <span>
                    Baixa Parcial • Novo saldo a pagar:{' '}
                    <strong className="text-rose-400 font-mono">
                      R$ {novoSaldoDevedor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total a Debitar:</span>
              <div className="text-base font-bold text-rose-400 font-mono">
                R$ {valorEfetivo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Previous Settlements History */}
          {title.historicoBaixas && title.historicoBaixas.length > 0 && (
            <div className="border-t border-slate-800 pt-3">
              <h4 className="text-[11px] font-bold uppercase text-slate-400 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                Histórico de Pagamentos Anteriores ({title.historicoBaixas.length}):
              </h4>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {title.historicoBaixas.map((h, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-[11px]"
                  >
                    <div>
                      <span className="font-semibold text-slate-300">
                        {new Date(h.data).toLocaleDateString('pt-BR')} • {h.formaPagamento}
                      </span>
                      {h.observacoes && (
                        <div className="text-[10px] text-slate-400">{h.observacoes}</div>
                      )}
                    </div>
                    <div className="font-mono font-bold text-emerald-400">
                      R$ {h.valorPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>

          <button
            id="btn-confirm-payable-payment"
            type="button"
            onClick={handleConfirmPayment}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/60 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar Pagamento & Baixa</span>
          </button>
        </div>
      </div>
    </div>
  );
};
