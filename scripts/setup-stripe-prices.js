require('dotenv').config({ path: '../.env.local' });
const Stripe = require('stripe');

// Configurar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
});

async function setupStripePrices() {
  try {
    console.log('🔄 Configurando preços do Stripe para assinaturas...');
    console.log('🔑 Stripe Key configurada:', process.env.STRIPE_SECRET_KEY ? 'Sim' : 'Não');

    // Produtos já criados
    const monthlyProductId = 'prod_SrUYOa3o1QVx5R';
    const annualProductId = 'prod_SrUYErZLFjQj1e';

    // Criar preço mensal recorrente
    console.log('📅 Criando preço mensal recorrente...');
    const monthlyPrice = await stripe.prices.create({
      product: monthlyProductId,
      unit_amount: 9790, // R$ 97,90 em centavos
      currency: 'brl',
      recurring: {
        interval: 'month',
      },
    });
    console.log('✅ Preço mensal criado:', monthlyPrice.id);

    // Criar preço anual recorrente
    console.log('📅 Criando preço anual recorrente...');
    const annualPrice = await stripe.prices.create({
      product: annualProductId,
      unit_amount: 97900, // R$ 979,00 em centavos
      currency: 'brl',
      recurring: {
        interval: 'year',
      },
    });
    console.log('✅ Preço anual criado:', annualPrice.id);

    // Atualizar arquivo de configuração
    const config = {
      monthlyProductId: monthlyProductId,
      annualProductId: annualProductId,
      monthlyPriceId: monthlyPrice.id,
      annualPriceId: annualPrice.id
    };

    console.log('\n🎯 Configuração atualizada:');
    console.log('Produto Mensal:', monthlyProductId);
    console.log('Produto Anual:', annualProductId);
    console.log('Preço Mensal:', monthlyPrice.id);
    console.log('Preço Anual:', annualPrice.id);

    console.log('\n📝 Atualize o arquivo stripe-price-ids.json com:');
    console.log(JSON.stringify(config, null, 2));

    return config;

  } catch (error) {
    console.error('❌ Erro ao configurar preços:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupStripePrices()
    .then(() => {
      console.log('\n✅ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script falhou:', error);
      process.exit(1);
    });
}

module.exports = { setupStripePrices }; 