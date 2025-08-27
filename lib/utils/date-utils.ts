/**
 * Utilitários para manipulação correta de datas e fuso horário
 * 
 * Estratégia: Sempre salvar em UTC no banco, converter para fuso local no frontend
 */

/**
 * Converte uma data local para UTC para envio ao banco
 * @param localDate - Data no formato YYYY-MM-DD
 * @param localTime - Hora no formato HH:mm (opcional)
 * @param timezone - Fuso horário (padrão: America/Sao_Paulo)
 * @returns String ISO em UTC
 */
export function localToUTC(
  localDate: string, 
  localTime?: string, 
  timezone: string = 'America/Sao_Paulo'
): string {
  try {
    if (!localDate) return '';
    
    // Combinar data e hora
    const dateTimeString = localTime 
      ? `${localDate}T${localTime}:00` 
      : `${localDate}T00:00:00`;
    
    // Criar data no fuso horário local
    const localDateTime = new Date(dateTimeString);
    
    // Converter para UTC
    const utcString = localDateTime.toISOString();
    
    return utcString;
  } catch (error) {
    console.error('Erro ao converter data local para UTC:', error);
    return localDate;
  }
}

/**
 * Converte uma data UTC do banco para fuso horário local
 * @param utcDate - Data UTC do banco
 * @param timezone - Fuso horário de destino (padrão: America/Sao_Paulo)
 * @returns Data formatada no fuso local
 */
export function utcToLocal(
  utcDate: string, 
  timezone: string = 'America/Sao_Paulo'
): string {
  try {
    if (!utcDate) return '';

    // Se já estiver no formato YYYY-MM-DD, usar diretamente
    if (/^\d{4}-\d{2}-\d{2}$/.test(utcDate)) {
      return utcDate;
    }

    // Criar objeto Date a partir da string UTC
    const date = new Date(utcDate);

    if (isNaN(date.getTime())) {
      throw new Error('Data inválida');
    }

    // Converter para o fuso horário local
    const localDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));

    // Formatar como YYYY-MM-DD
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Erro ao converter UTC para local:', error);
    return utcDate;
  }
}

/**
 * Converte uma data UTC para objeto Date no fuso local
 * @param utcDate - Data UTC do banco
 * @param timezone - Fuso horário de destino (padrão: America/Sao_Paulo)
 * @returns Objeto Date no fuso local
 */
export function utcToLocalDate(
  utcDate: string, 
  timezone: string = 'America/Sao_Paulo'
): Date {
  try {
    if (!utcDate) return new Date();
    
    // Criar objeto Date a partir da string UTC
    const date = new Date(utcDate);
    
    if (isNaN(date.getTime())) {
      throw new Error('Data inválida');
    }
    
    // Converter para o fuso horário local
    return new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  } catch (error) {
    console.error('Erro ao converter UTC para Date local:', error);
    return new Date();
  }
}

/**
 * Formata uma data para exibição no formato brasileiro
 * @param date - Data (string ou Date)
 * @param timezone - Fuso horário (padrão: America/Sao_Paulo)
 * @returns Data formatada como DD/MM/YYYY
 */
export function formatDateForDisplay(
  date: string | Date, 
  timezone: string = 'America/Sao_Paulo'
): string {
  try {
    if (!date) return '';
    
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Se for string UTC, converter para local
      if (date.includes('T') && (date.includes('+') || date.includes('Z'))) {
        dateObj = utcToLocalDate(date, timezone);
      } else {
        // Se for string de data simples, criar Date
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }
    
    if (isNaN(dateObj.getTime())) {
      throw new Error('Data inválida');
    }
    
    return dateObj.toLocaleDateString('pt-BR');
  } catch (error) {
    console.error('Erro ao formatar data para exibição:', error);
    return String(date);
  }
}

/**
 * Formata uma data para input HTML (formato YYYY-MM-DD)
 * @param date - Data (string ou Date)
 * @param timezone - Fuso horário (padrão: America/Sao_Paulo)
 * @returns Data formatada como YYYY-MM-DD
 */
export function formatDateForInput(
  date: string | Date, 
  timezone: string = 'America/Sao_Paulo'
): string {
  try {
    if (!date) return '';
    
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Se for string UTC, converter para local
      if (date.includes('T') && (date.includes('+') || date.includes('Z'))) {
        dateObj = utcToLocalDate(date, timezone);
      } else {
        // Se for string de data simples, criar Date
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }
    
    if (isNaN(dateObj.getTime())) {
      throw new Error('Data inválida');
    }
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Erro ao formatar data para input:', error);
    return '';
  }
}

