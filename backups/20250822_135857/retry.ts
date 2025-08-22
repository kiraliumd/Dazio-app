interface RetryOptions {
  maxAttempts?: number
  delay?: number
  backoff?: boolean
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 1000, backoff = true } = options

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error
      }

      const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay
      if (process.env.NODE_ENV === "development") { if (process.env.NODE_ENV === "development") { console.warn(`Tentativa ${attempt} falhou, tentando novamente em ${waitTime}ms:`, error)
      
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  throw new Error('Máximo de tentativas excedido')
}

// Função específica para operações do Supabase
export async function retrySupabase<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return retry(fn, {
    maxAttempts: 3,
    delay: 500,
    backoff: true,
    ...options
  })
} 