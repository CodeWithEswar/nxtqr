import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(128, { message: "Password must not exceed 128 characters" }),
});

export const RegisterSchema = z
  .object({
    email: z.string().trim().email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" })
      .max(128, { message: "Password must not exceed 128 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const PasswordResetSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type PasswordResetInput = z.infer<typeof PasswordResetSchema>;
