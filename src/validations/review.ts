import { z } from "zod";

export const reviewSchema = z.object({
  rating: z.coerce
    .number()
    .int()
    .min(1, "Please select at least 1 star.")
    .max(5, "Rating cannot exceed 5 stars."),
  title: z
    .string()
    .trim()
    .min(2, "Review headline must be at least 2 characters.")
    .max(100, "Review headline cannot exceed 100 characters."),
  comment: z
    .string()
    .trim()
    .min(5, "Review details must be at least 5 characters.")
    .max(1000, "Review details cannot exceed 1000 characters."),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
