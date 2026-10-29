import { z } from "zod";

export const loginSchema = z
  .object({
    email: z.string().optional(),
    password: z.string().optional(),
    phone: z.string().optional(),
    pin: z.string().optional(),
  })
  .refine(
    (data) => (data.phone && data.pin) || (data.email && data.password),
    {
      message: "Please enter your phone number and 4-digit PIN, or your email and password.",
    }
  );

export type LoginInput = z.infer<typeof loginSchema>;
