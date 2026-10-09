"use client";

import * as XLSX from "xlsx";
import { useEffect, useId, useRef, useState } from "react";
import { GripVertical, Plus, X } from "lucide-react";
import { useFeedback } from "@/components/ui/feedback-provider";
import { OverflowMenu, OverflowMenuItem } from "@/components/ui/overflow-menu";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/controls";

type Member = { name: string; position: string; phone: string; email: string; division?: string };
type SaveAction = (formData: FormData) => Promise<void>;
type EditTarget = { index: number; field: "name" | "position" };

const demoMembers: Member[] = [
  { name: "Alya Rahma", position: "Event Director", phone: "", email: "" },
  { name: "Bima Pratama", position: "Program & Content Lead", phone: "", email: "" },
  { name: "Citra Lestari", position: "Operations Manager", phone: "", email: "" },
  { name: "Dion Wijaya", position: "Guest Experience Lead", phone: "", email: "" },
  { name: "Eka Saputra", position: "Registration & Check-in", phone: "", email: "" },
  { name: "Farah Nabila", position: "Partnerships & Sponsorship", phone: "", email: "" },
  { name: "Gilang Mahesa", position: "Production & Stage", phone: "", email: "" },
  { name: "Hana Putri", position: "Creative & Visual", phone: "", email: "" },
  { name: "Iqbal Ramadhan", position: "Logistics & Venue", phone: "", email: "" },
  { name: "Jihan Anindita", position: "Documentation & Media", phone: "", email: "" },
];

function normalized(value: unknown) {
  return String(value ?? "").trim();
}

function headerIndex(headers: string[], names: string[]) {
  return headers.findIndex((header) => names.includes(header.toLowerCase().replace(/[\s_-]+/g, "")));
}

