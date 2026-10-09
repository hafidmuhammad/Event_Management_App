"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/authorization";
import { addContacts, deleteContact, deleteContactList, deleteGlobalTemplate, saveContactList, saveGlobalTemplate } from "@/services/library";
import { parseContactRows } from "@/lib/validation/library";

type Result = { ok: boolean; error?: string; notice?: string };

/** Saves a reusable global email template. Global templates never send email. */
export async function saveGlobalTemplateAction(formData: FormData): Promise<Result> {
  const session = await requireRole("ADMIN", "EVENT_MANAGER");
  try {
    const content = JSON.parse(String(formData.get("content") ?? '{"version":1,"blocks":[]}'));
    await saveGlobalTemplate(
      { name: formData.get("name"), description: formData.get("description") ?? "", type: formData.get("type"), subject: formData.get("subject"), content },
      String(formData.get("id") ?? "") || undefined,
      session.user.id,
    );
  } catch {
    return { ok: false, error: "Unable to save the global template. Check required fields and links." };
  }
  revalidatePath("/library/email-templates");
  return { ok: true, notice: "Global template saved. No email was sent." };
}

export async function deleteGlobalTemplateAction(formData: FormData): Promise<Result> {
  await requireRole("ADMIN", "EVENT_MANAGER");
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Template not found." };
  await deleteGlobalTemplate(id);
  revalidatePath("/library/email-templates");
  return { ok: true, notice: "Global template removed. Event templates already created from it are untouched." };
}

export async function saveContactListAction(formData: FormData): Promise<Result> {
  const session = await requireRole("ADMIN", "EVENT_MANAGER");
  try {
    await saveContactList({ name: formData.get("name"), description: formData.get("description") ?? "" }, String(formData.get("id") ?? "") || undefined, session.user.id);
  } catch {
    return { ok: false, error: "Unable to save the contact list. A name is required." };
  }
  revalidatePath("/library/contacts");
  return { ok: true, notice: "Contact list saved." };
}

export async function deleteContactListAction(formData: FormData): Promise<Result> {
  await requireRole("ADMIN", "EVENT_MANAGER");
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Contact list not found." };
  await deleteContactList(id);
  revalidatePath("/library/contacts");
  return { ok: true, notice: "Contact list and its contacts were removed." };
}

/** Imports pasted contact rows. Invalid rows are reported, never silently dropped. */
export async function importContactsAction(formData: FormData): Promise<Result> {
  await requireRole("ADMIN", "EVENT_MANAGER");
  const listId = String(formData.get("listId") ?? "");
  if (!listId) return { ok: false, error: "Contact list not found." };
  const { valid, invalid } = parseContactRows(String(formData.get("rows") ?? ""));
  if (!valid.length) return { ok: false, error: "No valid contacts found. Use `name, email, company` per line." };
  let added = 0;
  let skipped = 0;
  try {
    const result = await addContacts(listId, { contacts: valid });
    added = result.added;
    skipped = result.skipped;
  } catch {
    return { ok: false, error: "Unable to import contacts. Check the pasted rows and try again." };
  }
  revalidatePath(`/library/contacts/${listId}`);
  revalidatePath("/library/contacts");
  return { ok: true, notice: `${added} contact${added === 1 ? "" : "s"} added, ${skipped} duplicate${skipped === 1 ? "" : "s"} skipped${invalid.length ? `, ${invalid.length} row${invalid.length === 1 ? "" : "s"} rejected` : ""}.` };
}

export async function addContactAction(formData: FormData): Promise<Result> {
  await requireRole("ADMIN", "EVENT_MANAGER");
  const listId = String(formData.get("listId") ?? "");
  if (!listId) return { ok: false, error: "Contact list not found." };
  try {
    const result = await addContacts(listId, { contacts: [{ name: formData.get("name"), email: formData.get("email"), company: formData.get("company") ?? "" }] });
    revalidatePath(`/library/contacts/${listId}`);
    revalidatePath("/library/contacts");
    return { ok: true, notice: result.added ? "Contact added." : "That address is already in this list." };
  } catch {
    return { ok: false, error: "Unable to add the contact. A valid name and email are required." };
  }
}

export async function deleteContactAction(formData: FormData): Promise<Result> {
  await requireRole("ADMIN", "EVENT_MANAGER");
  const listId = String(formData.get("listId") ?? "");
  const contactId = String(formData.get("contactId") ?? "");
  if (!listId || !contactId) return { ok: false, error: "Contact not found." };
  await deleteContact(listId, contactId);
  revalidatePath(`/library/contacts/${listId}`);
  revalidatePath("/library/contacts");
  return { ok: true, notice: "Contact removed." };
}
