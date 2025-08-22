import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Exibir data SEM converter UTC para local, tratando 'YYYY-MM-DD' como data local
export function formatDateCuiaba(date: Date | string, pattern = 'dd/MM/yyyy') {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    // Forçar data local (ano, mês, dia)
    const [year, month, day] = date.split('-').map(Number);
    return format(new Date(year, month - 1, day), pattern);
  }
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, pattern);
}

export function formatTimeCuiaba(date: Date | string, pattern = 'HH:mm') {
  const d = typeof date === 'string' ? new Date(`1970-01-01T${date}`) : date;
  return format(d, pattern);
}
