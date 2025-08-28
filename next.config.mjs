/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações de imagem
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    minimumCacheTTL: 60,
  },
  
  // Configurações de desenvolvimento
  experimental: {
    // Reduzir Fast Refresh para evitar múltiplos rebuilds
    optimizePackageImports: ['@supabase/supabase-js'],
  },
  
  // Configurações de webpack
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Reduzir frequência de rebuilds em desenvolvimento
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000, // Verificar mudanças a cada 1 segundo
        aggregateTimeout: 300, // Aguardar 300ms antes de rebuild
      };
    }
    
    return config;
  },
  
  // Temporariamente desabilitar optimizeCss para evitar erro do critters
  // optimizeCss: false,
};

export default nextConfig;