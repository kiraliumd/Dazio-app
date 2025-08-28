/**
 * Utilitários para manipulação correta de datas e fuso horário
 * 
 * ✅ SOLUÇÃO PROFISSIONAL: Usar date-fns-tz para manipulação correta de timezone
 * Estratégia: Sempre trabalhar com datas no fuso local do usuário, converter para UTC apenas no momento de salvar
 */

import { format, isValid, parseISO } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

// Fuso horário padrão do Brasil
const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

/**
 * Converte uma data local para UTC para envio ao banco
 * @param localDate - Data no formato YYYY-MM-DD
 * @param localTime - Hora no formato HH:mm (opcional, padrão: 12:00)
 * @param timezone - Fuso horário (padrão: America/Sao_Paulo)
 * @returns String ISO em UTC
 */
export function localToUTC(
  localDate: string,
  localTime?: string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  try {
    if (!localDate) return '';

    // Combinar data e hora (usar 12:00 para evitar problemas de meia-noite)
    const time = localTime || '12:00';
    const dateTimeString = `${localDate}T${time}:00`;
    
    // Criar data no fuso horário local
    const localDateTime = parseISO(dateTimeString);
    
    if (!isValid(localDateTime)) {
      throw new Error('Data inválida');
    }
    
    // ✅ SOLUÇÃO PROFISSIONAL: Converter para UTC usando date-fns-tz
    const utcDate = toZonedTime(localDateTime, timezone);
    
    return utcDate.toISOString();
  } catch (error) {
    console.error('Erro ao converter data local para UTC:', error);
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

    // ✅ SOLUÇÃO: Se for timestamp com hora, extrair apenas a data
    // O problema era que as conversões de fuso estavam causando mudanças de dia
    if (utcDate.includes('T')) {
      const datePart = utcDate.split('T')[0];
      return datePart;
    }

    // Para outros formatos, tentar conversão simples
    const dateObj = parseISO(utcDate);
    if (!isValid(dateObj)) {
      throw new Error('Data inválida');
    }

    // ✅ SOLUÇÃO: Retornar data no formato YYYY-MM-DD sem conversão de fuso
    return format(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Erro ao converter data para local:', error);
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
  timezone: string = DEFAULT_TIMEZONE
): Date {
  try {
    if (!utcDate) return new Date();
    
    // Se já estiver no formato YYYY-MM-DD, criar Date diretamente
    if (/^\d{4}-\d{2}-\d{2}$/.test(utcDate)) {
      return parseISO(utcDate);
    }
    
    // ✅ SOLUÇÃO PROFISSIONAL: Converter UTC para fuso local
    const utcDateTime = parseISO(utcDate);
    
    if (!isValid(utcDateTime)) {
      throw new Error('Data inválida');
    }
    
    return toZonedTime(utcDateTime, timezone);
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
  timezone: string = DEFAULT_TIMEZONE
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
        dateObj = parseISO(date);
      }
    } else {
      dateObj = date;
    }
    
    if (!isValid(dateObj)) {
      throw new Error('Data inválida');
    }
    
    // ✅ SOLUÇÃO PROFISSIONAL: Formatar no fuso local
    return formatInTimeZone(dateObj, timezone, 'dd/MM/yyyy');
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
  timezone: string = DEFAULT_TIMEZONE
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
        dateObj = parseISO(date);
      }
    } else {
      dateObj = date;
    }
    
    if (!isValid(dateObj)) {
      throw new Error('Data inválida');
    }
    
    // ✅ SOLUÇÃO PROFISSIONAL: Formatar no fuso local
    return formatInTimeZone(dateObj, timezone, 'yyyy-MM-dd');
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
  timezone: string = DEFAULT_TIMEZONE
): string {
  try {
    if (!localDate || !localTime) return '';
    
    // ✅ SOLUÇÃO PROFISSIONAL: Usar date-fns-tz para conversão correta
    const dateTimeString = `${localDate}T${localTime}:00`;
    const localDateTime = parseISO(dateTimeString);
    
    if (!isValid(localDateTime)) {
      throw new Error('Data/hora inválida');
    }
    
    // Converter para UTC
    const utcDate = toZonedTime(localDateTime, timezone);
    
    return utcDate.toISOString();
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
  timezone: string = DEFAULT_TIMEZONE
): string {
  try {
    if (!utcDate) return '';
    
    // Se já estiver no formato YYYY-MM-DD, retornar diretamente
    if (/^\d{4}-\d{2}-\d{2}$/.test(utcDate)) {
      return utcDate;
    }
    
    // ✅ SOLUÇÃO PROFISSIONAL: Converter UTC para local e extrair data
    const localDate = utcToLocalDate(utcDate, timezone);
    
    return format(localDate, 'yyyy-MM-dd');
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
  timezone: string = DEFAULT_TIMEZONE
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
        dateObj = parseISO(date);
      }
    } else {
      dateObj = date;
    }
    
    if (!isValid(dateObj)) {
      return false;
    }
    
    // ✅ SOLUÇÃO PROFISSIONAL: Comparar com a data atual no fuso local
    const now = new Date();
    const todayLocal = toZonedTime(now, timezone);
    
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
 * Obtém a data atual no fuso horário local
 * @param timezone - Fuso horário (padrão: America/Sao_Paulo)
 * @returns Data atual no formato YYYY-MM-DD
 */
export function getCurrentDate(
  timezone: string = DEFAULT_TIMEZONE
): string {
  try {
    // ✅ SOLUÇÃO PROFISSIONAL: Obter data atual no fuso local
    const now = new Date();
    const localNow = toZonedTime(now, timezone);
    
    return format(localNow, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Erro ao obter data atual:', error);
    // Fallback para data UTC
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
  timezone: string = DEFAULT_TIMEZONE
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
        dateObj = parseISO(date);
      }
    } else {
      dateObj = date;
    }
    
    if (!isValid(dateObj)) {
      throw new Error('Data inválida');
    }
    
    // ✅ SOLUÇÃO PROFISSIONAL: Formatar no fuso local
    return formatInTimeZone(dateObj, timezone, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Erro ao criar chave de data:', error);
    return '';
  }
}

/**
 * Obtém o fuso horário local do usuário
 * @returns Fuso horário local ou padrão
 */
export function getLocalTimezone(): string {
  try {
    // Tentar obter o fuso horário do navegador
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezone || DEFAULT_TIMEZONE;
  } catch (error) {
    console.warn('Não foi possível detectar fuso horário, usando padrão:', error);
    return DEFAULT_TIMEZONE;
  }
}

/**
 * Normaliza uma data para armazenamento (evita problemas de meia-noite)
 * @param date - Data no formato YYYY-MM-DD
 * @param timezone - Fuso horário (padrão: America/Sao_Paulo)
 * @returns Data normalizada para armazenamento
 */
export function normalizeDateForStorage(
  date: string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  try {
    if (!date) return '';
    
    // ✅ SOLUÇÃO PROFISSIONAL: Usar 12:00 para evitar problemas de meia-noite
    const dateTimeString = `${date}T12:00:00`;
    const localDateTime = parseISO(dateTimeString);
    
    if (!isValid(localDateTime)) {
      throw new Error('Data inválida');
    }
    
    // Converter para UTC para armazenamento
    const utcDate = toZonedTime(localDateTime, timezone);
    
    return utcDate.toISOString();
  } catch (error) {
    console.error('Erro ao normalizar data para armazenamento:', error);
    return date;
  }
}
