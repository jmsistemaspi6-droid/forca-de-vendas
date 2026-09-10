// Parser profissional de XML de NF-e (Nota Fiscal Eletrônica - Modelo 55 e 65)
// Compatível com padrão SEFAZ Brasil

import { StockEntry, StockEntryItem, StockEntryDuplicate } from '../types';

export interface ParsedNFeResult {
  chaveAcesso: string;
  numeroNota: string;
  serie: string;
  naturezaOperacao: string;
  dataEmissao: string;
  dataEmissaoFormatada: string;
  fornecedor: {
    cnpjCpf: string;
    razaoSocial: string;
    nomeFantasia: string;
    inscricaoEstadual: string;
    telefone: string;
    email?: string;
    endereco: {
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      municipio: string;
      uf: string;
      cep: string;
    };
  };
  destinatario: {
    cnpjCpf: string;
    razaoSocial: string;
  };
  totais: {
    valorProdutos: number;
    valorFrete: number;
    valorSeguro: number;
    valorDesconto: number;
    valorIpi: number;
    valorIcmsSt: number;
    valorOutrasDespesas: number;
    valorTotalNota: number;
  };
  itens: StockEntryItem[];
  duplicatas: StockEntryDuplicate[];
  xmlOriginal: string;
}

// Helper para obter texto de tag XML com segurança
function getTagText(parent: Element | Document, tagName: string): string {
  const el = parent.getElementsByTagName(tagName)[0];
  return el?.textContent?.trim() || '';
}

function getTagNumber(parent: Element | Document, tagName: string): number {
  const txt = getTagText(parent, tagName);
  if (!txt) return 0;
  const num = parseFloat(txt.replace(',', '.'));
  return isNaN(num) ? 0 : num;
}

