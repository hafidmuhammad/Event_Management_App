import { requireRole } from "@/lib/auth/authorization";
import { listGlobalTemplates } from "@/services/library";
import { contentSchema } from "@/lib/validation/email";
import { formatEventDate } from "@/lib/date-time";
import { ComposeTrigger } from "@/components/ui/compose-window";
import { ActionForm } from "@/components/ui/action-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { OverflowMenu, OverflowMenuFormItem } from "@/components/ui/overflow-menu";
import { GlobalTemplateForm } from "@/components/email/global-template-form";
import { deleteGlobalTemplateAction, saveGlobalTemplateAction } from "../actions";

const sampleVariables = {
  "participant.name": "Sample Participant",
  "participant.company": "Example Company",
  "participant.email": "sample@example.local",
  "event.name": "Your event",
  "event.registration_url": "https://example.local/register",
  "ticket.ticket_number": "EVT-SAMPLE",
  "ticket.url": "https://example.local/t/sample",
};

export default async function GlobalEmailTemplatesPage() {
  await requireRole("ADMIN", "EVENT_MANAGER");
  const templates = await listGlobalTemplates();

  return <section className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="section-title">Global email templates</h2>
        <p className="page-subtitle">Reusable blueprints any event can apply. Global templates never send email on their own.</p>
      </div>
      <ComposeTrigger title="New global template" windowTitle="New global template">
        <GlobalTemplateForm action={saveGlobalTemplateAction} variables={sampleVariables} />
      </ComposeTrigger>
    </div>

    <div className="grid gap-3 lg:grid-cols-2">
      {templates.map((template) => {
        const content = contentSchema.safeParse(template.contentJson);
        const removeFormId = `remove-global-template-${template.id}`;
        return <Card key={template.id} asChild>
          <article>
            <CardHeader>
              <div className="min-w-0">
                <CardTitle>{template.name}</CardTitle>
                <CardDescription className="mt-1 text-body">{template.subject}</CardDescription>
              </div>
              <Badge>{template.type.replaceAll("_", " ")}</Badge>
            </CardHeader>
            {template.description && <CardDescription>{template.description}</CardDescription>}
            <p className="text-xs text-ink-muted">Updated {formatEventDate(template.updatedAt)}</p>
            <CardFooter>
              {content.success
                ? <ComposeTrigger title="Edit" windowTitle={`Edit ${template.name}`} variant="outline" triggerSize="sm">
                    <GlobalTemplateForm action={saveGlobalTemplateAction} variables={sampleVariables} template={{ id: template.id, name: template.name, description: template.description, type: template.type, subject: template.subject, content: content.data }} />
                  </ComposeTrigger>
                : <p className="text-xs text-danger-ink">Stored content is invalid and cannot be edited.</p>}
              {/* The form sits outside the menu so its confirm dialog survives the menu closing. */}
              <ActionForm
                id={removeFormId}
                action={deleteGlobalTemplateAction}
                className="hidden"
                confirm={{ title: "Remove global template?", message: "This removes the blueprint from the library. Event templates already created from it are untouched.", confirmLabel: "Remove template" }}
                danger
                footer={<></>}
              >
                <input type="hidden" name="id" value={template.id} />
              </ActionForm>
              <OverflowMenu label={`Actions for ${template.name}`} size="icon-sm">
                <OverflowMenuFormItem formId={removeFormId} danger>Remove</OverflowMenuFormItem>
              </OverflowMenu>
            </CardFooter>
          </article>
        </Card>;
      })}
      {!templates.length && <EmptyState className="lg:col-span-2" title="No global templates yet" description="Create one to reuse it across every event." />}
    </div>
  </section>;
}
