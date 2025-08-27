/**
 * Utilitários para manipulação correta de datas e fuso horário
 * 
 * Estratégia: Sempre salvar em UTC no banco, converter para fuso local no frontend
 */

/**
 * Converte uma data local para formato de envio ao banco
 * @param localDate - Data no formato YYYY-MM-DD
 * @param localTime - Hora no formato HH:mm (opcional)
 * @param timezone - Fuso horário (não usado mais, mantido para compatibilidade)
 * @returns String ISO sem conversão de fuso
 */
export function localToUTC(
  localDate: string, 
  localTime?: string, 
  timezone?: string
): string {
  try {
    if (!localDate) return '';
    
    // ✅ SOLUÇÃO CRÍTICA: Não converter para UTC, apenas formatar
    // O problema era que a conversão para UTC estava causando mudanças de dia
    
    // Combinar data e hora
    const dateTimeString = localTime 
      ? `${localDate}T${localTime}:00` 
      : `${localDate}T12:00:00`; // ✅ Usar 12:00 para evitar problemas de meia-noite
    
    // ✅ Retornar diretamente sem conversão para UTC
    return dateTimeString;
  } catch (error) {
    console.error('Erro ao formatar data local:', error);
    return localDate;
  }
}

/**
 * Converte uma data do banco para formato local (sem conversão de fuso)
 * @param utcDate - Data do banco (pode ser UTC ou local)
 * @param timezone - Fuso horário (não usado mais, mantido para compatibilidade)
 * @returns Data formatada como YYYY-MM-DD
 */
export function utcToLocal(
  utcDate: string, 
  timezone?: string
): string {
  try {
    if (!utcDate) return '';

    // Se já estiver no formato YYYY-MM-DD, usar diretamente
    if (/^\d{4}-\d{2}-\d{2}$/.test(utcDate)) {
      return utcDate;
    }

    // ✅ SOLUÇÃO CRÍTICA: Se for timestamp com hora, extrair apenas a data
    // O problema era que as conversões de fuso estavam causando mudanças de dia
    if (utcDate.includes('T')) {
      const datePart = utcDate.split('T')[0];
      return datePart;
    }

    // Para outros formatos, tentar conversão simples
    const dateObj = new Date(utcDate);
    if (isNaN(dateObj.getTime())) {
      throw new Error('Data inválida');
    }

    // ✅ SOLUÇÃO: Retornar data no formato YYYY-MM-DD sem conversão de fuso
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Erro ao converter data para local:', error);
    return utcDate;
  }
}

/**
 * Converte uma data do banco para objeto Date (sem conversão de fuso)
 * @param utcDate - Data do banco (pode ser UTC ou local)
 * @param timezone - Fuso horário (não usado mais, mantido para compatibilidade)
 * @returns Objeto Date
 */
export function utcToLocalDate(
  utcDate: string, 
  timezone?: string
): Date {
  try {
    if (!utcDate) return new Date();
    
    // ✅ SOLUÇÃO CRÍTICA: Se for timestamp com hora, extrair apenas a data
    // O problema era que as conversões de fuso estavam causando mudanças de dia
    if (utcDate.includes('T')) {
      const datePart = utcDate.split('T')[0];
      return new Date(datePart);
    }

    // Para outros formatos, criar Date diretamente
    const dateObj = new Date(utcDate);
    if (isNaN(dateObj.getTime())) {
      throw new Error('Data inválida');
    }
    
    return dateObj;
  } catch (error) {
    console.error('Erro ao converter data para Date local:', error);
    return new Date();
  }
}

/**
 * Formata uma data para exibição no formato brasileiro
 * @param date - Data (string ou Date)
 * @param timezone - Fuso horário (não usado mais, mantido para compatibilidade)
 * @returns Data formatada como DD/MM/YYYY
 */
