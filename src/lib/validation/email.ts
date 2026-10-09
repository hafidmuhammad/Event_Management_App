import { z } from "zod";
import { richRunSchema } from "@/lib/email-rich-text";

export const emailTypes = ["INVITATION", "REGISTRATION_RECEIVED", "WAITLIST", "APPROVED", "REJECTED", "TICKET", "REMINDER", "CUSTOM"] as const;
export const recipientType = z.enum(["ALL_PARTICIPANTS", "PENDING", "WAITLIST", "APPROVED", "CHECKED_IN", "NOT_CHECKED_IN", "CUSTOM"]);
const emailList = z.array(z.string().trim().email().transform((v) => v.toLowerCase())).default([]).transform((xs) => [...new Set(xs)]);
const idList = z.array(z.string().trim().min(1).max(36)).default([]).transform((xs) => [...new Set(xs)]);
export const recipientSchema = z.object({
  to: z.object({ type: recipientType, emails: emailList, contactListIds: idList }).refine((v) => v.type !== "CUSTOM" || v.emails.length > 0 || v.contactListIds.length > 0, "Custom recipients require an email or a contact list."),
  cc: emailList,
  bcc: emailList,
  ccContactListIds: idList,
  bccContactListIds: idList,
});
const align = z.enum(["left", "center", "right"]).default("left");
export const blockSchema = z.discriminatedUnion("type", [
 z.object({ id: z.string(), type: z.literal("heading"), data: z.object({ text: z.string(), level: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2), align }) }),
 z.object({ id: z.string(), type: z.literal("paragraph"), data: z.object({ text: z.string(), align, runs: z.array(richRunSchema).optional(), list: z.enum(["none", "bullet", "number"]).optional() }) }),
 z.object({ id: z.string(), type: z.literal("image"), data: z.object({ src: z.string().refine((value) => /^https?:\/\//i.test(value) || /^\/uploads\/email\/[a-f0-9-]+\.(?:jpg|png|webp)$/.test(value), "Use an HTTP/HTTPS image or an uploaded email image."), alt: z.string(), width: z.number().int().min(1).max(800), align }) }),
 z.object({ id: z.string(), type: z.literal("button"), data: z.object({ text: z.string(), url: z.string().refine((v) => /^https?:\/\//.test(v) || /^\{\{[\w.]+\}\}$/.test(v), "Unsafe URL"), align }) }),
 z.object({ id: z.string(), type: z.literal("table"), data: z.object({ rows: z.array(z.array(z.string()).min(1)).min(1) }) }),
 z.object({ id: z.string(), type: z.literal("divider"), data: z.object({}) }), z.object({ id: z.string(), type: z.literal("spacer"), data: z.object({ height: z.number().int().min(4).max(120) }) }), z.object({ id: z.string(), type: z.literal("qr"), data: z.object({ value: z.string(), size: z.number().int().min(80).max(400).default(180) }) }),
]);
export const contentSchema = z.object({ version: z.literal(1), deliveryStatus: z.enum(["DRAFT", "READY"]).optional(), blocks: z.array(blockSchema) });
export const emailTemplateInputSchema = z.object({ name: z.string().trim().min(1).max(160), type: z.enum(emailTypes), subject: z.string().trim().min(1).max(255), recipient: recipientSchema, content: contentSchema });
export type EmailContent = z.infer<typeof contentSchema>; export type RecipientConfig = z.infer<typeof recipientSchema>; export type RecipientConfigInput = z.input<typeof recipientSchema>;
