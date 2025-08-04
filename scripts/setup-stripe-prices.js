const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function setupStripePrices() {
  try {
    console.log('🔄 Criando produtos e preços no Stripe...');

    // Criar produto principal
    const product = await stripe.products.create({
      name: 'Dazio Admin',
      description: 'Sistema de gestão para locação de equipamentos',
    });

    console.log('✅ Produto criado:', product.id);

    // Criar preço mensal recorrente
    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 9790, // R$ 97,90 em centavos
      currency: 'brl',
      recurring: {
        interval: 'month',
      },
    });

    console.log('✅ Preço mensal criado:', monthlyPrice.id);

    // Criar preço anual recorrente
    const annualPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 97900, // R$ 979,00 em centavos
      currency: 'brl',
      recurring: {
        interval: 'year',
      },
    });

    console.log('✅ Preço anual criado:', annualPrice.id);

    console.log('\n📋 Resumo dos preços criados:');
    console.log('Produto:', product.id);
    console.log('Mensal (R$ 97,90/mês):', monthlyPrice.id);
    console.log('Anual (R$ 979,00/ano):', annualPrice.id);

    // Salvar os IDs em um arquivo para uso posterior
    const fs = require('fs');
    const priceIds = {
      productId: product.id,
      monthlyPriceId: monthlyPrice.id,
      annualPriceId: annualPrice.id,
    };

    fs.writeFileSync(
      'stripe-price-ids.json',
      JSON.stringify(priceIds, null, 2)
    );

    console.log('\n💾 IDs salvos em stripe-price-ids.json');
    console.log('\n🔧 Configure estas variáveis na Vercel:');
    console.log(`STRIPE_MONTHLY_PRICE_ID=${monthlyPrice.id}`);
    console.log(`STRIPE_ANNUAL_PRICE_ID=${annualPrice.id}`);

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