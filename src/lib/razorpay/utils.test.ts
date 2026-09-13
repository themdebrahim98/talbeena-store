import { describe, it, expect, beforeEach } from "vitest";
import crypto from "node:crypto";
import { verifyPaymentSignature, verifyWebhookSignature } from "./utils";

describe("Razorpay Signature Verification", () => {
  const secret = "test_secret_123456";

  beforeEach(() => {
    process.env.RAZORPAY_KEY_SECRET = secret;
    process.env.RAZORPAY_WEBHOOK_SECRET = secret;
  });

  it("successfully verifies valid payment signature", () => {
    const razorpayOrderId = "order_N123456789";
    const razorpayPaymentId = "pay_N987654321";
    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    const result = verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature: validSignature,
    });

    expect(result).toBe(true);
  });

  it("rejects tampered payment signature", () => {
    const result = verifyPaymentSignature({
      razorpayOrderId: "order_N123456789",
      razorpayPaymentId: "pay_N987654321",
      razorpaySignature: "invalid_signature_hash",
    });

    expect(result).toBe(false);
  });

  it("successfully verifies valid webhook payload", () => {
    const body = JSON.stringify({ event: "payment.captured", id: "evt_123" });
    const signature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    expect(verifyWebhookSignature(body, signature)).toBe(true);
  });

  it("rejects invalid webhook payload", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    expect(verifyWebhookSignature(body, "wrong_hash")).toBe(false);
  });
});
