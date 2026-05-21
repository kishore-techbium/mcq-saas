import Razorpay from "razorpay";
import { NextResponse } from "next/server";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST() {

  try {

    const options = {
      amount: 9900,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order =
      await razorpay.orders.create(options);

    return NextResponse.json(order);

  } catch (error) {

    console.log("RAZORPAY ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to create order",
      },
      {
        status: 500,
      }
    );
  }
}
