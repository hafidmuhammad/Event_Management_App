"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { Bold, Italic, Link as LinkIcon, Underline, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/controls";
import { cn } from "@/lib/cn";
import { useFeedback } from "@/components/ui/feedback-provider";
import { isAllowedRunLink, type RichRun } from "@/lib/email-rich-text";

/** Links offered next to the address field. Placeholders are filled in for each recipient when the email is sent. */
const linkPresets = [
  { value: "{{event.registration_url}}", label: "Registration form" },
  { value: "{{ticket.url}}", label: "Ticket link" },
] as const;

type Bubble = { top: number; left: number; below: boolean };
type Active = { bold: boolean; italic: boolean; underline: boolean; link: string | null };
const noFormat: Active = { bold: false, italic: false, underline: false, link: null };

function readRuns(root: HTMLElement): RichRun[] {
  const runs: RichRun[] = [];
  function visit(node: Node, style: Omit<RichRun, "text"> = {}) {
    if (node.nodeType === Node.TEXT_NODE) { if (node.textContent) runs.push({ ...style, text: node.textContent }); return; }
    if (!(node instanceof HTMLElement)) return;
    if (node.tagName === "BR") { runs.push({ text: "\n" }); return; }
    const next = {
      ...style,
      ...(["B", "STRONG"].includes(node.tagName) ? { bold: true } : {}),
      ...(["I", "EM"].includes(node.tagName) ? { italic: true } : {}),
      ...(node.tagName === "U" ? { underline: true } : {}),
      ...(node.tagName === "A" ? { url: node.getAttribute("href") ?? "" } : {}),
    };
    if (["DIV", "P"].includes(node.tagName) && runs.length) runs.push({ text: "\n" });
    node.childNodes.forEach((child) => visit(child, next));
  }
  root.childNodes.forEach((node) => visit(node));
  return runs;
}

function currentRange(root: HTMLElement | null) {
  const selection = window.getSelection();
  if (!root || !selection?.rangeCount) return null;
  const range = selection.getRangeAt(0);
  return root.contains(range.commonAncestorContainer) ? range : null;
}

function FormatButton({ label, active = false, onClick, children }: { label: string; active?: boolean; onClick: () => void; children: ReactNode }) {
  return <Button type="button" variant="ghost" size="icon-sm" title={label} aria-label={label} aria-pressed={active} className={cn(active && "bg-sky-soft text-link hover:bg-sky-soft hover:text-link")} onClick={onClick}>{children}</Button>;
}

/**
 * Paragraph editor with a Gmail-style floating toolbar: select some text and
 * Bold, Italic, Underline and Link appear right above it. Ctrl/Cmd+B, I, U and
 * K work as well. Links can point to the event registration form or the
 * ticket page without typing an address.
 */
