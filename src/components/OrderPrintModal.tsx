import React, { useState } from 'react';
import { Order } from '../types';
import {
  X,
  Printer,
  FileText,
  Copy,
  Check,
  Share2,
  HelpCircle,
  Scissors,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
} from 'lucide-react';
import {
  mapOrderToPrintData,
  imprimirMatricialMeiaFolha,
  gerarPDFMeiaFolha,
  gerarTextoMatricialMeiaFolha,
  imprimirRaw,
} from '../services/printService';
import { useSales } from '../context/SalesContext';

interface OrderPrintModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  isPostSale?: boolean; // Se for pós-venda, exibe mensagem de sucesso e botões de fluxo
  onNewOrder?: () => void;
}

export const OrderPrintModal: React.FC<OrderPrintModalProps> = ({
  order,
  isOpen,
  onClose,
  isPostSale = false,
  onNewOrder,
}) => {
  const { seller, showToast } = useSales();

  // Opção padrão: 2 vias na mesma folha para razão carbonado
  const [imprimirDuasVias, setImprimirDuasVias] = useState(true);
  const [showConfigHelp, setShowConfigHelp] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen || !order) return null;

  const printData = mapOrderToPrintData(order, imprimirDuasVias, seller?.nome || 'Vendedor JM');

  const handleImprimirMatricial = () => {
    try {
      imprimirMatricialMeiaFolha(printData);
      showToast(
        'Impressão Enviada',
        `Pedido ${order.numeroPedido} enviado para impressão em Meia Folha (${imprimirDuasVias ? '2 vias carbonadas' : '1 via avulsa'}).`,
        'success'
      );
    } catch (e) {
      showToast('Erro na Impressão', 'Não foi possível enviar para a impressora matricial.', 'error');
    }
  };

  const handleGerarPDF = () => {
    try {
      gerarPDFMeiaFolha(printData, true);
      showToast(
        'PDF Gerado',
        `Documento PDF A4 gerado com ${imprimirDuasVias ? '2 vias e linha de corte ✂' : '1 via'}.`,
        'success'
      );
    } catch (e) {
      showToast('Erro ao Gerar PDF', 'Ocorreu um erro ao gerar o arquivo PDF.', 'error');
    }
  };

  const handleCopiarTexto = () => {
    const texto = gerarTextoMatricialMeiaFolha(printData);
    navigator.clipboard.writeText(texto);
    setCopiedText(true);
    showToast('Copiado', 'Texto formatado copiado para a área de transferência.', 'info');
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleBaixarTxt = () => {
    const texto = gerarTextoMatricialMeiaFolha(printData);
    imprimirRaw(texto, `pedido-${order.numeroPedido}-LX300.txt`);
    showToast('Download Concluído', 'Arquivo de texto RAW baixado.', 'info');
  };

  const handleShareWhatsApp = () => {
    const itensSummary = order.itens
      .map((it) => `• ${it.quantidade}x ${it.produto.nome} = R$ ${it.subtotal.toFixed(2)}`)
      .join('\n');

    const text =
      `*JM SISTEMAS - ESPELHO DO PEDIDO ${order.numeroPedido}*\n` +
      `📅 *Data:* ${order.dataCriacao}\n` +
      `🏢 *Cliente:* ${order.cliente?.nomeFantasia || order.cliente?.razaoSocial} (${order.cliente?.cnpjCpf})\n` +
      `💳 *Condição:* ${order.condicaoPagamento} (${order.formaPagamento})\n\n` +
      `📦 *ITENS:*\n${itensSummary}\n\n` +
      `💰 *TOTAL DO PEDIDO:* R$ ${order.valorTotalLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
      `👤 *Vendedor:* ${seller?.nome || 'JM Sistemas'}`;

    const phone = (order.cliente?.whatsapp || order.cliente?.telefone || '').replace(/\D/g, '');
    const url = phone
      ? `https://wa.me/55${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden text-slate-100 my-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  Impressão em Meia Folha Carbonada
                </h3>
                {isPostSale && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Venda Concluída
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Pedido {order.numeroPedido} • Papel A4 Razão 240mm x 140mm
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh] text-xs">
          {/* Se for pós-venda, banner comemorativo */}
          {isPostSale && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-emerald-200">
                  Pedido Gravado com Sucesso!
                </h4>
                <p className="text-emerald-400/90 text-xs">
                  Cliente: <strong className="text-white">{order.cliente?.nomeFantasia}</strong> • Total: <strong className="text-white">R$ {order.valorTotalLiquido.toFixed(2)}</strong>
                </p>
              </div>
            </div>
          )}

          {/* SELEÇÃO DE VIAS (REGRA DE NEGÓCIO) */}
          <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Formato de Vias para Papel Carbonado:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Opção 1: 2 Vias na mesma folha (Padrão) */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  imprimirDuasVias
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                    : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="vias_option"
                  checked={imprimirDuasVias}
                  onChange={() => setImprimirDuasVias(true)}
                  className="mt-1 w-4 h-4 text-blue-600 accent-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <span className="font-bold block text-sm">
                    2 Vias na Mesma Folha A4
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    (Via Cliente em cima + Via Vendedor embaixo com linha de destaque)
                  </span>
                  <span className="inline-block mt-1 text-[10px] font-semibold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-800/50">
                    Recomendado para Razão Carbonado
                  </span>
                </div>
              </label>

              {/* Opção 2: 1 Via Meia Folha */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  !imprimirDuasVias
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                    : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="vias_option"
                  checked={!imprimirDuasVias}
                  onChange={() => setImprimirDuasVias(false)}
                  className="mt-1 w-4 h-4 text-blue-600 accent-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <span className="font-bold block text-sm">
                    1 Via (Meia Folha Avulsa)
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Imprime apenas 1 via compacta de 140mm (20 linhas)
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* BOTÕES PRINCIPAIS DE IMPRESSÃO */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Escolha a Impressora / Formato:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Formato 1: LX-300 Matricial */}
              <button
                type="button"
                onClick={handleImprimirMatricial}
                className="flex flex-col items-center text-center p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white shadow-lg shadow-blue-700/20 border border-blue-500/50 transition-all active:scale-[0.98] cursor-pointer"
              >
                <Printer className="w-8 h-8 mb-2 text-white" />
                <span className="font-extrabold text-sm">
                  Imprimir LX-300 Matricial
                </span>
                <span className="text-[11px] text-blue-100 mt-1 opacity-90">
                  Meia Folha (20 linhas draft 10cpi)
                </span>
                <span className="mt-2 text-[10px] bg-blue-900/60 text-blue-200 px-2.5 py-0.5 rounded-full font-bold">
                  MODO MAIS USADO
                </span>
              </button>

              {/* Formato 2: PDF A4 com 2 Vias (Laser / Jato) */}
              <button
                type="button"
                onClick={handleGerarPDF}
                className="flex flex-col items-center text-center p-4 rounded-2xl bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 transition-all active:scale-[0.98] cursor-pointer shadow-md hover:border-slate-600"
              >
                <FileText className="w-8 h-8 mb-2 text-amber-400" />
                <span className="font-extrabold text-sm">
                  Gerar PDF Meia Folha
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Impressoras Laser / Jato de Tinta
                </span>
                <span className="mt-2 text-[10px] bg-slate-900 text-amber-300 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 border border-amber-500/30">
                  <Scissors className="w-3 h-3" />
                  Com Linha de Picote (148mm)
                </span>
              </button>
            </div>
          </div>

          {/* Ações Rápidas: WhatsApp / Copiar / Download RAW */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex-1 min-w-[140px] py-2.5 px-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 border border-emerald-800/80 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleCopiarTexto}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copiar texto formatado para envio direto"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-blue-400" />}
              <span>{copiedText ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>

            <button
              type="button"
              onClick={handleBaixarTxt}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Baixar arquivo TXT/PRN para porta LPT1/USB"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Baixar TXT</span>
            </button>
          </div>

          {/* Guia de Configuração da LX-300 no Windows (Colapsável) */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/50">
            <button
              type="button"
              onClick={() => setShowConfigHelp(!showConfigHelp)}
              className="w-full p-3.5 flex items-center justify-between text-left text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-xs text-slate-300">
                  Como Configurar a Epson LX-300 no Windows (Meia Folha)
                </span>
              </div>
              {showConfigHelp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showConfigHelp && (
              <div className="p-4 border-t border-slate-800/80 bg-slate-900/60 text-slate-300 space-y-2 text-[11px] leading-relaxed">
                <p className="font-bold text-white">
                  Passo a passo para criar o tamanho personalizado no Windows:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>Abra o <strong>Painel de Controle &gt; Dispositivos e Impressoras</strong>.</li>
                  <li>Clique na <strong>EPSON LX-300</strong> e abra <strong>Propriedades do Servidor de Impressão</strong> (ou Preferências da Impressora &gt; Avançado).</li>
                  <li>Crie um novo formulário com nome: <strong className="text-blue-300">MEIA_FOLHA</strong>.</li>
                  <li>Defina a largura: <strong className="text-white">240mm</strong> (ou 9.5 polegadas) e altura: <strong className="text-white">140mm</strong> (ou 5.5 polegadas).</li>
                  <li>Salve e selecione este formulário como tamanho de papel padrão nas propriedades da impressora.</li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-3">
          {isPostSale && onNewOrder ? (
            <button
              type="button"
              onClick={onNewOrder}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Iniciar Novo Pedido
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
