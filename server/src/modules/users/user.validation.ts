import { RoleName, UserStatus } from "@prisma/client";
import { z } from "zod";

export const createUserSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  role: z.nativeEnum(RoleName),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").optional(),
  phone: z.string().optional(),
  role: z.nativeEnum(RoleName).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;