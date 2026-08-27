import Razorpay from 'razorpay'

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export const PLANS = {
  FREE: { name: 'Free', amount: 0, shipments: 3 },
  STARTER: { name: 'Starter', amount: 199900, shipments: 20 },
  BUSINESS: { name: 'Business', amount: 499900, shipments: -1 },
}