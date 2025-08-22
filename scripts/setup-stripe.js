const {
  createRecurringPrice,
  STRIPE_PRODUCT_IDS,
  STRIPE_PRODUCTS,
} = require('../lib/stripe.ts');

async function setupStripePrices() {
  try {
    console.log('🔄 Configurando preços recorrentes no Stripe...');

    // Criar preço mensal recorrente
    const monthlyPrice = await createRecurringPrice(
      STRIPE_PRODUCT_IDS.MONTHLY,
      STRIPE_PRODUCTS.MONTHLY.price,
      'month'
    );

    console.log('✅ Preço mensal criado:', monthlyPrice.id);

    // Criar preço anual recorrente
    const annualPrice = await createRecurringPrice(
      STRIPE_PRODUCT_IDS.ANNUAL,
      STRIPE_PRODUCTS.ANNUAL.price,
      'year'
    );

    console.log('✅ Preço anual criado:', annualPrice.id);

    console.log('\n📋 Resumo dos preços criados:');
    console.log(`Mensal: ${monthlyPrice.id} - R$ 97,90/mês`);
    console.log(`Anual: ${annualPrice.id} - R$ 979,00/ano`);

    // Salvar os IDs em um arquivo para uso posterior
    const fs = require('fs');
    const priceIds = {
      monthly: monthlyPrice.id,
      annual: annualPrice.id,
    };

    fs.writeFileSync(
      'stripe-price-ids.json',
      JSON.stringify(priceIds, null, 2)
    );
    console.log('\n💾 IDs salvos em stripe-price-ids.json');
  } catch (error) {
    console.error('❌ Erro ao criar preços:', error.message);
  }
}

setupStripePrices();
