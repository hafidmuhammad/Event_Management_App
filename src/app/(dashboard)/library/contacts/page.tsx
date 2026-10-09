import Link from "next/link";
import { requireRole } from "@/lib/auth/authorization";
import { listContactLists } from "@/services/library";
import { ModalTrigger } from "@/components/ui/modal";
import { ActionForm } from "@/components/ui/action-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardFooter, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/controls";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { ContactListActions } from "@/components/library/contact-list-actions";
import { deleteContactListAction, saveContactListAction } from "../actions";

export default async function ContactsPage() {
  await requireRole("ADMIN", "EVENT_MANAGER");
  const lists = await listContactLists();

  return <section className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="section-title">Global contact lists</h2>
        <p className="page-subtitle">Shared address books. Select them as recipients when broadcasting from any event.</p>
      </div>
      <ModalTrigger title="New contact list" size="max-w-lg">
        <ActionForm action={saveContactListAction} submitLabel="Create list">
          <Field label="List name"><Input name="name" required maxLength={160} placeholder="Partners &amp; sponsors" /></Field>
          <Field label="Description (optional)"><Input name="description" maxLength={500} placeholder="Who belongs in this list" /></Field>
        </ActionForm>
      </ModalTrigger>
    </div>

    <div className="grid gap-3 lg:grid-cols-2">
      {lists.map((list) => <Card key={list.id} asChild>
        <article>
          <CardHeader>
            <div className="min-w-0">
              <CardTitle><Link href={`/library/contacts/${list.id}`} className="text-link hover:underline">{list.name}</Link></CardTitle>
              {list.description && <CardDescription className="mt-1 text-body">{list.description}</CardDescription>}
            </div>
            <Badge>{list.contactCount} contact{list.contactCount === 1 ? "" : "s"}</Badge>
          </CardHeader>
          <CardFooter>
            <ContactListActions
              list={{ id: list.id, name: list.name, description: list.description, contactCount: list.contactCount }}
              saveAction={saveContactListAction}
              deleteAction={deleteContactListAction}
            />
          </CardFooter>
        </article>
      </Card>)}
      {!lists.length && <EmptyState className="lg:col-span-2" title="No contact lists yet" description="Create one and import contacts to reuse them across events." />}
    </div>
  </section>;
}