export function parseNFeXml(xmlString: string): ParsedNFeResult {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

  // Checa se houve erro de parsing XML
  const parserError = xmlDoc.getElementsByTagName('parsererror')[0];
  if (parserError) {
    throw new Error('Arquivo XML inválido ou corrompido. Certifique-se de selecionar um XML de NF-e válido.');
  }

  // Tenta localizar a tag infNFe
  const infNFe = xmlDoc.getElementsByTagName('infNFe')[0];
  if (!infNFe) {
    // Tenta verificar se é NFeProc
    const nfeProc = xmlDoc.getElementsByTagName('NFe')[0];
    if (!nfeProc) {
      throw new Error('O arquivo não parece ser uma NF-e (Nota Fiscal Eletrônica) autorizada pela SEFAZ.');
    }
  }

  // Chave de acesso
  let chaveAcesso = '';
  if (infNFe) {
    const idAttr = infNFe.getAttribute('Id') || '';
    chaveAcesso = idAttr.replace(/^NFe/, '').trim();
  }
  if (!chaveAcesso) {
    chaveAcesso = getTagText(xmlDoc, 'chNFe');
  }
  if (!chaveAcesso) {
    // Gerar uma chave simulada com 44 dígitos se for XML de homologação/sem ID
    chaveAcesso = `3524${Math.floor(10000000000000000000 + Math.random() * 90000000000000000000).toString().slice(0, 40)}`;
  }

  // Identificação da Nota (<ide>)
  const ideEl = xmlDoc.getElementsByTagName('ide')[0] || xmlDoc;
  const numeroNota = getTagText(ideEl, 'nNF') || '000000';
  const serie = getTagText(ideEl, 'serie') || '1';
  const naturezaOperacao = getTagText(ideEl, 'natOp') || 'COMPRA PARA INDUSTRIALIZAÇÃO OU COMERCIALIZAÇÃO';
  
  let dataEmissaoRaw = getTagText(ideEl, 'dhEmi') || getTagText(ideEl, 'dEmi') || new Date().toISOString();
  let dataEmissaoDate = new Date(dataEmissaoRaw);
  if (isNaN(dataEmissaoDate.getTime())) {
    dataEmissaoDate = new Date();
  }
  const dataEmissao = dataEmissaoDate.toISOString().split('T')[0];
  const dataEmissaoFormatada = dataEmissaoDate.toLocaleDateString('pt-BR');

  // Emitente / Fornecedor (<emit>)
  const emitEl = xmlDoc.getElementsByTagName('emit')[0] || xmlDoc;
  const emitCnpj = getTagText(emitEl, 'CNPJ') || getTagText(emitEl, 'CPF');
  const emitRazao = getTagText(emitEl, 'xNome') || 'Fornecedor Identificado';
  const emitFantasia = getTagText(emitEl, 'xFant') || emitRazao;
  const emitIE = getTagText(emitEl, 'IE');

  const enderEmit = emitEl.getElementsByTagName('enderEmit')[0] || emitEl;
  const emitLogradouro = getTagText(enderEmit, 'xLgr');
  const emitNumero = getTagText(enderEmit, 'nro');
  const emitComplemento = getTagText(enderEmit, 'xCpl');
  const emitBairro = getTagText(enderEmit, 'xBairro');
  const emitMun = getTagText(enderEmit, 'xMun');
  const emitUF = getTagText(enderEmit, 'UF');
  const emitCEP = getTagText(enderEmit, 'CEP');
  const emitFone = getTagText(enderEmit, 'fone');

  // Destinatário (<dest>)
  const destEl = xmlDoc.getElementsByTagName('dest')[0] || xmlDoc;
  const destCnpj = getTagText(destEl, 'CNPJ') || getTagText(destEl, 'CPF');
  const destRazao = getTagText(destEl, 'xNome') || 'Nossa Empresa / Distribuidora';

  // Totais da Nota (<total><ICMSTot>)
  const icmsTot = xmlDoc.getElementsByTagName('ICMSTot')[0] || xmlDoc;
  const valorProdutos = getTagNumber(icmsTot, 'vProd');
  const valorFrete = getTagNumber(icmsTot, 'vFrete');
  const valorSeguro = getTagNumber(icmsTot, 'vSeg');
  const valorDesconto = getTagNumber(icmsTot, 'vDesc');
  const valorIpi = getTagNumber(icmsTot, 'vIPI');
  const valorIcmsSt = getTagNumber(icmsTot, 'vST');
  const valorOutrasDespesas = getTagNumber(icmsTot, 'vOutro');
  let valorTotalNota = getTagNumber(icmsTot, 'vNF');
  if (!valorTotalNota && valorProdutos > 0) {
    valorTotalNota = valorProdutos + valorFrete + valorIpi + valorIcmsSt + valorOutrasDespesas - valorDesconto;
  }

  // Itens da Nota (<det>)
  const detElements = xmlDoc.getElementsByTagName('det');
  const itens: StockEntryItem[] = [];

  for (let i = 0; i < detElements.length; i++) {
    const det = detElements[i];
    const prod = det.getElementsByTagName('prod')[0] || det;

    const codigoProd = getTagText(prod, 'cProd') || `ITEM-${i + 1}`;
    let cEAN = getTagText(prod, 'cEAN');
    if (cEAN === 'SEM GTIN' || cEAN === 'SEM EAN') cEAN = '';
    
    const descricao = getTagText(prod, 'xProd') || 'Produto sem descrição';
    const ncm = getTagText(prod, 'NCM') || '0000.00.00';
    const cfop = getTagText(prod, 'CFOP') || '5102';
    const rawUnidade = (getTagText(prod, 'uCom') || 'UN').trim().toUpperCase();
    let unidade = 'UN';
    if (['UND', 'UNID', 'PC', 'PÇ', 'UN'].includes(rawUnidade)) {
      unidade = 'UN';
    } else if (['CX', 'CAIXA'].includes(rawUnidade)) {
      unidade = 'CX';
    } else if (['KG', 'KILO', 'QUILO'].includes(rawUnidade)) {
      unidade = 'KG';
    } else if (['PCT', 'PACOTE', 'PAC'].includes(rawUnidade)) {
      unidade = 'PCT';
    } else if (['FD', 'FARDO'].includes(rawUnidade)) {
      unidade = 'FD';
    } else if (['LT', 'L', 'LITRO'].includes(rawUnidade)) {
      unidade = 'LT';
    } else {
      unidade = 'UN';
    }
    const quantidade = getTagNumber(prod, 'qCom') || 1;
    const valorUnitario = getTagNumber(prod, 'vUnCom') || 0;
    const valorTotalBruto = getTagNumber(prod, 'vProd') || (quantidade * valorUnitario);

    // Impostos & Rateios do Item
    const impostoEl = det.getElementsByTagName('imposto')[0] || det;
    const ipiEl = impostoEl.getElementsByTagName('IPI')[0];
    const itemIpi = ipiEl ? getTagNumber(ipiEl, 'vIPI') : 0;

    const icmsEl = impostoEl.getElementsByTagName('ICMS')[0];
    const itemIcmsSt = icmsEl ? getTagNumber(icmsEl, 'vICMSST') || getTagNumber(icmsEl, 'vST') : 0;

    const itemFrete = getTagNumber(prod, 'vFrete');
    const itemDesconto = getTagNumber(prod, 'vDesc');

    // Custo Unitário Efetivo Calculado
    const custoTotalItem = valorTotalBruto + itemIpi + itemIcmsSt + itemFrete - itemDesconto;
    const custoUnitarioCalculado = quantidade > 0 ? Number((custoTotalItem / quantidade).toFixed(2)) : valorUnitario;

    itens.push({
      id: `xml-item-${Date.now()}-${i}`,
      codigoProdutoFornecedor: codigoProd,
      codigoBarrasEan: cEAN || undefined,
      descricaoFornecedor: descricao,
      ncm,
      cfop,
      unidade,
      quantidade,
      valorUnitario,
      valorTotalBruto,
      valorIpi: itemIpi,
      valorIcmsSt: itemIcmsSt,
      valorFreteRateio: itemFrete,
      valorDescontoItem: itemDesconto,
      custoUnitarioCalculado,
      margemLucroSugeridaPct: 40,
      novoPrecoVendaSugerido: Number((custoUnitarioCalculado * 1.4).toFixed(2)),
    });
  }

  // Cobrança & Duplicatas (<cobr><dup>)
  const duplicatas: StockEntryDuplicate[] = [];
  const dupElements = xmlDoc.getElementsByTagName('dup');

  for (let i = 0; i < dupElements.length; i++) {
    const dup = dupElements[i];
    const nDup = getTagText(dup, 'nDup') || `${i + 1}/${dupElements.length}`;
    let dVenc = getTagText(dup, 'dVenc');
    if (!dVenc) {
      const d = new Date();
      d.setDate(d.getDate() + 30 * (i + 1));
      dVenc = d.toISOString().split('T')[0];
    }
    const vDup = getTagNumber(dup, 'vDup') || (valorTotalNota / (dupElements.length || 1));

    duplicatas.push({
      numeroDuplicata: nDup,
      dataVencimento: dVenc,
      valorDuplicata: Number(vDup.toFixed(2)),
    });
  }

  // Se não houver duplicata no XML mas tiver valor total, gerar uma duplicata padrão para 30 dias
  if (duplicatas.length === 0 && valorTotalNota > 0) {
    const d = new Date();
    d.setDate(d.getDate() + 28);
    duplicatas.push({
      numeroDuplicata: '001/01',
      dataVencimento: d.toISOString().split('T')[0],
      valorDuplicata: valorTotalNota,
    });
  }

  return {
    chaveAcesso,
    numeroNota,
    serie,
    naturezaOperacao,
    dataEmissao,
    dataEmissaoFormatada,
    fornecedor: {
      cnpjCpf: emitCnpj,
      razaoSocial: emitRazao,
      nomeFantasia: emitFantasia,
      inscricaoEstadual: emitIE,
      telefone: emitFone,
      endereco: {
        logradouro: emitLogradouro,
        numero: emitNumero,
        complemento: emitComplemento,
        bairro: emitBairro,
        municipio: emitMun,
        uf: emitUF,
        cep: emitCEP,
      },
    },
    destinatario: {
      cnpjCpf: destCnpj,
      razaoSocial: destRazao,
    },
    totais: {
      valorProdutos,
      valorFrete,
      valorSeguro,
      valorDesconto,
      valorIpi,
      valorIcmsSt,
      valorOutrasDespesas,
      valorTotalNota,
    },
    itens,
    duplicatas,
    xmlOriginal: xmlString,
  };
}

