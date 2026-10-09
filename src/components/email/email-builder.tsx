/* eslint-disable @next/next/no-img-element -- the builder previews user-selected email assets. */
"use client";

import { ChangeEvent, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Eye, GripVertical, Plus, Redo2, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileInput, Input, Select, Textarea } from "@/components/ui/controls";
import { Field } from "@/components/ui/field";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { OverflowMenu, OverflowMenuItem } from "@/components/ui/overflow-menu";
import { Toolbar, ToolbarButton, ToolbarIconButton, ToolbarSeparator } from "@/components/ui/toolbar";
import { useFeedback } from "@/components/ui/feedback-provider";
import { Dialog } from "@/components/ui/dialog";
import { RichTextEditor } from "./rich-text-editor";
import { renderRichList, renderRichText, type RichRun } from "@/lib/email-rich-text";

import { resolveTemplateVariables } from "@/lib/email-content";
import type { EmailContent } from "@/lib/validation/email";
type BlockType = EmailContent["blocks"][number]["type"];
type Block = { id: string; type: BlockType; data: Record<string, unknown> };
const defaultImage = "https://example.com/image.png";
const defaults: Record<BlockType, Record<string, unknown>> = {
  heading: { text: "Heading", level: 2, align: "left" },
  paragraph: { text: "Hello {{participant.name}}", align: "left" },
  image: { src: defaultImage, alt: "Event image", width: 600, align: "center" },
  button: { text: "Register now", url: "{{event.registration_url}}", align: "center" },
  table: { rows: [["Name", "{{participant.name}}"]] },
  divider: {},
  spacer: { height: 24 },
  qr: { value: "{{ticket.url}}", size: 180 },
};
const blockLabels: Record<BlockType, string> = { heading: "Heading", paragraph: "Text", image: "Image", button: "Button", table: "Table", divider: "Divider", spacer: "Spacer", qr: "QR code" };
const registrationUrl = "{{event.registration_url}}";
const ticketUrl = "{{ticket.url}}";
const linkKinds = [[registrationUrl, "Registration form"], [ticketUrl, "Ticket page"], ["CUSTOM", "Other web address"]] as const;
function linkKind(url: unknown) { return url === registrationUrl || url === ticketUrl ? String(url) : "CUSTOM"; }

/** Insert menu, grouped so each entry says what it adds. `data` overrides the block defaults. */
const insertGroups: { label: string; items: { label: string; type: BlockType; data?: Record<string, unknown> }[] }[] = [
  { label: "Content", items: [
    { label: "Text", type: "paragraph" },
    { label: "Heading", type: "heading" },
    { label: "Image", type: "image" },
    { label: "Table", type: "table" },
    { label: "Divider", type: "divider" },
    { label: "Spacer", type: "spacer" },
  ] },
  { label: "Links and actions", items: [
    { label: "Registration form button", type: "button", data: { text: "Register now", url: registrationUrl } },
    { label: "Ticket button", type: "button", data: { text: "View my ticket", url: ticketUrl } },
    { label: "Button with other address", type: "button", data: { text: "Learn more", url: "https://example.com" } },
    { label: "Ticket QR code", type: "qr" },
  ] },
];

function previewText(value: string, variables: Record<string, string> = {}) { return resolveTemplateVariables(value, { "participant.name": "Sample Participant", "event.name": "Event", "event.registration_url": "https://example.local/register", ...variables }); }
function tableText(rows: unknown) { return Array.isArray(rows) ? rows.map((row) => Array.isArray(row) ? row.map(String).join(" | ") : "").join("\n") : ""; }