export function formatDateForDisplay(
  date: string | Date, 
  timezone?: string
): string {
  try {
    if (!date) return '';
    
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Se for string UTC, converter para local
      if (date.includes('T') && (date.includes('+') || date.includes('Z'))) {
        dateObj = utcToLocalDate(date);
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
 * @param timezone - Fuso horário (não usado mais, mantido para compatibilidade)
 * @returns Data formatada como YYYY-MM-DD
 */
export function formatDateForInput(
  date: string | Date, 
  timezone?: string
): string {
  try {
    if (!date) return '';
    
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Se for string UTC, converter para local
      if (date.includes('T') && (date.includes('+') || date.includes('Z'))) {
        dateObj = utcToLocalDate(date);
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
 * Converte data e hora para formato de envio ao banco
 * @param localDate - Data no formato YYYY-MM-DD
 * @param localTime - Hora no formato HH:mm
 * @param timezone - Fuso horário (não usado mais, mantido para compatibilidade)
 * @returns String ISO sem conversão de fuso
 */
export function dateTimeToUTC(
  localDate: string, 
  localTime: string, 
  timezone?: string
): string {
  try {
    if (!localDate || !localTime) return '';
    
    // ✅ SOLUÇÃO CRÍTICA: Não converter para UTC, apenas formatar
    // O problema era que a conversão para UTC estava causando mudanças de dia
    
    // Combinar data e hora
    const dateTimeString = `${localDate}T${localTime}:00`;
    
    // ✅ Retornar diretamente sem conversão para UTC
    return dateTimeString;
  } catch (error) {
    console.error('Erro ao formatar data/hora:', error);
    return localDate;
  }
}

/**
 * Extrai apenas a data (sem hora) de um timestamp
 * @param utcDate - Data do banco (pode ser UTC ou local)
 * @param timezone - Fuso horário (não usado mais, mantido para compatibilidade)
 * @returns Data no formato YYYY-MM-DD
 */
export function extractDateFromUTC(
  utcDate: string, 
  timezone?: string
): string {
  try {
    if (!utcDate) return '';
    
    // Se já estiver no formato YYYY-MM-DD, retornar diretamente
    if (/^\d{4}-\d{2}-\d{2}$/.test(utcDate)) {
      return utcDate;
    }
    
    // ✅ SOLUÇÃO: Se for timestamp com hora, extrair apenas a data
    if (utcDate.includes('T')) {
      const datePart = utcDate.split('T')[0];
      return datePart;
    }
    
    // Para outros formatos, tentar conversão simples
    const dateObj = new Date(utcDate);
    if (isNaN(dateObj.getTime())) {
      throw new Error('Data inválida');
    }
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Erro ao extrair data:', error);
    return utcDate;
  }
}

/**
 * Verifica se uma data é hoje
 * @param date - Data para verificar
 * @param timezone - Fuso horário (não usado mais, mantido para compatibilidade)
 * @returns true se for hoje
 */
export function isToday(
  date: string | Date, 
  timezone?: string
): boolean {
  try {
    if (!date) return false;
    
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Se for string UTC, converter para local
      if (date.includes('T') && (date.includes('+') || date.includes('Z'))) {
        dateObj = utcToLocalDate(date);
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
    
    // ✅ SOLUÇÃO: Comparar com a data atual sem conversão de fuso
    const today = new Date();
    
    return (
      dateObj.getFullYear() === today.getFullYear() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getDate() === today.getDate()
    );
  } catch (error) {
    console.error('Erro ao verificar se é hoje:', error);
    return false;
  }
}

/**
 * Obtém a data atual
 * @param timezone - Fuso horário (não usado mais, mantido para compatibilidade)
 * @returns Data atual no formato YYYY-MM-DD
 */
export function getCurrentDate(timezone?: string): string {
  try {
    // ✅ SOLUÇÃO: Obter data atual sem conversão de fuso
    const now = new Date();
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
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
 * @param timezone - Fuso horário (não usado mais, mantido para compatibilidade)
 * @returns Chave de data no formato YYYY-MM-DD
 */
export function createDateKey(
  date: string | Date, 
  timezone?: string
): string {
  try {
    if (!date) return '';
    
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Se for string UTC, converter para local
      if (date.includes('T') && (date.includes('+') || date.includes('Z'))) {
        dateObj = utcToLocalDate(date);
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
