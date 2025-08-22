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
