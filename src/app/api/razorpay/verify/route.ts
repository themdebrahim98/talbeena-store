import { NextResponse } from "next/server";
import { verifyRazorpayPaymentAction } from "@/actions/checkout";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: "Missing required verification parameters" }, { status: 400 });
    }

    const res = await verifyRazorpayPaymentAction({
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (res.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: res.error || "Verification failed" }, { status: 400 });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
