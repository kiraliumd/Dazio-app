const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createRecurringPrices() {
  try {
    console.log('🔄 Criando preços recorrentes no Stripe...');

    // Criar preço mensal recorrente
    const monthlyPrice = await stripe.prices.create({
      product: 'prod_Sn2n2D1UuSgF4u',
      unit_amount: 9790, // R$ 97,90 em centavos
      currency: 'brl',
      recurring: {
        interval: 'month',
      },
    });

    console.log('✅ Preço mensal criado:', monthlyPrice.id);

    // Criar preço anual recorrente
    const annualPrice = await stripe.prices.create({
      product: 'prod_Sn2ndrRgXRp0rC',
      unit_amount: 97900, // R$ 979,00 em centavos
      currency: 'brl',
      recurring: {
        interval: 'year',
      },
    });

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

createRecurringPrices();
