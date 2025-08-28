// Sistema de logging configurável para produção vs desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  // Logs de debug - apenas em desenvolvimento
  debug: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`🔍 ${message}`, ...args);
    }
  },

  // Logs de info - sempre visíveis
  info: (message: string, ...args: any[]) => {
    console.log(`ℹ️ ${message}`, ...args);
  },

  // Logs de sucesso - sempre visíveis
  success: (message: string, ...args: any[]) => {
    console.log(`✅ ${message}`, ...args);
  },

  // Logs de warning - sempre visíveis
  warn: (message: string, ...args: any[]) => {
    console.warn(`⚠️ ${message}`, ...args);
  },

  // Logs de erro - sempre visíveis
  error: (message: string, ...args: any[]) => {
    console.error(`❌ ${message}`, ...args);
  },

  // Logs de cache - apenas em desenvolvimento
  cache: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`🗄️ ${message}`, ...args);
    }
  },

  // Logs de limpeza - apenas em desenvolvimento
  cleanup: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`🗑️ ${message}`, ...args);
    }
  },

  // Logs de dashboard - apenas em desenvolvimento
  dashboard: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`📊 ${message}`, ...args);
    }
  },

  // Logs de dados - apenas em desenvolvimento
  data: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`📦 ${message}`, ...args);
    }
  },

  // Logs de refresh - apenas em desenvolvimento
  refresh: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`🔄 ${message}`, ...args);
    }
  }
};
