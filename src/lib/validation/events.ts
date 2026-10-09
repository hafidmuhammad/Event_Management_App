import { z } from "zod";
import { jakartaInput } from "@/lib/date-time";

const optionalDate = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.coerce.date().optional(),
);

const optionalText = (max: number) => z.preprocess(
  (value) => (value === null || (typeof value === "string" && value.trim() === "") ? undefined : value),
  z.string().trim().max(max).optional(),
);

export const committeeMemberSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(160),
  position: z.string().trim().min(1, "Position is required.").max(160),
  division: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(32).optional().default(""),
  email: z.string().trim().email("Enter a valid committee email.").max(255).optional().or(z.literal("")),
});

export const committeeSchema = z.array(committeeMemberSchema).max(50);

export const eventInputSchema = z.object({
  name: z.string().trim().min(1, "Event name is required.").max(255),
  description: optionalText(10000),
  venue: optionalText(255),
  capacity: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.coerce.number().int("Capacity must be a whole number.").positive("Capacity must be greater than zero.").optional(),
  ),
  banner: optionalText(500),
  registrationStart: optionalDate,
  registrationEnd: optionalDate,
  eventStart: optionalDate,
  eventEnd: optionalDate,
  ticketValidFrom: optionalDate,
  ticketValidUntil: optionalDate,
}).superRefine((value, context) => {
  const pairs: Array<[keyof typeof value, keyof typeof value, string]> = [
    ["registrationStart", "registrationEnd", "Registration end must be after registration start."],
    ["eventStart", "eventEnd", "Event end must be after event start."],
    ["ticketValidFrom", "ticketValidUntil", "Ticket validity end must be after ticket validity start."],
  ];

  for (const [from, until, message] of pairs) {
    if (value[from] && value[until] && value[from] >= value[until]) {
      context.addIssue({ code: "custom", path: [until], message });
    }
  }

  if (value.registrationEnd && value.eventStart && value.registrationEnd > value.eventStart) {
    context.addIssue({ code: "custom", path: ["registrationEnd"], message: "Registration cannot close after the event starts." });
  }

  if (value.ticketValidFrom && value.ticketValidUntil && value.eventEnd && value.ticketValidFrom > value.eventEnd) {
    context.addIssue({ code: "custom", path: ["ticketValidFrom"], message: "Ticket validity should begin before the event ends." });
  }
});

export type EventInput = z.infer<typeof eventInputSchema>;
export type EventFormState = { formError?: string; fieldErrors?: Record<string, string[] | undefined> };

export function eventFormDataToInput(formData: FormData): EventInput {
  return {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    venue: String(formData.get("venue") ?? ""),
    capacity: String(formData.get("capacity") ?? ""),
    banner: String(formData.get("banner") ?? ""),
    registrationStart: jakartaInput(String(formData.get("registrationStart") ?? "")),
    registrationEnd: jakartaInput(String(formData.get("registrationEnd") ?? "")),
    eventStart: jakartaInput(String(formData.get("eventStart") ?? "")),
    eventEnd: jakartaInput(String(formData.get("eventEnd") ?? "")),
    ticketValidFrom: jakartaInput(String(formData.get("ticketValidFrom") ?? "")),
    ticketValidUntil: jakartaInput(String(formData.get("ticketValidUntil") ?? "")),
  } as unknown as EventInput;
}

export function validateEventInput(input: unknown) {
  return eventInputSchema.safeParse(input);
}

export function validateEventForPublish(event: {
  name: string;
  capacity: number | null;
  registrationStart: Date | null;
  registrationEnd: Date | null;
  eventStart: Date | null;
  eventEnd: Date | null;
  ticketValidFrom: Date | null;
  ticketValidUntil: Date | null;
}) {
  const parsed = eventInputSchema.safeParse(event);
  if (!parsed.success) return parsed;
  if (!parsed.data.registrationStart || !parsed.data.registrationEnd) {
    return { success: false as const, error: "Registration window is required before publishing." };
  }
  if (!parsed.data.eventStart || !parsed.data.eventEnd) {
    return { success: false as const, error: "Event schedule is required before publishing." };
  }
  if (!parsed.data.ticketValidFrom || !parsed.data.ticketValidUntil) {
    return { success: false as const, error: "Ticket validity is required before publishing." };
  }
  return parsed;
}
