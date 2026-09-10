import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Download,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Database,
  Users,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  FileCheck,
  Info,
  ShieldCheck,
  Sparkles,
  Layers,
  ArrowRight,
  Clock,
  HardDriveDownload,
  HardDriveUpload,
  HelpCircle,
  FileText,
  Trash2,
  Building,
  History,
  Check,
  X,
  FileJson,
  Calendar,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { Product, Client, FinancialTitle, LocalBackupSnapshot, SystemBackupData } from '../../types';

type MigrationCategory = 'produtos' | 'clientes' | 'contas_receber';

interface ImportSummary {
  tipo: string;
  totalLidos: number;
  inseridos: number;
  atualizados: number;
  erros: number;
  detalhes: string[];
  timestamp: string;
}

export const DataMigrationBackupView: React.FC = () => {
  const {
    products,
    clients,
    financialTitles,
    payableTitles,
    orders,
    suppliers,
    stockEntries,
    accountabilitySessions,
    issuer,
    bulkUpsertProducts,
    bulkUpsertClients,
    bulkUpsertFinancialTitles,
    resetDatabaseToEmpty,
    generateFullSystemBackup,
    restoreFullSystemBackup,
    localBackupSnapshots,
    deleteLocalBackupSnapshot,
    downloadLocalBackupSnapshot,
    showToast,
  } = useSales();

  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Estados de Backup Completo e Restauração
  const [isGeneratingBackup, setIsGeneratingBackup] = useState(false);
  const [backupRestorePreview, setBackupRestorePreview] = useState<any | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  // Estados de Importação de Legado / Clipper
  const [selectedCategory, setSelectedCategory] = useState<MigrationCategory>('produtos');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [lastImportSummary, setLastImportSummary] = useState<ImportSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper para acionar download de arquivo no navegador
  const downloadFile = (content: string, filename: string, type = 'text/csv;charset=utf-8;') => {
    const blob = new Blob(['\uFEFF' + content], { type }); // BOM UTF-8 para Excel / Calc abrir corretamente
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper para escapar campos CSV
  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  // =========================================================================
  // 1. ROTINA DE BACKUP COMPLETO (SALVO NO COMPUTADOR)
  // =========================================================================

  const handleGenerateBackup = () => {
    setIsGeneratingBackup(true);
    setTimeout(() => {
      try {
        generateFullSystemBackup();
      } catch (err: any) {
        showToast('Erro ao gerar backup', err.message || 'Falha ao processar dados.', 'error');
      } finally {
        setIsGeneratingBackup(false);
      }
    }, 300);
  };

  // Processa arquivo de backup selecionado pelo usuário no computador
  const handleBackupFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        // Valida se o formato do backup é reconhecido
        const dados = parsed.dados || parsed;
        if (!dados.produtos && !dados.clientes && !dados.titulosReceber && !dados.products && !dados.financialTitles) {
          throw new Error('O arquivo selecionado não contém uma estrutura de backup válida do JM Sistemas.');
        }

        setBackupRestorePreview({
          fileName: file.name,
          fileSizeKb: Math.round(file.size / 1024),
          rawParsed: parsed,
          versaoBackup: parsed.versaoBackup || '1.0.0',
          geradoEm: parsed.geradoEm || new Date().toLocaleString('pt-BR'),
          empresaNome: parsed.empresa?.nomeFantasia || parsed.empresa?.razaoSocial || issuer.nomeFantasia || 'Empresa',
          empresaCnpj: parsed.empresa?.cnpj || issuer.cnpj || 'Não informado',
          totalProdutos: (dados.produtos || dados.products || []).length,
          totalClientes: (dados.clientes || dados.clients || []).length,
          totalPedidos: (dados.pedidos || dados.orders || []).length,
          totalReceber: (dados.titulosReceber || dados.financialTitles || []).length,
          totalPagar: (dados.titulosPagar || dados.payableTitles || []).length,
          totalEntradas: (dados.entradasEstoque || dados.stockEntries || []).length,
          totalFornecedores: (dados.fornecedores || dados.suppliers || []).length,
          totalUsuarios: (dados.usuarios || dados.users || []).length,
        });
      } catch (err: any) {
        showToast('Arquivo Inválido', err.message || 'Não foi possível ler o arquivo de backup selecionado.', 'error');
      } finally {
        if (backupFileInputRef.current) {
          backupFileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      showToast('Erro de Leitura', 'Falha ao acessar o arquivo no computador.', 'error');
    };

    reader.readAsText(file, 'utf-8');
  };

  const handleConfirmRestore = () => {
    if (!backupRestorePreview?.rawParsed) return;
    setIsRestoring(true);

    setTimeout(() => {
      try {
        restoreFullSystemBackup(backupRestorePreview.rawParsed);
        setBackupRestorePreview(null);
      } catch (err: any) {
        showToast('Erro na Restauração', err.message || 'Falha ao restaurar dados.', 'error');
      } finally {
        setIsRestoring(false);
      }
    }, 400);
  };

  const handleRestoreFromSnapshot = (snapshot: LocalBackupSnapshot) => {
    try {
      const parsed = JSON.parse(snapshot.dadosJson);
      setBackupRestorePreview({
        fileName: snapshot.nomeArquivo,
        fileSizeKb: snapshot.tamanhoKb,
        rawParsed: parsed,
        versaoBackup: parsed.versaoBackup || 'Snapshot Local',
        geradoEm: snapshot.geradoEm,
        empresaNome: snapshot.empresaNome,
        empresaCnpj: snapshot.empresaCnpj,
        totalProdutos: snapshot.totalProdutos,
        totalClientes: snapshot.totalClientes,
        totalPedidos: snapshot.totalPedidos,
        totalReceber: (parsed.dados?.titulosReceber || []).length,
        totalPagar: (parsed.dados?.titulosPagar || []).length,
        totalEntradas: (parsed.dados?.entradasEstoque || []).length,
        totalFornecedores: (parsed.dados?.fornecedores || []).length,
        totalUsuarios: (parsed.dados?.usuarios || []).length,
      });
    } catch (err: any) {
      showToast('Erro ao ler ponto local', err.message || 'Dados inválidos.', 'error');
    }
  };

  // =========================================================================
  // 2. ROTINA DE EXPORTAÇÕES ESPECÍFICAS (CSV)
  // =========================================================================

  // Exportar Estoque Atual
  const handleExportStockCsv = () => {
    try {
      const headers = [
        'ID_SISTEMA',
        'CODIGO_SKU',
        'CODIGO_BARRAS_EAN',
        'NOME_PRODUTO',
        'CATEGORIA',
        'MARCA',
        'UNIDADE',
        'SALDO_ESTOQUE_ATUAL',
        'ESTOQUE_MINIMO',
        'PRECO_CUSTO',
        'PRECO_ATACADO',
        'PRECO_VAREJO',
        'PRECO_DISTRIBUIDOR',
        'VALOR_ESTOQUE_CUSTO_TOTAL',
        'STATUS',
      ];

      const rows = products.map((p) => [
        escapeCsv(p.id),
        escapeCsv(p.codigoSku),
        escapeCsv(p.codigoBarras),
        escapeCsv(p.nome),
        escapeCsv(p.categoria),
        escapeCsv(p.marca),
        escapeCsv(p.unidade),
        escapeCsv(p.estoqueAtual),
        escapeCsv(p.estoqueMinimo),
        escapeCsv(p.precoCusto.toFixed(2)),
        escapeCsv(p.precoTabela.atacado.toFixed(2)),
        escapeCsv(p.precoTabela.varejo.toFixed(2)),
        escapeCsv(p.precoTabela.distribuidor.toFixed(2)),
        escapeCsv((p.estoqueAtual * p.precoCusto).toFixed(2)),
        escapeCsv(p.status || 'ativo'),
      ]);

      const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
      const filename = `backup_estoque_produtos_${new Date().toISOString().split('T')[0]}.csv`;
      downloadFile(csvContent, filename);

      showToast('Estoque Exportado', `${products.length} produtos exportados em formato CSV.`, 'success');
    } catch (err: any) {
      showToast('Erro na Exportação', err.message || 'Falha ao gerar CSV.', 'error');
    }
  };

  // Exportar Histórico de Vendas / Pedidos
  const handleExportOrdersCsv = () => {
    try {
      const headers = [
        'NUMERO_PEDIDO',
        'DATA_EMISSAO',
        'PREVISAO_ENTREGA',
        'CLIENTE_NOME',
        'CLIENTE_DOC_CNPJ_CPF',
        'CONDICAO_PAGAMENTO',
        'FORMA_PAGAMENTO',
        'QTD_ITENS',
        'SUBTOTAL_BRUTO',
        'DESCONTO_REAIS',
        'FRETE',
        'VALOR_TOTAL_LIQUIDO',
        'MARGEM_LUCRO_PCT',
        'STATUS_PEDIDO',
        'SINCRONIZACAO',
      ];

      const rows = orders.map((o) => [
        escapeCsv(o.numeroPedido),
        escapeCsv(o.dataCriacao),
        escapeCsv(o.dataPrevisaoEntrega),
        escapeCsv(o.cliente.razaoSocial || o.cliente.nomeFantasia),
        escapeCsv(o.cliente.cnpjCpf),
        escapeCsv(o.condicaoPagamento),
        escapeCsv(o.formaPagamento),
        escapeCsv(o.itens.length),
        escapeCsv(o.subtotalItensBruto.toFixed(2)),
        escapeCsv(o.descontoTotalReais.toFixed(2)),
        escapeCsv(o.valorFrete.toFixed(2)),
        escapeCsv(o.valorTotalLiquido.toFixed(2)),
        escapeCsv(o.margemMediaPct.toFixed(2)),
        escapeCsv(o.status),
        escapeCsv(o.sincronizadoEm || 'Local'),
      ]);

      const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
      const filename = `backup_historico_vendas_${new Date().toISOString().split('T')[0]}.csv`;
      downloadFile(csvContent, filename);

      showToast('Vendas Exportadas', `${orders.length} pedidos exportados com sucesso!`, 'success');
    } catch (err: any) {
      showToast('Erro na Exportação', err.message || 'Falha ao gerar CSV.', 'error');
    }
  };

  // Exportar Fluxo de Contas a Receber
  const handleExportReceivablesCsv = () => {
    try {
      const headers = [
        'NUMERO_DOCUMENTO',
        'PARCELA',
        'CLIENTE_NOME',
        'CLIENTE_CNPJ_CPF',
        'DATA_EMISSAO',
        'DATA_VENCIMENTO',
        'VALOR_ORIGINAL_TITULO',
        'TOTAL_RECEBIDO_AMORTIZADO',
        'SALDO_RESTANTE_DEVEDOR',
        'STATUS',
        'DIAS_ATRASO',
        'FORMA_COBRANCA',
        'QTD_BAIXAS_PARCIAIS',
        'ULTIMA_BAIXA_DATA',
      ];

      const rows = financialTitles.map((t) => {
        const totalBaixas = t.historicoBaixas?.length || 0;
        const ultimaBaixa = t.historicoBaixas && t.historicoBaixas.length > 0 ? t.historicoBaixas[t.historicoBaixas.length - 1].dataRecebimento : '';

        return [
          escapeCsv(t.numeroDocumento),
          escapeCsv(t.parcela || '1/1'),
          escapeCsv(t.clienteNome),
          escapeCsv(t.clienteCnpj || ''),
          escapeCsv(t.dataEmissao),
          escapeCsv(t.dataVencimento),
          escapeCsv(t.valorOriginal.toFixed(2)),
          escapeCsv(t.valorRecebido.toFixed(2)),
          escapeCsv(t.saldoRestante.toFixed(2)),
          escapeCsv(t.status),
          escapeCsv(t.diasAtraso),
          escapeCsv(t.formaCobranca || t.formaPagamento || 'Boleto'),
          escapeCsv(totalBaixas),
          escapeCsv(ultimaBaixa),
        ];
      });

      const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
      const filename = `backup_contas_a_receber_${new Date().toISOString().split('T')[0]}.csv`;
      downloadFile(csvContent, filename);

      showToast('Contas a Receber Exportado', `${financialTitles.length} títulos financeiros exportados.`, 'success');
    } catch (err: any) {
      showToast('Erro na Exportação', err.message || 'Falha ao gerar CSV.', 'error');
    }
  };

  // Exportar Fluxo de Contas a Pagar
  const handleExportPayablesCsv = () => {
    try {
      const headers = [
        'NUMERO_DOCUMENTO',
        'FORNECEDOR_NOME',
        'FORNECEDOR_CNPJ',
        'DATA_EMISSAO',
        'DATA_VENCIMENTO',
        'VALOR_ORIGINAL',
        'VALOR_PAGO',
        'SALDO_RESTANTE',
        'STATUS',
        'FORMA_PAGAMENTO',
        'CATEGORIA_DESPESA',
      ];

      const rows = payableTitles.map((t) => [
        escapeCsv(t.numeroDocumento),
        escapeCsv(t.fornecedorNome),
        escapeCsv(t.fornecedorCnpj || ''),
        escapeCsv(t.dataEmissao),
        escapeCsv(t.dataVencimento),
        escapeCsv(t.valorOriginal.toFixed(2)),
        escapeCsv(t.valorPago.toFixed(2)),
        escapeCsv(t.saldoRestante.toFixed(2)),
        escapeCsv(t.status),
        escapeCsv(t.formaPagamento),
        escapeCsv(t.categoriaDespesa || 'Despesa Geral'),
      ]);

      const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
      const filename = `backup_contas_a_pagar_${new Date().toISOString().split('T')[0]}.csv`;
      downloadFile(csvContent, filename);

      showToast('Contas a Pagar Exportado', `${payableTitles.length} títulos a pagar exportados.`, 'success');
    } catch (err: any) {
      showToast('Erro na Exportação', err.message || 'Falha ao gerar CSV.', 'error');
    }
  };

  // =========================================================================
  // 3. PARSER DE ARQUIVOS LEGADOS (CLIPPER / CSV / JSON)
  // =========================================================================

  const parseCsvToObjects = (text: string): Record<string, string>[] => {
    const lines = text
      .split(/\r\n|\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 2) return [];

    const delimiter = lines[0].includes(';') ? ';' : ',';
    const rawHeaders = lines[0].split(delimiter).map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

    const result: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i];
      const regex = new RegExp(`(?:^|${delimiter})(?:\"([^\"]*)\"|([^${delimiter}]*))`, 'g');
      const rowValues: string[] = [];
      let match;
      while ((match = regex.exec(currentLine))) {
        let val = match[1] !== undefined ? match[1] : match[2] !== undefined ? match[2] : '';
        rowValues.push(val.trim());
      }

      if (rowValues.length > 0) {
        const obj: Record<string, string> = {};
        rawHeaders.forEach((header, idx) => {
          obj[header] = rowValues[idx] || '';
        });
        result.push(obj);
      }
    }

    return result;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProgressPct(10);
    setProgressText('Lendo arquivo do disco...');

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const rawContent = e.target?.result as string;
        const isJson = file.name.toLowerCase().endsWith('.json') || rawContent.trim().startsWith('[') || rawContent.trim().startsWith('{');

        let rawData: any[] = [];

        if (isJson) {
          setProgressPct(30);
          setProgressText('Decodificando estrutura JSON...');
          const parsed = JSON.parse(rawContent);
          rawData = Array.isArray(parsed) ? parsed : [parsed];
        } else {
          setProgressPct(30);
          setProgressText('Interpretando linhas CSV...');
          rawData = parseCsvToObjects(rawContent);
        }

        if (rawData.length === 0) {
          throw new Error('Nenhum registro legível encontrado no arquivo.');
        }

        setProgressPct(50);
        setProgressText(`Processando ${rawData.length} registros com validação de Upsert...`);

        if (selectedCategory === 'produtos') {
          const mappedProducts: Partial<Product>[] = rawData.map((item: any) => {
            const codigo = item.codigo || item.codigo_sku || item.codigoSku || item.cod || item.id || '';
            const descricao = item.descricao || item.produto || item.nome || item.nome_produto || 'Produto Sem Nome';
            const unidade = item.unidade || item.und || item.un || 'UN';
            const saldo = Number(item.saldo_estoque ?? item.saldo ?? item.estoque ?? item.estoqueAtual ?? 0);
            const precoCusto = Number(item.preco_custo ?? item.preco_cust ?? item.custo ?? item.precoCusto ?? 0);
            const precoVenda = Number(item.preco_venda ?? item.preco_vend ?? item.venda ?? item.precoTabela?.atacado ?? (precoCusto > 0 ? precoCusto * 1.35 : 10));

            return {
              codigoSku: String(codigo).trim(),
              nome: String(descricao).trim(),
              unidade: String(unidade).toUpperCase() as any,
              estoqueAtual: saldo,
              precoCusto: precoCusto,
              precoTabela: {
                atacado: precoVenda,
                varejo: Number((precoVenda * 1.15).toFixed(2)),
                distribuidor: Number((precoVenda * 0.9).toFixed(2)),
              },
              marca: item.fornecedor || item.marca || 'Distribuidora',
              categoria: item.categoria || 'Legado / Clipper',
              descricao: `Importado de migração legada (${file.name})`,
            };
          });

          setProgressPct(80);
          setProgressText('Gravando produtos no banco de dados local...');
          
          setTimeout(() => {
            const res = bulkUpsertProducts(mappedProducts);
            setProgressPct(100);
            setProgressText(`Concluído! ${res.total} produtos processados.`);
            setLastImportSummary({
              tipo: 'Produtos',
              totalLidos: rawData.length,
              inseridos: res.inserted,
              atualizados: res.updated,
              erros: 0,
              detalhes: [`${res.inserted} novos produtos inseridos`, `${res.updated} produtos existentes atualizados`],
              timestamp: new Date().toLocaleTimeString('pt-BR'),
            });
            setIsProcessing(false);
            showToast('Produtos Importados', `${res.inserted} inseridos, ${res.updated} atualizados com sucesso!`, 'success');
          }, 400);

        } else if (selectedCategory === 'clientes') {
          const mappedClients: Partial<Client>[] = rawData.map((item: any) => {
            const rawDoc = item.documento || item.cgc || item.cpf || item.cnpj || item.cnpjCpf || '';
            const docLimpo = String(rawDoc).replace(/\D/g, '');
            const nome = item.nome_razao_social || item.nome || item.razaoSocial || item.razao_social || item.nomeFantasia || 'Cliente Sem Nome';
            const fone = String(item.telefone || item.fone || item.celular || '').replace(/\D/g, '');
            const enderecoObj = typeof item.endereco === 'object' && item.endereco !== null ? item.endereco : {};

            return {
              razaoSocial: nome,
              nomeFantasia: item.nome_fantasia || item.nomeFantasia || nome,
              cnpjCpf: docLimpo,
              telefone: fone,
              whatsapp: fone,
              endereco: {
                rua: enderecoObj.logradouro || item.ende || item.rua || item.logradouro || 'Endereço Principal',
                numero: enderecoObj.numero || item.numero || 'S/N',
                bairro: enderecoObj.bairro || item.bairro || 'Centro',
                cidade: enderecoObj.cidade || item.cidade || 'Teresina',
                uf: (enderecoObj.uf || item.uf || 'PI').toUpperCase(),
                cep: String(enderecoObj.cep || item.cep || '').replace(/\D/g, ''),
              },
              limiteCredito: Number(item.limiteCredito || item.limite_credito || 5000),
            };
          });

          setProgressPct(80);
          setProgressText('Gravando clientes no banco de dados local...');

          setTimeout(() => {
            const res = bulkUpsertClients(mappedClients);
            setProgressPct(100);
            setProgressText(`Concluído! ${res.total} clientes processados.`);
            setLastImportSummary({
              tipo: 'Clientes',
              totalLidos: rawData.length,
              inseridos: res.inserted,
              atualizados: res.updated,
              erros: 0,
              detalhes: [`${res.inserted} novos clientes cadastrados`, `${res.updated} clientes existentes sincronizados`],
              timestamp: new Date().toLocaleTimeString('pt-BR'),
            });
            setIsProcessing(false);
            showToast('Clientes Importados', `${res.inserted} inseridos, ${res.updated} atualizados com sucesso!`, 'success');
          }, 400);

        } else if (selectedCategory === 'contas_receber') {
          const mappedTitles: Partial<FinancialTitle>[] = rawData.map((item: any) => {
            const numNota = item.numero_nota || item.nota || item.numeroDocumento || item.documento || `TIT-${Math.floor(1000 + Math.random() * 9000)}`;
            const numDoc = item.numero_documento || item.documento || item.parcela || '1/1';
            const clienteNome = item.cliente_nome || item.nome || item.clienteNome || 'Cliente Não Informado';
            const dataVenc = item.data_vencimento || item.vencto || item.dataVencimento || new Date().toISOString().split('T')[0];
            const valorOrig = Number(item.valor_original ?? item.valor ?? 0);
            const totalRec = Number(item.total_recebido ?? item.valorRecebido ?? 0);
            const saldoRest = Number(item.saldo_restante ?? item.saldo ?? Math.max(0, valorOrig - totalRec));

            const histRaw = Array.isArray(item.historico_pagamentos) ? item.historico_pagamentos : [];
            const historicoBaixas = histRaw.map((b: any, idx: number) => ({
              id: `bx-clipper-${Date.now()}-${idx}`,
              dataRecebimento: b.data_pagamento || b.pagto || dataVenc,
              valorRecebido: Number(b.valor_pago || b.valor_parc || 0),
              valorJurosMulta: 0,
              valorDesconto: 0,
              valorLiquidoEfetivo: Number(b.valor_pago || b.valor_parc || 0),
              formaRecebimento: 'Boleto / Clipper',
              reciboNumero: `REC-LEG-${b.nota || numNota}`,
              responsavel: 'Migração Clipper 5.0',
            }));

            return {
              numeroDocumento: numNota,
              parcela: numDoc,
              clienteNome: clienteNome,
              clienteCnpj: item.cliente_documento || item.cliente_codigo || '',
              dataVencimento: dataVenc,
              valorOriginal: valorOrig,
              valor: valorOrig,
              valorRecebido: totalRec || (historicoBaixas.reduce((acc: number, cur: any) => acc + cur.valorRecebido, 0)),
              saldoRestante: saldoRest,
              status: item.status || (saldoRest <= 0 ? 'pago' : totalRec > 0 ? 'parcial' : 'a_vencer'),
              historicoBaixas: historicoBaixas,
              observacoes: `Título importado de CRECEBER/CDRECEBE Clipper.`,
            };
          });

          setProgressPct(80);
          setProgressText('Gravando títulos e histórico de amortizações...');

          setTimeout(() => {
            const res = bulkUpsertFinancialTitles(mappedTitles);
            setProgressPct(100);
            setProgressText(`Concluído! ${res.total} títulos de Contas a Receber processados.`);
            setLastImportSummary({
              tipo: 'Contas a Receber',
              totalLidos: rawData.length,
              inseridos: res.inserted,
              atualizados: res.updated,
              erros: 0,
              detalhes: [`${res.inserted} novos títulos lançados`, `${res.updated} títulos atualizados com amortizações`],
              timestamp: new Date().toLocaleTimeString('pt-BR'),
            });
            setIsProcessing(false);
            showToast('Contas a Receber Importado', `${res.inserted} novos títulos, ${res.updated} atualizados!`, 'success');
          }, 400);
        }
      } catch (err: any) {
        setIsProcessing(false);
        setProgressPct(0);
        showToast('Falha no Processamento', err.message || 'Arquivo com formato inválido.', 'error');
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      setIsProcessing(false);
      setProgressPct(0);
      showToast('Erro de Leitura', 'Não foi possível ler o arquivo selecionado.', 'error');
    };

    reader.readAsText(file, 'utf-8');
  };

  const totalRegistrosSistema =
    products.length +
    clients.length +
    orders.length +
    financialTitles.length +
    payableTitles.length +
    stockEntries.length +
    suppliers.length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header da Tela */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-950/50">
            <HardDriveDownload className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              Backup de Todos os Dados & Migração
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-blue-900/60 text-blue-300 border border-blue-700/50">
                DESKTOP LOCAL
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Gere cópias de segurança completas gravadas diretamente no disco rígido do computador e restaure seus dados a qualquer momento.
            </p>
          </div>
        </div>

        {/* Resumo Rápido de Registros no Banco */}
        <div className="flex items-center gap-3 bg-slate-950/70 px-4 py-2.5 rounded-xl border border-slate-800/80 text-xs">
          <div className="text-center px-2">
            <span className="block text-[10px] text-slate-400 uppercase font-semibold">Empresa</span>
            <span className="font-bold text-slate-200 truncate max-w-[120px] block">
              {issuer.nomeFantasia || issuer.razaoSocial}
            </span>
          </div>
          <div className="w-[1px] h-6 bg-slate-800" />
          <div className="text-center px-2">
            <span className="block text-[10px] text-slate-400 uppercase font-semibold">Total Geral</span>
            <span className="font-bold text-blue-400 font-mono">{totalRegistrosSistema} registros</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SEÇÃO PRINCIPAL: BACKUP COMPLETO DO SISTEMA (GRAVADO NO COMPUTADOR)
         ========================================================================= */}
      <div className="bg-gradient-to-br from-blue-950/50 via-slate-900 to-indigo-950/50 border-2 border-blue-600/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Database className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-black text-white tracking-wide">
                Backup Completo de Todos os Dados da Empresa
              </h2>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Esta rotina compila e salva em um <strong>único arquivo .JSON</strong> 100% dos cadastros e movimentos: <strong className="text-blue-200">Produtos, Estoque, Custos, Clientes, Histórico de Pedidos de Venda, Contas a Receber, Contas a Pagar, Entradas de Mercadorias (XML), Fornecedores, Prestação de Contas, Usuários e Dados Fiscais</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-300">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-950/80 border border-blue-800/60 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Gravado no Disco do Computador (Download)
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950/80 border border-slate-800 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                Armazenado no Ponto Local do Navegador
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-950/80 border border-indigo-800/60 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Restauração 100% Autônoma
              </span>
            </div>
          </div>

          {/* Botões de Ação de Backup e Restauração */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              type="button"
              id="btn-gerar-backup-completo"
              onClick={handleGenerateBackup}
              disabled={isGeneratingBackup}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-blue-950/60 flex items-center justify-center gap-2.5 transition-all transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <HardDriveDownload className={`w-5 h-5 ${isGeneratingBackup ? 'animate-bounce' : ''}`} />
              <span>{isGeneratingBackup ? 'Gerando Backup...' : 'Gerar & Salvar Backup no Computador'}</span>
            </button>

            <input
              type="file"
              ref={backupFileInputRef}
              onChange={handleBackupFileSelect}
              accept=".json,.jmbackup"
              className="hidden"
            />

            <button
              type="button"
              id="btn-restaurar-backup-arquivo"
              onClick={() => backupFileInputRef.current?.click()}
              className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <HardDriveUpload className="w-4 h-4 text-emerald-400" />
              <span>Restaurar Backup do Computador</span>
            </button>
          </div>
        </div>

        {/* Resumo do Conteúdo que vai no Backup */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
            <span className="block text-[10px] text-slate-400 uppercase font-semibold">Produtos</span>
            <span className="text-sm font-bold text-blue-400 font-mono">{products.length}</span>
          </div>
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
            <span className="block text-[10px] text-slate-400 uppercase font-semibold">Clientes</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">{clients.length}</span>
          </div>
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
            <span className="block text-[10px] text-slate-400 uppercase font-semibold">Pedidos Venda</span>
            <span className="text-sm font-bold text-purple-400 font-mono">{orders.length}</span>
          </div>
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
            <span className="block text-[10px] text-slate-400 uppercase font-semibold">Contas a Receber</span>
            <span className="text-sm font-bold text-amber-400 font-mono">{financialTitles.length}</span>
          </div>
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
            <span className="block text-[10px] text-slate-400 uppercase font-semibold">Contas a Pagar</span>
            <span className="text-sm font-bold text-rose-400 font-mono">{payableTitles.length}</span>
          </div>
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
            <span className="block text-[10px] text-slate-400 uppercase font-semibold">Entradas NF-e</span>
            <span className="text-sm font-bold text-cyan-400 font-mono">{stockEntries.length}</span>
          </div>
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
            <span className="block text-[10px] text-slate-400 uppercase font-semibold">Fornecedores</span>
            <span className="text-sm font-bold text-indigo-400 font-mono">{suppliers.length}</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          HISTÓRICO DE BACKUPS SALVOS NESTE COMPUTADOR (SNAPSHOTS LOCAIS)
         ========================================================================= */}
      {localBackupSnapshots.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                Pontos de Backup Gravados neste Computador ({localBackupSnapshots.length})
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">
              Armazenamento local da máquina
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {localBackupSnapshots.map((snap) => (
              <div
                key={snap.id}
                className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileJson className="w-4 h-4 text-blue-400 shrink-0" />
                      <h3 className="text-xs font-bold text-slate-200 truncate" title={snap.nomeArquivo}>
                        {snap.nomeArquivo}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">
                      {snap.tamanhoKb} KB
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-2">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{snap.geradoEm}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-500 block">Produtos</span>
                      <strong className="text-blue-400 font-mono">{snap.totalProdutos}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Clientes</span>
                      <strong className="text-emerald-400 font-mono">{snap.totalClientes}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Pedidos</span>
                      <strong className="text-purple-400 font-mono">{snap.totalPedidos}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => downloadLocalBackupSnapshot(snap.id)}
                    title="Baixar arquivo novamente para o computador"
                    className="flex-1 py-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 border border-blue-800/60 text-blue-300 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all"
                  >
                    <Download className="w-3 h-3" />
                    <span>Baixar Arquivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRestoreFromSnapshot(snap)}
                    title="Restaurar dados a partir deste ponto"
                    className="flex-1 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Restaurar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteLocalBackupSnapshot(snap.id)}
                    title="Remover ponto de backup local"
                    className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/60 text-rose-400 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          SEÇÕES SECUNDÁRIAS: EXPORTAÇÃO EM CSV E CARGA DO SISTEMA ANTIGO
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SEÇÃO 2: ROTINA DE EXPORTAÇÃO EM CSV */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                  Exportações Individuais para Excel / CSV
                </h2>
              </div>
              <span className="text-[11px] text-emerald-300 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-md font-medium">
                Planilhas Formatadas
              </span>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Exporte tabelas específicas em formato <strong>.CSV</strong> para abrir no Excel, LibreOffice ou enviar para contabilidade externa.
            </p>

            <div className="space-y-2.5">
              {/* Estoque */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-400">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-200">Estoque de Produtos</h3>
                    <p className="text-[10px] text-slate-400">{products.length} itens (Custos, Preços e Saldos)</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportStockCsv}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  .CSV
                </button>
              </div>

              {/* Vendas */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-200">Histórico de Pedidos de Venda</h3>
                    <p className="text-[10px] text-slate-400">{orders.length} pedidos emitidos</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportOrdersCsv}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  .CSV
                </button>
              </div>

              {/* Contas a Receber */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400">
                    <ArrowDownLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-200">Contas a Receber & Baixas</h3>
                    <p className="text-[10px] text-slate-400">{financialTitles.length} títulos de clientes</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportReceivablesCsv}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  .CSV
                </button>
              </div>

              {/* Contas a Pagar */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-200">Contas a Pagar & Despesas</h3>
                    <p className="text-[10px] text-slate-400">{payableTitles.length} títulos a pagar</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportPayablesCsv}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  .CSV
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Delimitador ponto-e-vírgula (;)
            </span>
            <span>BOM UTF-8 Automático</span>
          </div>
        </div>

        {/* SEÇÃO 3: ROTINA DE CARGA LEGADA (CLIPPER / CSV / JSON) COM UPSERT */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <HardDriveUpload className="w-5 h-5 text-indigo-400" />
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                  Carga Legada (Clipper 5.0 / JSON / CSV)
                </h2>
              </div>
              <span className="text-[11px] text-indigo-300 bg-indigo-950/80 border border-indigo-800/60 px-2 py-0.5 rounded-md font-medium">
                Upsert Inteligente
              </span>
            </div>

            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              Importe cadastros de sistemas antigos. O sistema faz <em>Upsert automático</em>: atualiza existentes ou insere novos.
            </p>

            {/* Seletor de Categoria */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setSelectedCategory('produtos')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all text-xs font-semibold ${
                  selectedCategory === 'produtos'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Produtos</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('clientes')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all text-xs font-semibold ${
                  selectedCategory === 'clientes'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Clientes</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('contas_receber')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all text-xs font-semibold ${
                  selectedCategory === 'contas_receber'
                    ? 'bg-amber-600/20 border-amber-500 text-amber-300 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>A Receber</span>
              </button>
            </div>

            {/* Upload Area */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json,.csv"
              className="hidden"
            />

            <div
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isProcessing
                  ? 'border-indigo-500/50 bg-indigo-950/20 cursor-not-allowed'
                  : 'border-slate-700 hover:border-indigo-500 bg-slate-950/60 hover:bg-indigo-950/10'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-indigo-400 mb-2">
                {isProcessing ? (
                  <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                ) : (
                  <UploadCloud className="w-5 h-5" />
                )}
              </div>
              <p className="text-xs font-bold text-slate-200 mb-0.5">
                {isProcessing
                  ? 'Processando carga de registros...'
                  : `Carregar arquivo de ${selectedCategory.toUpperCase()} (.JSON ou .CSV)`}
              </p>
              <p className="text-[10px] text-slate-400">
                Suporta formato do script Python Clipper e planilhas estruturadas.
              </p>
            </div>

            {/* Resumo da Última Carga */}
            {lastImportSummary && !isProcessing && (
              <div className="mt-3 p-3 bg-emerald-950/30 border border-emerald-800/60 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Carga Concluída: {lastImportSummary.tipo}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {lastImportSummary.timestamp}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-emerald-900/40 text-[10px]">
                  <div>
                    <span className="text-slate-400 block">Lidos</span>
                    <strong className="text-slate-200 font-mono">{lastImportSummary.totalLidos}</strong>
                  </div>
                  <div>
                    <span className="text-emerald-400 block">Novos</span>
                    <strong className="text-emerald-400 font-mono">{lastImportSummary.inseridos}</strong>
                  </div>
                  <div>
                    <span className="text-blue-400 block">Atualizados</span>
                    <strong className="text-blue-400 font-mono">{lastImportSummary.atualizados}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Proteção contra duplicidades
            </span>
            <span>UTF-8 & CP850</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SEÇÃO 4: RESET DE BANCO DE DADOS / BASE 100% LIMPA
         ========================================================================= */}
      <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-5 backdrop-blur-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-rose-200 uppercase tracking-wider flex items-center gap-2">
                Zona de Implantação: Resetar para Base 100% Limpa
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono">
                  PRODUÇÃO
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Limpa todos os dados das tabelas, deixando a base zerada para implantação de uma nova empresa real. (Recomenda-se gerar um backup antes).
              </p>
            </div>
          </div>

          {!showConfirmReset ? (
            <button
              type="button"
              onClick={() => setShowConfirmReset(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-900/40 hover:bg-rose-800/60 border border-rose-700/60 text-rose-200 text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Zerar Tabelas da Base</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 shrink-0 animate-fadeIn">
              <button
                type="button"
                onClick={() => setShowConfirmReset(false)}
                className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  resetDatabaseToEmpty();
                  setShowConfirmReset(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-950/60 flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Sim, Confirmar Limpeza Total</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          MODAL DE PRÉ-VISUALIZAÇÃO E CONFIRMAÇÃO DE RESTAURAÇÃO
         ========================================================================= */}
      {backupRestorePreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                  <HardDriveUpload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Confirmar Restauração de Backup
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Arquivo: <strong className="text-slate-200">{backupRestorePreview.fileName}</strong> ({backupRestorePreview.fileSizeKb} KB)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBackupRestorePreview(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Detalhes do Conteúdo do Arquivo */}
            <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-xs">
              <div className="grid grid-cols-2 gap-2 text-[11px] pb-3 border-b border-slate-800">
                <div>
                  <span className="text-slate-500 block">Empresa de Origem:</span>
                  <strong className="text-slate-200">{backupRestorePreview.empresaNome}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Data de Criação:</span>
                  <strong className="text-slate-200">{backupRestorePreview.geradoEm}</strong>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Registros que Serão Carregados:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Produtos:</span>
                    <strong className="text-blue-400 font-mono">{backupRestorePreview.totalProdutos}</strong>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Clientes:</span>
                    <strong className="text-emerald-400 font-mono">{backupRestorePreview.totalClientes}</strong>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Pedidos de Venda:</span>
                    <strong className="text-purple-400 font-mono">{backupRestorePreview.totalPedidos}</strong>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Contas a Receber:</span>
                    <strong className="text-amber-400 font-mono">{backupRestorePreview.totalReceber}</strong>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Contas a Pagar:</span>
                    <strong className="text-rose-400 font-mono">{backupRestorePreview.totalPagar}</strong>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Fornecedores:</span>
                    <strong className="text-indigo-400 font-mono">{backupRestorePreview.totalFornecedores}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-xl text-[11px] text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p>
                A restauração substituirá os dados atuais da empresa pelos dados contidos neste arquivo de backup.
              </p>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBackupRestorePreview(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className={`w-4 h-4 ${isRestoring ? 'animate-spin' : ''}`} />
                <span>{isRestoring ? 'Restaurando...' : 'Confirmar & Restaurar Dados'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