// Exemplos Prontos de XML de NF-e para testes rápidos
export const SAMPLE_NFE_XML_1 = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35240860701190000104550010000849201000849204" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <cNF>00084920</cNF>
        <natOp>VENDA DE MERCADORIA ADQUIRIDA DE TERCEIROS</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>84920</nNF>
        <dhEmi>2026-08-25T10:30:00-03:00</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
      </ide>
      <emit>
        <CNPJ>60701190000104</CNPJ>
        <xNome>INDUSTRIA BRASILEIRA DE ALIMENTOS E MATINAIS S/A</xNome>
        <xFant>CAFE E GRAOS NOBRE</xFant>
        <enderEmit>
          <xLgr>RODOVIA ANHANGUERA KM 140</xLgr>
          <nro>2500</nro>
          <xBairro>DISTRITO INDUSTRIAL</xBairro>
          <cMun>3526902</cMun>
          <xMun>LIMEIRA</xMun>
          <UF>SP</UF>
          <CEP>13480000</CEP>
          <fone>1934045000</fone>
        </enderEmit>
        <IE>417088920110</IE>
        <CRT>3</CRT>
      </emit>
      <dest>
        <CNPJ>12345678000195</CNPJ>
        <xNome>DISTRIBUIDORA NACIONAL DE ALIMENTOS LTDA</xNome>
        <enderDest>
          <xLgr>AVENIDA DOS BANDEIRANTES</xLgr>
          <nro>4000</nro>
          <xBairro>VILA OLIMPIA</xBairro>
          <xMun>SAO PAULO</xMun>
          <UF>SP</UF>
          <CEP>04553900</CEP>
        </enderDest>
        <IE>114889201115</IE>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>ALM-8041</cProd>
          <cEAN>7891000100015</cEAN>
          <xProd>Cafe Torrado e Moido Especial 500g (Pack c/ 10)</xProd>
          <NCM>09012100</NCM>
          <CFOP>5102</CFOP>
          <uCom>FD</uCom>
          <qCom>150.0000</qCom>
          <vUnCom>108.0000</vUnCom>
          <vProd>16200.00</vProd>
          <cEANTrib>7891000100015</cEANTrib>
          <uTrib>FD</uTrib>
          <qTrib>150.0000</qTrib>
          <vUnTrib>108.0000</vUnTrib>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <modBC>3</modBC>
              <vBC>16200.00</vBC>
              <pICMS>12.00</pICMS>
              <vICMS>1944.00</vICMS>
            </ICMS00>
          </ICMS>
          <IPI>
            <cEnq>999</cEnq>
            <IPINT>
              <CST>53</CST>
            </IPINT>
          </IPI>
        </imposto>
      </det>
      <det nItem="2">
        <prod>
          <cProd>ALM-9022</cProd>
          <cEAN>7891000100022</cEAN>
          <xProd>Azeite de Oliva Extra Virgem 500ml (Caixa c/ 12)</xProd>
          <NCM>15091000</NCM>
          <CFOP>5102</CFOP>
          <uCom>CX</uCom>
          <qCom>80.0000</qCom>
          <vUnCom>245.0000</vUnCom>
          <vProd>19600.00</vProd>
          <cEANTrib>7891000100022</cEANTrib>
          <uTrib>CX</uTrib>
          <qTrib>80.0000</qTrib>
          <vUnTrib>245.0000</vUnTrib>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <modBC>3</modBC>
              <vBC>19600.00</vBC>
              <pICMS>18.00</pICMS>
              <vICMS>3528.00</vICMS>
            </ICMS00>
          </ICMS>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vBC>35800.00</vBC>
          <vICMS>5472.00</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vFCP>0.00</vFCP>
          <vBCST>0.00</vBCST>
          <vST>0.00</vST>
          <vFCPST>0.00</vFCPST>
          <vFCPSTRet>0.00</vFCPSTRet>
          <vProd>35800.00</vProd>
          <vFrete>650.00</vFrete>
          <vSeg>0.00</vSeg>
          <vDesc>0.00</vDesc>
          <vII>0.00</vII>
          <vIPI>0.00</vIPI>
          <vIPIDevol>0.00</vIPIDevol>
          <vPIS>232.70</vPIS>
          <vCOFINS>1074.00</vCOFINS>
          <vOutro>0.00</vOutro>
          <vNF>36450.00</vNF>
        </ICMSTot>
      </total>
      <cobr>
        <dup>
          <nDup>001/03</nDup>
          <dVenc>2026-09-24</dVenc>
          <vDup>12150.00</vDup>
        </dup>
        <dup>
          <nDup>002/03</nDup>
          <dVenc>2026-10-24</dVenc>
          <vDup>12150.00</vDup>
        </dup>
        <dup>
          <nDup>003/03</nDup>
          <dVenc>2026-11-24</dVenc>
          <vDup>12150.00</vDup>
        </dup>
      </cobr>
    </infNFe>
  </NFe>
