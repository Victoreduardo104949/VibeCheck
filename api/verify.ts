
import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  // Fixed Stripe API version mismatch to match '2025-12-15.clover'
  apiVersion: '2025-12-15.clover',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id } = req.query;

  if (!session_id || typeof session_id !== 'string') {
    return res.status(400).json({ paid: false, error: 'Session ID missing' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status === 'paid') {
      return res.status(200).json({ paid: true });
    }
    
    return res.status(200).json({ paid: false });
  } catch (error: any) {
    return res.status(500).json({ paid: false, error: 'Erro de validação' });
  }
}
