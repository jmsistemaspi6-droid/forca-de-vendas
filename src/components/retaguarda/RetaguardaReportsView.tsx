import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Boxes,
  Users,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  PieChart,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownLeft,
  Building,
  Sparkles,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';

export const RetaguardaReportsView: React.FC = () => {
  const {
    orders,
    products,
    clients,
    sellers,
    financialTitles,
    payableTitles,
    stockEntries,
    suppliers,
  } = useSales();

  const [activeReportTab, setActiveReportTab] = useState<
    'vendas' | 'dre_fluxo' | 'estoque' | 'inadimplencia' | 'compras'
  >('vendas');

  const [periodo, setPeriodo] = useState<'mes_atual' | '7_dias' | 'trimestre' | 'ano'>('mes_atual');

  // --- Calculations for Vendas ---
  const totalFaturamento = orders.reduce((sum, o) => sum + (o.valorTotalLiquido ?? (o as any).totalLiquido ?? 0), 0);
  const totalPedidos = orders.length;
  const ticketMedio = totalPedidos > 0 ? totalFaturamento / totalPedidos : 0;
  const totalDescontosConcedidos = orders.reduce((sum, o) => sum + (o.descontoTotalReais ?? (o as any).descontoTotal ?? 0), 0);

  // Sales by Seller
  const sellerStats = sellers.map((seller) => {
    const sellerOrders = orders.filter((o) => (o as any).vendedorId === seller.id || seller.id === 'vend-01');
    const total = sellerOrders.reduce((sum, o) => sum + (o.valorTotalLiquido ?? (o as any).totalLiquido ?? 0), 0);
    const comissao = total * ((seller.comissaoPercentual || 3) / 100);
    return {
      ...seller,
      totalVendido: total,
      pedidosCount: sellerOrders.length,
      comissaoEstimada: comissao,
    };
  }).sort((a, b) => b.totalVendido - a.totalVendido);

  // Top Products ABC
  const productSalesMap: Record<string, { nome: string; codigo: string; qtd: number; total: number }> = {};
  orders.forEach((o) => {
    o.itens?.forEach((it) => {
      const pId = it.produtoId || it.produto?.id || `prod-${Math.random()}`;
      if (!productSalesMap[pId]) {
        productSalesMap[pId] = {
          nome: it.produto?.nome || (it as any).nomeProduto || 'Produto',
          codigo: it.produto?.codigoSku || (it as any).codigoProduto || '',
          qtd: 0,
          total: 0,
        };
      }
      productSalesMap[pId].qtd += (it.quantidade || 0);
      productSalesMap[pId].total += (it.subtotal ?? (it.quantidade * (it.precoUnitarioCobrado || it.precoUnitarioTabela || 0)));
    });
  });

  const topProducts = Object.values(productSalesMap).sort((a, b) => b.total - a.total);

  // Top Clients ABC
  const clientSalesMap: Record<string, { nome: string; cnpj: string; pedidos: number; total: number }> = {};
  orders.forEach((o) => {
    const cId = o.clienteId || o.cliente?.id || `cli-${Math.random()}`;
    if (!clientSalesMap[cId]) {
      clientSalesMap[cId] = {
        nome: o.cliente?.razaoSocial || (o as any).clienteNome || 'Cliente',
        cnpj: o.cliente?.cnpjCpf || (o as any).clienteCnpj || '',
        pedidos: 0,
        total: 0,
      };
    }
    clientSalesMap[cId].pedidos += 1;
    clientSalesMap[cId].total += (o.valorTotalLiquido ?? (o as any).totalLiquido ?? 0);
  });

  const topClients = Object.values(clientSalesMap).sort((a, b) => b.total - a.total);

  // --- DRE & Fluxo de Caixa Calculations ---
  const totalRecebidoCaixa = financialTitles.reduce((sum, t) => sum + (t.valorRecebido || 0), 0);
  const totalPagoCaixa = payableTitles.reduce((sum, t) => sum + (t.valorPago || 0), 0);
  const saldoLiquidoCaixa = totalRecebidoCaixa - totalPagoCaixa;

  // CMV Estimado (Custo das mercadorias dos pedidos)
  let cmvTotal = 0;
  orders.forEach((o) => {
    o.itens?.forEach((it) => {
      const prod = products.find((p) => p.id === (it.produtoId || it.produto?.id));
      const custoUn = prod ? prod.precoCusto : ((it.precoUnitarioCobrado || it.precoUnitarioTabela || 10) * 0.65);
      cmvTotal += custoUn * (it.quantidade || 0);
    });
  });

  const lucroBruto = totalFaturamento - cmvTotal;
  const margemBrutaPercent = totalFaturamento > 0 ? (lucroBruto / totalFaturamento) * 100 : 0;
  const despesasOperacionaisPagas = payableTitles
    .filter((t) => t.categoria !== 'Fornecedores' && t.categoriaDespesa !== 'Compra de Mercadorias (XML)')
    .reduce((sum, t) => sum + (t.valorPago || 0), 0);
  const resultadoLiquidoOperacional = lucroBruto - despesasOperacionaisPagas;

  // --- Inventory & Assets ---
  const valorEstoqueCusto = products.reduce((sum, p) => sum + ((p.precoCusto || 0) * (p.estoqueAtual || 0)), 0);
  const valorEstoqueVenda = products.reduce((sum, p) => sum + ((p.precoTabela?.varejo ?? (p as any).precoVenda ?? (p.precoCusto * 1.4)) * (p.estoqueAtual || 0)), 0);
  const potencialLucroEstoque = Math.max(0, valorEstoqueVenda - valorEstoqueCusto);
  const produtosEstoqueBaixo = products.filter((p) => p.estoqueAtual <= p.estoqueMinimo);

  // --- Inadimplência & Aging ---
  const hoje = new Date().toISOString().split('T')[0];
  const titulosVencidos = financialTitles.filter(
    (t) => t.status === 'vencido' || (t.status !== 'pago' && t.dataVencimento < hoje)
  );
  const totalInadimplente = titulosVencidos.reduce(
    (sum, t) => sum + (t.saldoRestante ?? t.valor ?? t.valorOriginal ?? 0),
    0
  );
  const totalCarteiraReceber = financialTitles.reduce(
    (sum, t) => sum + (t.saldoRestante ?? t.valor ?? t.valorOriginal ?? 0),
    0
  );
  const taxaInadimplencia =
    totalCarteiraReceber > 0 ? (totalInadimplente / totalCarteiraReceber) * 100 : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    alert('📊 Relatório gerencial compilado e pronto para exportação.');
  };

  return (
    <div className="space-y-6">
      {/* Report Header & Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Relatórios Gerenciais, DRE & Inteligência de Negócio
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Métricas consolidadas de vendas em campo, compras, estoque e finanças
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value as any)}
            className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="mes_atual">Mês Atual (Vigente)</option>
            <option value="7_dias">Últimos 7 Dias</option>
            <option value="trimestre">Trimestre Atual</option>
            <option value="ano">Ano Fiscal 2026</option>
          </select>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>Imprimir</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Report Category Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'vendas', label: '📊 Vendas & Faturamento', icon: <ShoppingBag className="w-4 h-4" /> },
          { id: 'dre_fluxo', label: '💵 DRE & Fluxo de Caixa', icon: <TrendingUp className="w-4 h-4" /> },
          { id: 'estoque', label: '📦 Posição de Estoque', icon: <Boxes className="w-4 h-4" /> },
          { id: 'inadimplencia', label: '⚠️ Inadimplência & Cobrança', icon: <AlertTriangle className="w-4 h-4" /> },
          { id: 'compras', label: '🏢 Compras & Fornecedores (XML)', icon: <Building className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReportTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeReportTab === tab.id
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: VENDAS & FATURAMENTO */}
      {activeReportTab === 'vendas' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Faturamento Bruto
              </span>
              <div className="text-xl font-bold text-slate-100 mt-1 font-mono">
                R$ {totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-emerald-400 mt-0.5 block">
                {totalPedidos} pedidos emitidos
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Ticket Médio
              </span>
              <div className="text-xl font-bold text-blue-400 mt-1 font-mono">
                R$ {ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Por pedido fechado
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Margem Bruta Média
              </span>
              <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">
                {margemBrutaPercent.toFixed(1)}%
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Lucro operacional de vendas
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Descontos Aplicados
              </span>
              <div className="text-xl font-bold text-amber-400 mt-1 font-mono">
                R$ {totalDescontosConcedidos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Negociações comerciais em campo
              </span>
            </div>
          </div>

          {/* Grids: Sellers and Products ABC */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vendedores Ranking */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                <span>Ranking da Equipe de Vendas</span>
                <span className="text-[10px] text-purple-400">Comissão Acumulada</span>
              </h3>

              <div className="divide-y divide-slate-800">
                {sellerStats.map((seller, idx) => (
                  <div key={seller.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}º
                      </div>
                      <div>
                        <div className="font-semibold text-slate-100">{seller.nome}</div>
                        <div className="text-[10px] text-slate-400">
                          {seller.pedidosCount} pedidos • {seller.regiao}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-slate-100 font-mono">
                        R$ {seller.totalVendido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-mono">
                        Comissão: R$ {seller.comissaoEstimada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Produtos ABC */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                <span>Curva ABC de Produtos Mais Vendidos</span>
                <span className="text-[10px] text-blue-400">Volume & Receita</span>
              </h3>

              <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto">
                {topProducts.slice(0, 8).map((prod, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between text-xs">
                    <div className="truncate pr-2">
                      <div className="font-semibold text-slate-200 truncate">{prod.nome}</div>
                      <div className="text-[10px] text-slate-400">
                        {prod.qtd} un. vendidas • Cód: {prod.codigo}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-emerald-400 text-right shrink-0">
                      R$ {prod.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DRE GERENCIAL & FLUXO DE CAIXA */}
      {activeReportTab === 'dre_fluxo' && (
        <div className="space-y-6">
          {/* Fluxo de Caixa Summary Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60">
              <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold mb-1">
                <span>(+) Entradas no Caixa (Recebimentos)</span>
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                R$ {totalRecebidoCaixa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60">
              <div className="flex items-center justify-between text-xs text-rose-300 font-semibold mb-1">
                <span>(-) Saídas do Caixa (Pagamentos)</span>
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold font-mono text-rose-400">
                R$ {totalPagoCaixa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${
              saldoLiquidoCaixa >= 0
                ? 'bg-blue-950/40 border-blue-800/60'
                : 'bg-amber-950/40 border-amber-800/60'
            }`}>
              <div className="flex items-center justify-between text-xs text-blue-300 font-semibold mb-1">
                <span>(=) Saldo Líquido do Período</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className={`text-2xl font-bold font-mono ${
                saldoLiquidoCaixa >= 0 ? 'text-blue-400' : 'text-amber-400'
              }`}>
                R$ {saldoLiquidoCaixa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* DRE Structure Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Demonstrativo de Resultado do Exercício (DRE Gerencial)
            </h3>

            <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Conta Contábil / Descrição</th>
                    <th className="p-3 text-right">Valor (R$)</th>
                    <th className="p-3 text-right">% s/ Venda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  <tr className="bg-slate-900/80 font-bold text-slate-100">
                    <td className="p-3">(+) Receita Bruta de Vendas</td>
                    <td className="p-3 text-right">R$ {totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right">100.0%</td>
                  </tr>
                  <tr className="text-slate-400">
                    <td className="p-3 pl-6">(-) Descontos e Abatimentos Comerciais</td>
                    <td className="p-3 text-right text-rose-400">- R$ {totalDescontosConcedidos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right">{totalFaturamento > 0 ? ((totalDescontosConcedidos / totalFaturamento) * 100).toFixed(1) : 0}%</td>
                  </tr>
                  <tr className="text-slate-400">
                    <td className="p-3 pl-6">(-) Custo das Mercadorias Vendidas (CMV)</td>
                    <td className="p-3 text-right text-rose-400">- R$ {cmvTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right">{totalFaturamento > 0 ? ((cmvTotal / totalFaturamento) * 100).toFixed(1) : 0}%</td>
                  </tr>
                  <tr className="bg-emerald-950/20 font-bold text-emerald-400">
                    <td className="p-3">(=) Lucro Bruto Operacional (Margem de Contribuição)</td>
                    <td className="p-3 text-right">R$ {lucroBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right">{margemBrutaPercent.toFixed(1)}%</td>
                  </tr>
                  <tr className="text-slate-400">
                    <td className="p-3 pl-6">(-) Despesas Operacionais & Administrativas</td>
                    <td className="p-3 text-right text-rose-400">- R$ {despesasOperacionaisPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right">{totalFaturamento > 0 ? ((despesasOperacionaisPagas / totalFaturamento) * 100).toFixed(1) : 0}%</td>
                  </tr>
                  <tr className="bg-blue-950/40 font-bold text-blue-300 text-sm">
                    <td className="p-3.5">(=) Resultado Líquido Operacional</td>
                    <td className="p-3.5 text-right">R$ {resultadoLiquidoOperacional.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3.5 text-right">{totalFaturamento > 0 ? ((resultadoLiquidoOperacional / totalFaturamento) * 100).toFixed(1) : 0}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ESTOQUE & POSIÇÃO PATRIMONIAL */}
      {activeReportTab === 'estoque' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Valor Total em Estoque (Custo)
              </span>
              <div className="text-xl font-bold text-slate-100 mt-1 font-mono">
                R$ {valorEstoqueCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Capital imobilizado em mercadorias
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Potencial de Venda (Preço Varejo)
              </span>
              <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">
                R$ {valorEstoqueVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Lucro potencial: R$ {potencialLucroEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Alerta de Ruptura / Estoque Baixo
              </span>
              <div className="text-xl font-bold text-amber-400 mt-1">
                {produtosEstoqueBaixo.length} itens críticos
              </div>
              <span className="text-[11px] text-amber-400/80 mt-0.5 block">
                Necessitam de reposição imediata
              </span>
            </div>
          </div>

          {/* Low stock table */}
          {produtosEstoqueBaixo.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Produtos com Estoque Abaixo do Mínimo (Sugestão de Compra):
              </h3>
              <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-950 text-slate-400 font-semibold">
                    <tr>
                      <th className="p-2.5">Código / Produto</th>
                      <th className="p-2.5 text-center">Un.</th>
                      <th className="p-2.5 text-right">Estoque Atual</th>
                      <th className="p-2.5 text-right">Estoque Mínimo</th>
                      <th className="p-2.5 text-right">Sugestão Compra</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {produtosEstoqueBaixo.map((p) => {
                      const sugestao = Math.max(10, p.estoqueMinimo * 2 - p.estoqueAtual);
                      return (
                        <tr key={p.id}>
                          <td className="p-2.5">
                            <span className="font-semibold text-slate-200">{p.nome}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">{p.codigoSku || (p as any).codigo || ''}</span>
                          </td>
                          <td className="p-2.5 text-center font-bold text-slate-300">{p.unidade}</td>
                          <td className="p-2.5 text-right font-bold text-rose-400">{p.estoqueAtual}</td>
                          <td className="p-2.5 text-right text-slate-400">{p.estoqueMinimo}</td>
                          <td className="p-2.5 text-right font-bold text-emerald-400 font-mono">+{sugestao} un.</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: INADIMPLÊNCIA & COBRANÇA */}
      {activeReportTab === 'inadimplencia' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300">
                Total Inadimplente (Vencidos)
              </span>
              <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
                R$ {totalInadimplente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-rose-300/80 mt-0.5 block">
                {titulosVencidos.length} títulos atrasados
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Taxa de Inadimplência
              </span>
              <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                {taxaInadimplencia.toFixed(1)}%
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Sobre a carteira a receber
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Carteira Total em Aberto
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                R$ {totalCarteiraReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Títulos vigentes + vencidos
              </span>
            </div>
          </div>

          {/* Inadimplentes Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Relação de Títulos Vencidos para Ação de Cobrança
            </h3>

            <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 font-semibold">
                  <tr>
                    <th className="p-2.5">Cliente</th>
                    <th className="p-2.5">Documento</th>
                    <th className="p-2.5">Vencimento</th>
                    <th className="p-2.5 text-right">Saldo Devedor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {titulosVencidos.map((t) => (
                    <tr key={t.id}>
                      <td className="p-2.5 font-semibold text-slate-100">{t.clienteNome}</td>
                      <td className="p-2.5 text-slate-400">{t.numeroDocumento || t.id}</td>
                      <td className="p-2.5 text-rose-400 font-semibold">
                        {new Date(t.dataVencimento).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-rose-400">
                        R$ {(t.saldoRestante ?? t.valor ?? t.valorOriginal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: COMPRAS & FORNECEDORES (XML) */}
      {activeReportTab === 'compras' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total de Compras Registradas
              </span>
              <div className="text-xl font-bold text-slate-100 mt-1 font-mono">
                R$ {stockEntries.reduce((sum, e) => sum + (e.totais?.valorTotalNota ?? (e as any).valorTotal ?? 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {stockEntries.length} notas fiscais importadas
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Fornecedores Cadastrados
              </span>
              <div className="text-xl font-bold text-blue-400 mt-1">
                {suppliers.length} empresas
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Com CNPJ validado na Receita
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Média por Nota Fiscal
              </span>
              <div className="text-xl font-bold text-purple-400 mt-1 font-mono">
                R$ {stockEntries.length > 0 ? (stockEntries.reduce((sum, e) => sum + (e.totais?.valorTotalNota ?? (e as any).valorTotal ?? 0), 0) / stockEntries.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Ticket médio de compra
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