</nfeProc>`;

export const SAMPLE_NFE_XML_2 = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe43240892910220000188550010000318491000318493" versao="4.00">
      <ide>
        <cUF>43</cUF>
        <cNF>00031849</cNF>
        <natOp>VENDA DE BEBIDAS E SUCOS NATURAIS</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>31849</nNF>
        <dhEmi>2026-08-27T14:15:00-03:00</dhEmi>
        <tpNF>1</tpNF>
      </ide>
      <emit>
        <CNPJ>92910220000188</CNPJ>
        <xNome>VINICOLA E SUCOS VALE VERDE LTDA</xNome>
        <xFant>VALE VERDE BEBIDAS</xFant>
        <enderEmit>
          <xLgr>AVENIDA DAS VIDEIRAS</xLgr>
          <nro>1200</nro>
          <xBairro>VALE DOS VINHEDOS</xBairro>
          <xMun>BENTO GONCALVES</xMun>
          <UF>RS</UF>
          <CEP>95700000</CEP>
          <fone>5434521000</fone>
        </enderEmit>
        <IE>0109920199</IE>
      </emit>
      <dest>
        <CNPJ>12345678000195</CNPJ>
        <xNome>DISTRIBUIDORA NACIONAL DE ALIMENTOS LTDA</xNome>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>BEB-3310</cProd>
          <cEAN>7891000100039</cEAN>
          <xProd>Suco Integral de Uva 1.5L (Caixa c/ 6)</xProd>
          <NCM>20098990</NCM>
          <CFOP>5102</CFOP>
          <uCom>CX</uCom>
          <qCom>200.0000</qCom>
          <vUnCom>58.5000</vUnCom>
          <vProd>11700.00</vProd>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <vBC>11700.00</vBC>
              <pICMS>12.00</pICMS>
              <vICMS>1404.00</vICMS>
            </ICMS00>
          </ICMS>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vProd>11700.00</vProd>
          <vFrete>350.00</vFrete>
          <vSeg>0.00</vSeg>
          <vDesc>200.00</vDesc>
          <vIPI>0.00</vIPI>
          <vST>0.00</vST>
          <vOutro>0.00</vOutro>
          <vNF>11850.00</vNF>
        </ICMSTot>
      </total>
      <cobr>
        <dup>
          <nDup>001/02</nDup>
          <dVenc>2026-09-27</dVenc>
          <vDup>5925.00</vDup>
        </dup>
        <dup>
          <nDup>002/02</nDup>
          <dVenc>2026-10-27</dVenc>
          <vDup>5925.00</vDup>
        </dup>
      </cobr>
    </infNFe>
  </NFe>
</nfeProc>`;

