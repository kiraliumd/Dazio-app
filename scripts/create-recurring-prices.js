const Stripe = require('stripe');

// Configurar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
});

async function createRecurringPrices() {
  try {
    console.log('🔄 Criando preços recorrentes no Stripe...');

    // Criar preço mensal recorrente
    console.log('📅 Criando preço mensal...');
    const monthlyPrice = await stripe.prices.create({
      product: 'prod_Sn2n2D1UuSgF4u', // Dazio Admin - Plano Mensal
      unit_amount: 9790, // R$ 97,90 em centavos
      currency: 'brl',
      recurring: {
        interval: 'month',
      },
    });
    console.log('✅ Preço mensal criado:', monthlyPrice.id);

    // Criar preço anual recorrente
    console.log('📅 Criando preço anual...');
    const annualPrice = await stripe.prices.create({
      product: 'prod_Sn2ndrRgXRp0rC', // Dazio Admin - Plano Anual
      unit_amount: 97900, // R$ 979,00 em centavos
      currency: 'brl',
      recurring: {
        interval: 'year',
      },
    });
    console.log('✅ Preço anual criado:', annualPrice.id);

    // Salvar IDs em arquivo
    const priceIds = {
      monthlyPriceId: monthlyPrice.id,
      annualPriceId: annualPrice.id,
      monthlyProductId: 'prod_Sn2n2D1UuSgF4u',
      annualProductId: 'prod_Sn2ndrRgXRp0rC'
    };

    console.log('\n🎯 IDs dos preços criados:');
    console.log('Mensal:', monthlyPrice.id);
    console.log('Anual:', annualPrice.id);
    console.log('\n📝 Atualize o arquivo stripe-price-ids.json com esses IDs');

    return priceIds;

  } catch (error) {
    console.error('❌ Erro ao criar preços:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createRecurringPrices()
    .then(() => {
      console.log('\n✅ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script falhou:', error);
      process.exit(1);
    });
}

module.exports = { createRecurringPrices };
