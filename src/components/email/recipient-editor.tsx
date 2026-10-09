"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/controls";
import { ComposeChip, ComposeLine, ComposeRow, ComposeRowLabel } from "./compose-parts";

type RecipientType = "ALL_PARTICIPANTS" | "PENDING" | "WAITLIST" | "APPROVED" | "CHECKED_IN" | "NOT_CHECKED_IN" | "CUSTOM";
export type RecipientValue = { to: { type: RecipientType; emails: string[]; contactListIds: string[] }; cc: string[]; bcc: string[]; ccContactListIds: string[]; bccContactListIds: string[] };
export type ContactListOption = { id: string; name: string; contactCount: number };

const types: RecipientType[] = ["ALL_PARTICIPANTS", "PENDING", "WAITLIST", "APPROVED", "CHECKED_IN", "NOT_CHECKED_IN", "CUSTOM"];
const typeLabels: Record<RecipientType, string> = { ALL_PARTICIPANTS: "All participants", PENDING: "Pending approval", WAITLIST: "Waitlist", APPROVED: "Approved participants", CHECKED_IN: "Checked-in participants", NOT_CHECKED_IN: "Not checked-in participants", CUSTOM: "Contacts / custom list only" };

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
function splitEmails(value: string) { return value.split(/[\s,;]+/).map((email) => email.trim().toLowerCase()).filter(Boolean); }

function ChipField({ label, emails, onChange, placeholder, describedBy }: { label: string; emails: string[]; onChange: (emails: string[]) => void; placeholder: string; describedBy?: string }) {
  const [draft, setDraft] = useState("");
  const [rejected, setRejected] = useState<string[]>([]);
  function commit(raw: string) {
    const parts = splitEmails(raw);
    if (!parts.length) return;
    const valid = parts.filter(isEmail);
    const invalid = parts.filter((part) => !isEmail(part));
    if (valid.length) onChange([...new Set([...emails, ...valid])]);
    setRejected(invalid);
    setDraft(invalid.join(", "));
  }
  function keydown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === "," || event.key === ";" || event.key === "Tab") {
      if (!draft.trim()) return;
      event.preventDefault();
      commit(draft);
      return;
    }
    if (event.key === "Backspace" && !draft && emails.length) onChange(emails.slice(0, -1));
  }
  return (
    <div className="flex flex-1 flex-wrap items-center gap-1.5">
      {emails.map((email) => (
        <ComposeChip key={email} label={email} removeLabel={`Remove ${email} from ${label}`} onRemove={() => onChange(emails.filter((item) => item !== email))} />
      ))}
      <ComposeLine
        value={draft}
        onChange={(event) => { setDraft(event.target.value); setRejected([]); }}
        onKeyDown={keydown}
        onBlur={() => { if (draft.trim()) commit(draft); }}
        placeholder={emails.length ? "" : placeholder}
        aria-label={`${label} recipients`}
        aria-describedby={describedBy}
        aria-invalid={rejected.length > 0}
      />
      {rejected.length > 0 && <span className="text-xs text-danger-ink" role="alert">Not a valid email address.</span>}
    </div>
  );
}

function ContactListPicker({ label, options, selected, onChange }: { label: string; options: ContactListOption[]; selected: string[]; onChange: (ids: string[]) => void }) {
  const [open, setOpen] = useState(false);
  if (!options.length) return <span className="text-xs text-ink-muted">No global contact lists yet.</span>;
  const total = options.filter((option) => selected.includes(option.id)).reduce((sum, option) => sum + option.contactCount, 0);
  return (
    <div className="w-full">
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        {selected.length ? `${selected.length} contact list${selected.length === 1 ? "" : "s"} · ${total} contacts` : "Choose from contacts"}
      </Button>
      {open && (
        <fieldset className="mt-2 max-h-48 w-full overflow-y-auto rounded-md border border-outline bg-surface-sunken p-2">
          <legend className="px-1 text-xs text-ink-muted">{label} contact lists</legend>
          {options.map((option) => (
            <label key={option.id} className="flex min-h-ctl-sm items-center gap-2 px-1 text-body text-ink">
              <input
                type="checkbox"
                className="size-4 shrink-0 accent-primary"
                checked={selected.includes(option.id)}
                onChange={(event) => onChange(event.target.checked ? [...new Set([...selected, option.id])] : selected.filter((id) => id !== option.id))}
              />
              <span className="min-w-0 flex-1 truncate">{option.name}</span>
              <span className="text-xs text-ink-muted">{option.contactCount}</span>
            </label>
          ))}
        </fieldset>
      )}
    </div>
  );
}

