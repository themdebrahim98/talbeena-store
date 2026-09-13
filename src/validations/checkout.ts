import { z } from "zod";
import { addressSchema } from "./address";

export const checkoutSchema = z.object({
  addressId: z.string().optional(),
  newAddress: addressSchema.optional(),
  paymentMethod: z.enum(["razorpay", "cod"]),
  couponCode: z.string().trim().max(30).optional().nullable(),
  customerNote: z.string().trim().max(300).optional().nullable(),
}).refine(
  (data) => Boolean(data.addressId || data.newAddress),
  {
    message: "Please select a delivery address or enter a new one",
    path: ["addressId"],
  }
);

export type CheckoutInput = z.infer<typeof checkoutSchema>;
