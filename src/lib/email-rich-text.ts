import { z } from "zod";
import { safeEmailLink } from "./email-delivery";
import { escapeHtml } from "./email-content";

/** A link may be an absolute HTTP(S) URL or one placeholder such as `{{event.registration_url}}`, resolved when the email is rendered. */
export function isAllowedRunLink(value: string) {
  if (/^\{\{[\w.]+\}\}$/.test(value)) return true;
  try { safeEmailLink(value); return true; } catch { return false; }
}

export const richRunSchema = z.object({
  text: z.string(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  url: z.string().refine(isAllowedRunLink, "Use an absolute HTTP or HTTPS inline link.").optional(),
});
export type RichRun = z.infer<typeof richRunSchema>;

/**
 * `resolve` fills variables in text. `resolveUrl` (defaults to `resolve`) does the
 * same for link targets, so the caller can also turn app paths such as `/t/abc`
 * into absolute URLs. The resolved link must still be a safe absolute URL.
 */
export function renderRichText(runs: RichRun[], resolve: (value: string) => string, resolveUrl: (value: string) => string = resolve) {
  return runs.map((run) => {
    let text = escapeHtml(resolve(run.text)).replace(/\n/g, "<br>");
    if (run.bold) text = `<strong>${text}</strong>`;
    if (run.italic) text = `<em>${text}</em>`;
    if (run.underline) text = `<u>${text}</u>`;
    if (run.url) text = `<a href="${escapeHtml(safeEmailLink(resolveUrl(run.url)))}">${text}</a>`;
    return text;
  }).join("");
}

export function renderRichList(runs: RichRun[], resolve: (value: string) => string, type: "bullet" | "number", resolveUrl: (value: string) => string = resolve) {
  const lines: RichRun[][] = [[]];
  for (const run of runs) {
    run.text.split("\n").forEach((text, index) => { if (index) lines.push([]); lines[lines.length - 1].push({ ...run, text }); });
  }
  const tag = type === "number" ? "ol" : "ul";
  return `<${tag} style="padding-left:24px">${lines.map((line) => `<li>${renderRichText(line, resolve, resolveUrl)}</li>`).join("")}</${tag}>`;
}
