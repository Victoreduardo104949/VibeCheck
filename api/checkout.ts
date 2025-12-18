
import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-27-preview' as any,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { chatTitle } = req.body;
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['host'];
    const successUrl = `${protocol}://${host}/?pagamento=confirmado`;
    const cancelUrl = `${protocol}://${host}/`;

    // Criação da sessão de checkout profissional
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
    console.error('Stripe Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
