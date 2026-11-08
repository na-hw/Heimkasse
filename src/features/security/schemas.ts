import { z } from "zod";
import { validationMessage } from "@/lib/validation/messages";
import { MIN_PASSWORD_LENGTH } from "./lock";

const password = z
  .string()
  .min(MIN_PASSWORD_LENGTH, {
    message: validationMessage("validation.minLength", { min: MIN_PASSWORD_LENGTH }),
  })
  .max(256);

const mismatch = {
  path: ["confirm"],
  message: validationMessage("validation.passwordMismatch"),
};

/** New password + repetition (set or change). */
export const newPasswordSchema = z
  .object({ current: z.string(), password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, mismatch);

export type PasswordForm = z.infer<typeof newPasswordSchema>;
