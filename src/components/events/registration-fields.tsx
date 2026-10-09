import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/controls";

export function RegistrationFields({ preview = false }: { preview?: boolean }) {
  return <fieldset disabled={preview} className="mt-4 grid gap-3 sm:grid-cols-2">
    <Field label="Title"><Input name="title" placeholder="Mr / Ms" /></Field>
    <Field label="Name" required><Input name="name" autoComplete="name" /></Field>
    <Field label="Company"><Input name="company" autoComplete="organization" /></Field>
    <Field label="Job title"><Input name="jobTitle" autoComplete="organization-title" /></Field>
    <Field label="Phone" required><Input name="phone" type="tel" autoComplete="tel" /></Field>
    <Field label="Email" required><Input name="email" type="email" autoComplete="email" /></Field>
  </fieldset>;
}
