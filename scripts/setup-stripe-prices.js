const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function setupStripePrices() {
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
    console.log('Mensal (R$ 97,90/mês):', monthlyPrice.id);
    console.log('Anual (R$ 979,00/ano):', annualPrice.id);

    // Salvar os IDs em um arquivo para uso posterior
    const fs = require('fs');
    const priceIds = {
      monthlyPriceId: monthlyPrice.id,
      annualPriceId: annualPrice.id,
    };

    fs.writeFileSync(
      'stripe-price-ids.json',
      JSON.stringify(priceIds, null, 2)
    );

    console.log('\n💾 IDs salvos em stripe-price-ids.json');

    return priceIds;
  } catch (error) {
    console.error('❌ Erro ao criar preços:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupStripePrices()
    .then(() => {
      console.log('\n🎉 Setup concluído com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Erro no setup:', error);
      process.exit(1);
    });
}

module.exports = { setupStripePrices }; 