import { z } from "zod";

export const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Code must be at least 3 characters")
    .max(20)
    .regex(/^[A-Z0-9_-]+$/, "Code must be uppercase alphanumeric characters"),
  type: z.enum(["percentage", "fixed"]),
  value: z.coerce.number().positive("Value must be greater than 0"),
  minOrderAmount: z.coerce.number().min(0, "Minimum order cannot be negative").default(0),
  maxDiscount: z.coerce
    .number()
    .positive("Max discount must be greater than 0")
    .optional()
    .nullable(),
  perUserLimit: z.coerce.number().int().min(1).default(1),
  usageLimit: z.coerce.number().int().min(1).optional().nullable(),
  startsAt: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export type CouponInput = z.infer<typeof couponSchema>;
