import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .max(254, "Email is too long.")
  .email("Enter a valid email address.")
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be 128 characters or fewer.")
  .regex(/[a-z]/, "Include at least one lowercase letter.")
  .regex(/[A-Z]/, "Include at least one uppercase letter.")
  .regex(/[0-9]/, "Include at least one number.");

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Please enter your full name.")
  .max(80, "Name is too long.");

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const orgRegisterSchema = z.object({
  orgName: z.string().trim().min(3, "Organisation name is required.").max(120),
  category: z.enum(["hospital", "diagnostic", "bank", "government", "clinic", "service"]),
  description: z.string().trim().min(20, "Add a short description (at least 20 characters).").max(1200),
  address: z.string().trim().min(5, "Street address is required.").max(200),
  city: z.string().trim().min(2, "City is required.").max(80),
  state: z.string().trim().max(80).optional().default(""),
  pincode: z.string().trim().min(4, "Enter a valid pincode.").max(12),
  phone: z.string().trim().min(7, "Enter a contact phone number.").max(24),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  openTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format."),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format."),
  services: z.string().trim().max(300).optional().default(""),
  ownerName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(128),
  remember: z.boolean().optional().default(false),
  expectedRole: z.enum(["user", "org", "admin"]).optional(),
});

export const resendSchema = z.object({ email: emailSchema });

export const forgotSchema = z.object({ email: emailSchema });

export const resetSchema = z.object({
  token: z.string().min(10, "Reset token is missing."),
  password: passwordSchema,
});

export const verifySchema = z.object({ token: z.string().min(10, "Verification token is missing.") });

export const joinSchema = z.object({
  orgId: z.string().min(3),
  kind: z.enum(["queue", "appointment"]).default("queue"),
  slot: z.string().datetime({ offset: true }).optional().nullable(),
  emergency: z.boolean().optional().default(false),
  emergencyReason: z.string().trim().max(800).optional().nullable(),
});

export const cancelTicketSchema = z.object({
  reason: z.string().trim().min(3, "Please provide a reason.").max(500),
  reasonCategory: z.enum(["personal", "medical_emergency", "other"]).optional(),
});

export const profileSchema = z.object({
  name: nameSchema,
  phone: z.string().trim().max(24).optional().default(""),
});

export const prefsSchema = z.object({
  language: z.enum(["en", "hi"]),
  largeText: z.boolean().default(false),
});

export const reportSchema = z.object({
  subject: z.string().trim().min(3).max(140),
  message: z.string().trim().min(10).max(2000),
  orgId: z.string().optional().nullable(),
});

export const emergencyRequestSchema = z.object({
  reason: z.string().trim().min(10, "Please describe the situation briefly.").max(800),
});

export const prioritySchema = z.object({
  priority: z.enum(["normal", "senior", "disability", "emergency"]),
  reason: z.string().trim().min(3, "A verification reason is required.").max(300),
});

export const statusSchema = z.object({
  status: z.enum(["serving", "completed", "cancelled", "no_show"]),
  reason: z.string().trim().max(500).optional(),
});

export const emergencyDecisionSchema = z.object({
  decision: z.enum(["approved", "declined"]),
  note: z.string().trim().min(3, "Add a short clinical or operational note.").max(500),
});

export const orgSettingsSchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().min(20).max(1200),
  phone: z.string().trim().min(7).max(24),
  email: emailSchema,
  address: z.string().trim().min(5).max(200),
  city: z.string().trim().min(2).max(80),
  openTime: z.string().regex(/^\d{2}:\d{2}$/),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/),
  slotMinutes: z.number().int().min(5).max(60),
  services: z.string().trim().max(300),
  priorityPolicy: z.string().trim().min(10).max(1200),
  cancellationPolicy: z.string().trim().min(10).max(1200),
  emergencyEnabled: z.boolean(),
});

export const counterSchema = z.object({
  name: z.string().trim().min(2, "Counter name is required.").max(60),
});

export const counterToggleSchema = z.object({
  isActive: z.boolean(),
});

export const channelSchema = z.object({
  action: z.enum(["approve", "reject", "suspend", "restore"]),
  reason: z.string().trim().max(500).optional(),
});

export const userActionSchema = z.object({
  action: z.enum(["restrict", "unrestrict", "verify"]),
  reason: z.string().trim().max(500).optional(),
  days: z.number().int().min(1).max(90).optional(),
});

export const appealDecisionSchema = z.object({
  decision: z.enum(["accepted", "rejected"]),
  note: z.string().trim().min(3).max(500),
});

export const reportUpdateSchema = z.object({
  status: z.enum(["open", "reviewing", "resolved"]),
  note: z.string().trim().max(1000).optional(),
});

export const adminSettingsSchema = z.object({
  thresholdCount: z.number().int().min(2).max(10),
  windowDays: z.number().int().min(7).max(180),
  restrictionDays: z.number().int().min(1).max(90),
});

export const checkinSchema = z.object({
  code: z.string().trim().min(4).max(400),
});

export const verifyTokenSchema = z.object({ token: z.string().min(4).max(400) });
