import React, { useState } from 'react';
import { useSales } from '../context/SalesContext';
import { Order } from '../types';
import {
  X,
  Printer,
  Share2,
  Copy,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  Building2,
  Phone,
  Mail,
  Calendar,
  Send,
  Download,
  FileText
} from 'lucide-react';
import { OrderPrintModal } from './OrderPrintModal';

interface OrderDetailModalProps {
  orderId: string;
  onClose: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ orderId, onClose }) => {
  const { orders, transmitOrder, duplicateOrder, showToast } = useSales();
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const order = orders.find((o) => o.id === orderId);

  if (!order) return null;

  const handlePrint = () => {
    setIsPrintModalOpen(true);
  };

  const handleShareWhatsApp = () => {
    const itensSummary = order.itens
      .map((it) => `• ${it.quantidade}x ${it.produto.nome} = R$ ${it.subtotal.toFixed(2)}`)
      .join('\n');

    const text = `*DISTRIBUIDORA NACIONAL - ESPELHO DO PEDIDO ${order.numeroPedido}*\n` +
      `📅 *Data:* ${order.dataCriacao}\n` +
      `🏢 *Cliente:* ${order.cliente.nomeFantasia} (${order.cliente.cnpjCpf})\n` +
      `💳 *Condição:* ${order.condicaoPagamento} (${order.formaPagamento})\n` +
      `🚚 *Frete:* ${order.tipoFrete} | *Previsão Entrega:* ${order.dataPrevisaoEntrega}\n\n` +
      `📦 *ITENS DO PEDIDO:*\n${itensSummary}\n\n` +
      `💰 *VALOR TOTAL LÍQUIDO:* R$ ${order.valorTotalLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
      `*Status:* ${order.status.toUpperCase()}`;

    const phone = order.cliente.whatsapp.replace(/\D/g, '');
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  let statusBg = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
  let statusIcon = Clock;
  let statusText = 'Transmitido para Central';

  if (order.status === 'aprovado') {
    statusBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    statusIcon = CheckCircle2;
    statusText = 'Aprovado & Em Separação';
  } else if (order.status === 'pendente_transmissao') {
    statusBg = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    statusIcon = Clock;
    statusText = 'Pendente de Transmissão (Offline)';
  } else if (order.status === 'cancelado') {
    statusBg = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    statusIcon = AlertCircle;
    statusText = 'Cancelado';
  }

  const StatusIconComponent = statusIcon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-mono font-bold text-sm">
              Nº
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-white font-mono">{order.numeroPedido}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusBg}`}>
                  <StatusIconComponent className="w-3 h-3" />
                  <span>{statusText}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">Emitido em {order.dataCriacao} • Tipo: {order.tipo.toUpperCase()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Imprimir Pedido"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="p-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 transition-colors"
              title="Enviar no WhatsApp"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs printable-order-content">
          
          {/* Informações da Distribuidora & Cliente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dados do Cliente (Faturado)</span>
              <h4 className="text-sm font-bold text-white">{order.cliente.nomeFantasia}</h4>
              <p className="text-slate-300">{order.cliente.razaoSocial}</p>
              <p className="font-mono text-slate-400">CNPJ: {order.cliente.cnpjCpf} • IE: {order.cliente.inscricaoEstadual || 'Isento'}</p>
              <p className="text-slate-300 mt-1">
                📍 {order.cliente.endereco.rua}, {order.cliente.endereco.numero} - {order.cliente.endereco.bairro}, {order.cliente.endereco.cidade}/{order.cliente.endereco.uf}
              </p>
              <p className="text-slate-400">Contato: {order.cliente.contatoPrincipal} • {order.cliente.telefone}</p>
            </div>

            <div className="space-y-1 md:border-l md:border-slate-700 md:pl-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Condições Comerciais</span>
              <div className="space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tabela de Preço:</span>
                  <span className="font-bold uppercase text-white">{order.tabelaPreco}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Condição / Prazo:</span>
                  <span className="font-bold text-white">{order.condicaoPagamento}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Forma de Pagamento:</span>
                  <span className="font-medium text-white">{order.formaPagamento}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Modalidade Frete:</span>
                  <span className="font-bold text-blue-400">{order.tipoFrete}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Previsão Entrega:</span>
                  <span className="font-bold text-white">{order.dataPrevisaoEntrega}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela Detalhada de Itens */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Produtos & Grade do Pedido ({order.itens.length} itens)
            </h4>

            <div className="border border-slate-700/80 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800 text-slate-300 font-bold border-b border-slate-700">
                    <th className="p-2.5">SKU / Item</th>
                    <th className="p-2.5 text-center">Un</th>
                    <th className="p-2.5 text-center">Qtd</th>
                    <th className="p-2.5 text-right">Preço Tab.</th>
                    <th className="p-2.5 text-right">Desc %</th>
                    <th className="p-2.5 text-right">Preço Final</th>
                    <th className="p-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {order.itens.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-800/40">
                      <td className="p-2.5">
                        <p className="font-bold text-white">{item.produto.nome}</p>
                        <p className="text-[10px] text-slate-400 font-mono">SKU: {item.produto.codigoSku} • {item.produto.marca}</p>
                      </td>
                      <td className="p-2.5 text-center text-slate-300 font-mono">{item.produto.unidade}</td>
                      <td className="p-2.5 text-center font-bold text-white">{item.quantidade}</td>
                      <td className="p-2.5 text-right text-slate-400 font-mono">
                        R$ {item.precoUnitarioTabela.toFixed(2)}
                      </td>
                      <td className="p-2.5 text-right font-semibold text-amber-400 font-mono">
                        {item.descontoPct > 0 ? `${item.descontoPct.toFixed(1)}%` : '-'}
                      </td>
                      <td className="p-2.5 text-right font-bold text-slate-200 font-mono">
                        R$ {item.precoUnitarioCobrado.toFixed(2)}
                      </td>
                      <td className="p-2.5 text-right font-black text-emerald-400 font-mono">
                        R$ {item.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totais & Observações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Observações */}
            <div className="space-y-3">
              {order.observacoesInternas && (
                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Observações Internas:</span>
                  <p className="text-slate-300 mt-0.5">{order.observacoesInternas}</p>
                </div>
              )}

              {order.observacoesNotaFiscal && (
                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Dados da Nota Fiscal (DANFE):</span>
                  <p className="text-slate-300 mt-0.5">{order.observacoesNotaFiscal}</p>
                </div>
              )}

              {/* Assinatura Digital do Comprador */}
              {order.assinaturaClienteBase64 && (
                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Assinatura Digital Capturada:</span>
                  <div className="bg-white p-2 rounded-lg inline-block">
                    <img
                      src={order.assinaturaClienteBase64}
                      alt="Assinatura"
                      className="h-14 object-contain"
                    />
                  </div>
                  {order.nomeRecebedorAssinatura && (
                    <p className="text-[10px] text-slate-300 font-medium">
                      Autorizado por: <strong className="text-white">{order.nomeRecebedorAssinatura}</strong>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Totalizadores do Fechamento */}
            <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/60 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal Itens Bruto:</span>
                <span>R$ {order.subtotalItensBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              {order.descontoTotalReais > 0 && (
                <div className="flex justify-between text-amber-400 font-semibold">
                  <span>Descontos Totais ({order.descontoTotalPct.toFixed(1)}%):</span>
                  <span>- R$ {order.descontoTotalReais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-300">
                <span>Valor do Frete ({order.tipoFrete}):</span>
                <span>R$ {order.valorFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Peso Total Estimado:</span>
                <span>{order.pesoTotalKg.toFixed(2)} kg ({order.volumeTotalCaixas} volumes)</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-slate-700">
                <span>Comissão do Vendedor:</span>
                <span>R$ {order.comissaoTotalReais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-600">
                <span>TOTAL DO PEDIDO:</span>
                <span className="text-emerald-400">
                  R$ {order.valorTotalLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/95 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-700/20 active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Meia Folha</span>
            </button>

            {order.status === 'pendente_transmissao' && (
              <button
                onClick={() => transmitOrder(order.id)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-700/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Transmitir ao ERP</span>
              </button>
            )}

            <button
              onClick={() => {
                duplicateOrder(order);
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-blue-400" />
              <span>Duplicar / Recomprar</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>

      {/* Modal de Impressão Meia Folha / LX-300 / PDF */}
      <OrderPrintModal
        order={order}
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
      />
    </div>
  );
};