function PreviewBlock({ block, variables }: { block: Block; variables?: Record<string, string> }) {
  const preview = (value: string) => previewText(value, variables);
  if (block.type === "heading") { const Heading = `h${Number(block.data.level) || 2}` as "h1" | "h2" | "h3"; return <Heading className="font-semibold" style={{ textAlign: String(block.data.align ?? "left") as "left" | "center" | "right" }}>{preview(String(block.data.text ?? ""))}</Heading>; }
  if (block.type === "paragraph") { const runs = (block.data.runs ?? [{ text: String(block.data.text ?? "") }]) as RichRun[]; const render = (items: RichRun[]) => block.data.list === "bullet" || block.data.list === "number" ? renderRichList(items, preview, block.data.list) : renderRichText(items, preview);
    // A link that does not resolve to a safe address (for example a ticket link in the sample data) is shown as plain text in the preview.
    let body: string; try { body = render(runs); } catch { body = render(runs.map((run) => ({ ...run, url: undefined }))); }
    return <div className="whitespace-pre-wrap text-sm leading-6" style={{ textAlign: String(block.data.align ?? "left") as "left" | "center" | "right" }}><span dangerouslySetInnerHTML={{ __html: body }} /></div>; }
  if (block.type === "image") return String(block.data.src ?? "") === defaultImage ? <div className="grid h-24 place-items-center border border-dashed border-slate-300 text-xs text-slate-400">Image placeholder</div> : <img src={String(block.data.src)} alt={String(block.data.alt ?? "Email image")} width={Number(block.data.width) || 600} className="max-h-48 w-full object-contain" />;
  if (block.type === "button") return <div className="py-1" style={{ textAlign: String(block.data.align ?? "center") as "left" | "center" | "right" }}><span className="inline-flex rounded-md bg-[#2F81F7] px-4 py-2 text-sm font-medium text-white">{preview(String(block.data.text ?? "Button"))}</span></div>;
  if (block.type === "table") return <table className="w-full border-collapse text-left text-xs"><tbody>{(Array.isArray(block.data.rows) ? block.data.rows : []).map((row, rowIndex) => <tr key={rowIndex}>{(Array.isArray(row) ? row : []).map((cell, cellIndex) => <td key={cellIndex} className="border border-slate-200 px-2 py-1">{preview(String(cell))}</td>)}</tr>)}</tbody></table>;
  if (block.type === "divider") return <hr className="border-slate-200" />;
  if (block.type === "spacer") return <div style={{ height: Math.min(Number(block.data.height) || 24, 80) }} />;
  return <div className="mx-auto grid h-20 w-20 place-items-center border-4 border-slate-200 text-center text-[10px] text-slate-500">QR code</div>;
}

/** Email-safe paper preview. Always light, because that is how mail clients render. */
function PreviewPaper({ blocks, subject, variables }: { blocks: Block[]; subject?: string; variables?: Record<string, string> }) {
  return <article className="rounded-md border border-paper-outline bg-paper p-6 text-paper-ink shadow-sm">
    <div className="mb-4 border-b border-paper-outline pb-3">
      <p className="text-xs font-semibold text-paper-ink-muted">Cikarang Dryport Event Management</p>
      {subject ? <p className="mt-1 text-sm font-semibold text-paper-ink">Subject: {previewText(subject, variables)}</p> : <p className="mt-1 text-[11px] text-paper-ink-muted">Message preview</p>}
    </div>
    <div className="space-y-3">{blocks.length ? blocks.map((block) => <PreviewBlock key={block.id} block={block} variables={variables} />) : <p className="py-8 text-center text-xs text-paper-ink-muted">Your email preview will appear here.</p>}</div>
  </article>;
}

