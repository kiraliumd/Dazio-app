import React, { useState } from 'react';
import { pdf, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { Budget } from '../components/budget-form-v2';
import { CompanySettings } from '../lib/database/settings';

// Registrar fonte padrão
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfB.ttf', fontWeight: 'bold' },
  ],
});

// Estilos do PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: '1px solid #000',
    paddingBottom: 20,
  },
  companyInfo: {
    marginBottom: 10,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  companyDetails: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 5,
  },
  documentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  budgetInfo: {
    marginBottom: 20,
  },
  budgetRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  budgetLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    width: 120,
  },
  budgetValue: {
    fontSize: 10,
    flex: 1,
  },
  clientInfo: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottom: '1px solid #000',
    paddingBottom: 5,
  },
  clientRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  clientLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    width: 100,
  },
  clientValue: {
    fontSize: 10,
    flex: 1,
  },
  itemsTable: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderBottom: '1px solid #000',
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 'bold',
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1px solid #ccc',
  },
  tableCell: {
    fontSize: 9,
    flex: 1,
  },
  totals: {
    marginTop: 20,
    borderTop: '1px solid #000',
    paddingTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    width: 150,
  },
  totalValue: {
    fontSize: 10,
    flex: 1,
  },
  observations: {
    marginTop: 20,
  },
  observationsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  observationsText: {
    fontSize: 10,
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
  },
});

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

