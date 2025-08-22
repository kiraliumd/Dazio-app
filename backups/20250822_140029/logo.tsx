// Componente de Logo SVG
// Substitua o conteúdo SVG abaixo pela sua logo

export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 32 32" 
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
    >
      {/* 
        SUBSTITUA ESTE CONTEÚDO PELA SUA LOGO SVG
        Exemplo de logo simples para "Precisa Locações":
      */}
      
      {/* Fundo circular */}
      <circle cx="16" cy="16" r="15" fill="currentColor" opacity="0.1"/>
      
      {/* Letra P estilizada */}
      <path 
        d="M10 8h8c2.2 0 4 1.8 4 4s-1.8 4-4 4h-4v4h-4V8zm4 6h4c1.1 0 2-0.9 2-2s-0.9-2-2-2h-4v4z"
        fill="currentColor"
      />
      
      {/* Símbolo de localização */}
      <circle cx="22" cy="22" r="3" fill="currentColor" opacity="0.7"/>
      
      {/* 
        FIM DO EXEMPLO - SUBSTITUA PELA SUA LOGO REAL
      */}
    </svg>
  )
}

// Versão alternativa com texto (para logo retangular)
export function LogoWithText({ className = "h-8 w-32" }: { className?: string }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 128 32" 
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
    >
      {/* 
        LOGO COM TEXTO - SUBSTITUA PELA SUA LOGO REAL
      */}
      
      {/* Ícone */}
      <circle cx="16" cy="16" r="12" fill="currentColor" opacity="0.1"/>
      <path 
        d="M8 8h6c1.7 0 3 1.3 3 3s-1.3 3-3 3h-3v3h-3V8zm3 4.5h3c0.8 0 1.5-0.7 1.5-1.5s-0.7-1.5-1.5-1.5h-3v3z"
        fill="currentColor"
      />
      
      {/* Texto "Precisa" */}
      <text x="36" y="20" fontSize="14" fontWeight="600" fill="currentColor">
        Precisa
      </text>
      
      {/* Texto "Locações" */}
      <text x="36" y="28" fontSize="10" fill="currentColor" opacity="0.7">
        Locações
      </text>
      
      {/* 
        FIM DO EXEMPLO - SUBSTITUA PELA SUA LOGO REAL
      */}
    </svg>
  )
} 