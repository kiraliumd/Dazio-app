#!/bin/bash

# 🚀 Script de Correção Automática de Qualidade de Código
# Dazio Admin - Versão 1.0
# 
# Este script corrige automaticamente alguns problemas de qualidade identificados
# na revisão de boas práticas.

set -e

echo "🔍 Iniciando correção automática de qualidade de código..."
echo "=================================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. Remover console.log de produção (manter apenas em desenvolvimento)
log "1. Removendo console.log de produção..."

# Criar backup dos arquivos
mkdir -p backups/$(date +%Y%m%d_%H%M%S)

# Função para processar arquivos TypeScript/TSX
process_file() {
    local file="$1"
    local backup_dir="$2"
    
    if [[ -f "$file" ]]; then
        # Criar backup
        cp "$file" "$backup_dir/"
        
        # Substituir console.log por versão condicional
        sed -i.tmp 's/console\.log(/if (process.env.NODE_ENV === "development") { console.log(/g' "$file"
        sed -i.tmp 's/console\.warn(/if (process.env.NODE_ENV === "development") { console.warn(/g' "$file"
        sed -i.tmp 's/console\.error(/if (process.env.NODE_ENV === "development") { console.error(/g' "$file"
        
        # Adicionar chaves de fechamento
        sed -i.tmp 's/console\.log([^)]*);/& }/g' "$file"
        sed -i.tmp 's/console\.warn([^)]*);/& }/g' "$file"
        sed -i.tmp 's/console\.error([^)]*);/& }/g' "$file"
        
        # Remover arquivos temporários
        rm -f "$file.tmp"
        
        log "   Processado: $file"
    fi
}

# Processar todos os arquivos TypeScript/TSX
backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v .next | while read file; do
    process_file "$file" "$backup_dir"
done

# 2. Criar arquivo de configuração ESLint melhorado
log "2. Criando configuração ESLint melhorada..."

cat > .eslintrc.json << 'EOF'
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "react-hooks/exhaustive-deps": "error",
    "no-console": "warn",
    "prefer-const": "error",
    "no-var": "error"
  },
  "overrides": [
    {
      "files": ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
      "rules": {
        "@typescript-eslint/no-explicit-any": "off",
        "no-console": "off"
      }
    }
  ]
}
EOF

# 3. Criar arquivo de configuração Prettier
log "3. Criando configuração Prettier..."

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

# 4. Criar arquivo .prettierignore
log "4. Criando .prettierignore..."

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
EOF

# 5. Criar script de limpeza automática
log "5. Criando script de limpeza automática..."

cat > scripts/cleanup-code.sh << 'EOF'
#!/bin/bash

# Script para limpeza automática de código
# Remove imports não utilizados e variáveis não utilizadas

echo "🧹 Iniciando limpeza automática de código..."

# Instalar dependências necessárias se não existirem
if ! command -v npx &> /dev/null; then
    echo "❌ npx não encontrado. Instale o Node.js primeiro."
    exit 1
fi

# Executar ESLint com --fix
echo "🔧 Executando ESLint com correções automáticas..."
npx eslint . --ext .ts,.tsx --fix

# Executar Prettier
echo "💅 Executando Prettier..."
npx prettier --write "**/*.{ts,tsx,js,jsx,json,css,md}"

echo "✅ Limpeza concluída!"
EOF

chmod +x scripts/cleanup-code.sh

# 6. Criar arquivo de configuração TypeScript mais rigoroso
log "6. Atualizando configuração TypeScript..."

# Verificar se tsconfig.json existe
if [[ -f "tsconfig.json" ]]; then
    # Fazer backup
    cp tsconfig.json "tsconfig.json.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Atualizar configurações para ser mais rigoroso
    sed -i.tmp 's/"strict": false/"strict": true/g' tsconfig.json
    sed -i.tmp 's/"noImplicitAny": false/"noImplicitAny": true/g' tsconfig.json
    sed -i.tmp 's/"strictNullChecks": false/"strictNullChecks": true/g' tsconfig.json
    
    rm -f tsconfig.json.tmp
    log "   tsconfig.json atualizado para modo strict"
else
    warn "   tsconfig.json não encontrado"
fi

# 7. Criar arquivo de configuração do VSCode
log "7. Criando configuração do VSCode..."

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

# 8. Criar arquivo de configuração do Git hooks
log "8. Configurando Git hooks..."

cat > .husky/pre-commit << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Executando verificações pré-commit..."

# Executar ESLint
npx lint-staged

# Verificar se há erros críticos
if npx eslint . --ext .ts,.tsx --max-warnings 0; then
    echo "✅ Verificações passaram!"
else
    echo "❌ Erros encontrados. Corrija antes de fazer commit."
    exit 1
fi
EOF

chmod +x .husky/pre-commit

# 9. Atualizar package.json com scripts úteis
log "9. Atualizando package.json..."