export const usePDFGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateBudgetPDF = async (budget: Budget, companySettings: CompanySettings) => {
    try {
      setIsGenerating(true);

      // Criar o documento PDF
      const pdfDoc = React.createElement(Document, {}, 
        React.createElement(Page, { size: 'A4', style: styles.page }, [
          // Cabeçalho
          React.createElement(View, { key: 'header', style: styles.header }, [
            React.createElement(View, { key: 'companyInfo', style: styles.companyInfo }, [
              React.createElement(Text, { 
                key: 'companyName', 
                style: styles.companyName 
              }, companySettings.company_name || 'Nome da Empresa'),
              companySettings.cnpj && React.createElement(Text, { 
                key: 'cnpj', 
                style: styles.companyDetails 
              }, `CNPJ: ${companySettings.cnpj}`),
              companySettings.address && React.createElement(Text, { 
                key: 'address', 
                style: styles.companyDetails 
              }, companySettings.address),
              companySettings.phone && React.createElement(Text, { 
                key: 'phone', 
                style: styles.companyDetails 
              }, `Tel: ${companySettings.phone}`),
              companySettings.email && React.createElement(Text, { 
                key: 'email', 
                style: styles.companyDetails 
              }, `Email: ${companySettings.email}`),
            ].filter(Boolean)),
            React.createElement(Text, { 
              key: 'documentTitle', 
              style: styles.documentTitle 
            }, 'ORÇAMENTO'),
          ]),
          
          // Informações do orçamento
          React.createElement(View, { key: 'budgetInfo', style: styles.budgetInfo }, [
            React.createElement(View, { key: 'budgetRow1', style: styles.budgetRow }, [
              React.createElement(Text, { key: 'label1', style: styles.budgetLabel }, 'Número:'),
              React.createElement(Text, { key: 'value1', style: styles.budgetValue }, budget.number),
            ]),
            React.createElement(View, { key: 'budgetRow2', style: styles.budgetRow }, [
              React.createElement(Text, { key: 'label2', style: styles.budgetLabel }, 'Data:'),
              React.createElement(Text, { key: 'value2', style: styles.budgetValue }, formatDate(budget.createdAt)),
            ]),
            React.createElement(View, { key: 'budgetRow3', style: styles.budgetRow }, [
              React.createElement(Text, { key: 'label3', style: styles.budgetLabel }, 'Status:'),
              React.createElement(Text, { key: 'value3', style: styles.budgetValue }, budget.status),
            ]),
          ]),

          // Informações do cliente
          React.createElement(View, { key: 'clientInfo', style: styles.clientInfo }, [
            React.createElement(Text, { key: 'sectionTitle', style: styles.sectionTitle }, 'DADOS DO CLIENTE'),
            React.createElement(View, { key: 'clientRow1', style: styles.clientRow }, [
              React.createElement(Text, { key: 'clientLabel1', style: styles.clientLabel }, 'Nome:'),
              React.createElement(Text, { key: 'clientValue1', style: styles.clientValue }, budget.clientName),
            ]),
            React.createElement(View, { key: 'clientRow2', style: styles.clientRow }, [
              React.createElement(Text, { key: 'clientLabel2', style: styles.clientLabel }, 'Período:'),
              React.createElement(Text, { 
                key: 'clientValue2', 
                style: styles.clientValue 
              }, `${formatDate(budget.startDate)} a ${formatDate(budget.endDate)}`),
            ]),
            budget.installationLocation && React.createElement(View, { key: 'clientRow3', style: styles.clientRow }, [
              React.createElement(Text, { key: 'clientLabel3', style: styles.clientLabel }, 'Local:'),
              React.createElement(Text, { key: 'clientValue3', style: styles.clientValue }, budget.installationLocation),
            ]),
          ].filter(Boolean)),

          // Tabela de itens
          React.createElement(View, { key: 'itemsTable', style: styles.itemsTable }, [
            React.createElement(Text, { key: 'itemsTitle', style: styles.sectionTitle }, 'ITENS DO ORÇAMENTO'),
            React.createElement(View, { key: 'tableHeader', style: styles.tableHeader }, [
              React.createElement(Text, { key: 'header1', style: [styles.tableHeaderCell, { flex: 2 }] }, 'Equipamento'),
              React.createElement(Text, { key: 'header2', style: styles.tableHeaderCell }, 'Qtd'),
              React.createElement(Text, { key: 'header3', style: styles.tableHeaderCell }, 'Dias'),
              React.createElement(Text, { key: 'header4', style: styles.tableHeaderCell }, 'Valor/Dia'),
              React.createElement(Text, { key: 'header5', style: styles.tableHeaderCell }, 'Total'),
            ]),
            ...budget.items.map((item, index) => 
              React.createElement(View, { key: `row${index}`, style: styles.tableRow }, [
                React.createElement(Text, { key: `cell1${index}`, style: [styles.tableCell, { flex: 2 }] }, item.equipmentName),
                React.createElement(Text, { key: `cell2${index}`, style: styles.tableCell }, item.quantity.toString()),
                React.createElement(Text, { key: `cell3${index}`, style: styles.tableCell }, item.days.toString()),
                React.createElement(Text, { key: `cell4${index}`, style: styles.tableCell }, formatCurrency(item.dailyRate)),
                React.createElement(Text, { key: `cell5${index}`, style: styles.tableCell }, formatCurrency(item.total)),
              ])
            ),
          ]),

          // Totais
          React.createElement(View, { key: 'totals', style: styles.totals }, [
            React.createElement(View, { key: 'totalRow1', style: styles.totalRow }, [
              React.createElement(Text, { key: 'totalLabel1', style: styles.totalLabel }, 'Subtotal:'),
              React.createElement(Text, { key: 'totalValue1', style: styles.totalValue }, formatCurrency(budget.subtotal)),
            ]),
            budget.discount > 0 && React.createElement(View, { key: 'totalRow2', style: styles.totalRow }, [
              React.createElement(Text, { key: 'totalLabel2', style: styles.totalLabel }, 'Desconto:'),
              React.createElement(Text, { key: 'totalValue2', style: styles.totalValue }, formatCurrency(budget.discount)),
            ]),
            React.createElement(View, { key: 'totalRow3', style: styles.totalRow }, [
              React.createElement(Text, { 
                key: 'totalLabel3', 
                style: [styles.totalLabel, { fontSize: 12, fontWeight: 'bold' }] 
              }, 'TOTAL:'),
              React.createElement(Text, { 
                key: 'totalValue3', 
                style: [styles.totalValue, { fontSize: 12, fontWeight: 'bold' }] 
              }, formatCurrency(budget.totalValue)),
            ]),
          ].filter(Boolean)),

          // Observações
          budget.observations && React.createElement(View, { key: 'observations', style: styles.observations }, [
            React.createElement(Text, { key: 'obsTitle', style: styles.observationsTitle }, 'Observações:'),
            React.createElement(Text, { key: 'obsText', style: styles.observationsText }, budget.observations),
          ]),

          // Rodapé
          React.createElement(Text, { 
            key: 'footer', 
            style: styles.footer 
          }, 'Este orçamento é válido por 30 dias a partir da data de emissão.'),
        ].filter(Boolean))
      );
      
      // Gerar o blob do PDF
      const blob = await pdf(pdfDoc).toBlob();
      
      // Criar URL do blob
      const url = URL.createObjectURL(blob);
      
      // Criar link de download
      const link = document.createElement('a');
      link.href = url;
      link.download = `orcamento-${budget.number}.pdf`;
      
      // Simular clique para download
      document.body.appendChild(link);
      link.click();
      
      // Limpar
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw new Error('Erro ao gerar PDF do orçamento');
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateBudgetPDF,
    isGenerating,
  };
}; 