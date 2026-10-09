import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/authorization";
import { getContactList } from "@/services/library";
import { ModalTrigger } from "@/components/ui/modal";
import { ActionForm } from "@/components/ui/action-form";
import { Input, Textarea } from "@/components/ui/controls";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { OverflowMenu, OverflowMenuFormItem, OverflowMenuItem } from "@/components/ui/overflow-menu";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/table";
import { addContactAction, deleteContactAction, importContactsAction } from "../../actions";

export default async function ContactListPage({ params }: { params: Promise<{ listId: string }> }) {
  await requireRole("ADMIN", "EVENT_MANAGER");
  const { listId } = await params;
  const list = await getContactList(listId);
  if (!list) notFound();

  return <section className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="eyebrow"><Link href="/library/contacts" className="text-link hover:underline">Contacts</Link> / {list.name}</p>
        <h1 className="page-title break-words">{list.name}</h1>
        <p className="page-subtitle">{list.contacts.length} contact{list.contacts.length === 1 ? "" : "s"}{list.description ? ` · ${list.description}` : ""}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ModalTrigger title="Import contacts" variant="outline" size="max-w-2xl">
          <ActionForm action={importContactsAction} submitLabel="Import contacts" pendingLabel="Importing…">
            <input type="hidden" name="listId" value={list.id} />
            <Field label="Paste rows">
              <Textarea name="rows" required rows={10} className="font-mono text-xs" placeholder={"Name, email, company\nAyu Lestari, ayu@example.com, Dryport\nbudi@example.com"} />
            </Field>
            <p className="text-xs text-ink-muted">One contact per line. Comma, semicolon, or tab separated. A bare email address also works. Duplicates inside the list are skipped and invalid rows are reported.</p>
          </ActionForm>
        </ModalTrigger>
        <ModalTrigger title="Add contact" size="max-w-lg">
          <ActionForm action={addContactAction} submitLabel="Add contact">
            <input type="hidden" name="listId" value={list.id} />
            <Field label="Name"><Input name="name" required maxLength={160} /></Field>
            <Field label="Email"><Input name="email" type="email" required maxLength={255} /></Field>
            <Field label="Company (optional)"><Input name="company" maxLength={160} /></Field>
          </ActionForm>
        </ModalTrigger>
        <OverflowMenu label="More list actions">
          <OverflowMenuItem asChild><a href={`/api/library/contacts/${list.id}/export?format=csv`}>Export CSV</a></OverflowMenuItem>
          <OverflowMenuItem asChild><a href={`/api/library/contacts/${list.id}/export?format=xlsx`}>Export Excel</a></OverflowMenuItem>
        </OverflowMenu>
      </div>
    </div>

    <Table responsive>
      <Thead><Tr><Th>Name</Th><Th>Email</Th><Th>Company</Th><Th className="w-10"><span className="sr-only">Actions</span></Th></Tr></Thead>
      <Tbody>
        {list.contacts.map((contact) => {
          const removeFormId = `remove-contact-${contact.id}`;
          return <Tr key={contact.id}>
            <Td data-label="Name">{contact.name}</Td>
            <Td data-label="Email">{contact.email}</Td>
            <Td data-label="Company">{contact.company ?? "—"}</Td>
            <Td data-label="Actions">
              {/* The form sits outside the menu so its confirm dialog survives the menu closing. */}
              <ActionForm
                id={removeFormId}
                action={deleteContactAction}
                className="hidden"
                danger
                confirm={{ title: "Remove contact?", message: `Remove ${contact.email} from this list?`, confirmLabel: "Remove contact" }}
                footer={<></>}
              >
                <input type="hidden" name="listId" value={list.id} />
                <input type="hidden" name="contactId" value={contact.id} />
              </ActionForm>
              <OverflowMenu label={`Actions for ${contact.email}`} size="icon-sm">
                <OverflowMenuFormItem formId={removeFormId} danger>Remove</OverflowMenuFormItem>
              </OverflowMenu>
            </Td>
          </Tr>;
        })}
        {!list.contacts.length && <Tr><Td colSpan={4}><EmptyState title="No contacts yet" description="Import or add one to start using this list as recipients." /></Td></Tr>}
      </Tbody>
    </Table>
  </section>;
}
