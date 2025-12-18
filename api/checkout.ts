
import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  // Fixed Stripe API version mismatch to match '2025-12-15.clover'
  apiVersion: '2025-12-15.clover',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { chatTitle } = req.body;
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['host'];
    
    const successUrl = `${protocol}://${host}/?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${protocol}://${host}/`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'pix'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'VibeCheck Pro - Diagnóstico de Relacionamento',
              description: `Análise profunda da conversa: ${chatTitle}`,
              images: ['https://raw.githubusercontent.com/lucide-react/lucide/main/icons/heart.svg'],
            },
            unit_amount: 590, // R$ 5,90
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Payment Error:', error);
    return res.status(500).json({ error: 'Erro ao processar transação.' });
  }
}