export function RecipientEditor({ initial, contactLists = [] }: { initial: RecipientValue; contactLists?: ContactListOption[] }) {
  const [value, setValue] = useState<RecipientValue>(initial);
  const [showCc, setShowCc] = useState(initial.cc.length > 0 || initial.ccContactListIds.length > 0);
  const [showBcc, setShowBcc] = useState(initial.bcc.length > 0 || initial.bccContactListIds.length > 0);
  const serialized = useMemo(() => JSON.stringify(value), [value]);
  const update = (next: Partial<RecipientValue>) => setValue((current) => ({ ...current, ...next }));

  return (
    <div>
      <ComposeRow>
        <ComposeRowLabel>To</ComposeRowLabel>
        <Select className="max-w-64" value={value.to.type} onChange={(event) => update({ to: { ...value.to, type: event.target.value as RecipientType } })} aria-label="To recipient segment">
          {types.map((type) => <option key={type} value={type}>{typeLabels[type]}</option>)}
        </Select>
        <div className="ml-auto flex gap-2">
          {!showCc && <Button type="button" variant="outline" size="sm" onClick={() => setShowCc(true)}>Cc</Button>}
          {!showBcc && <Button type="button" variant="outline" size="sm" onClick={() => setShowBcc(true)}>Bcc</Button>}
        </div>
      </ComposeRow>

      <ComposeRow>
        <ComposeRowLabel>Contacts</ComposeRowLabel>
        <ContactListPicker label="To" options={contactLists} selected={value.to.contactListIds} onChange={(ids) => update({ to: { ...value.to, contactListIds: ids } })} />
      </ComposeRow>

      <ComposeRow>
        <ComposeRowLabel>Emails</ComposeRowLabel>
        <ChipField label="To" emails={value.to.emails} onChange={(emails) => update({ to: { ...value.to, emails } })} placeholder="Type an address and press Enter" describedBy="compose-to-help" />
      </ComposeRow>
      <p id="compose-to-help" className="px-4 py-1 text-xs text-ink-muted">Participant segments, selected contact lists, and manual addresses are combined. Each recipient receives their own message.</p>

      {showCc && <ComposeRow>
        <ComposeRowLabel>Cc</ComposeRowLabel>
        <ChipField label="Cc" emails={value.cc} onChange={(cc) => update({ cc })} placeholder="Add Cc recipients" />
      </ComposeRow>}
      {showCc && <ComposeRow><ComposeRowLabel /><ContactListPicker label="Cc" options={contactLists} selected={value.ccContactListIds} onChange={(ccContactListIds) => update({ ccContactListIds })} /></ComposeRow>}

      {showBcc && <ComposeRow>
        <ComposeRowLabel>Bcc</ComposeRowLabel>
        <ChipField label="Bcc" emails={value.bcc} onChange={(bcc) => update({ bcc })} placeholder="Add Bcc recipients" />
      </ComposeRow>}
      {showBcc && <ComposeRow><ComposeRowLabel /><ContactListPicker label="Bcc" options={contactLists} selected={value.bccContactListIds} onChange={(bccContactListIds) => update({ bccContactListIds })} /></ComposeRow>}

      <input type="hidden" name="recipient" value={serialized} />
    </div>
  );
}
