import { z } from "zod";

export const RETURN_REASONS = [
  { value: "damaged", label: "Damaged / Defective item" },
  { value: "wrong_item", label: "Wrong item delivered" },
  { value: "quality", label: "Quality not as expected" },
  { value: "packaging", label: "Broken seal or packaging damaged" },
  { value: "other", label: "Other reason" },
] as const;

export const returnInputSchema = z.object({
  reason: z.enum(
    ["damaged", "wrong_item", "quality", "packaging", "other"],
    { message: "Please select a valid return reason" },
  ),
  comments: z
    .string()
    .max(500, "Comments cannot exceed 500 characters")
    .optional(),
});

export type ReturnInput = z.infer<typeof returnInputSchema>;
