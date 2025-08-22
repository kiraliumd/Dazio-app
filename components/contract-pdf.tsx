import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Registrar fonte padrão
Font.register({
  family: 'Helvetica',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfB.ttf',
      fontWeight: 'bold',
    },
  ],
});

// Estilos do PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.4,
  },

  // Cabeçalho
  header: {
    marginBottom: 30,
    textAlign: 'center',
    borderBottom: 2,
    borderColor: '#000',
    paddingBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
  },

  // Seções
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textDecoration: 'underline',
    borderBottom: 1,
    borderColor: '#ccc',
    paddingBottom: 5,
  },

  // Layout de duas colunas
  twoColumns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  column: {
    width: '48%',
  },

  // Campos de dados
  fieldGroup: {
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 10,
    marginBottom: 4,
    paddingLeft: 5,
  },

  // Período de locação
  periodSection: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    marginBottom: 20,
    borderTop: 1,
    borderBottom: 1,
    borderLeft: 1,
    borderRight: 1,
    borderColor: '#dee2e6',
  },
  periodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  periodItem: {
    width: '48%',
  },

  // Tabela de equipamentos
  equipmentTable: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderBottom: 1,
    borderColor: '#dee2e6',
    paddingVertical: 8,
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: 1,
    borderColor: '#eee',
    paddingVertical: 6,
    fontSize: 9,
  },
  tableCell: {
    paddingHorizontal: 4,
  },
  colName: { width: '35%' },
  colQty: { width: '10%', textAlign: 'center' },
  colRate: { width: '20%', textAlign: 'right' },
  colDays: { width: '10%', textAlign: 'center' },
  colTotal: { width: '25%', textAlign: 'right' },

  // Resumo financeiro
  financialSummary: {
    marginTop: 20,
    marginBottom: 30,
    alignSelf: 'flex-end',
    width: '40%',
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  financialLabel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  financialValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  totalRow: {
    borderTop: 1,
    borderColor: '#000',
    paddingTop: 8,
    marginTop: 8,
  },

  // Condições gerais
  conditionsSection: {
    marginBottom: 30,
  },
  conditionItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  conditionNumber: {
    fontSize: 9,
    fontWeight: 'bold',
    marginRight: 8,
    minWidth: 20,
  },
  conditionText: {
    fontSize: 9,
    flex: 1,
  },

  // Assinaturas
  signatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
  },
  signature: {
    width: '45%',
    textAlign: 'center',
  },
  signatureLine: {
    borderBottom: 1,
    borderColor: '#000',
    marginBottom: 8,
    height: 30,
  },
  signatureText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  signatureSubtext: {
    fontSize: 8,
    color: '#666',
    marginTop: 2,
  },

  // Data do contrato
  contractDate: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 9,
    color: '#666',
  },
});

interface ContractData {
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
    address: string;
    phone: string;
    email: string;
  };
  contract: {
    startDate: string;
    endDate: string;
    installationTime: string;
    removalTime: string;
    installationLocation: string;
    totalValue: number;
    discount: number;
    finalValue: number;
    items: Array<{
      equipmentName: string;
      quantity: number;
      dailyRate: number;
      days: number;
      total: number;
    }>;
  };
  template: string;
}

interface ContractPDFProps {
  data: ContractData;
}

