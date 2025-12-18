
import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

// Fix: Update apiVersion to match the expected type '2025-12-15.clover'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover', 
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is not defined in environment variables.');
    return res.status(500).json({ error: 'Configuração do servidor incompleta (Chave API ausente).' });
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
              name: 'VibeCheck Pro - Diagnóstico Individual',
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
    console.error('Stripe Checkout Error:', error.message);
    return res.status(500).json({ 
      error: 'Erro ao gerar pagamento.', 
      details: error.message 
    });
  }
}
