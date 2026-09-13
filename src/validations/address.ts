import { z } from "zod";

export const addressSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number"),
  line1: z
    .string()
    .trim()
    .min(5, "Flat/House no., Street or Area is required")
    .max(200),
  line2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(2, "City is required").max(100),
  state: z.string().trim().min(2, "State is required").max(100),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Please enter a valid 6-digit PIN code"),
  country: z.string().trim().default("India"),
  isDefault: z.boolean().default(false),
});

export type AddressInput = z.infer<typeof addressSchema>;
