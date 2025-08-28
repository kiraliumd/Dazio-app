import {
    Document,
    Page,
    StyleSheet,
    Text,
    View,
} from '@react-pdf/renderer';
import React from 'react';

// ✅ BOAS PRÁTICAS: Usar fontes padrão do sistema sem Font.register
// Isso evita problemas de carregamento de fontes externas e garante compatibilidade

// Estilos para a nota fiscal - usando fontes padrão do sistema
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontSize: 10,
    lineHeight: 1.4,
  },
  
  // Cabeçalho da empresa
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    borderBottom: '2px solid #f3f4f6',
    paddingBottom: 20,
  },
  
  companyInfo: {
    flex: 1,
  },
  
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  
  companyDetails: {
    fontSize: 10,
    color: '#6b7280',
    lineHeight: 1.4,
  },
  
  invoiceHeader: {
    alignItems: 'flex-end',
    textAlign: 'right',
  },
  
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 8,
  },
  
  invoiceNumber: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  
  invoiceDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  
  // Informações do cliente
  clientSection: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  clientInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  clientColumn: {
    flex: 1,
  },
  
  clientLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  clientValue: {
    fontSize: 12,
    color: '#1f2937',
    marginBottom: 8,
    fontWeight: 'medium',
  },
  
  // Detalhes da locação
  rentalDetails: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  
  rentalGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  
  rentalLabel: {
    fontSize: 10,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  rentalValue: {
    fontSize: 12,
    color: '#1f2937',
    fontWeight: 'medium',
  },
  
  // Tabela de itens
  itemsTable: {
    marginBottom: 30,
  },
  
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottom: '1px solid #e5e7eb',
  },
  
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottom: '1px solid #f3f4f6',
  },
  
  tableCell: {
    fontSize: 10,
    color: '#1f2937',
  },
  
  // Colunas da tabela
  colEquipment: { flex: 3 },
  colQuantity: { flex: 1, textAlign: 'center' },
  colDays: { flex: 1, textAlign: 'center' },
  colRate: { flex: 1, textAlign: 'right' },
  colTotal: { flex: 1, textAlign: 'right' },
  
  // Resumo financeiro
  summary: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  
  summaryValue: {
    fontSize: 12,
    color: '#1f2937',
    fontWeight: 'medium',
  },
  
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTop: '2px solid #e5e7eb',
  },
  
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  
  // Observações
  observations: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  
  observationsText: {
    fontSize: 11,
    color: '#6b7280',
    lineHeight: 1.5,
  },
  
  // Rodapé
  footer: {
    marginTop: 'auto',
    paddingTop: 20,
    borderTop: '1px solid #e5e7eb',
    textAlign: 'center',
  },
  
  footerText: {
    fontSize: 10,
    color: '#9ca3af',
    lineHeight: 1.4,
  },
  
  // Status da nota fiscal
  status: {
    position: 'absolute',
    top: 40,
    right: 40,
    backgroundColor: '#dc2626',
    color: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

interface InvoiceData {
  company: {
    name: string;
    cnpj: string;
    address: string;
    phone: string;
    email: string;
  };
  client: {
    name: string;
    document: string;
    phone: string;
    email: string;
  };
  invoice: {
    number: string;
    date: string;
    dueDate: string;
    startDate: string;
    endDate: string;
    installationLocation: string;
    subtotal: number;
    discount: number;
    finalValue: number;
    observations: string;
    items: Array<{
      equipmentName: string;
      quantity: number;
      dailyRate: number;
      days: number;
      total: number;
    }>;
  };
}

interface InvoicePDFProps {
  data: InvoiceData;
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ data }) => {
  // ✅ BOAS PRÁTICAS: Funções de formatação com tratamento de erro
  const formatCurrency = (value: number) => {
    try {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    } catch (error) {
      // Fallback para formatação simples
      return `R$ ${value.toFixed(2).replace('.', ',')}`;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch (error) {
      return dateString || 'Data não informada';
    }
  };

  const formatDateLong = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch (error) {
      return dateString || 'Data não informada';
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Status da nota fiscal */}
        <View style={styles.status}>
          <Text>Nota Fatura</Text>
        </View>

        {/* Cabeçalho */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{data.company.name}</Text>
            <Text style={styles.companyDetails}>
              CNPJ: {data.company.cnpj}
            </Text>
            <Text style={styles.companyDetails}>
              {data.company.address}
            </Text>
            <Text style={styles.companyDetails}>
              Tel: {data.company.phone} | Email: {data.company.email}
            </Text>
          </View>
          
          <View style={styles.invoiceHeader}>
            <Text style={styles.invoiceTitle}>NOTA FATURA</Text>
            <Text style={styles.invoiceNumber}>{data.invoice.number}</Text>
            <Text style={styles.invoiceDate}>
              Data: {formatDate(data.invoice.date)}
            </Text>
            <Text style={styles.invoiceDate}>
              Vencimento: {formatDate(data.invoice.dueDate)}
            </Text>
          </View>
        </View>

        {/* Informações do cliente */}
        <View style={styles.clientSection}>
          <Text style={styles.sectionTitle}>Dados do Cliente</Text>
          <View style={styles.clientInfo}>
            <View style={styles.clientColumn}>
              <Text style={styles.clientLabel}>Nome</Text>
              <Text style={styles.clientValue}>{data.client.name}</Text>
              
              <Text style={styles.clientLabel}>Documento</Text>
              <Text style={styles.clientValue}>{data.client.document}</Text>
            </View>
            
            <View style={styles.clientColumn}>
              <Text style={styles.clientLabel}>Contato</Text>
              <Text style={styles.clientValue}>
                {data.client.phone} | {data.client.email}
              </Text>
            </View>
          </View>
        </View>

        {/* Detalhes da locação */}
        <View style={styles.rentalDetails}>
          <Text style={styles.sectionTitle}>Detalhes da Locação</Text>
          
          <View style={styles.rentalGrid}>
            <Text style={styles.rentalLabel}>Período de Locação</Text>
            <Text style={styles.rentalValue}>
              {formatDateLong(data.invoice.startDate)} a {formatDateLong(data.invoice.endDate)}
            </Text>
          </View>
          
          <View style={styles.rentalGrid}>
            <Text style={styles.rentalLabel}>Local de Instalação</Text>
            <Text style={styles.rentalValue}>{data.invoice.installationLocation}</Text>
          </View>
        </View>

        {/* Tabela de itens */}
        <View style={styles.itemsTable}>
          <Text style={styles.sectionTitle}>Equipamentos Locados</Text>
          
          {/* Cabeçalho da tabela */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colEquipment]}>Equipamento</Text>
            <Text style={[styles.tableHeaderCell, styles.colQuantity]}>Qtd</Text>
            <Text style={[styles.tableHeaderCell, styles.colDays]}>Dias</Text>
            <Text style={[styles.tableHeaderCell, styles.colRate]}>Valor/Dia</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
          </View>
          
          {/* Itens da tabela */}
          {data.invoice.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colEquipment]}>{item.equipmentName}</Text>
              <Text style={[styles.tableCell, styles.colQuantity]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.colDays]}>{item.days}</Text>
              <Text style={[styles.tableCell, styles.colRate]}>{formatCurrency(item.dailyRate)}</Text>
              <Text style={[styles.tableCell, styles.colTotal]}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Resumo financeiro */}
        <View style={styles.summary}>
          <Text style={styles.sectionTitle}>Resumo Financeiro</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatCurrency(data.invoice.subtotal)}</Text>
          </View>
          
          {data.invoice.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Desconto</Text>
              <Text style={styles.summaryValue}>-{formatCurrency(data.invoice.discount)}</Text>
            </View>
          )}
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total a Pagar</Text>
            <Text style={styles.totalValue}>{formatCurrency(data.invoice.finalValue)}</Text>
          </View>
        </View>

        {/* Observações */}
        {data.invoice.observations && (
          <View style={styles.observations}>
            <Text style={styles.sectionTitle}>Observações</Text>
            <Text style={styles.observationsText}>{data.invoice.observations}</Text>
          </View>
        )}

        {/* Rodapé */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Esta nota fatura foi gerada automaticamente pelo sistema Dazio.
          </Text>
          <Text style={styles.footerText}>
            Em caso de dúvidas, entre em contato conosco.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
