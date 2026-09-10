import { jsPDF } from 'jspdf';
import { Order } from '../types';

export interface PrintOrderData {
  numero: string;
  data: string;
  hora: string;
  clienteNome: string;
  razaoSocial?: string;
  cnpj: string;
  fone: string;
  endereco?: string;
  cidadeUf?: string;
  itens: Array<{
    cod: string | number;
    nome: string;
    unidade?: string;
    qtd: number;
    vlUnit: number;
    total: number;
  }>;
  total: number;
  formaPagto: string;
  condicaoPagto?: string;
  vendedor: string;
  observacoes?: string;
  imprimirDuasViasNaMesmaFolha: boolean;
}

/**
 * Converte um objeto Order do sistema para o formato estruturado de impressão
 */
export function mapOrderToPrintData(
  order: Order,
  imprimirDuasViasNaMesmaFolha = true,
  vendedorNome = 'Vendedor JM Sistemas'
): PrintOrderData {
  const parts = (order.dataCriacao || '').split(' ');
  const data = parts[0] || new Date().toISOString().split('T')[0];
  const hora = parts[1] || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return {
    numero: order.numeroPedido,
    data,
    hora,
    clienteNome: order.cliente?.nomeFantasia || order.cliente?.razaoSocial || 'Cliente Consumidor',
    razaoSocial: order.cliente?.razaoSocial,
    cnpj: order.cliente?.cnpjCpf || 'ISENTO',
    fone: order.cliente?.telefone || order.cliente?.whatsapp || '-',
    endereco: order.cliente?.endereco ? `${order.cliente.endereco.rua}, ${order.cliente.endereco.numero}` : undefined,
    cidadeUf: order.cliente?.endereco ? `${order.cliente.endereco.cidade}/${order.cliente.endereco.uf}` : undefined,
    itens: order.itens.map((it) => ({
      cod: it.produto.codigoSku || (it.produto as any).codigo || it.id.substring(0, 4),
      nome: it.produto.nome || 'Produto',
      unidade: it.produto.unidade || 'UN',
      qtd: it.quantidade,
      vlUnit: it.precoUnitarioCobrado,
      total: it.subtotal,
    })),
    total: order.valorTotalLiquido,
    formaPagto: order.formaPagamento || 'Boleto Bancário',
    condicaoPagto: order.condicaoPagamento || '28/35/42 DDL',
    vendedor: vendedorNome,
    observacoes: order.observacoesInternas || order.observacoesNotaFiscal,
    imprimirDuasViasNaMesmaFolha,
  };
}

/**
 * FORMATO 1: LX-300 MATRICIAL - MEIA FOLHA (240mm x 140mm Carbonado)
 * Gera a sequência de escape ESC/P nativa para Epson LX-300 e matriciais padrão
 */
