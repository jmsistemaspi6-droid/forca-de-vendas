import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Calendar,
  User,
  CreditCard,
  CheckCircle2,
  X,
  AlertCircle,
  FileText,
  Clock,
  ArrowDownLeft,
  Printer,
  Share2,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { FinancialTitle, SettlementType } from '../../types';

interface ReceivablePaymentModalProps {
  title: FinancialTitle | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceivablePaymentModal: React.FC<ReceivablePaymentModalProps> = ({
  title,
  isOpen,
  onClose,
}) => {
  const { settleReceivableTitle, currentUser } = useSales();

  const [settlementType, setSettlementType] = useState<SettlementType>('total');
  const [valorPago, setValorPago] = useState<number>(0);
  const [juros, setJuros] = useState<number>(0);
  const [desconto, setDesconto] = useState<number>(0);
  const [formaPagamento, setFormaPagamento] = useState<string>('PIX');
  const [contaBancaria, setContaBancaria] = useState<string>('Banco Itaú - Conta Cobrança');
  const [observacoes, setObservacoes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState<boolean>(false);
  const [generatedReceiptNumber, setGeneratedReceiptNumber] = useState<string>('');

  useEffect(() => {
    if (title) {
      const saldo = title.saldoRestante ?? title.valorOriginal ?? title.valor ?? 0;
      setValorPago(saldo);
      setSettlementType('total');
      setJuros(0);
      setDesconto(0);
      setObservacoes('');
      setErrorMsg(null);
      setShowReceipt(false);
      setGeneratedReceiptNumber('');
    }
  }, [title]);

  if (!isOpen || !title) return null;

  const saldoAtual = title.saldoRestante ?? title.valorOriginal ?? title.valor ?? 0;
  const valorLiquidoRecebido = Math.max(0, valorPago + juros - desconto);
  const novoSaldoRestante = settlementType === 'total' ? 0 : Math.max(0, saldoAtual - valorPago);

  const handleTypeChange = (type: SettlementType) => {
    setSettlementType(type);
    if (type === 'total') {
      setValorPago(saldoAtual);
    } else {
      setValorPago(Number((saldoAtual / 2).toFixed(2)));
    }
  };

  const handleConfirmReceipt = () => {
    setErrorMsg(null);

    if (valorPago <= 0) {
      setErrorMsg('O valor recebido deve ser maior que zero.');
      return;
    }

    if (valorPago > saldoAtual && settlementType === 'parcial') {
      setErrorMsg('O valor de recebimento parcial não pode exceder o saldo devedor atual do cliente.');
      return;
    }

    try {
      const recNum = `REC-${Math.floor(100000 + Math.random() * 900000)}`;
      setGeneratedReceiptNumber(recNum);

      settleReceivableTitle(title.id, {
        valorRecebido: settlementType === 'total' ? saldoAtual : valorPago,
        valorJurosMulta: juros,
        valorDesconto: desconto,
        formaRecebimento: formaPagamento as any,
        responsavel: currentUser?.nome || 'Operador Financeiro',
        observacoes: observacoes ? `${observacoes} (Destino: ${contaBancaria})` : `Destino: ${contaBancaria}`,
      });

      setShowReceipt(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar a baixa de recebimento.');
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Baixa de Contas a Receber
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-semibold uppercase">
                  Recebimento de Cliente
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {title.clienteNome} • {title.pedidoId ? `Pedido #${title.pedidoId.slice(-6)}` : `Doc: ${title.numeroDocumento || title.id}`} {title.numeroParcela ? `(Parc. ${title.numeroParcela})` : ''}
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
          {showReceipt ? (
            /* Official Receipt View */
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-white text-slate-900 shadow-md border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-base font-bold uppercase tracking-wider text-slate-900">
                      RECIBO DE PAGAMENTO
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Distrimax Força de Vendas & Distribuição Ltda
                    </p>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-[10px] text-slate-500 block uppercase">Nº Recibo</span>
                    <span className="text-sm font-bold text-emerald-700">
                      {generatedReceiptNumber || `REC-${Date.now().toString().slice(-6)}`}
                    </span>
                  </div>
                </div>

                <div className="text-xs space-y-2 leading-relaxed">
                  <p>
                    Recebemos de <strong>{title.clienteNome}</strong> a quantia de:
                  </p>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-base font-bold text-emerald-700 flex items-center justify-between">
                    <span>R$ {valorLiquidoRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span className="text-xs text-slate-500 font-normal">
                      via {formaPagamento}
                    </span>
                  </div>
                  <p className="text-slate-600">
                    Referente ao pagamento{' '}
                    <strong>{settlementType === 'total' ? 'integral (quitação)' : 'parcial'}</strong> do título{' '}
                    <strong>{title.numeroDocumento || title.id}</strong> {title.pedidoId ? `(Origem: Pedido #${title.pedidoId.slice(-6)})` : ''}.
                  </p>
                  {settlementType === 'parcial' && (
                    <p className="text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 text-[11px]">
                      Saldo residual a pagar pelo cliente:{' '}
                      <strong>R$ {novoSaldoRestante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                    </p>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-200 flex items-end justify-between text-[11px] text-slate-500">
                  <div>
                    <p>Emitido em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                    <p>Autenticação: {contaBancaria}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-36 border-b border-slate-400 mb-1"></div>
                    <span>Assinatura / Tesouraria</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                >
                  <Printer className="w-4 h-4 text-blue-400" />
                  <span>Imprimir Recibo</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Concluir & Fechar</span>
                </button>
              </div>
            </div>
          ) : (
            /* Settlement Form */
            <>
              {/* Title Info Card */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Valor Original</span>
                  <div className="text-sm font-bold text-slate-200 font-mono mt-0.5">
                    R$ {(title.valorOriginal ?? title.valor ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Saldo a Receber</span>
                  <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
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
                  <span className="text-[10px] uppercase font-bold text-slate-400">Status Atual</span>
                  <div className="text-xs font-semibold mt-1">
                    {title.status === 'pago' ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Totalmente Quitado
                      </span>
                    ) : title.status === 'parcial' ? (
                      <span className="text-blue-400 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Parcialmente Pago
                      </span>
                    ) : (
                      <span className="text-slate-300">Pendente de Baixa</span>
                    )}
                  </div>
                </div>
              </div>

              {title.status === 'pago' && (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold">Este título já foi totalmente liquidado!</div>
                    <div className="text-[11px] text-emerald-400/80">
                      Consulte o histórico de baixas e comprovantes emitidos abaixo.
                    </div>
                  </div>
                </div>
              )}

              {title.status !== 'pago' && (
                <>
                  {/* Settlement Type Selector */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300 text-[11px] uppercase tracking-wider block">
                      Modalidade do Recebimento:
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleTypeChange('total')}
                        className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                          settlementType === 'total'
                            ? 'bg-emerald-950/40 border-emerald-700 text-emerald-200 ring-1 ring-emerald-500/50'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs">Baixa Total (Quitação)</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Cliente quitou 100% da dívida</div>
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
                          <div className="text-[10px] text-slate-400 mt-0.5">Receber parte e manter saldo</div>
                        </div>
                        <div className="text-right font-mono font-bold text-blue-400">
                          Parcial
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Amount Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Valor Recebido (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={saldoAtual}
                        value={valorPago}
                        onChange={(e) => setValorPago(parseFloat(e.target.value) || 0)}
                        disabled={settlementType === 'total'}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono font-bold focus:outline-none focus:border-emerald-500 disabled:opacity-75"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Juros Cobrados (+)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={juros}
                        onChange={(e) => setJuros(parseFloat(e.target.value) || 0)}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Desconto Concedido (-)
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

                  {/* Payment Method & Bank Account */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Meio de Recebimento
                      </label>
                      <select
                        value={formaPagamento}
                        onChange={(e) => setFormaPagamento(e.target.value)}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="PIX">PIX / QR Code Instantâneo</option>
                        <option value="Boleto Bancário">Boleto Bancário (Compensado)</option>
                        <option value="Dinheiro">Dinheiro (Em Mãos / Caixa)</option>
                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                        <option value="Transferência Bancária">Transferência Bancária / TED</option>
                        <option value="Cheque">Cheque à Vista / Pré-Datado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Conta de Destino / Caixa
                      </label>
                      <select
                        value={contaBancaria}
                        onChange={(e) => setContaBancaria(e.target.value)}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Banco Itaú - Conta Cobrança">Banco Itaú - Cobrança</option>
                        <option value="Banco Bradesco - Conta Principal">Banco Bradesco - Matriz</option>
                        <option value="Caixa Físico do Vendedor (Rota)">Caixa em Rota (Vendedor)</option>
                        <option value="Caixa Interno Matriz">Caixa Interno Matriz</option>
                      </select>
                    </div>
                  </div>

                  {/* Observação */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Observações do Recebimento
                    </label>
                    <input
                      type="text"
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Ex: Pago pelo proprietário da loja no ato da entrega"
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Preview calculation card */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Resumo do Recebimento:
                      </span>
                      <div className="text-xs text-slate-300 mt-0.5">
                        {settlementType === 'total' ? (
                          <span className="text-emerald-400 font-semibold">Quitação Integral do Título</span>
                        ) : (
                          <span>
                            Baixa Parcial • Saldo restante do cliente:{' '}
                            <strong className="text-amber-400 font-mono">
                              R$ {novoSaldoRestante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Total a Entrar no Caixa:</span>
                      <div className="text-base font-bold text-emerald-400 font-mono">
                        R$ {valorLiquidoRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* History of previous partial receipts */}
              {title.historicoBaixas && title.historicoBaixas.length > 0 && (
                <div className="border-t border-slate-800 pt-3">
                  <h4 className="text-[11px] font-bold uppercase text-slate-400 mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    Histórico de Recebimentos / Baixas Anteriores ({title.historicoBaixas.length}):
                  </h4>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {title.historicoBaixas.map((h, i) => {
                      const valorEfetivo = h.valorRecebido ?? h.valorPago ?? 0;
                      const dataStr = h.dataRecebimento || h.data || '';
                      const meio = h.formaRecebimento || h.formaPagamento || 'Recebimento';
                      const rec = h.reciboNumero ? `• ${h.reciboNumero}` : '';
                      return (
                        <div
                          key={h.id || i}
                          className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-[11px]"
                        >
                          <div>
                            <div className="font-semibold text-slate-200">
                              {dataStr} • {meio} {rec}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              {h.responsavel && <span>Resp: {h.responsavel}</span>}
                              {h.observacoes && <span>({h.observacoes})</span>}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-emerald-400">
                              + R$ {valorEfetivo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            {(h.valorJurosMulta > 0 || h.valorDesconto > 0) && (
                              <div className="text-[9px] text-slate-400">
                                {h.valorJurosMulta > 0 ? `+Juros: ${h.valorJurosMulta.toFixed(2)} ` : ''}
                                {h.valorDesconto > 0 ? `-Desc: ${h.valorDesconto.toFixed(2)}` : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!showReceipt && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              {title.status === 'pago' ? 'Fechar' : 'Cancelar'}
            </button>

            {title.status !== 'pago' && (
              <button
                id="btn-confirm-receivable-receipt"
                type="button"
                onClick={handleConfirmReceipt}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/60 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar Recebimento & Gerar Recibo</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
