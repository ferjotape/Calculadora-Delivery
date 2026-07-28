import Stripe from "stripe";

let instance: Stripe | null = null;

function getInstance(): Stripe {
  if (!instance) {
    instance = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return instance;
}

/**
 * Instanciado sob demanda (na primeira chamada real), não no carregamento do
 * módulo — evita falhar o build/coleta de dados de rota quando
 * STRIPE_SECRET_KEY ainda não está definida (ex: build sem segredos).
 */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getInstance(), prop, receiver);
  },
});