if [[ -f "package.json" ]]; then
    # Fazer backup
    cp package.json "package.json.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Adicionar scripts úteis se não existirem
    if ! grep -q '"lint:fix"' package.json; then
        # Encontrar a linha dos scripts e adicionar após ela
        sed -i.tmp '/"lint":/a\    "lint:fix": "next lint --fix",' package.json
    fi
    
    if ! grep -q '"format"' package.json; then
        sed -i.tmp '/"lint:fix":/a\    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,css,md}\"",' package.json
    fi
    
    if ! grep -q '"type-check"' package.json; then
        sed -i.tmp '/"format":/a\    "type-check": "tsc --noEmit",' package.json
    fi
    
    rm -f package.json.tmp
    log "   package.json atualizado com novos scripts"
else
    warn "   package.json não encontrado"
fi

# 10. Criar arquivo de documentação das correções
log "10. Criando documentação das correções..."

cat > docs/AUTO_FIXES_APPLIED.md << 'EOF'
# 🔧 Correções Automáticas Aplicadas

**Data**: $(date)
**Script**: fix-code-quality.sh

## ✅ Correções Implementadas

### 1. Console.log de Produção
- Substituído por verificações condicionais de ambiente
- Backup criado em: `backups/$(date +%Y%m%d_%H%M%S)/`

### 2. Configuração ESLint
- Arquivo `.eslintrc.json` criado com regras rigorosas
- Regra `@typescript-eslint/no-explicit-any` definida como erro
- Regra `react-hooks/exhaustive-deps` habilitada

### 3. Configuração Prettier
- Arquivo `.prettierrc` criado com configurações padrão
- Arquivo `.prettierignore` criado

### 4. Scripts de Limpeza
- `scripts/cleanup-code.sh` criado para limpeza automática
- Executa ESLint --fix e Prettier automaticamente

### 5. Configuração TypeScript
- Modo strict habilitado
- `noImplicitAny` habilitado
- `strictNullChecks` habilitado

### 6. Configuração VSCode
- Configurações automáticas de formatação
- Extensões recomendadas
- Formatação automática ao salvar

### 7. Git Hooks
- Pre-commit hook configurado
- Verificações automáticas antes de cada commit

### 8. Scripts NPM
- `lint:fix` - Corrige problemas de linting automaticamente
- `format` - Formata código com Prettier
- `type-check` - Verifica tipos TypeScript

## 🚀 Como Usar

### Limpeza Automática
```bash
./scripts/cleanup-code.sh
```

### Verificação de Tipos
```bash
npm run type-check
```

### Formatação
```bash
npm run format
```

### Linting com Correções
```bash
npm run lint:fix
```

## ⚠️ Importante

1. **Backups**: Todos os arquivos modificados foram salvos em `backups/`
2. **Revisão**: Sempre revise as mudanças antes de fazer commit
3. **Testes**: Execute testes após aplicar as correções
4. **Gradual**: As correções podem ser aplicadas gradualmente

## 🔄 Próximos Passos

1. Execute `npm install` para instalar dependências
2. Execute `npm run lint:fix` para corrigir problemas automáticos
3. Revise e teste as mudanças
4. Faça commit das correções
5. Configure CI/CD para executar verificações automaticamente
EOF

# 11. Instalar dependências necessárias
log "11. Instalando dependências necessárias..."

# Verificar se pnpm está disponível
if command -v pnpm &> /dev/null; then
    log "   Instalando dependências com pnpm..."
    pnpm add -D @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-config-prettier eslint-plugin-prettier prettier husky lint-staged
else
    warn "   pnpm não encontrado. Instale manualmente as dependências:"
    echo "   npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-config-prettier eslint-plugin-prettier prettier husky lint-staged"
fi

# 12. Resumo final
echo ""
echo "🎉 Correção automática concluída!"
echo "=================================================="
echo ""
echo "📁 Arquivos criados/modificados:"
echo "   ✅ .eslintrc.json - Configuração ESLint rigorosa"
echo "   ✅ .prettierrc - Configuração Prettier"
echo "   ✅ .prettierignore - Arquivos ignorados pelo Prettier"
echo "   ✅ scripts/cleanup-code.sh - Script de limpeza automática"
echo "   ✅ .vscode/settings.json - Configurações do VSCode"
echo "   ✅ .vscode/extensions.json - Extensões recomendadas"
echo "   ✅ .husky/pre-commit - Git hook pré-commit"
echo "   ✅ docs/AUTO_FIXES_APPLIED.md - Documentação das correções"
echo ""
echo "📊 Resumo das correções:"
echo "   🔧 Console.log condicionado por ambiente"
echo "   🚫 Uso de 'any' bloqueado por ESLint"
echo "   📏 Formatação automática com Prettier"
echo "   🧹 Limpeza automática com ESLint --fix"
echo "   🔒 Verificações automáticas no commit"
echo ""
echo "🚀 Próximos passos:"
echo "   1. Execute: npm install (ou pnpm install)"
echo "   2. Execute: npm run lint:fix"
echo "   3. Revise as mudanças"
echo "   4. Teste a aplicação"
echo "   5. Faça commit das correções"
echo ""
echo "📚 Documentação criada em: docs/AUTO_FIXES_APPLIED.md"
echo "💾 Backups salvos em: backups/$(date +%Y%m%d_%H%M%S)/"
echo ""
echo "⚠️  IMPORTANTE: Sempre revise as mudanças antes de fazer commit!"
echo ""
