export const dynamic = 'force-dynamic'

import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id:
    process.env
      .NEXT_PUBLIC_RAZORPAY_KEY_ID,

  key_secret:
    process.env
      .RAZORPAY_KEY_SECRET,
})

export async function POST() {

  try {

    const options = {
      amount: 9900,
      currency: 'INR',
      receipt:
        `receipt_${Date.now()}`,
    }

    const order =
      await razorpay.orders.create(
        options
      )

    return Response.json(order)

  } catch (err) {

    console.error(err)

    return Response.json(
      {
        error: err.message
      },
      {
        status: 500
      }
    )
  }
}