export function RichTextEditor({ text, runs, onChange }: { text: string; runs?: RichRun[]; onChange: (runs: RichRun[]) => void }) {
  const editor = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const last = useRef("");
  const saved = useRef<Range | null>(null);
  const pointerDown = useRef(false);
  const linking = useRef(false);
  const [bubble, setBubble] = useState<Bubble | null>(null);
  const [active, setActive] = useState<Active>(noFormat);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("https://");
  const [linkError, setLinkError] = useState("");
  const { toast } = useFeedback();
  const serialized = JSON.stringify(runs ?? [{ text }]);

  useEffect(() => {
    if (!editor.current || last.current === serialized) return;
    editor.current.replaceChildren();
    for (const run of JSON.parse(serialized) as RichRun[]) {
      let node: Node = document.createTextNode(run.text);
      for (const tag of [...(run.bold ? ["strong"] : []), ...(run.italic ? ["em"] : []), ...(run.underline ? ["u"] : []), ...(run.url ? ["a"] : [])]) {
        const element = document.createElement(tag);
        if (tag === "a") { if (isAllowedRunLink(run.url!)) element.setAttribute("href", run.url!); }
        element.append(node); node = element;
      }
      editor.current.append(node);
    }
    last.current = serialized;
  }, [serialized]);

  const publish = useCallback(() => {
    if (!editor.current) return;
    const next = readRuns(editor.current);
    last.current = JSON.stringify(next);
    onChange(next);
  }, [onChange]);

  const closeLink = useCallback(() => { linking.current = false; setLinkOpen(false); setLinkError(""); }, []);

  const sync = useCallback(() => {
    if (linking.current || pointerDown.current) return;
    const range = currentRange(editor.current);
    if (!range || range.collapsed) { setBubble(null); return; }
    const rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height) { setBubble(null); return; }
    const below = rect.top < 72;
    const left = Math.round(Math.min(Math.max(rect.left + rect.width / 2, 190), Math.max(190, window.innerWidth - 190)));
    const top = Math.round(below ? rect.bottom + 8 : rect.top - 8);
    setBubble((previous) => previous && previous.top === top && previous.left === left && previous.below === below ? previous : { top, left, below });
    const anchor = range.startContainer instanceof Element ? range.startContainer : range.startContainer.parentElement;
    const link = anchor?.closest("a");
    setActive({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      link: link && editor.current?.contains(link) ? link.getAttribute("href") ?? "" : null,
    });
  }, []);

  useEffect(() => {
    const down = (event: globalThis.MouseEvent) => {
      const target = event.target as Node;
      if (panel.current?.contains(target)) return;
      if (editor.current?.contains(target)) { pointerDown.current = true; if (linking.current) closeLink(); return; }
      if (linking.current) closeLink();
      setBubble(null);
    };
    const up = () => { if (!pointerDown.current) return; pointerDown.current = false; window.setTimeout(sync, 0); };
    document.addEventListener("selectionchange", sync);
    document.addEventListener("mousedown", down);
    document.addEventListener("mouseup", up);
    window.addEventListener("scroll", sync, true);
    window.addEventListener("resize", sync);
    return () => {
      document.removeEventListener("selectionchange", sync);
      document.removeEventListener("mousedown", down);
      document.removeEventListener("mouseup", up);
      window.removeEventListener("scroll", sync, true);
      window.removeEventListener("resize", sync);
    };
  }, [sync, closeLink]);

  useEffect(() => { if (linkOpen) panel.current?.querySelector("input")?.focus(); }, [linkOpen]);

  function run(command: "bold" | "italic" | "underline" | "unlink") {
    editor.current?.focus();
    document.execCommand(command);
    publish();
    sync();
  }

  function openLink() {
    const range = currentRange(editor.current);
    if (!range || range.collapsed) { toast("Select the text you want to link first.", "info"); return; }
    saved.current = range.cloneRange();
    linking.current = true;
    setLinkValue(active.link && !linkPresets.some((preset) => preset.value === active.link) ? active.link : "https://");
    setLinkError("");
    setLinkOpen(true);
  }

  function applyLink(raw: string) {
    let value = raw.trim();
    if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(value)) value = `https://${value}`;
    if (!isAllowedRunLink(value)) { setLinkError("Enter a full http:// or https:// address, or pick a form link above."); return; }
    editor.current?.focus();
    const selection = window.getSelection();
    if (saved.current && selection) { selection.removeAllRanges(); selection.addRange(saved.current); }
    document.execCommand("createLink", false, value);
    publish();
    closeLink();
    setBubble(null);
  }

  function removeLink() {
    editor.current?.focus();
    const selection = window.getSelection();
    if (saved.current && selection) { selection.removeAllRanges(); selection.addRange(saved.current); }
    document.execCommand("unlink");
    publish();
    closeLink();
    sync();
  }

  function editorKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); openLink(); }
  }

  const keepSelection = (event: MouseEvent<HTMLDivElement>) => { if (!(event.target instanceof HTMLInputElement)) event.preventDefault(); };
  const position = bubble ? { top: bubble.top, left: bubble.left } : undefined;
  const placement = bubble?.below ? "-translate-x-1/2" : "-translate-x-1/2 -translate-y-full";

  return <div className="space-y-1.5">
    <div
      ref={editor}
      role="textbox"
      aria-label="Paragraph text"
      aria-multiline="true"
      data-placeholder="Write your message. Select text to format it or add a link."
      contentEditable
      suppressContentEditableWarning
      className="min-h-24 w-full whitespace-pre-wrap rounded-md border border-outline bg-surface-sunken px-3 py-2 text-body text-ink focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/40 empty:before:text-ink-subtle empty:before:content-[attr(data-placeholder)] [&_a]:text-link [&_a]:underline"
      onInput={publish}
      onKeyDown={editorKeyDown}
      onPaste={(event) => { event.preventDefault(); document.execCommand("insertText", false, event.clipboardData.getData("text/plain")); publish(); }}
    />
    <p className="text-xs text-ink-subtle">Select text to format it or link it to the registration form. Shortcuts: Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+K.</p>

    {bubble && !linkOpen && <div ref={panel} role="toolbar" aria-label="Text formatting" onMouseDown={keepSelection} style={position} className={cn("fixed z-menu flex items-center gap-0.5 rounded-md border border-outline bg-overlay p-1 shadow-md", placement)}>
      <FormatButton label="Bold (Ctrl+B)" active={active.bold} onClick={() => run("bold")}><Bold aria-hidden="true" /></FormatButton>
      <FormatButton label="Italic (Ctrl+I)" active={active.italic} onClick={() => run("italic")}><Italic aria-hidden="true" /></FormatButton>
      <FormatButton label="Underline (Ctrl+U)" active={active.underline} onClick={() => run("underline")}><Underline aria-hidden="true" /></FormatButton>
      <span className="mx-0.5 h-5 w-px bg-outline" aria-hidden="true" />
      <FormatButton label="Link (Ctrl+K)" active={active.link !== null} onClick={openLink}><LinkIcon aria-hidden="true" /></FormatButton>
      {active.link !== null && <FormatButton label="Remove link" onClick={() => run("unlink")}><Unlink aria-hidden="true" /></FormatButton>}
    </div>}

    {bubble && linkOpen && <div
      ref={panel}
      role="group"
      aria-label="Link"
      onMouseDown={keepSelection}
      onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); closeLink(); editor.current?.focus(); } }}
      style={position}
      className={cn("fixed z-menu w-[22rem] max-w-[calc(100vw-1rem)] space-y-2 rounded-md border border-outline bg-overlay p-2 shadow-md", placement)}
    >
      <p className="text-label font-medium uppercase tracking-wide text-ink-subtle">Link to</p>
      <div className="flex flex-wrap gap-1">
        {linkPresets.map((preset) => <Button key={preset.value} type="button" size="sm" variant={active.link === preset.value ? "primary" : "outline"} onClick={() => applyLink(preset.value)}>{preset.label}</Button>)}
      </div>
      <div className="flex gap-1">
        <Input
          type="text"
          inputMode="url"
          value={linkValue}
          onChange={(event) => { setLinkValue(event.target.value); setLinkError(""); }}
          onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); applyLink(linkValue); } }}
          placeholder="https://example.com"
          aria-label="Link address"
          aria-invalid={linkError ? true : undefined}
          className="min-h-ctl-sm"
        />
        <Button type="button" size="sm" variant="primary" onClick={() => applyLink(linkValue)}>Apply</Button>
      </div>
      {linkError && <p role="alert" className="text-xs text-danger-ink">{linkError}</p>}
      <div className="flex items-center justify-between">
        {active.link !== null ? <Button type="button" size="sm" variant="ghost" onClick={removeLink}>Remove link</Button> : <span />}
        <Button type="button" size="sm" variant="ghost" onClick={() => { closeLink(); editor.current?.focus(); }}>Cancel</Button>
      </div>
    </div>}
  </div>;
}
