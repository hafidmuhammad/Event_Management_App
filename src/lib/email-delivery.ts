export function isEmailDraft(template: { name: string; contentJson: unknown }) {
  const content = template.contentJson as { deliveryStatus?: string } | null;
  return /^\s*\[DRAFT\]/i.test(template.name) || content?.deliveryStatus === "DRAFT";
}

export function safeEmailLink(value: string) {
  if (!/^https?:\/\//i.test(value)) throw new Error("Email links must resolve to an absolute HTTP or HTTPS URL.");
  const url = new URL(value);
  if (!url.hostname || url.username || url.password) throw new Error("Unsafe email link.");
  return value;
}