export function gerarTextoMatricialMeiaFolha(pedido: PrintOrderData): string {
  const ESC = '\x1B';
  let texto = '';

  // 1. Inicialização e Configuração de Página
  texto += ESC + '@'; // Reset/Init
  texto += ESC + 'C' + String.fromCharCode(20); // Define página com 20 linhas = Meia Folha (140mm)
  texto += ESC + 'P'; // 10 CPI (Pica - padrão 80 colunas)
  texto += ESC + '1'; // Draft Rápido (alta velocidade)

  // ==========================================
  // VIA 1 - CLIENTE (Parte Superior da Folha)
  // ==========================================
  texto += 'JM SISTEMAS - VIA CLIENTE\n';
  texto += `PEDIDO: ${pedido.numero} DATA: ${pedido.data} HORA: ${pedido.hora}\n`;
  texto += `CLIENTE: ${pedido.clienteNome.substring(0, 35)}\n`;
  texto += `CNPJ: ${pedido.cnpj} FONE: ${pedido.fone}\n`;
  texto += '----------------------------------------\n';
  texto += 'COD  PRODUTO                QTD VL.UNIT   TOTAL\n';

  pedido.itens.forEach((item) => {
    // Linha compacta para caber perfeitamente na meia folha
    const cod = String(item.cod).substring(0, 4).padEnd(4);
    const nome = item.nome.substring(0, 22).padEnd(22);
    const qtd = String(item.qtd).padStart(3);
    const vlUnit = item.vlUnit.toFixed(2).padStart(7);
    const total = item.total.toFixed(2).padStart(7);
    texto += `${cod} ${nome} ${qtd} ${vlUnit} ${total}\n`;
  });

  texto += '----------------------------------------\n';
  texto += `TOTAL: R$ ${pedido.total.toFixed(2).padStart(30)}\n`;
  texto += `PAGTO: ${pedido.formaPagto} VENDEDOR: ${pedido.vendedor.substring(0, 18)}\n`;
  texto += '\n'; // 1 linha em branco

  // Linha picotada para destacar
  texto += '- - - - - - - - - - - - - - - - - - - -\n';

  // ESPAÇO ENTRE VIAS: 2 linhas
  texto += '\n\n';

  // ==========================================
  // VIA 2 - VENDEDOR (Parte Inferior da Folha)
  // ==========================================
  if (pedido.imprimirDuasViasNaMesmaFolha) {
    texto += 'JM SISTEMAS - VIA VENDEDOR (COPIA)\n';
    texto += `PEDIDO: ${pedido.numero} DATA: ${pedido.data}\n`;
    texto += `CLIENTE: ${pedido.clienteNome.substring(0, 35)}\n`;
    texto += '----------------------------------------\n';
    texto += 'COD  PRODUTO                QTD VL.UNIT   TOTAL\n';

    pedido.itens.forEach((item) => {
      const cod = String(item.cod).substring(0, 4).padEnd(4);
      const nome = item.nome.substring(0, 22).padEnd(22);
      const qtd = String(item.qtd).padStart(3);
      const vlUnit = item.vlUnit.toFixed(2).padStart(7);
      const total = item.total.toFixed(2).padStart(7);
      texto += `${cod} ${nome} ${qtd} ${vlUnit} ${total}\n`;
    });

    texto += '----------------------------------------\n';
    texto += `TOTAL: R$ ${pedido.total.toFixed(2).padStart(30)}\n`;
    texto += '\n\n\n'; // Avança para a próxima folha
  } else {
    texto += '\n\n\n'; // Só avança meia folha
  }

  // Restaura padrão da impressora para 66 linhas (A4 padrão)
  texto += ESC + 'C' + String.fromCharCode(66);

  return texto;
}

/**
 * Envia comando RAW para a impressora ou faz download do arquivo .prn/.txt
 */
