import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/authorization";
import { getEvent } from "@/services/events";
import { listEmailTemplates, renderEmailAsync, resolveRecipients, resolveTemplateVariables, eventVariables } from "@/services/email";
import { listSchedules } from "@/services/email-schedules";
import { listContactLists, listGlobalTemplates } from "@/services/library";
import { ComposeTrigger } from "@/components/ui/compose-window";
import type { GlobalTemplateOption } from "@/components/email/template-form";
import { contentSchema, recipientSchema } from "@/lib/validation/email";
import { broadcastAction, createReminderSchemeAction, createScheduleAction, markTemplateReadyAction, removeScheduleAction, saveEventTemplateToLibraryAction, saveTemplateAction } from "./actions";
import { ActionForm } from "@/components/ui/action-form";
import { BroadcastButton } from "@/components/email/broadcast-button";
import { SendTestForm } from "@/components/email/send-test-form";
import { TemplateForm } from "@/components/email/template-form";
import { TemplateCardActions } from "@/components/email/template-card-actions";
import { AddReminderButton, SchemeSubmitButton } from "@/components/email/reminder-controls";
import { isEmailDraft } from "@/lib/email-delivery";
import { formatOffset, scheduledSendAt } from "@/lib/email-schedule";
import { ModalTrigger } from "@/components/ui/modal";
import { listBroadcasts, listDeliveries } from "@/services/activity";
import { formatEventDate } from "@/lib/date-time";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/controls";
import { EmptyState } from "@/components/ui/empty-state";
import { OverflowMenu, OverflowMenuFormItem } from "@/components/ui/overflow-menu";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/table";

const scheduleBadge = {
  PENDING: { variant: "info", label: "Scheduled" },
  RUNNING: { variant: "warning", label: "Sending" },
  SENT: { variant: "positive", label: "Sent" },
  FAILED: { variant: "negative", label: "Failed" },
  SKIPPED: { variant: "neutral", label: "Skipped" },
  CANCELLED: { variant: "neutral", label: "Cancelled" },
} as const;