export function EmailBuilder({ name = "content", variables, subject, deliveryStatus: statusProp, toolbarEnd, initial = { version: 1, deliveryStatus: "DRAFT", blocks: [] as Block[] } }: {
  name?: string;
  variables?: Record<string, string>;
  subject?: string;
  /** Controlled by the form that owns the Status field. Falls back to the stored value. */
  deliveryStatus?: "DRAFT" | "READY";
  /** Extra tools shown at the right end of the message toolbar. */
  toolbarEnd?: React.ReactNode;
  initial?: { version: 1; deliveryStatus?: "DRAFT" | "READY"; blocks: Block[] };
}) {
  const [blocks, rawSetBlocks] = useState<Block[]>(initial.blocks);
  const undo = useRef<Block[][]>([]); const redo = useRef<Block[][]>([]);
  const { confirm, toast } = useFeedback();
  const dragged = useRef<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  function setBlocks(next: Block[] | ((items: Block[]) => Block[])) { undo.current = [...undo.current.slice(-49), blocks]; redo.current = []; rawSetBlocks(typeof next === "function" ? next(blocks) : next); }
  function history(direction: "undo" | "redo") { const from = direction === "undo" ? undo : redo; const to = direction === "undo" ? redo : undo; const previous = from.current.pop(); if (!previous) return; to.current.push(blocks); rawSetBlocks(previous); toast(`${direction === "undo" ? "Undo" : "Redo"} applied to draft.`, "info"); }
  const deliveryStatus = statusProp ?? initial.deliveryStatus ?? "READY";
  const [uploadedImages, setUploadedImages] = useState<Set<string>>(() => new Set(initial.blocks.filter((block) => block.type === "image" && block.data.src && block.data.src !== defaultImage).map((block) => block.id)));
  const [uploadMessage, setUploadMessage] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);

  const add = (type: BlockType, data: Record<string, unknown> = {}) => setBlocks((items) => [...items, { id: crypto.randomUUID(), type, data: { ...defaults[type], ...data } }]);
  const move = (index: number, direction: number) => setBlocks((items) => { const copy = [...items]; const next = index + direction; if (next < 0 || next >= copy.length) return copy; [copy[index], copy[next]] = [copy[next], copy[index]]; return copy; });
  const update = (id: string, data: Record<string, unknown>) => setBlocks((items) => items.map((item) => item.id === id ? { ...item, data: { ...item.data, ...data } } : item));

  async function uploadImage(id: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadMessage("Uploading image…");
    const form = new FormData();
    form.set("file", file);
    try {
      const response = await fetch("/api/email-assets", { method: "POST", body: form });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? "Image upload failed");
      update(id, { src: result.url });
      setUploadedImages((items) => new Set(items).add(id));
      setUploadMessage("Image uploaded."); toast("Image uploaded into email draft.", "info");
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : "Image upload failed"); toast(error instanceof Error ? error.message : "Image upload failed", "error");
    }
  }

  function removeImage(id: string) {
    update(id, { src: defaultImage });
    setUploadedImages((items) => { const next = new Set(items); next.delete(id); return next; });
    setFileInputKey((value) => value + 1);
    setUploadMessage(""); toast("Image removed from email draft.", "info");
  }

  function renderEditor(block: Block) {
    const imageUrl = String(block.data.src ?? "");
    const showImagePreview = block.type === "image" && uploadedImages.has(block.id);
    if (block.type === "heading") return <div className="grid gap-2 sm:grid-cols-[1fr_100px_110px]"><Input value={String(block.data.text ?? "")} onChange={(event) => update(block.id, { text: event.target.value })} aria-label="Heading text" /><Select value={String(block.data.level ?? 2)} onChange={(event) => update(block.id, { level: Number(event.target.value) })} aria-label="Heading level"><option value="1">H1</option><option value="2">H2</option><option value="3">H3</option></Select><Select value={String(block.data.align ?? "left")} onChange={(event) => update(block.id, { align: event.target.value })} aria-label="Heading alignment"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></Select></div>;
    if (block.type === "paragraph") return <div className="space-y-2">
      <RichTextEditor text={String(block.data.text ?? "")} runs={block.data.runs as RichRun[] | undefined} onChange={(runs) => update(block.id, { runs, text: runs.map((run) => run.text).join("") })} />
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Select wrapperClassName="w-36" value={String(block.data.list ?? "none")} onChange={(event) => update(block.id, { list: event.target.value })} aria-label="Paragraph list style"><option value="none">No list</option><option value="bullet">Bullet list</option><option value="number">Numbered list</option></Select>
        <Select wrapperClassName="w-28" value={String(block.data.align ?? "left")} onChange={(event) => update(block.id, { align: event.target.value })} aria-label="Paragraph alignment"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></Select>
      </div>
    </div>;
    if (block.type === "button") {
      const kind = linkKind(block.data.url);
      return <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Button text"><Input value={String(block.data.text ?? "")} onChange={(event) => update(block.id, { text: event.target.value })} placeholder="Register now" /></Field>
        <Field label="Link to">
          <Select value={kind} onChange={(event) => update(block.id, { url: event.target.value === "CUSTOM" ? "https://example.com" : event.target.value })}>
            {linkKinds.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
        </Field>
        {kind === "CUSTOM" && <Field label="Web address" className="sm:col-span-2"><Input value={String(block.data.url ?? "")} onChange={(event) => update(block.id, { url: event.target.value })} placeholder="https://example.com" /></Field>}
        {kind !== "CUSTOM" && <p className="text-xs text-ink-muted sm:col-span-2">{kind === registrationUrl ? "Each recipient is sent to this event's registration form." : "Each recipient is sent to their own ticket page. Only works for people who already have a ticket."}</p>}
        <Field label="Alignment"><Select value={String(block.data.align ?? "center")} onChange={(event) => update(block.id, { align: event.target.value })}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></Select></Field>
      </div>;
    }
    if (block.type === "image") return <div className="space-y-2">{showImagePreview ? <div className="relative w-fit rounded-md border border-outline bg-surface p-2"><img src={imageUrl} alt={String(block.data.alt ?? "Email image preview")} className="max-h-40 max-w-full rounded object-contain" /><Button type="button" variant="danger" size="icon-sm" className="absolute right-1 top-1" onClick={() => removeImage(block.id)} aria-label="Remove uploaded image"><X aria-hidden="true" /></Button></div> : <label className="block text-xs text-ink-muted">Upload image<FileInput key={`${block.id}-${fileInputKey}`} className="mt-1" accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadImage(block.id, event)} /></label>}<div className="grid gap-2 sm:grid-cols-[1fr_110px]"><Input value={String(block.data.alt ?? "")} onChange={(event) => update(block.id, { alt: event.target.value })} placeholder="Alt text" aria-label="Image alt text" /><Input type="number" min="1" max="800" value={String(block.data.width ?? 600)} onChange={(event) => update(block.id, { width: Number(event.target.value) })} aria-label="Image width" /></div>{!showImagePreview && <Input value={imageUrl} onChange={(event) => update(block.id, { src: event.target.value })} placeholder="Or paste an image URL" aria-label="Image URL" />}</div>;
    if (block.type === "table") return <Textarea className="min-h-24 resize-y font-mono text-xs" value={tableText(block.data.rows)} onChange={(event) => update(block.id, { rows: event.target.value.split("\n").map((row) => row.split("|").map((cell) => cell.trim())) })} placeholder="Name | Company\n{{participant.name}} | {{participant.company}}" aria-label="Table rows" />;
    if (block.type === "spacer") return <label className="flex items-center gap-3 text-body text-ink-muted">Height <Input className="max-w-32" type="number" min="4" max="120" value={String(block.data.height ?? 24)} onChange={(event) => update(block.id, { height: Number(event.target.value) })} /></label>;
    if (block.type === "qr") return <div className="grid gap-2 sm:grid-cols-[1fr_110px]"><Input value={String(block.data.value ?? "")} onChange={(event) => update(block.id, { value: event.target.value })} placeholder="{{ticket.url}}" aria-label="QR value" /><Input type="number" min="80" max="400" value={String(block.data.size ?? 180)} onChange={(event) => update(block.id, { size: Number(event.target.value) })} aria-label="QR size" /></div>;
    return <p className="text-xs text-ink-muted">This divider will be included in the email.</p>;
  }

  return <div>
    <div className="flex items-center gap-3 border-y border-outline bg-surface-raised px-4 py-2">
      {/* One fixed-height row, never wraps. Insert holds every block type so the bar stays short. */}
      <Toolbar aria-label="Message tools" className="w-auto flex-1 overflow-visible px-0">
        <ToolbarIconButton label="Undo" variant="outline" disabled={!undo.current.length} onClick={() => history("undo")}><Undo2 aria-hidden="true" /></ToolbarIconButton>
        <ToolbarIconButton label="Redo" variant="outline" disabled={!redo.current.length} onClick={() => history("redo")}><Redo2 aria-hidden="true" /></ToolbarIconButton>
        <ToolbarSeparator />
        <DropdownMenu>
          <DropdownMenuTrigger asChild><ToolbarButton variant="outline"><Plus aria-hidden="true" />Insert<ChevronDown aria-hidden="true" /></ToolbarButton></DropdownMenuTrigger>
          <DropdownMenuContent align="start" aria-label="Insert into message">
            {insertGroups.map((group, index) => <div key={group.label}>
              {index > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
              {group.items.map((item) => <DropdownMenuItem key={item.label} onSelect={() => add(item.type, item.data)}>{item.label}</DropdownMenuItem>)}
            </div>)}
          </DropdownMenuContent>
        </DropdownMenu>
        <ToolbarButton variant="outline" onClick={() => setPreviewOpen(true)}><Eye aria-hidden="true" />Preview</ToolbarButton>
      </Toolbar>
      {toolbarEnd}
    </div>

    {uploadMessage && <p className="px-4 py-2 text-xs text-ink-muted" role="status">{uploadMessage}</p>}

    <div className="space-y-3 p-4">
      {blocks.map((block, index) => <article key={block.id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const from = dragged.current; if (from === null || from === index) return; setBlocks((items) => { const copy = [...items]; const [item] = copy.splice(from, 1); copy.splice(index, 0, item); return copy; }); dragged.current = null; toast("Block reordered.", "info"); }} className="rounded-md border border-outline bg-surface p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon-sm" draggable onDragStart={() => { dragged.current = index; }} onDragEnd={() => { dragged.current = null; }} className="cursor-grab" aria-label={`Drag block ${index + 1}`}><GripVertical aria-hidden="true" /></Button>
            <span className="grid size-6 place-items-center rounded-sm bg-sky-soft text-xs text-link" aria-hidden="true">{index + 1}</span>
            <strong className="text-xs uppercase tracking-wide text-ink-muted">{blockLabels[block.type] ?? block.type}</strong>
          </div>
          <div className="flex items-center gap-1">
            <Button type="button" variant="outline" size="icon-sm" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move block up"><ArrowUp aria-hidden="true" /></Button>
            <Button type="button" variant="outline" size="icon-sm" onClick={() => move(index, 1)} disabled={index === blocks.length - 1} aria-label="Move block down"><ArrowDown aria-hidden="true" /></Button>
            <OverflowMenu label={`Actions for block ${index + 1}`} size="icon-sm">
              <OverflowMenuItem danger onSelect={async () => { if (await confirm({ title: "Remove email block?", message: "Remove this block from the email draft? You can restore it with Undo.", confirmLabel: "Remove block", danger: true })) { setBlocks((items) => items.filter((item) => item.id !== block.id)); toast("Block removed from draft.", "info"); } }}>Remove block</OverflowMenuItem>
            </OverflowMenu>
          </div>
        </div>
        {renderEditor(block)}
      </article>)}
      {!blocks.length && <div className="rounded-md border border-dashed border-outline px-4 py-12 text-center">
        <p className="text-body font-medium text-ink">Start your message</p>
        <p className="mt-1 text-xs text-ink-muted">Choose a block from the Insert menu above, just like composing in Outlook or Gmail.</p>
      </div>}
    </div>

    {previewOpen && <Dialog title="Live preview" size="max-w-3xl" onClose={() => setPreviewOpen(false)}>
      <p className="mb-3 text-xs text-ink-muted">Rendered with sample variables. This preview never sends an email.</p>
      <PreviewPaper blocks={blocks} subject={subject} variables={variables} />
    </Dialog>}

    <input type="hidden" name={name} value={JSON.stringify({ version: 1, deliveryStatus, blocks })} />
  </div>;
}
