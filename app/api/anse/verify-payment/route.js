export const dynamic = 'force-dynamic'

import crypto from 'crypto'

export async function POST(req) {

  try {

    const body =
      await req.json()

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = body

    const generated_signature =
      crypto
        .createHmac(
          'sha256',
          process.env
            .RAZORPAY_KEY_SECRET
        )
        .update(
          razorpay_order_id +
          "|" +
          razorpay_payment_id
        )
        .digest('hex')

    const isValid =
      generated_signature ===
      razorpay_signature

    return Response.json({
      success: isValid
    })

  } catch (err) {

    console.error(err)

    return Response.json(
      {
        success: false
      },
      {
        status: 500
      }
    )
  }
}
