
import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

// Updated apiVersion to match the expected type '2025-12-15.clover'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover' as any,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { session_id } = req.query;

  if (!session_id || typeof session_id !== 'string') {
    return res.status(400).json({ paid: false, error: 'ID da sessão ausente.' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const isPaid = session.payment_status === 'paid' || session.status === 'complete';
    return res.status(200).json({ paid: isPaid });
  } catch (error: any) {
    return res.status(500).json({ 
      paid: false, 
      error: 'Erro ao validar', 
      details: error.message 
    });
  }
}
