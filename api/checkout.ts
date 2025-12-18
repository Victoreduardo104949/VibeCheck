
import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

// Updated apiVersion to match the expected type '2025-12-15.clover'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover' as any,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ 
      error: 'Configuração incompleta.', 
      details: 'A variável STRIPE_SECRET_KEY não foi configurada no Vercel.' 
    });
  }

  try {
    const { chatTitle } = req.body;
    const protocol = req.headers['x-forwarded-proto'] || 'https';
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
              description: `Análise profunda da conversa: ${chatTitle || 'Conversa WhatsApp'}`,
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
    // Retorna a mensagem real do Stripe (ex: se a chave não tem permissão)
    return res.status(error.statusCode || 500).json({ 
      error: 'Erro no Stripe', 
      details: error.message 
    });
  }
}
