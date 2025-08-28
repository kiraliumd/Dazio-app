import {
    Document,
    Page,
    StyleSheet,
    Text,
    View,
} from '@react-pdf/renderer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ✅ BOAS PRÁTICAS: Usar fontes padrão do sistema sem Font.register
// Isso evita problemas de carregamento de fontes externas e garante compatibilidade

// Estilos do PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
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
  mainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },

  // Seções
  section: {
    marginBottom: 20,
  },

  // Títulos das cláusulas
  clauseTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textDecoration: 'underline',
  },

  // Subtítulos
  subsectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 10,
  },

  // Parágrafos
  paragraph: {
    fontSize: 10,
    marginBottom: 8,
    textAlign: 'justify',
    lineHeight: 1.5,
  },

  // Texto em negrito
  bold: {
    fontWeight: 'bold',
  },

  // Campos de dados
  fieldGroup: {
    marginBottom: 8,
    marginLeft: 15,
  },
  fieldLabel: {
    fontSize: 10,
    marginBottom: 4,
  },

  // Lista de equipamentos
  equipmentItem: {
    marginBottom: 4,
    marginLeft: 15,
  },
  equipmentText: {
    fontSize: 10,
    lineHeight: 1.4,
  },

  // Seção de assinaturas
  signaturesSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 20,
  },
  signatureColumn: {
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
    observations?: string;
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

  // Calcular dias totais
  const startDate = new Date(data.contract.startDate);
  const endDate = new Date(data.contract.endDate);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  // Formatar valor por extenso
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

  // Formatar data por extenso
  const formatDateLong = (date: Date) => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    return `${days[date.getDay()]} Feira, ${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Título Principal */}
        <View style={styles.header}>
          <Text style={styles.mainTitle}>CONTRATO DE LOCAÇÃO DE BENS MÓVEIS</Text>
        </View>

        {/* Preâmbulo */}
        <View style={styles.section}>
          <Text style={styles.paragraph}>
            Pelo presente instrumento de locação de bens móveis que entre si, fazem como{' '}
            <Text style={styles.bold}>LOCADORA: {data.company.name}</Text>, {data.company.address}, 
            Telefone: {data.company.phone}, CPF/CNPJ: {data.company.cnpj}, 
            neste ato representada por seu representante legal infra-assinado e que doravante será designado{' '}
            <Text style={styles.bold}>LOCADORA</Text> e de outro lado: <Text style={styles.bold}>{data.client.name}</Text>, 
            doravante denominada{' '}
            <Text style={styles.bold}>LOCATÁRIA</Text>, Contrataram a locação dos bens móveis abaixo descritos, 
            com respectivos valores unitários, mediante as condições estabelecidas nas cláusulas seguintes:
          </Text>
        </View>

        {/* Cláusula Primeira - Objeto do Contrato */}
        <View style={styles.section}>
          <Text style={styles.clauseTitle}>1-) OBJETO DO CONTRATO:</Text>
          <Text style={styles.paragraph}>
            A Locadora aluga os bens móveis, abaixo descritos de sua propriedade para uso exclusivo no endereço aqui especificado:
          </Text>
          
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Local de entrega: {data.contract.installationLocation}</Text>
          </View>
          
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Observações: {data.contract.observations || 'Nenhuma observação adicional'}</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              PERÍODO: {format(new Date(data.contract.startDate), 'dd/MM/yyyy', { locale: ptBR })} às {data.contract.installationTime} 
              horas até {format(new Date(data.contract.endDate), 'dd/MM/yyyy', { locale: ptBR })} às {data.contract.removalTime} 
              horas totalizando {totalDays} dia(s), totalizando {formatCurrency(data.contract.finalValue)}.
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Forma de Pagamento: Transferência Bancária</Text>
          </View>
        </View>

        {/* Lista de Equipamentos */}
        <View style={styles.section}>
          <Text style={styles.subsectionTitle}>EQUIPAMENTOS LOCADOS:</Text>
          {data.contract.items.map((item, index) => (
            <View key={index} style={styles.equipmentItem}>
              <Text style={styles.equipmentText}>
                • {item.equipmentName} - Qtd: {item.quantity} - Valor: {formatCurrency(item.total)}
              </Text>
            </View>
          ))}
        </View>

        {/* Cláusula Segunda - Pagamento */}
        <View style={styles.section}>
          <Text style={styles.clauseTitle}>CLÁUSULA SEGUNDA: DO PAGAMENTO:</Text>
          <Text style={styles.paragraph}>
            Como pagamento pela locação de bens móveis de que se trata a Cláusula Primeira, a LOCATÁRIA pagará a 
            LOCADORA a importância certa de {formatCurrency(data.contract.finalValue)}.
          </Text>
        </View>

        {/* Cláusula Terceira - Devolução */}
        <View style={styles.section}>
          <Text style={styles.clauseTitle}>CLÁUSULA TERCEIRA:</Text>
          <Text style={styles.paragraph}>
            A LOCATÁRIA fica a obrigação de devolver os materiais locados, ao final do evento ou na loja, 
            no estado em que os recebeu, além de pagar pontualmente o aluguel acordado e de conservá-los como se fossem seus.
          </Text>
          <Text style={styles.paragraph}>
            Em caso de avaria, extravio, danos por força maior e/ou furto do material locado, a LOCADORA se reserva 
            o direito de emitir cobrança bancária a LOCATÁRIA, no valor correspondente ao reparo e/ou substituição 
            do material conforme preço de reposição descrito no contrato.
          </Text>
        </View>

        {/* Cláusula Quarta - Anuência das Partes */}
        <View style={styles.section}>
          <Text style={styles.clauseTitle}>CLÁUSULA QUARTA: ANUÊNCIA DAS PARTES:</Text>
          <Text style={styles.paragraph}>
            Caso haja rescisão contratual por uma das partes - depois de assinado o presente contrato, restará para 
            aquele que rescindir pagar uma multa de 50% (cinquenta por cento) do valor total do contrato.
          </Text>
          <Text style={styles.paragraph}>
            Após o evento realizado, em caso de haver inadimplência de alguma parcela em aberto, fica também estipulada 
            a multa de 2% (dois por cento) do valor total do contrato. Fica reservado o direito da LOCADORA de não 
            realizar a montagem e locação dos materiais ora contratados, caso haja algum inadimplemento ou rescisão 
            contratual mediante notificação.
          </Text>
        </View>

        {/* Cláusula Quinta - Período e Local */}
        <View style={styles.section}>
          <Text style={styles.clauseTitle}>CLÁUSULA QUINTA: DO PERÍODO E LOCAL:</Text>
          <Text style={styles.paragraph}>
            A data de locação dos materiais descritos na Cláusula Primeira corresponde no período das datas mencionadas.
          </Text>
        </View>

        {/* Cláusula Sexta - Responsabilidades */}
        <View style={styles.section}>
          <Text style={styles.clauseTitle}>CLÁUSULA SEXTA: DAS RESPONSABILIDADES:</Text>
          <Text style={styles.paragraph}>
            A LOCATÁRIA se responsabiliza pela retirada, transporte e devolução dos materiais em perfeitas condições 
            de uso no dia, local e hora da devolução dos mesmos, caso escolha retirar e devolver o material na empresa. 
            A LOCATÁRIA também se responsabiliza por conferir o material na entrega e/ou retirada, assim como na 
            recolha e/ou devolução dos mesmos, não sendo aceitas reclamações posteriores. A retirada e devolução dos 
            equipamentos locados serão efetuadas através do comprovante de entrega e de devolução emitidos pela LOCADORA. 
            Os mesmos deverão ser assinados pela LOCADORA e pela LOCATÁRIA ou por representantes autorizados.
          </Text>
        </View>

        {/* Cláusula Sétima - Foro */}
        <View style={styles.section}>
          <Text style={styles.clauseTitle}>CLÁUSULA SÉTIMA: DO FORO:</Text>
          <Text style={styles.paragraph}>
            Em caso de alguma controvérsia as partes elegem o Foro de Cuiabá-MT para dirimir quaisquer problemas 
            que surgir relativos a este contrato.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>PARÁGRAFO ÚNICO:</Text> Renuncia a LOCATÁRIA qualquer foro diverso a este 
            eleito nesta cláusula por mais privilegiado que seja. Por estarem assim acordados e ajustados, firmam 
            o presente contrato em duas vias de teor e forma igual para um só efeito.
          </Text>
        </View>

        {/* Assinaturas */}
        <View style={styles.signaturesSection}>
          <View style={styles.signatureColumn}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureText}>{data.company.name}</Text>
            <Text style={styles.signatureSubtext}>LOCADORA</Text>
          </View>
          
          <View style={styles.signatureColumn}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureText}>{data.client.name}</Text>
            <Text style={styles.signatureSubtext}>LOCATÁRIA</Text>
          </View>
        </View>

        {/* Data do Contrato */}
        <View style={styles.contractDate}>
          <Text>CUIABÁ - MT, {formatDateLong(new Date())}</Text>
        </View>
      </Page>
    </Document>
  );
}
