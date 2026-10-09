import { z } from "zod";

export const participantRegistrationSchema = z.object({
  title: z.string().trim().max(32).optional().or(z.literal("")),
  name: z.string().trim().min(1, "Name is required.").max(160),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  jobTitle: z.string().trim().max(160).optional().or(z.literal("")),
  phone: z.string().trim().min(3, "Phone is required.").max(32),
  email: z.string().trim().email("Enter a valid email.").max(255),
});

export const participantStatusSchema = z.enum(["INVITED", "PENDING", "WAITLIST", "APPROVED", "REJECTED", "CANCELLED", "CHECKED_IN", "NO_SHOW"]);
export type ParticipantStatus = z.infer<typeof participantStatusSchema>;

export const rejectionSchema = z.object({ rejectionReason: z.string().trim().min(1, "A rejection reason is required.").max(500) });

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string) {
  const compact = phone.trim().replace(/[\s().-]/g, "");
  if (compact.startsWith("00")) return `+${compact.slice(2)}`;
  return compact;
}

export function registrationWindowState(event: { status: string; registrationStart: Date | null; registrationEnd: Date | null }, now = new Date()) {
  if (event.status === "CANCELLED") return "CANCELLED" as const;
  if (event.status !== "PUBLISHED") return "NOT_PUBLISHED" as const;
  if (event.registrationStart && now < event.registrationStart) return "NOT_OPEN" as const;
  if (event.registrationEnd && now > event.registrationEnd) return "CLOSED" as const;
  return "OPEN" as const;
}

export function participantFormDataToInput(formData: FormData) {
  return {
    title: String(formData.get("title") ?? ""),
    name: String(formData.get("name") ?? ""),
    company: String(formData.get("company") ?? ""),
    jobTitle: String(formData.get("jobTitle") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
  };
}
