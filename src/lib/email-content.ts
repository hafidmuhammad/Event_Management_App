export function escapeHtml(value: string) { return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]!)); }
export function resolveTemplateVariables(value: string, vars: Record<string, string>) { return value.replace(/\{\{([\w.]+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`); }