export function CommitteeEditor({ initialMembers, action }: { initialMembers: Member[]; action: SaveAction }) {
  const { confirm, toast } = useFeedback();
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [importStatus, setImportStatus] = useState("");
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const reorderHelpId = useId();
  const dragSource = useRef<number | null>(null);
  const dragTarget = useRef<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const payload = members
    .map((member) => ({ ...member, name: member.name.trim(), position: member.position.trim() }))
    .filter((member) => member.name || member.position);

  function startEdit(index: number, field: "name" | "position") {
    setEditValue(members[index][field]);
    setEditing({ index, field });
  }

  function commitEdit() {
    if (!editing) return;
    const value = editValue.trim();
    setMembers((current) => current.map((member, index) => (index === editing.index ? { ...member, [editing.field]: value } : member)));
    setEditing(null);
    setEditValue("");
  }

  function cancelEdit() {
    setEditing(null);
    setEditValue("");
  }

  function addMember() {
    if (members.length >= 50) {
      toast("Maximum 50 committee members.", "error");
      return;
    }
    setMembers((current) => [...current, { name: "", position: "", phone: "", email: "" }]);
    setEditValue("");
    setEditing({ index: members.length, field: "name" });
  }

  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= members.length) return;
    setEditing(null);
    setMembers((current) => {
      const next = [...current];
      const [member] = next.splice(from, 1);
      next.splice(to, 0, member);
      return next;
    });
    toast(`Member moved to position ${to + 1}. Save committee to apply it.`, "info");
  }

  function stopDrag() {
    dragSource.current = null;
    dragTarget.current = null;
    setDropIndex(null);
  }

  async function removeMember(index: number) {
    const label = members[index].name || `Row ${index + 1}`;
    if (!(await confirm({ title: "Remove committee member?", message: `Remove ${label} from the committee draft? Save committee to apply this change.`, confirmLabel: "Remove member", danger: true }))) return;
    setEditing(null);
    setMembers((current) => current.filter((_, memberIndex) => memberIndex !== index));
    toast("Member removed from draft.", "info");
  }

  function downloadExample() {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Name", "Position"], ["Sample Member", "Coordinator"]]), "Committee");
    XLSX.writeFile(workbook, "committee-import-template.xlsx");
    toast("Excel example downloaded. Name and position are required.", "info");
  }

  async function loadDemo() {
    if (members.length && !(await confirm({ title: "Replace committee draft?", message: "Replace the current unsaved committee list with dummy data?", confirmLabel: "Replace draft", danger: true }))) return;
    setEditing(null);
    setMembers(demoMembers.map((member) => ({ ...member })));
    setImportStatus("Dummy committee loaded. Save committee to apply it.");
    toast("Dummy committee loaded. Save committee to apply it.", "info");
  }

  async function importExcel(file: File) {
    setImportStatus("Reading Excel…");
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("Excel file must be 5 MB or smaller.");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!firstSheet) throw new Error("Workbook has no sheet.");
      const rows = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1, defval: "" });
      if (!rows.length) throw new Error("The selected sheet is empty.");
      const headers = rows[0].map((value) => normalized(value).toLowerCase().replace(/[\s_-]+/g, ""));
      const nameColumn = headerIndex(headers, ["name", "nama", "fullname", "panitia", "committee"]);
      const positionColumn = headerIndex(headers, ["position", "jabatan", "role", "peran"]);
      const hasHeader = nameColumn >= 0 || positionColumn >= 0;
      const nameIndex = nameColumn >= 0 ? nameColumn : 0;
      const positionIndex = positionColumn >= 0 ? positionColumn : 1;
      const imported = rows
        .slice(hasHeader ? 1 : 0)
        .map((row) => ({ name: normalized(row[nameIndex]), position: normalized(row[positionIndex]), phone: "", email: "" }))
        .filter((member) => member.name && member.position);
      if (!imported.length) throw new Error("No rows with name and position were found.");
      const nonemptyRows = rows.slice(hasHeader ? 1 : 0).filter((row) => row.some((cell) => normalized(cell)));
      if (nonemptyRows.length !== imported.length) throw new Error("Some rows are missing name or position. Correct the sheet before importing; no rows were added.");
      if (members.length + imported.length > 50) throw new Error("Maximum 50 committee members. Split or reduce the import.");
      setEditing(null);
      setMembers((current) => [...current, ...imported]);
      setImportStatus(`${imported.length} committee members imported. Save committee to apply them.`);
      toast(`${imported.length} members imported into the draft.`, "info");
    } catch (error) {
      setImportStatus(error instanceof Error ? error.message : "Excel import failed.");
      toast(error instanceof Error ? error.message : "Excel import failed.", "error");
    }
  }

  function guardSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (editing) commitEdit();
    const incomplete = payload.findIndex((member) => !member.name || !member.position);
    if (incomplete >= 0) {
      event.preventDefault();
      toast(`Row ${incomplete + 1} needs both a name and a position.`, "error");
    }
  }

  function cellProps(index: number, field: "name" | "position") {
    return {
      tabIndex: 0,
      role: "button" as const,
      title: "Double-click to edit",
      "aria-label": `Edit ${field} for row ${index + 1}`,
      onDoubleClick: () => startEdit(index, field),
      onKeyDown: (event: React.KeyboardEvent) => {
        if (event.key === "Enter" || event.key === "F2") {
          event.preventDefault();
          startEdit(index, field);
        }
      },
      className: "block w-full cursor-text rounded-sm px-1 py-0.5 hover:bg-surface-raised",
    };
  }

  function editCell(index: number, field: "name" | "position", value: string, emptyLabel: string) {
    if (editing && editing.index === index && editing.field === field) {
      return (
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(event) => setEditValue(event.target.value)}
          onBlur={commitEdit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitEdit();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              cancelEdit();
            }
          }}
          aria-label={`${field} for row ${index + 1}`}
          className="min-h-0 border-sky px-1.5 py-0.5"
        />
      );
    }
    return (
      <span {...cellProps(index, field)}>
        {value || <span className="text-ink-subtle">{emptyLabel}</span>}
      </span>
    );
  }

  return (
    <form action={action} onSubmit={guardSubmit} className="space-y-4">
      <input type="hidden" name="committeeJson" value={JSON.stringify(payload)} readOnly />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-body font-medium text-ink">{members.length} {members.length === 1 ? "member" : "members"}</p>
          <p id={reorderHelpId} className="mt-0.5 text-xs text-ink-muted">Drag the grip to reorder members. On a focused grip, use Arrow Up/Down. Double-click a name or position to edit. Save committee to apply changes.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={addMember}><Plus aria-hidden="true" />Add member</Button>
          {/* The file input stays mounted here: the menu content unmounts when it closes, and a picker started from a removed input would be lost. */}
          <input
            ref={importInput}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="sr-only"
            aria-label="Import committee from Excel"
            tabIndex={-1}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importExcel(file);
              event.target.value = "";
            }}
          />
          <OverflowMenu label="More committee actions">
            <OverflowMenuItem onSelect={() => importInput.current?.click()}>Import Excel</OverflowMenuItem>
            <OverflowMenuItem onSelect={downloadExample}>Template</OverflowMenuItem>
            <OverflowMenuItem onSelect={() => void loadDemo()}>Dummy data</OverflowMenuItem>
          </OverflowMenu>
          <Button type="submit" variant="primary">Save committee</Button>
        </div>
      </div>

      {importStatus && <p className="text-xs text-ink-muted" role="status">{importStatus}</p>}

      <Table>
          <caption className="sr-only">Committee members in closing-credit order</caption>
          <thead>
            <tr>
              <th scope="col" className="w-12">#</th>
              <th scope="col">Name</th>
              <th scope="col">Position</th>
              <th scope="col" className="w-32 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member, index) => (
              <tr key={index} data-committee-row={index} className={dropIndex === index ? "bg-sky-soft outline outline-2 -outline-offset-2 outline-sky" : undefined}>
                <td className="text-ink-muted tabular-nums"><span className="inline-flex items-center gap-2"><Button type="button" variant="outline" size="sm" aria-label={`Drag to reorder ${member.name || `row ${index + 1}`}`} aria-describedby={reorderHelpId} title="Drag to reorder" className="min-h-9 min-w-9 touch-none cursor-grab select-none justify-center px-1 active:cursor-grabbing"
                  onPointerDown={(event) => {
                    if (event.button !== 0 || !event.isPrimary) return;
                    commitEdit();
                    dragSource.current = index;
                    dragTarget.current = index;
                    event.currentTarget.setPointerCapture(event.pointerId);
                  }}
                  onPointerMove={(event) => {
                    if (dragSource.current === null) return;
                    const row = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLTableRowElement>("tr[data-committee-row]");
                    const target = row?.closest("table") === event.currentTarget.closest("table") ? Number(row?.dataset.committeeRow) : null;
                    dragTarget.current = target;
                    setDropIndex(target);
                  }}
                  onPointerUp={(event) => {
                    const from = dragSource.current, to = dragTarget.current;
                    stopDrag();
                    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
                    if (from !== null && to !== null) move(from, to);
                  }}
                  onPointerCancel={stopDrag} onLostPointerCapture={stopDrag}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") { stopDrag(); return; }
                    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
                    event.preventDefault();
                    const to = index + (event.key === "ArrowUp" ? -1 : 1);
                    if (to < 0 || to >= members.length) return;
                    const table = event.currentTarget.closest("table");
                    move(index, to);
                    requestAnimationFrame(() => table?.querySelector<HTMLButtonElement>(`tr[data-committee-row="${to}"] button`)?.focus());
                  }}><GripVertical aria-hidden="true" /></Button>{index + 1}</span></td>
                <td className="font-medium">{editCell(index, "name", member.name, "Add name")}</td>
                <td>{editCell(index, "position", member.position, "Add position")}</td>
                <td className="text-right">
                  <div className="inline-flex items-center gap-1">
                    <Button type="button" variant="danger" size="sm" className="justify-center px-1.5" onClick={() => void removeMember(index)} aria-label={`Remove ${member.name || `row ${index + 1}`}`} title="Remove"><X aria-hidden="true" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {!members.length && (
              <tr>
                <td colSpan={4}>
                  <EmptyState title="No committee members yet" description="Use Add member or import an Excel file." className="py-10" />
                </td>
              </tr>
            )}
          </tbody>
      </Table>
    </form>
  );
}