export function ContractPDF({ data }: ContractPDFProps) {
  // Validações para garantir que todos os dados estejam presentes
  if (!data) {
    console.error('ContractPDF: data is null or undefined');
    return null;
  }

  if (!data.client || !data.company || !data.contract) {
    console.error('ContractPDF: missing required data sections', { data });
    return null;
  }

  if (!data.contract.items || data.contract.items.length === 0) {
    console.error('ContractPDF: no items in contract');
    return null;
  }

  // Log para debug
  console.log('ContractPDF rendering with data:', data);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text style={styles.title}>CONTRATO DE LOCAÇÃO DE EQUIPAMENTOS</Text>
          <Text style={styles.subtitle}>Documento oficial de locação</Text>
        </View>

        {/* Dados das Partes - Duas Colunas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DADOS DAS PARTES</Text>
          <View style={styles.twoColumns}>
            {/* Coluna do Contratante (Cliente) */}
            <View style={styles.column}>
              <Text style={styles.fieldLabel}>CONTRATANTE:</Text>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldValue}>{data.client.name}</Text>
                <Text style={styles.fieldValue}>
                  Documento: {data.client.document}
                </Text>
                <Text style={styles.fieldValue}>
                  Endereço: {data.client.address}
                </Text>
                <Text style={styles.fieldValue}>
                  Telefone: {data.client.phone}
                </Text>
                <Text style={styles.fieldValue}>
                  E-mail: {data.client.email}
                </Text>
              </View>
            </View>

            {/* Coluna do Contratado (Empresa) */}
            <View style={styles.column}>
              <Text style={styles.fieldLabel}>CONTRATADO:</Text>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldValue}>{data.company.name}</Text>
                <Text style={styles.fieldValue}>CNPJ: {data.company.cnpj}</Text>
                <Text style={styles.fieldValue}>
                  Endereço: {data.company.address}
                </Text>
                <Text style={styles.fieldValue}>
                  Telefone: {data.company.phone}
                </Text>
                <Text style={styles.fieldValue}>
                  E-mail: {data.company.email}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Período de Locação */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PERÍODO DE LOCAÇÃO</Text>
          <View style={styles.periodSection}>
            <View style={styles.periodGrid}>
              <View style={styles.periodItem}>
                <Text style={styles.fieldLabel}>Data de Início:</Text>
                <Text style={styles.fieldValue}>
                  {format(new Date(data.contract.startDate), 'dd/MM/yyyy', {
                    locale: ptBR,
                  })}{' '}
                  às {data.contract.installationTime}
                </Text>
              </View>
              <View style={styles.periodItem}>
                <Text style={styles.fieldLabel}>Data de Término:</Text>
                <Text style={styles.fieldValue}>
                  {format(new Date(data.contract.endDate), 'dd/MM/yyyy', {
                    locale: ptBR,
                  })}{' '}
                  às {data.contract.removalTime}
                </Text>
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Local de Instalação:</Text>
              <Text style={styles.fieldValue}>
                {data.contract.installationLocation}
              </Text>
            </View>
          </View>
        </View>

        {/* Equipamentos Locados */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EQUIPAMENTOS LOCADOS</Text>
          <View style={styles.equipmentTable}>
            {/* Cabeçalho da Tabela */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.colName]}>
                EQUIPAMENTO
              </Text>
              <Text style={[styles.tableCell, styles.colQty]}>QTD</Text>
              <Text style={[styles.tableCell, styles.colRate]}>VALOR/DIA</Text>
              <Text style={[styles.tableCell, styles.colDays]}>DIAS</Text>
              <Text style={[styles.tableCell, styles.colTotal]}>TOTAL</Text>
            </View>

            {/* Linhas dos Equipamentos */}
            {data.contract.items.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colName]}>
                  {item.equipmentName}
                </Text>
                <Text style={[styles.tableCell, styles.colQty]}>
                  {item.quantity}
                </Text>
                <Text style={[styles.tableCell, styles.colRate]}>
                  R$ {item.dailyRate.toFixed(2).replace('.', ',')}
                </Text>
                <Text style={[styles.tableCell, styles.colDays]}>
                  {item.days}
                </Text>
                <Text style={[styles.tableCell, styles.colTotal]}>
                  R$ {item.total.toFixed(2).replace('.', ',')}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Resumo Financeiro */}
        <View style={styles.financialSummary}>
          <View style={styles.financialRow}>
            <Text style={styles.financialLabel}>Valor Total:</Text>
            <Text style={styles.financialValue}>
              R$ {data.contract.totalValue.toFixed(2).replace('.', ',')}
            </Text>
          </View>
          <View style={styles.financialRow}>
            <Text style={styles.financialLabel}>Desconto:</Text>
            <Text style={styles.financialValue}>
              R$ {data.contract.discount.toFixed(2).replace('.', ',')}
            </Text>
          </View>
          <View style={[styles.financialRow, styles.totalRow]}>
            <Text style={styles.financialLabel}>VALOR FINAL:</Text>
            <Text style={styles.financialValue}>
              R$ {data.contract.finalValue.toFixed(2).replace('.', ',')}
            </Text>
          </View>
        </View>

        {/* Condições Gerais */}
        <View style={styles.conditionsSection}>
          <Text style={styles.sectionTitle}>CONDIÇÕES GERAIS</Text>
          <View style={styles.conditionItem}>
            <Text style={styles.conditionNumber}>1.</Text>
            <Text style={styles.conditionText}>
              O contratante se compromete a devolver os equipamentos no estado
              em que foram recebidos, responsabilizando-se por qualquer dano ou
              perda durante o período de locação.
            </Text>
          </View>
          <View style={styles.conditionItem}>
            <Text style={styles.conditionNumber}>2.</Text>
            <Text style={styles.conditionText}>
              O pagamento deve ser realizado conforme acordado entre as partes,
              sendo obrigatório o cumprimento dos prazos estabelecidos.
            </Text>
          </View>
          <View style={styles.conditionItem}>
            <Text style={styles.conditionNumber}>3.</Text>
            <Text style={styles.conditionText}>
              Em caso de atraso na devolução dos equipamentos, será cobrada
              multa diária equivalente a 10% do valor da diária por equipamento.
            </Text>
          </View>
          <View style={styles.conditionItem}>
            <Text style={styles.conditionNumber}>4.</Text>
            <Text style={styles.conditionText}>
              O contratado não se responsabiliza por danos causados por mau uso
              ou condições inadequadas de instalação dos equipamentos.
            </Text>
          </View>
        </View>

        {/* Assinaturas */}
        <View style={styles.signatures}>
          <View style={styles.signature}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureText}>CONTRATANTE</Text>
            <Text style={styles.signatureSubtext}>{data.client.name}</Text>
          </View>
          <View style={styles.signature}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureText}>CONTRATADO</Text>
            <Text style={styles.signatureSubtext}>{data.company.name}</Text>
          </View>
        </View>

        {/* Data do Contrato */}
        <Text style={styles.contractDate}>
          Cuiabá, {format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}
        </Text>
      </Page>
    </Document>
  );
}
