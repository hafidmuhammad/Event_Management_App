import { z } from "zod";
import { contentSchema, emailTypes } from "./email";

/** Global email templates are reusable blueprints and carry no event scope. */
/** Optional free text: accepts missing, null, or empty input and stores null. */
const optionalText = (max: number) =>
  z.preprocess((value) => (value === null || value === undefined ? "" : value), z.string().trim().max(max)).transform((value) => value || null);

export const globalTemplateInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: optionalText(500),
  type: z.enum(emailTypes),
  subject: z.string().trim().min(1).max(255),
  content: contentSchema,
});

export const contactListInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: optionalText(500),
});

export const contactInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
  company: optionalText(160),
});

export const contactBulkSchema = z.object({ contacts: z.array(contactInputSchema).min(1).max(5000) });

export type GlobalTemplateInput = z.infer<typeof globalTemplateInputSchema>;
export type ContactListInput = z.infer<typeof contactListInputSchema>;
export type ContactInput = z.infer<typeof contactInputSchema>;

/**
 * Parses pasted contact rows. Accepts `name, email, company` or a bare email per
 * line, plus comma/semicolon/tab separated values. Invalid rows are reported
 * instead of silently dropped so the operator can correct them.
 */
export function parseContactRows(raw: string) {
  const valid: ContactInput[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  for (const line of raw.split(/\r?\n/)) {
    const row = line.trim();
    if (!row) continue;
    if (/^(name)\s*[,;\t]/i.test(row)) continue;
    const cells = row.split(/[,;\t]/).map((cell) => cell.trim()).filter(Boolean);
    const emailCell = cells.find((cell) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cell));
    if (!emailCell) { invalid.push(row); continue; }
    const rest = cells.filter((cell) => cell !== emailCell);
    const parsed = contactInputSchema.safeParse({ name: rest[0] || emailCell.split("@")[0], email: emailCell, company: rest[1] ?? "" });
    if (!parsed.success) { invalid.push(row); continue; }
    if (seen.has(parsed.data.email)) continue;
    seen.add(parsed.data.email);
    valid.push(parsed.data);
  }
  return { valid, invalid };
}