export const SAMPLE_NFE_XML_3 = `<?xml version="1.0" encoding="utf-8"?>
<nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe>
    <infNFe Id="NFe21260151871231000101550010000000361594721302" versao="4.00">
      <ide>
        <cUF>21</cUF>
        <cNF>59472130</cNF>
        <natOp>VENDAS DENTRO DO ESTADO</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>36</nNF>
        <dhEmi>2026-01-26T17:27:16-03:00</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
        <cMunFG>2112209</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>2</cDV>
        <tpAmb>1</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>1</indFinal>
        <indPres>1</indPres>
        <procEmi>0</procEmi>
        <verProc>4.00_b002|NS_CLIENT</verProc>
      </ide>
      <emit>
        <CNPJ>51871231000101</CNPJ>
        <xNome>F M AGROPECUARIA LTDA</xNome>
        <xFant>FAZENDA ESTADO NOVO</xFant>
        <enderEmit>
          <xLgr>ROD BR 226</xLgr>
          <nro>100</nro>
          <xBairro>ZONA RURAL</xBairro>
          <cMun>2112209</cMun>
          <xMun>TIMON</xMun>
          <UF>MA</UF>
          <CEP>65630482</CEP>
          <cPais>1058</cPais>
          <xPais>BRASIL</xPais>
        </enderEmit>
        <IE>128191970</IE>
        <IM>128191970</IM>
        <CNAE>4692300</CNAE>
        <CRT>1</CRT>
      </emit>
      <dest>
        <CPF>39817172368</CPF>
        <xNome>JOAO ANTONIO MUNIZ</xNome>
        <enderDest>
          <xLgr>ZONA RURAL TIMON</xLgr>
          <nro>00000</nro>
          <xBairro>ZONA RURAL</xBairro>
          <cMun>2112209</cMun>
          <xMun>TIMON</xMun>
          <UF>MA</UF>
          <CEP>65000000</CEP>
          <cPais>1058</cPais>
          <xPais>BRASIL</xPais>
        </enderDest>
        <indIEDest>9</indIEDest>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>000001</cProd>
          <cEAN>SEM GTIN</cEAN>
          <xProd>ARGOLA SERVI 90CM</xProd>
          <NCM>71171900</NCM>
          <CEST>0107500</CEST>
          <CFOP>5405</CFOP>
          <uCom>und</uCom>
          <qCom>1.0000</qCom>
          <vUnCom>40.0000</vUnCom>
          <vProd>40.00</vProd>
          <cEANTrib>SEM GTIN</cEANTrib>
          <uTrib>und</uTrib>
          <qTrib>1.0000</qTrib>
          <vUnTrib>40.0000</vUnTrib>
          <indTot>1</indTot>
          <nItemPed>0</nItemPed>
        </prod>
        <imposto>
          <vTotTrib>0.00</vTotTrib>
          <ICMS>
            <ICMSSN500>
              <orig>0</orig>
              <CSOSN>500</CSOSN>
              <vBCSTRet>0.00</vBCSTRet>
              <pST>0.00</pST>
              <vICMSSTRet>0.00</vICMSSTRet>
              <pRedBCEfet>0.00</pRedBCEfet>
              <vBCEfet>0.00</vBCEfet>
              <pICMSEfet>0.00</pICMSEfet>
              <vICMSEfet>0.00</vICMSEfet>
            </ICMSSN500>
          </ICMS>
          <IPI>
            <cEnq>999</cEnq>
            <IPINT>
              <CST>53</CST>
            </IPINT>
          </IPI>
          <PIS>
            <PISAliq>
              <CST>01</CST>
              <vBC>40.00</vBC>
              <pPIS>0.65</pPIS>
              <vPIS>0.26</vPIS>
            </PISAliq>
          </PIS>
          <COFINS>
            <COFINSAliq>
              <CST>01</CST>
              <vBC>40.00</vBC>
              <pCOFINS>3.00</pCOFINS>
              <vCOFINS>1.20</vCOFINS>
            </COFINSAliq>
          </COFINS>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vBC>0.00</vBC>
          <vICMS>0.00</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vFCP>0.00</vFCP>
          <vBCST>0.00</vBCST>
          <vST>0.00</vST>
          <vFCPST>0.00</vFCPST>
          <vFCPSTRet>0.00</vFCPSTRet>
          <qBCMono>0.00</qBCMono>
          <vProd>40.00</vProd>
          <vFrete>0.00</vFrete>
          <vSeg>0.00</vSeg>
          <vDesc>0.00</vDesc>
          <vII>0.00</vII>
          <vIPI>0.00</vIPI>
          <vIPIDevol>0.00</vIPIDevol>
          <vPIS>0.26</vPIS>
          <vCOFINS>1.20</vCOFINS>
          <vOutro>0.00</vOutro>
          <vNF>40.00</vNF>
        </ICMSTot>
      </total>
      <transp>
        <modFrete>0</modFrete>
        <vol>
          <qVol>1</qVol>
          <esp>DIVERSOS</esp>
          <pesoB>1.000</pesoB>
        </vol>
      </transp>
      <pag>
        <detPag>
          <indPag>0</indPag>
          <tPag>01</tPag>
          <vPag>40.00</vPag>
        </detPag>
      </pag>
      <infAdic />
    </infNFe>
  </NFe>
</nfeProc>`;