export default async function EmailPage({ params, searchParams }: { params: Promise<{ eventId: string }>; searchParams: Promise<{ notice?: string; error?: string; compose?: string; edit?: string; preview?: string }> }) {
  const session = await requireRole("ADMIN", "EVENT_MANAGER", "RECEPTIONIST");
  const { eventId } = await params;
  const query = await searchParams;
  const [event, templates] = await Promise.all([getEvent(eventId), listEmailTemplates(eventId)]);
  if (!event) notFound();
  const canManage = session.user.role !== "RECEPTIONIST";
  // Global library data powers the compose window: reusable blueprints and shared address books.
  const [contactLists, globalRows, schedules] = canManage ? await Promise.all([listContactLists(), listGlobalTemplates(), listSchedules(eventId)]) : [[], [], []];
  const globalTemplates: GlobalTemplateOption[] = globalRows.flatMap((row) => {
    const parsed = contentSchema.safeParse(row.contentJson);
    return parsed.success ? [{ id: row.id, name: row.name, description: row.description, type: row.type, subject: row.subject, content: parsed.data }] : [];
  });
  const contactListOptions = contactLists.map((list) => ({ id: list.id, name: list.name, contactCount: list.contactCount }));
  const [history, deliveries] = await Promise.all([listBroadcasts(eventId), listDeliveries(eventId)]);
  const sample = { ...eventVariables(event), "participant.name": "Sample Participant", "participant.company": "Example Company", "participant.email": "sample@example.local", "participant.phone": "+6281200000000", "participant.job_title": "Guest", "ticket.ticket_number": "EVT-SAMPLE", "ticket.url": `${(process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "")}/t/sample` };
  const audiences = await Promise.all(templates.map(async (template) => { try { return { id: template.id, recipients: await resolveRecipients(eventId, recipientSchema.parse(template.recipientJson)) }; } catch { return { id: template.id, recipients: { to: [], cc: [], bcc: [] } }; } }));
  const counts = new Map(audiences.map((item) => [item.id, item.recipients]));
  const previews = await Promise.all(templates.map(async (template) => { try { const html = await renderEmailAsync(contentSchema.parse(template.contentJson), sample); return { id: template.id, html }; } catch { return { id: template.id, html: "Preview unavailable. Check the template fields and links." }; } }));
  const previewById = new Map(previews.map((item) => [item.id, item.html]));
  const transport = process.env.MAIL_TRANSPORT === "smtp" ? "SMTP: sends real email" : "Development preview: saved locally, no email is sent";

  return <section className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="eyebrow">{event.name} / Email</p>
        <h1 className="page-title">Email</h1>
        <p className="page-subtitle">Write a message, then send it now or schedule it as a reminder.</p>
      </div>
      {canManage && <ComposeTrigger title="New template" windowTitle="New message" defaultOpen={query.compose === "new"}><TemplateForm eventId={eventId} variables={sample} contactLists={contactListOptions} globalTemplates={globalTemplates} action={saveTemplateAction.bind(null, eventId)} /></ComposeTrigger>}
    </div>
    {query.notice && <Alert variant="success">{query.notice}</Alert>}
    {query.error && <Alert variant="danger">{query.error}</Alert>}

    <section aria-labelledby="templates-heading" className="space-y-3">
      <h2 id="templates-heading" className="section-title">Templates</h2>
      <div className="grid gap-3 lg:grid-cols-2">
        {templates.map((template) => {
          const recipient = counts.get(template.id) ?? { to: [], cc: [], bcc: [] };
          const preview = previewById.get(template.id) ?? "";
          const draft = isEmailDraft(template);
          const content = contentSchema.safeParse(template.contentJson);
          const config = recipientSchema.safeParse(template.recipientJson);
          const libraryFormId = `save-library-${template.id}`;
          const subjectSample = resolveTemplateVariables(template.subject, sample);
          return <Card key={template.id} asChild>
            <article>
              <CardHeader>
                <div className="min-w-0">
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription className="mt-1 text-body">{template.subject}</CardDescription>
                </div>
                <Badge variant={draft ? "warning" : "positive"}>{draft ? "Draft" : "Ready"}</Badge>
              </CardHeader>
              <p className="text-xs text-ink-muted">{template.type.replaceAll("_", " ")} · To {recipient.to.length} · Cc {recipient.cc.length} · Bcc {recipient.bcc.length}</p>
              {draft && canManage && <p className="text-xs text-ink-muted">Draft: it cannot be sent yet. Press Send to review it and mark it ready.</p>}
              {!draft && !recipient.to.length && <p className="text-xs text-ink-muted">No recipients match this audience. Edit the template to choose recipients.</p>}
              {canManage && <ActionForm id={libraryFormId} action={saveEventTemplateToLibraryAction.bind(null, eventId)} className="hidden" confirm={{ title: "Save to global library?", message: "Copies this subject and message body into the reusable global template library. Recipients are not copied and no email is sent.", confirmLabel: "Save to library" }} footer={<></>}><input type="hidden" name="templateId" value={template.id} /></ActionForm>}
              <TemplateCardActions
                canManage={canManage}
                templateName={template.name}
                draft={draft}
                recipientCount={recipient.to.length}
                facts={{ subject: subjectSample, to: recipient.to.length, cc: recipient.cc.length, bcc: recipient.bcc.length, transport }}
                libraryFormId={canManage && content.success ? libraryFormId : null}
                defaultOpen={query.preview === template.id ? "preview" : query.edit === template.id ? "edit" : undefined}
                previewNode={<>
                  {canManage ? <SendTestForm eventId={eventId} templateId={template.id} /> : <p className="text-sm text-ink-muted">Only an Admin or Event Manager can send test emails.</p>}
                  <article className="mt-3 rounded-md bg-paper p-6 text-paper-ink"><p className="mb-4 text-sm font-semibold">Subject: {subjectSample}</p><div dangerouslySetInnerHTML={{ __html: preview }} /></article>
                </>}
                editNode={canManage && content.success && config.success ? <TemplateForm eventId={eventId} variables={sample} contactLists={contactListOptions} globalTemplates={globalTemplates} action={saveTemplateAction.bind(null, eventId)} template={{ id: template.id, name: template.name, type: template.type, subject: template.subject, content: content.data, recipient: config.data }} /> : null}
                markReadyForm={<ActionForm action={markTemplateReadyAction.bind(null, eventId)} submitLabel="Mark as ready" pendingLabel="Marking…"><input type="hidden" name="templateId" value={template.id} /></ActionForm>}
                sendForm={<form action={broadcastAction.bind(null, eventId)} className="space-y-3">
                  <input type="hidden" name="templateId" value={template.id} />
                  <Checkbox name="confirmed" value="yes" required label="I have reviewed the subject, the recipients and the preview." />
                  <div className="flex justify-end"><BroadcastButton count={recipient.to.length} /></div>
                </form>}
              />
            </article>
          </Card>;
        })}
        {!templates.length && <EmptyState className="lg:col-span-2" title="No templates yet" description={canManage ? "Create a template to start writing, or use the reminder scheme below for a ready-made series." : "An Admin or Event Manager can create templates."} />}
      </div>
    </section>

    {canManage && <section aria-labelledby="reminders-heading" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="reminders-heading" className="section-title">Scheduled reminders</h2>
          <p className="page-subtitle">Send a template automatically a set time before the event starts.</p>
        </div>
        <div className="flex items-center gap-2">
          <ActionForm action={createReminderSchemeAction.bind(null, eventId)} className="contents" confirm={{ title: "Create the 3-step reminder scheme?", message: "Creates three draft templates (7 days, 1 day and 3 hours before the event) with their schedules. Nothing is sent, and you can edit everything afterwards.", confirmLabel: "Create scheme" }} footer={<SchemeSubmitButton>Use 3-step scheme</SchemeSubmitButton>} />
          <AddReminderButton
            action={createScheduleAction.bind(null, eventId)}
            disabled={!event.eventStart}
            templates={templates.map((template) => ({ id: template.id, name: template.name, draft: isEmailDraft(template) }))}
          />
        </div>
      </div>

      {!event.eventStart && <Alert variant="warning" title="This event has no start time">Reminders are timed from the event start. <Link className="underline" href={`/events/${eventId}/edit`}>Set the start time</Link> first.</Alert>}
      <Alert variant="info" title="Reminders need the scheduler">
        Reminders are sent by a scheduler, not by this page. Run <code>pnpm reminders:run</code> every 5 minutes, or call <code>POST /api/cron/email-reminders</code> with your <code>CRON_SECRET</code>.
      </Alert>

      {schedules.length ? <Table responsive>
        <Thead><Tr><Th>Template</Th><Th>Sends</Th><Th>Status</Th><Th className="w-12"><span className="sr-only">Actions</span></Th></Tr></Thead>
        <Tbody>{schedules.map((item) => {
          const sendAt = scheduledSendAt(event.eventStart, item.offsetMinutes);
          const badge = scheduleBadge[item.status as keyof typeof scheduleBadge] ?? scheduleBadge.PENDING;
          const waiting = item.status === "PENDING" && item.templateDraft;
          const formId = `remove-schedule-${item.id}`;
          return <Tr key={item.id}>
            <Td data-label="Template"><span className="font-medium">{item.templateName}</span></Td>
            <Td data-label="Sends"><span>{formatOffset(item.offsetMinutes)}</span><span className="block text-xs text-ink-muted">{sendAt ? formatEventDate(sendAt) : "Needs an event start time"}</span></Td>
            <Td data-label="Status">
              <Badge variant={waiting ? "warning" : badge.variant}>{waiting ? "Waiting for Ready" : badge.label}</Badge>
              {waiting && <span className="mt-1 block text-xs text-ink-muted">The template is a draft. Mark it ready to send.</span>}
              {item.lastError && <span className="mt-1 block text-xs text-ink-muted">{item.lastError}</span>}
            </Td>
            <Td data-label="Actions">
              <ActionForm id={formId} action={removeScheduleAction.bind(null, eventId)} className="hidden" danger confirm={{ title: "Remove this reminder?", message: "The reminder will no longer be sent. The template and any emails already sent are kept.", confirmLabel: "Remove reminder" }} footer={<></>}><input type="hidden" name="scheduleId" value={item.id} /></ActionForm>
              <OverflowMenu label={`Actions for reminder ${formatOffset(item.offsetMinutes)}`} size="icon-sm"><OverflowMenuFormItem formId={formId} danger>Remove</OverflowMenuFormItem></OverflowMenu>
            </Td>
          </Tr>;
        })}</Tbody>
      </Table> : <EmptyState title="No reminders scheduled" description="Add a reminder for one template, or use the 3-step scheme to get started." />}
    </section>}

    <section aria-labelledby="history-heading" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="history-heading" className="section-title">Broadcast history</h2>
          <p className="page-subtitle">Latest 20 broadcasts. Preview means a local file was saved and no email was sent. Running may mean an interrupted request: check the deliveries before sending again.</p>
        </div>
        <ModalTrigger title="Delivery report" variant="outline" triggerSize="sm" size="max-w-4xl">
          <p className="mb-3 text-xs text-ink-muted">Latest 100 event-scoped deliveries. PREVIEW is not SENT.</p>
          <ul className="divide-y divide-outline">{deliveries.map((item) => <li key={item.id} className="py-3"><p className="break-words text-sm">{item.recipient} · {item.status}</p><p className="mt-1 break-words text-xs text-ink-muted">{item.subject} · {formatEventDate(item.createdAt)}</p></li>)}{!deliveries.length && <li><EmptyState title="No deliveries recorded" /></li>}</ul>
        </ModalTrigger>
      </div>
      <Card>
        <ul className="divide-y divide-outline">{history.map((item) => <li key={item.id} className="py-3 first:pt-0 last:pb-0"><p className="text-sm font-semibold">{item.templateName} · {item.status}</p><p className="mt-1 text-xs text-ink-muted">{formatEventDate(item.createdAt)} · {item.transport} · {item.requested} requested / {item.sent} processed / {item.failed} failed</p></li>)}{!history.length && <li className="text-sm text-ink-muted">No broadcasts recorded yet.</li>}</ul>
      </Card>
    </section>
  </section>;
}