export function imprimirRaw(conteudoTexto: string, nomeArquivo = 'pedido-lx300.txt'): { success: boolean; method: string } {
  // 1. Tenta acionar RawBT via Android intent se estiver em dispositivo móvel
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
  if (isAndroid) {
    try {
      const base64Content = btoa(unescape(encodeURIComponent(conteudoTexto)));
      const rawbtUrl = `rawbt:data:text/plain;base64,${base64Content}`;
      window.location.href = rawbtUrl;
      return { success: true, method: 'rawbt' };
    } catch (e) {
      console.warn('Falha ao acionar RawBT:', e);
    }
  }

  // 2. Cria janela de impressão direta com formatação monoespaçada compatível com matricial
  try {
    const printWindow = window.open('', '_blank', 'width=500,height=600');
    if (printWindow) {
      // Remove caracteres de escape para visualização em tela/janela de impressão padrão
      const cleanText = conteudoTexto.replace(/\x1B[@CP1]/g, '');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Impressão LX-300 Meia Folha - ${nomeArquivo}</title>
          <style>
            @page {
              size: 240mm 140mm;
              margin: 4mm;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 11px;
              line-height: 1.25;
              white-space: pre-wrap;
              color: #000;
              background: #fff;
              margin: 0;
              padding: 8px;
            }
          </style>
        </head>
        <body>
          <pre>${cleanText}</pre>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
      return { success: true, method: 'window_print' };
    }
  } catch (e) {
    console.warn('Janela pop-up bloqueada:', e);
  }

  // 3. Fallback: Download do arquivo .txt / .prn RAW para envio direto via LPT1/USB
  const blob = new Blob([conteudoTexto], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { success: true, method: 'download' };
}

/**
 * Dispara a impressão Matricial Meia Folha (LX-300)
 */
export function imprimirMatricialMeiaFolha(pedido: PrintOrderData) {
  const texto = gerarTextoMatricialMeiaFolha(pedido);
  return imprimirRaw(texto, `pedido-${pedido.numero}-LX300.txt`);
}

/**
 * FORMATO 2: PDF - A4 COM 2 VIAS (PARA IMPRESSORA JATO/LASER)
 * Desenha 2 vias idênticas em uma folha A4 com picote no meio (148mm)
 */
export function gerarPDFMeiaFolha(pedido: PrintOrderData, autoOpen = true): jsPDF {
  const doc = new jsPDF({ format: 'a4', orientation: 'portrait' });
  doc.setFont('courier', 'normal');

  // Função que desenha uma via
  const desenharVia = (yInicial: number, tituloVia: string) => {
    let y = yInicial;
    doc.setFontSize(10);
    doc.setFont('courier', 'bold');
    doc.text(`JM SISTEMAS - ${tituloVia}`, 10, y);
    y += 5;

    doc.setFontSize(8.5);
    doc.setFont('courier', 'normal');
    doc.text(`PEDIDO: ${pedido.numero}   DATA: ${pedido.data}   HORA: ${pedido.hora}`, 10, y);
    y += 4;
    doc.text(`CLIENTE: ${pedido.clienteNome.substring(0, 45)}`, 10, y);
    y += 4;
    doc.text(`CNPJ: ${pedido.cnpj}   FONE: ${pedido.fone}`, 10, y);
    y += 4;

    if (pedido.endereco) {
      doc.text(`END: ${pedido.endereco} - ${pedido.cidadeUf || ''}`, 10, y);
      y += 4;
    }

    doc.text('----------------------------------------------------------------------', 10, y);
    y += 4;
    doc.setFont('courier', 'bold');
    doc.text('COD  PRODUTO                    QTD   UN   VL.UNIT       TOTAL', 10, y);
    y += 4;
    doc.setFont('courier', 'normal');

    pedido.itens.forEach((it) => {
      const cod = String(it.cod).substring(0, 4).padEnd(4);
      const nome = it.nome.substring(0, 26).padEnd(26);
      const qtd = String(it.qtd).padStart(3);
      const un = (it.unidade || 'UN').substring(0, 2).padEnd(2);
      const vlUnit = `R$ ${it.vlUnit.toFixed(2)}`.padStart(11);
      const total = `R$ ${it.total.toFixed(2)}`.padStart(12);

      doc.text(`${cod} ${nome} ${qtd}   ${un} ${vlUnit}  ${total}`, 10, y);
      y += 4;
    });

    doc.text('----------------------------------------------------------------------', 10, y);
    y += 4;

    doc.setFont('courier', 'bold');
    doc.text(`TOTAL DO PEDIDO: R$ ${pedido.total.toFixed(2).padStart(12)}`, 10, y);
    y += 4;

    doc.setFont('courier', 'normal');
    doc.text(`COND. PAGTO: ${pedido.condicaoPagto || pedido.formaPagto}   VENDEDOR: ${pedido.vendedor.substring(0, 20)}`, 10, y);
  };

  // VIA 1 - Topo da folha A4 (y = 12)
  desenharVia(12, 'VIA CLIENTE');

  if (pedido.imprimirDuasViasNaMesmaFolha) {
    // Linha picotada no meio da folha A4 (y = 148mm)
    doc.setLineWidth(0.2);
    doc.setDrawColor(140);
    // Linha tracejada
    doc.setLineDashPattern([2, 2], 0);
    doc.line(10, 148, 200, 148);

    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text('✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -', 10, 145);
    doc.setTextColor(0);

    // VIA 2 - Embaixo da folha A4 (y = 156)
    desenharVia(156, 'VIA VENDEDOR - COPIA');
  }

  const fileName = `pedido-${pedido.numero}-${pedido.imprimirDuasViasNaMesmaFolha ? '2vias' : '1via'}.pdf`;

  if (autoOpen) {
    try {
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank');
    } catch (e) {
      doc.save(fileName);
    }
  } else {
    doc.save(fileName);
  }

  return doc;
}
