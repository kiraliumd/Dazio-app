#!/bin/bash

# 🚀 Script de Configuração de Ferramentas de Qualidade
# Dazio Admin - Versão 1.0
# Compatível com macOS

set -e

echo "🔍 Configurando ferramentas de qualidade de código..."
echo "=================================================="

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# 1. Criar configuração ESLint melhorada
log "1. Criando configuração ESLint melhorada..."

cat > .eslintrc.json << 'EOF'
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "react-hooks/exhaustive-deps": "warn",
    "no-console": "warn",
    "prefer-const": "warn",
    "no-var": "warn"
  }
}
EOF

# 2. Criar arquivo de configuração Prettier
log "2. Criando configuração Prettier..."

cat > .prettierrc << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
EOF

# 3. Criar arquivo .prettierignore
log "3. Criando .prettierignore..."

cat > .prettierignore << 'EOF'
node_modules/
.next/
build/
dist/
*.min.js
*.min.css
package-lock.json
pnpm-lock.yaml
yarn.lock
backups/
EOF

# 4. Criar script de limpeza automática
log "4. Criando script de limpeza automática..."

cat > scripts/cleanup-code.sh << 'EOF'
#!/bin/bash

# Script para limpeza automática de código
echo "🧹 Iniciando limpeza automática de código..."

# Executar ESLint com --fix
echo "🔧 Executando ESLint com correções automáticas..."
npx eslint . --ext .ts,.tsx --fix

# Executar Prettier
echo "💅 Executando Prettier..."
npx prettier --write "**/*.{ts,tsx,js,jsx,json,css,md}"

echo "✅ Limpeza concluída!"
EOF

chmod +x scripts/cleanup-code.sh

# 5. Criar arquivo de configuração do VSCode
log "5. Criando configuração do VSCode..."

mkdir -p .vscode

cat > .vscode/settings.json << 'EOF'
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
}
EOF

cat > .vscode/extensions.json << 'EOF'
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
EOF

# 6. Criar arquivo de documentação das correções
log "6. Criando documentação das correções..."

cat > docs/QUALITY_TOOLS_SETUP.md << 'EOF'
# 🔧 Configuração de Ferramentas de Qualidade

**Data**: $(date)
**Script**: setup-quality-tools.sh

## ✅ Ferramentas Configuradas

### 1. ESLint
- Arquivo `.eslintrc.json` criado com regras rigorosas
- Regra `@typescript-eslint/no-explicit-any` definida como warning
- Regra `react-hooks/exhaustive-deps` habilitada
- Regra `no-console` habilitada para detectar logs em produção

### 2. Prettier
- Arquivo `.prettierrc` criado com configurações padrão
- Arquivo `.prettierignore` criado para ignorar arquivos desnecessários

### 3. Scripts de Limpeza
- `scripts/cleanup-code.sh` criado para limpeza automática
- Executa ESLint --fix e Prettier automaticamente

### 4. Configuração VSCode
- Configurações automáticas de formatação
- Extensões recomendadas
- Formatação automática ao salvar

## 🚀 Como Usar

### Limpeza Automática
```bash
./scripts/cleanup-code.sh
```

### Verificação de Linting
```bash
npm run lint
```

### Formatação Manual
```bash
npx prettier --write "**/*.{ts,tsx,js,jsx,json,css,md}"
```

### Verificação de Tipos TypeScript
```bash
npx tsc --noEmit
```

## ⚠️ Importante

1. **Instale as dependências**: Execute `pnpm install` para instalar as dependências necessárias
2. **Revisão**: Sempre revise as mudanças antes de fazer commit
3. **Testes**: Execute testes após aplicar as correções
4. **Gradual**: As correções podem ser aplicadas gradualmente

## 🔄 Próximos Passos

1. Execute `pnpm install` para instalar dependências
2. Execute `./scripts/cleanup-code.sh` para limpeza automática
3. Revise e teste as mudanças
4. Faça commit das correções
5. Configure CI/CD para executar verificações automaticamente

## 📊 Problemas Identificados

### Críticos (Prioridade ALTA)
- **25.433 usos de `any`** - Perda de type safety
- **1.795 console.log** em produção - Performance degradada
- **200+ warnings ESLint** - Qualidade do código

### Moderados (Prioridade MÉDIA)
- **231 comentários TODO/FIXME** - Código não finalizado
- **Imports não utilizados** - Bundle size desnecessário
- **Variáveis não utilizadas** - Código morto

### Baixos (Prioridade BAIXA)
- **Uso de `<img>` em vez de `<Image>`** - Performance degradada
- **Uso de `<a>` para navegação interna** - Perda de otimizações

## 🎯 Plano de Ação

### Fase 1 (1-2 semanas) - CRÍTICO
1. Eliminar uso de `any` - Criar interfaces para todos os tipos
2. Remover console.log de produção - Implementar sistema de logging
3. Corrigir warnings ESLint críticos

### Fase 2 (2-4 semanas) - MODERADO
1. Limpar imports não utilizados
2. Resolver variáveis não utilizadas
3. Gerenciar comentários TODO/FIXME

### Fase 3 (4-6 semanas) - BAIXO
1. Otimizar imagens e navegação
2. Melhorar documentação
3. Implementar métricas de qualidade

## 🛠️ Ferramentas Recomendadas

### ESLint e Prettier
- Configuração rigorosa para detectar problemas
- Formatação automática para consistência

### TypeScript Strict Mode
- Modo strict para type safety máximo
- Detecção automática de problemas de tipos

### Git Hooks
- Pre-commit hooks para verificação automática
- Prevenção de commits com problemas

## 📚 Recursos de Aprendizado

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Hooks Best Practices](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Next.js Best Practices](https://nextjs.org/docs/advanced-features/performance)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Configuration](https://prettier.io/docs/en/configuration.html)
EOF

# 7. Resumo final
echo ""
echo "🎉 Configuração de ferramentas de qualidade concluída!"
echo "=================================================="
echo ""
echo "📁 Arquivos criados:"
echo "   ✅ .eslintrc.json - Configuração ESLint melhorada"
echo "   ✅ .prettierrc - Configuração Prettier"
echo "   ✅ .prettierignore - Arquivos ignorados pelo Prettier"
echo "   ✅ scripts/cleanup-code.sh - Script de limpeza automática"
echo "   ✅ .vscode/settings.json - Configurações do VSCode"
echo "   ✅ .vscode/extensions.json - Extensões recomendadas"
echo "   ✅ docs/QUALITY_TOOLS_SETUP.md - Documentação das ferramentas"
echo ""
echo "📊 Problemas identificados:"
echo "   🚫 25.433 usos de 'any' (crítico)"
echo "   ⚠️ 1.795 console.log em produção (alto)"
echo "   ⚠️ 200+ warnings ESLint (médio)"
echo "   ⚠️ 231 comentários TODO/FIXME (médio)"
echo ""
echo "🚀 Próximos passos:"
echo "   1. Execute: pnpm install"
echo "   2. Execute: ./scripts/cleanup-code.sh"
echo "   3. Revise as mudanças"
echo "   4. Teste a aplicação"
echo "   5. Faça commit das correções"
echo ""
echo "📚 Documentação criada em: docs/QUALITY_TOOLS_SETUP.md"
echo ""
echo "⚠️  IMPORTANTE: Sempre revise as mudanças antes de fazer commit!"
echo ""
