#!/bin/bash

echo "🧹 Limpando cache do Next.js..."
rm -rf .next
rm -rf node_modules/.cache

echo "📦 Reinstalando dependências..."
pnpm install

echo "🚀 Iniciando desenvolvimento..."
pnpm run dev 