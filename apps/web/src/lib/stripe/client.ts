import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

export type StripeWebhookEvent = Stripe.Event;
export type StripeCustomer = Stripe.Customer;
export type StripePaymentMethod = Stripe.PaymentMethod;
export type StripeSubscription = Stripe.Subscription;
export type StripeInvoice = Stripe.Invoice;
export type StripeSetupIntent = Stripe.SetupIntent;
export type StripePaymentIntent = Stripe.PaymentIntent;

