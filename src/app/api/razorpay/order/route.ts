import { NextResponse } from "next/server";
import { getRazorpayClient } from "@/lib/razorpay/server";
import { getSessionUser } from "@/lib/firebase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, receipt, notes } = body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const session = await getSessionUser();
    const razorpay = getRazorpayClient();

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // convert to paise
      currency: "INR",
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: {
        userId: session?.uid || "guest",
        ...notes,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Razorpay order creation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