/**
 * Converte data e hora para UTC para envio ao banco
 * @param localDate - Data no formato YYYY-MM-DD
 * @param localTime - Hora no formato HH:mm
 * @param timezone - Fuso horário (padrão: America/Sao_Paulo)
 * @returns String ISO em UTC
 */
export function dateTimeToUTC(
  localDate: string, 
  localTime: string, 
  timezone: string = 'America/Sao_Paulo'
): string {
  try {
    if (!localDate || !localTime) return '';
    
    // Combinar data e hora
    const dateTimeString = `${localDate}T${localTime}:00`;
    
    // Criar data no fuso horário local
    const localDateTime = new Date(dateTimeString);
    
    // Converter para UTC
    return localDateTime.toISOString();
  } catch (error) {
    console.error('Erro ao converter data/hora para UTC:', error);
    return localDate;
  }
}

/**
 * Extrai apenas a data (sem hora) de um timestamp UTC
 * @param utcDate - Data UTC do banco
 * @param timezone - Fuso horário (padrão: America/Sao_Paulo)
 * @returns Data no formato YYYY-MM-DD
 */
export function extractDateFromUTC(
  utcDate: string, 
  timezone: string = 'America/Sao_Paulo'
): string {
  try {
    if (!utcDate) return '';
    
    // Se já estiver no formato YYYY-MM-DD, retornar diretamente
    if (/^\d{4}-\d{2}-\d{2}$/.test(utcDate)) {
      return utcDate;
    }
    
    // Converter UTC para local e extrair apenas a data
    const localDate = utcToLocalDate(utcDate, timezone);
    
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Erro ao extrair data de UTC:', error);
    return utcDate;
  }
}

/**
 * Verifica se uma data é hoje no fuso horário local
 * @param date - Data para verificar
 * @param timezone - Fuso horário (padrão: America/Sao_Paulo)
 * @returns true se for hoje
 */
export function isToday(
  date: string | Date, 
  timezone: string = 'America/Sao_Paulo'
): boolean {
  try {
    if (!date) return false;
    
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Se for string UTC, converter para local
      if (date.includes('T') && (date.includes('+') || date.includes('Z'))) {
        dateObj = utcToLocalDate(date, timezone);
      } else {
        // Se for string de data simples, criar Date
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }
    
    if (isNaN(dateObj.getTime())) {
      return false;
    }
    
    // Comparar com a data atual no fuso horário local
    const today = new Date();
    const todayLocal = new Date(today.toLocaleString('en-US', { timeZone: timezone }));
    
    return (
      dateObj.getFullYear() === todayLocal.getFullYear() &&
      dateObj.getMonth() === todayLocal.getMonth() &&
      dateObj.getDate() === todayLocal.getDate()
    );
  } catch (error) {
    console.error('Erro ao verificar se é hoje:', error);
    return false;
  }
}

/**
 * Obtém a data atual no fuso horário especificado
 * @param timezone - Fuso horário (padrão: America/Sao_Paulo)
 * @returns Data atual no formato YYYY-MM-DD
 */
export function getCurrentDate(timezone: string = 'America/Sao_Paulo'): string {
  try {
    const now = new Date();
    const localNow = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    
    const year = localNow.getFullYear();
    const month = String(localNow.getMonth() + 1).padStart(2, '0');
    const day = String(localNow.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Erro ao obter data atual:', error);
    const now = new Date();
    return now.toISOString().split('T')[0];
  }
}

/**
 * Cria uma chave de data para comparação (formato YYYY-MM-DD)
 * @param date - Data (string ou Date)
 * @param timezone - Fuso horário (padrão: America/Sao_Paulo)
 * @returns Chave de data no formato YYYY-MM-DD
 */
export function createDateKey(
  date: string | Date, 
  timezone: string = 'America/Sao_Paulo'
): string {
  try {
    if (!date) return '';
    
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Se for string UTC, converter para local
      if (date.includes('T') && (date.includes('+') || date.includes('Z'))) {
        dateObj = utcToLocalDate(date, timezone);
      } else {
        // Se for string de data simples, criar Date
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }
    
    if (isNaN(dateObj.getTime())) {
      throw new Error('Data inválida');
    }
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Erro ao criar chave de data:', error);
    return '';
  }
}
