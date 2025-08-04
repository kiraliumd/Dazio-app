#!/usr/bin/env node

/**
 * Script para configurar variáveis de ambiente no Vercel
 * Execute: node scripts/setup-vercel-env.js
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Configuração de Variáveis de Ambiente para Vercel');
console.log('==================================================\n');

// Verificar se existe arquivo .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ Arquivo .env.local não encontrado!');
  console.log('📝 Crie o arquivo .env.local com as seguintes variáveis:\n');
  
  const envTemplate = `# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico

# Stripe
STRIPE_SECRET_KEY=sua_chave_secreta_stripe
STRIPE_PUBLISHABLE_KEY=sua_chave_publica_stripe
STRIPE_MONTHLY_PRICE_ID=price_xxx
STRIPE_ANNUAL_PRICE_ID=price_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Database (se usar conexão direta)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`;

  console.log(envTemplate);
  process.exit(1);
}

// Ler arquivo .env.local
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && !key.startsWith('#')) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

console.log('📋 Variáveis encontradas no .env.local:');
Object.keys(envVars).forEach(key => {
  const value = envVars[key];
  const maskedValue = value.length > 10 ? value.substring(0, 10) + '...' : value;
  console.log(`   ${key}: ${maskedValue}`);
});

console.log('\n🔧 Para configurar no Vercel:');
console.log('1. Acesse: https://vercel.com/dashboard');
console.log('2. Vá para seu projeto dazio-admin');
console.log('3. Clique em "Settings" > "Environment Variables"');
console.log('4. Adicione cada variável acima');

console.log('\n📝 Comandos Vercel CLI (opcional):');
Object.entries(envVars).forEach(([key, value]) => {
  console.log(`   vercel env add ${key} production`);
});

console.log('\n🔗 Configuração da Conexão Direta:');
console.log('1. No Vercel, vá para "Settings" > "Storage"');
console.log('2. Clique em "Connect Database"');
console.log('3. Selecione "Supabase"');
console.log('4. Use a URL do DATABASE_URL acima');

console.log('\n✅ Configuração concluída!');
console.log('🔄 Faça um novo deploy após configurar as variáveis.'); 